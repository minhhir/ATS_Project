"""
Scoring CV vs JD bằng Sentence-Transformer model (đa ngôn ngữ Việt + Anh)
+ keyword overlap + skill matching làm composite score.

Thiết kế:
- Lazy-load model: chỉ load lần đầu, các request sau dùng lại.
- Graceful fallback: nếu load model thất bại (thiếu lib / mạng / ổ đĩa),
  vẫn chấm được bằng keyword/skill overlap để pipeline không gãy.
"""

import math
import re
import threading
from collections import Counter
from typing import Optional, List, Tuple

# ----- Stop words -----
STOP_WORDS_EN = {
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "he", "him", "his", "she", "her", "hers", "it", "its", "they",
    "them", "their", "theirs", "what", "which", "who", "whom", "this", "that",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any",
    "both", "each", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
    "will", "just", "don", "should", "now", "also", "us", "would", "could",
    "may", "might", "must", "shall", "need", "used", "using", "use",
}

STOP_WORDS_VI = {
    "và", "của", "cho", "với", "là", "được", "trong", "có", "các", "những",
    "một", "này", "đó", "khi", "từ", "để", "tại", "về", "như", "theo",
    "đến", "hay", "hoặc", "nhưng", "nếu", "thì", "vì", "do", "bởi",
    "mà", "nên", "cũng", "đã", "sẽ", "đang", "rất", "hơn", "nhất",
    "nhiều", "ít", "tất", "cả", "mọi", "không", "chưa", "chỉ", "còn",
    "lại", "ra", "vào", "lên", "xuống", "qua", "lúc", "sau", "trước",
    "trên", "dưới", "giữa", "bên", "ngoài", "cùng", "luôn",
    "thường", "mỗi", "ai", "gì", "nào", "đâu", "sao", "thế", "vậy",
    "ơi", "ạ", "nhé", "thôi", "rồi", "đây", "kia", "họ", "tôi",
    "bạn", "anh", "chị", "em", "mình", "chúng", "toàn", "bộ",
}

STOP_WORDS = STOP_WORDS_EN | STOP_WORDS_VI

# Tên model: nhỏ (~117MB) nhưng support Việt + Anh tốt
MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
MAX_TEXT_CHARS = 5000  # cắt bớt để inference nhanh

_MODEL = None
_MODEL_TRIED = False
_MODEL_LOCK = threading.Lock()


def _get_model():
    """Lazy-load model 1 lần duy nhất. None nếu load fail (fallback path)."""
    global _MODEL, _MODEL_TRIED
    if _MODEL_TRIED:
        return _MODEL
    with _MODEL_LOCK:
        if _MODEL_TRIED:
            return _MODEL
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            print(f'[Scorer] Loading model: {MODEL_NAME} (lần đầu có thể mất 1-2 phút)...')
            _MODEL = SentenceTransformer(MODEL_NAME)
            print('[Scorer] Model loaded OK.')
        except Exception as e:
            print(f'[Scorer] Không load được model ({e}). Fallback sang keyword scoring.')
            _MODEL = None
        _MODEL_TRIED = True
        return _MODEL


def preprocess(text: str) -> str:
    text = (text or '').lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'_', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def _tokenize(text: str) -> List[str]:
    cleaned = preprocess(text)
    return [w for w in cleaned.split() if w not in STOP_WORDS and len(w) > 1]


