import math
import re
from collections import Counter

# Stop words tiếng Anh
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

# Stop words tiếng Việt phổ biến
STOP_WORDS_VI = {
    "và", "của", "cho", "với", "là", "được", "trong", "có", "các", "những",
    "một", "này", "đó", "khi", "từ", "để", "tại", "về", "như", "theo",
    "đến", "hay", "hoặc", "nhưng", "nếu", "thì", "vì", "do", "bởi",
    "mà", "nên", "cũng", "đã", "sẽ", "đang", "rất", "hơn", "nhất",
    "nhiều", "ít", "tất", "cả", "mọi", "không", "chưa", "chỉ", "còn",
    "lại", "ra", "vào", "lên", "xuống", "qua", "lúc", "sau", "trước",
    "trên", "dưới", "giữa", "bên", "ngoài", "trong", "cùng", "luôn",
    "thường", "mỗi", "ai", "gì", "nào", "đâu", "sao", "thế", "vậy",
    "ơi", "ạ", "nhé", "thôi", "rồi", "đây", "kia", "đó", "họ", "tôi",
    "bạn", "anh", "chị", "em", "mình", "chúng", "toàn", "bộ", "một",
}

STOP_WORDS = STOP_WORDS_EN | STOP_WORDS_VI


def preprocess(text: str) -> str:
    """Chuẩn hóa văn bản: chuyển thường, loại bỏ dấu câu, giữ nguyên Unicode (tiếng Việt)."""
    text = text.lower()
    # Dùng \w với Unicode để giữ lại chữ cái tiếng Việt (ă, ơ, ư, v.v.)
    # Loại bỏ dấu câu và ký tự đặc biệt, giữ lại chữ, số và khoảng trắng
    text = re.sub(r'[^\w\s]', ' ', text)
    # Loại bỏ dấu gạch dưới (nằm trong \w nhưng không phải từ thật)
    text = re.sub(r'_', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def get_term_frequencies(words: list) -> dict:
    """Tính tần suất tương đối (TF) cho mỗi từ."""
    if not words:
        return {}
    tf = Counter(words)
    total_words = len(words)
    return {word: count / total_words for word, count in tf.items()}


def score_cv(cv_text: str, jd_text: str) -> dict:
    """
    Tính điểm phù hợp giữa CV và Job Description bằng TF-IDF cosine similarity.
    Trả về: score (0–100), matched_keywords, summary.
    """
    cv_clean = preprocess(cv_text)
    jd_clean = preprocess(jd_text)

    cv_words = [w for w in cv_clean.split() if w not in STOP_WORDS and len(w) > 1]
    jd_words = [w for w in jd_clean.split() if w not in STOP_WORDS and len(w) > 1]

    if len(cv_words) < 10 or len(jd_words) < 10:
        return {
            'score': 0.0,
            'matched_keywords': [],
            'summary': 'Không đủ nội dung hợp lệ để phân tích (yêu cầu ít nhất 10 từ khóa).',
        }

    cv_tf = get_term_frequencies(cv_words)
    jd_tf = get_term_frequencies(jd_words)

    vocabulary = set(cv_tf.keys()) | set(jd_tf.keys())

    # IDF với smoothing: log(N+1 / df+1) + 1, N=2 tài liệu
    idf = {}
    for word in vocabulary:
        doc_count = (1 if word in cv_tf else 0) + (1 if word in jd_tf else 0)
        idf[word] = math.log((2 + 1) / (doc_count + 1)) + 1

    cv_vector = {word: cv_tf.get(word, 0.0) * idf[word] for word in vocabulary}
    jd_vector = {word: jd_tf.get(word, 0.0) * idf[word] for word in vocabulary}

    dot_product = sum(cv_vector[word] * jd_vector[word] for word in vocabulary)
    mag_cv = math.sqrt(sum(val ** 2 for val in cv_vector.values()))
    mag_jd = math.sqrt(sum(val ** 2 for val in jd_vector.values()))

    if mag_cv == 0 or mag_jd == 0:
        return {
            'score': 0.0,
            'matched_keywords': [],
            'summary': 'Nội dung không chứa từ khóa có nghĩa.',
        }

    similarity = dot_product / (mag_cv * mag_jd)
    score = min(round(similarity * 100, 1), 100.0)

    # Lấy tối đa 15 từ khóa quan trọng nhất của JD có xuất hiện trong CV
    # Sắp xếp theo TF trong JD (độ quan trọng trong JD), lọc ra những từ có trong CV
    # Ngưỡng tối thiểu: từ phải xuất hiện ít nhất 1 lần trong JD (relative freq >= 1/len)
    min_jd_freq = 1 / max(len(jd_words), 1)
    matched = [
        word
        for word, freq in sorted(jd_tf.items(), key=lambda x: x[1], reverse=True)
        if word in cv_tf and freq >= min_jd_freq
    ][:15]

    if matched:
        summary = (
            f"Điểm phù hợp: {score}/100. "
            f"Tìm thấy {len(matched)} từ khóa khớp: {', '.join(matched)}."
        )
    else:
        summary = f"Điểm phù hợp: {score}/100. Không tìm thấy từ khóa chung đáng kể."

    return {
        'score': score,
        'matched_keywords': matched,
        'summary': summary,
    }
