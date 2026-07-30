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

# Vấn đề: Khi đếm độ trùng từ khóa giữa CV và JD, các hư từ ("the", "và", "của"...)
#   xuất hiện ở khắp nơi khiến điểm khớp bị nhiễu, làm CV nào cũng "có vẻ giống" JD.
# Hướng giải quyết: Định nghĩa danh sách stop-word cho cả tiếng Anh lẫn tiếng Việt
#   để loại trước khi tokenize, chỉ giữ lại các từ thực sự mang ý nghĩa chuyên môn.
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

MODEL_NAME = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
MAX_TEXT_CHARS = 5000  # cắt bớt để inference nhanh

# Vấn đề: Model SentenceTransformer nặng (~hàng trăm MB) và mất 1-2 phút để load;
#   nếu mỗi request load lại sẽ khiến API chấm điểm cực chậm và tốn RAM.
#   Hơn nữa, Flask/FastAPI thường chạy đa luồng nên hai request song song có thể
#   cùng load model một lúc gây race condition và OOM.
# Hướng giải quyết: Dùng singleton (_MODEL) + cờ đã thử (_MODEL_TRIED) + Lock
#   để đảm bảo model chỉ load đúng 1 lần trong vòng đời tiến trình.
_MODEL = None
_MODEL_TRIED = False
_MODEL_LOCK = threading.Lock()


def _get_model():
    """
    Lazy-load model 1 lần duy nhất. Trả về None nếu load fail (đi nhánh fallback).

    Vấn đề:
      - Import sentence_transformers ngay từ đầu file sẽ khiến app crash nếu
        máy chưa cài torch / không có internet để tải checkpoint.
      - Nhiều thread cùng gọi hàm này lần đầu sẽ load model song song, lãng phí RAM.
    Hướng giải quyết:
      - Dùng pattern double-checked locking: kiểm tra _MODEL_TRIED trước khi vào
        critical section để các lần gọi sau không phải chờ Lock.
      - Bọc try/except quanh phần load: nếu fail thì set _MODEL = None và đánh dấu
        đã thử, để các caller chuyển sang chấm điểm bằng keyword/skill thay vì raise.
    """
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
    """
    Chuẩn hóa text trước khi so sánh.

    Vấn đề:
      - CV/JD có dấu câu, gạch dưới, viết hoa-thường lẫn lộn ("Python," vs "python")
        khiến hai từ giống nhau bị coi là khác → giảm độ chính xác khớp keyword.
    Hướng giải quyết:
      - Lowercase toàn bộ, thay dấu câu/underscore bằng khoảng trắng và collapse
        các khoảng trắng thừa để chuỗi đầu ra chỉ còn token cách nhau bằng 1 space.
    """
    text = (text or '').lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'_', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def _tokenize(text: str) -> List[str]:
    """
    Tách text đã preprocess thành list token có nghĩa.

    Vấn đề:
      - Sau khi preprocess vẫn còn nhiều stop-word và token 1 ký tự ("a", "i", "ơ")
        gây nhiễu khi tính keyword overlap.
    Hướng giải quyết:
      - Lọc bỏ stop-word (Anh + Việt) và token có độ dài <= 1 để chỉ giữ lại
        các từ có khả năng mang thông tin chuyên môn.
    """
    cleaned = preprocess(text)
    return [w for w in cleaned.split() if w not in STOP_WORDS and len(w) > 1]


def _semantic_similarity(cv_text: str, jd_text: str) -> Optional[float]:
    """
    Tính cosine similarity giữa embedding của CV và JD.

    Vấn đề:
      - Khớp keyword không nắm được ngữ nghĩa: CV ghi "phát triển web" và JD ghi
        "lập trình website" thực chất giống nhau nhưng overlap = 0.
      - CV/JD quá dài có thể vượt context window của model gây OOM hoặc encode chậm.
      - Cosine theo lý thuyết nằm trong [-1, 1] nhưng pipeline tính điểm cần [0, 1].
    Hướng giải quyết:
      - Dùng model multilingual encode 2 đoạn text → vector chuẩn hóa, rồi nhân
        điểm trong (vì đã normalize, dot product = cosine).
      - Cắt text ở MAX_TEXT_CHARS để giới hạn thời gian inference ở mức ổn định.
      - Clamp kết quả về [0, 1] để có thể trộn tuyến tính với keyword/skill score.
      - Trả về None khi model fail thay vì raise → caller sẽ tự fallback.
    """
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
    """
    Đo độ phủ từ khóa của JD trong CV.

    Vấn đề:
      - Cần một tín hiệu rẻ và ổn định để bù khi semantic model unavailable
        hoặc để khẳng định lại các thuật ngữ chuyên môn.
      - Nếu chia theo tổng số từ JD (kể cả lặp), một JD lặp lại nhiều lần "Python"
        sẽ bị "ăn gian" coverage.
    Hướng giải quyết:
      - Lấy số từ unique trong JD làm mẫu số (len(jd_counter)) và đếm bao nhiêu
        từ trong số đó xuất hiện trong CV → coverage trong [0, 1].
      - Sắp xếp danh sách matched theo tần suất xuất hiện trong JD (most_common)
        để các từ "đắt giá" (xuất hiện nhiều) đứng trước trong báo cáo.
    """
    if not jd_words:
        return 0.0, []
    cv_set = set(cv_words)
    jd_counter = Counter(jd_words)
    matched = [w for w, _freq in jd_counter.most_common() if w in cv_set]
    coverage = len(matched) / len(jd_counter)
    return coverage, matched