def _semantic_similarity(cv_text: str, jd_text: str) -> Optional[float]:
    """Cosine similarity giữa embedding CV và JD. None nếu model unavailable."""
    model = _get_model()
    if model is None:
        return None
    try:
        embs = model.encode(
            [cv_text[:MAX_TEXT_CHARS], jd_text[:MAX_TEXT_CHARS]],
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        sim = float((embs[0] * embs[1]).sum())
        # cosine có thể âm — clamp về [0,1]
        return max(0.0, min(1.0, sim))
    except Exception as e:
        print(f'[Scorer] Lỗi khi encode embedding: {e}')
        return None


def _keyword_overlap(cv_words: List[str], jd_words: List[str]) -> Tuple[float, List[str]]:
    """Trả về (coverage 0..1, danh sách từ khóa quan trọng đã khớp)."""
    if not jd_words:
        return 0.0, []
    cv_set = set(cv_words)
    jd_counter = Counter(jd_words)
    matched = [w for w, _freq in jd_counter.most_common() if w in cv_set]
    coverage = len(matched) / len(jd_counter)
    return coverage, matched


def _skill_match(cv_text_lower: str, jd_skills: Optional[List[str]]) -> Tuple[Optional[float], List[str]]:
    """Match từng skill yêu cầu. Hỗ trợ cả skill nhiều từ (vd 'machine learning')."""
    if not jd_skills:
        return None, []
    matched = []
    for raw in jd_skills:
        if not isinstance(raw, str):
            continue
        s = raw.strip().lower()
        if not s:
            continue
        # Match nguyên cụm
        if re.search(r'\b' + re.escape(s) + r'\b', cv_text_lower):
            matched.append(raw)
            continue
        # Match dạng tách từ (cho cụm nhiều từ): tất cả token phải xuất hiện
        tokens = [t for t in re.split(r'\s+', s) if t]
        if len(tokens) > 1 and all(re.search(r'\b' + re.escape(t) + r'\b', cv_text_lower) for t in tokens):
            matched.append(raw)
    if not jd_skills:
        return None, []
    return len(matched) / max(1, len(jd_skills)), matched


def _build_summary(score_pct: float, sem: Optional[float], matched_skills: List[str],
                   missing_skills: List[str], matched_kw: List[str]) -> str:
    parts = [f"Điểm phù hợp: {score_pct}/100."]

    if score_pct >= 80:
        parts.append("Hồ sơ rất phù hợp với yêu cầu.")
    elif score_pct >= 60:
        parts.append("Hồ sơ khá phù hợp, đáng để phỏng vấn.")
    elif score_pct >= 40:
        parts.append("Mức độ phù hợp trung bình, cần xem xét thêm.")
    else:
        parts.append("Mức độ phù hợp thấp với yêu cầu.")

    if sem is not None:
        parts.append(f"Tương đồng ngữ nghĩa: {round(sem * 100, 1)}%.")

    if matched_skills:
        parts.append(f"Khớp {len(matched_skills)} kỹ năng: {', '.join(matched_skills[:6])}.")
    if missing_skills:
        parts.append(f"Còn thiếu kỹ năng: {', '.join(missing_skills[:5])}.")
    if matched_kw and not matched_skills:
        parts.append(f"Từ khóa khớp: {', '.join(matched_kw[:8])}.")

    return ' '.join(parts)


def score_cv(cv_text: str, jd_text: str, jd_skills: Optional[List[str]] = None) -> dict:
    """Chấm điểm CV vs JD bằng composite: semantic + keyword + skill."""
    if not cv_text or not jd_text:
        return {'score': 0.0, 'matched_keywords': [], 'summary': 'CV hoặc JD không có nội dung.'}

    cv_words = _tokenize(cv_text)
    jd_words = _tokenize(jd_text)

    if len(cv_words) < 10 or len(jd_words) < 5:
        return {
            'score': 0.0,
            'matched_keywords': [],
            'summary': 'Không đủ nội dung hợp lệ để phân tích (CV cần ít nhất 10 từ khóa).',
        }

    # 1. Semantic similarity (None nếu model fail)
    sem = _semantic_similarity(cv_text, jd_text)

    # 2. Keyword coverage
    kw_cov, matched_kw = _keyword_overlap(cv_words, jd_words)

    # 3. Skill match (None nếu không có skills nào)
    cv_lower = cv_text.lower()
    skill_cov, matched_skills = _skill_match(cv_lower, jd_skills)
    missing_skills = [s for s in (jd_skills or []) if s not in matched_skills]

    # Composite: ưu tiên semantic > skill > keyword
    if sem is not None and skill_cov is not None:
        # Có cả 3 tín hiệu
        composite = 0.55 * sem + 0.25 * skill_cov + 0.20 * kw_cov
    elif sem is not None:
        composite = 0.65 * sem + 0.35 * kw_cov
    elif skill_cov is not None:
        # Fallback: không có embedding
        composite = 0.55 * skill_cov + 0.45 * kw_cov
    else:
        composite = kw_cov

    # Hiệu chỉnh: cosine similarity của model multilingual hiếm khi vượt 0.85
    # với CV/JD thật, nên stretch nhẹ để CV "rất phù hợp" về vùng 80+
    score = min(1.0, composite * 1.1) if sem is not None else composite
    score_pct = round(score * 100, 1)

    summary = _build_summary(score_pct, sem, matched_skills, missing_skills, matched_kw)

    # Gộp matched: kỹ năng trước, sau đó từ khóa nội dung, dedupe
    combined = []
    seen = set()
    for item in matched_skills + matched_kw:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        combined.append(item)

    return {
        'score': score_pct,
        'matched_keywords': combined[:15],
        'summary': summary,
    }
