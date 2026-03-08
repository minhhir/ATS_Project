import math
import re
from collections import Counter

# Tập từ khóa dừng (stop words) tiếng Anh cơ bản
STOP_WORDS = {"i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "he", "him", "his", "she", "her", "hers", "it", "its", "they", "them", "their", "theirs", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just", "don", "should", "now"}

def preprocess(text: str) -> str:
    """Chuẩn hóa text: lowercase, bỏ ký tự đặc biệt"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệ\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()

def get_term_frequencies(words: list) -> dict:
    """Tính tần suất xuất hiện của từng từ (TF)"""
    tf = Counter(words)
    total_words = len(words)
    return {word: count / total_words for word, count in tf.items()}

def score_cv(cv_text: str, jd_text: str) -> dict:
    """Tính điểm tương đồng bằng Pure Python (TF-IDF + Cosine Similarity)"""
    cv_clean = preprocess(cv_text)
    jd_clean = preprocess(jd_text)

    cv_words = [w for w in cv_clean.split() if w not in STOP_WORDS and len(w) > 1]
    jd_words = [w for w in jd_clean.split() if w not in STOP_WORDS and len(w) > 1]

    if len(cv_words) < 10 or len(jd_words) < 10:
        return {
            'score': 0.0,
            'matched_keywords': [],
            'summary': 'Không đủ nội dung hợp lệ để phân tích (Yêu cầu ít nhất 10 từ khóa).'
        }

    cv_tf = get_term_frequencies(cv_words)
    jd_tf = get_term_frequencies(jd_words)

    vocabulary = set(cv_tf.keys()).union(set(jd_tf.keys()))

    idf = {}
    for word in vocabulary:
        doc_count = 0
        if word in cv_tf: doc_count += 1
        if word in jd_tf: doc_count += 1
        idf[word] = math.log(3 / (1 + doc_count)) + 1

    cv_vector = {word: (cv_tf.get(word, 0.0) * idf[word]) for word in vocabulary}
    jd_vector = {word: (jd_tf.get(word, 0.0) * idf[word]) for word in vocabulary}

    dot_product = sum(cv_vector[word] * jd_vector[word] for word in vocabulary)
    mag_cv = math.sqrt(sum(val**2 for val in cv_vector.values()))
    mag_jd = math.sqrt(sum(val**2 for val in jd_vector.values()))

    if mag_cv == 0 or mag_jd == 0:
        return {'score': 0.0, 'matched_keywords': [], 'summary': 'Nội dung không chứa từ khóa ý nghĩa.'}

    similarity = dot_product / (mag_cv * mag_jd)
    score = min(round(similarity * 100, 1), 100.0)

    #Sort theo tần suất thuần (TF) của JD thay vì TF-IDF
    sorted_jd_words = sorted(jd_tf.items(), key=lambda item: item[1], reverse=True)
    matched = []
    for word, _ in sorted_jd_words:
        # Nếu từ khóa quan trọng của JD CÓ XUẤT HIỆN trong CV
        if word in cv_tf and cv_tf[word] > 0:
            matched.append(word)
            if len(matched) >= 10:
                break

    summary = f"Điểm phù hợp: {score}/100. Các từ khóa khớp: {', '.join(matched) if matched else 'không tìm thấy'}"

    return { 'score': score, 'matched_keywords': matched, 'summary': summary }