def _skill_match(cv_text_lower: str, jd_skills: Optional[List[str]]) -> Tuple[Optional[float], List[str]]:
    """
    Đối chiếu từng skill JD yêu cầu với CV.

    Vấn đề:
      - Skill thường gồm nhiều từ ("machine learning", "node js"). Tokenize thường
        sẽ tách rời nên match dạng "có chứa skill" sẽ miss.
      - Match bằng substring đơn thuần dễ false-positive: "java" sẽ trùng với
        "javascript" trong CV.
      - Có thể không có jd_skills (job không khai báo skill) → cần phân biệt với
        trường hợp có skill nhưng không khớp được.
    Hướng giải quyết:
      - Ưu tiên match nguyên cụm bằng \\b...\\b (word boundary) để tránh khớp lệch
        kiểu "java" → "javascript".
      - Với cụm nhiều từ, nếu match nguyên cụm fail thì cho phép tất cả token thành
        phần xuất hiện rời rạc trong CV (bắt cả trường hợp CV viết "Machine-Learning"
        hay "machine, learning").
      - Trả về None khi jd_skills rỗng để caller biết "không có tín hiệu skill"
        và bỏ trọng số skill khỏi composite.
    """
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
    """
    Sinh lời nhận xét bằng tiếng Việt cho recruiter.

    Vấn đề:
      - Recruiter không quan tâm số điểm thô; họ cần kết luận "có nên phỏng vấn không"
        và lý do (skill nào khớp, skill nào còn thiếu).
      - Nếu liệt kê toàn bộ skill/keyword, summary sẽ dài và khó đọc.
    Hướng giải quyết:
      - Phân ngưỡng theo điểm (>=80 / 60 / 40) để dán nhãn mức độ phù hợp dễ hiểu.
      - Hiển thị thêm phần trăm tương đồng ngữ nghĩa (nếu có) để recruiter biết
        điểm này có dựa trên embedding hay chỉ keyword.
      - Cắt danh sách skill/keyword khớp ở 5-8 phần tử đầu để summary gọn gàng.
    """
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
    """
    Chấm điểm CV so với JD bằng composite: semantic + keyword + skill.

    Vấn đề:
      - Một tín hiệu duy nhất không đủ tin cậy: chỉ semantic dễ "thiên vị" CV
        viết hoa mỹ; chỉ keyword dễ thiên vị CV nhồi từ khóa; chỉ skill phụ
        thuộc vào việc HR có khai báo skill hay không.
      - Khi model embedding fail (thiếu lib, thiếu RAM), pipeline vẫn phải
        trả về điểm hợp lý thay vì 0 hoặc lỗi.
      - CV/JD quá ngắn (vài từ) sẽ khiến mọi thước đo đều vô nghĩa.
      - Cosine của model multilingual với CV/JD thật rất hiếm khi vượt 0.85,
        nên CV "rất phù hợp" thường chỉ ra điểm 75-80, recruiter dễ hiểu nhầm
        là "chưa tốt".
    Hướng giải quyết:
      - Validate đầu vào trước: rỗng → 0 điểm; quá ngắn → trả thông báo rõ ràng
        thay vì điểm rác.
      - Tính 3 tín hiệu độc lập rồi trộn tuyến tính theo trọng số ưu tiên
        semantic (0.55) > skill (0.25) > keyword (0.20). Nếu thiếu tín hiệu
        nào thì redistribute trọng số sang tín hiệu còn lại để tổng vẫn ~1.
      - Stretch nhẹ x1.1 (clamp ở 1.0) khi có semantic để dải điểm "phù hợp"
        rơi vào vùng 80+, đúng với kỳ vọng đọc của recruiter.
      - Trả về cả matched_keywords (kỹ năng trước, từ khóa sau, dedupe theo
        lowercase) để frontend hiển thị bằng chứng cho điểm số.
    """
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

    # Composite: ưu tiên semantic > skill > keyword.
    # Vấn đề: nếu thiếu tín hiệu, dùng đúng công thức 3-thành-phần sẽ khiến
    #   tổng trọng số < 1 → điểm bị "phạt oan".
    # Hướng giải quyết: chia nhánh theo tín hiệu còn lại và phân bổ lại trọng
    #   số sao cho tổng luôn = 1.
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

    # Vấn đề: matched_skills và matched_kw có thể trùng nhau (ví dụ "python" vừa
    #   là skill khai báo vừa là token trong JD), nếu đẩy hết ra UI sẽ bị duplicate.
    # Hướng giải quyết: gộp theo thứ tự ưu tiên (skill trước, keyword sau) và dedupe
    #   theo dạng lowercase để giữ đúng case gốc khi hiển thị.
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
