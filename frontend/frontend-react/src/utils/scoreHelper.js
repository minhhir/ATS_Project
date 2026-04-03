// Các hàm tiện ích liên quan đến điểm số (score) và hiển thị
export const getScoreClass = (score) => {
    if (score == null) return 'text-slate-400';
    if (score >= 90) return 'score-badge-high';
    if (score >= 70) return 'score-badge-mid';
    return 'score-badge-low';
};

// Lấy class cho thanh điểm (background + width) dựa trên score
export const getScoreBarClass = (score) => {
    if (score == null) return 'h-1.5 rounded-full bg-slate-200';
    if (score >= 90) return 'score-bar-high';
    if (score >= 70) return 'score-bar-mid';
    return 'score-bar-low';
};

// Lấy style cho badge điểm (background + text color) dựa trên score
export const getScoreBadgeStyle = (score) => {
    if (score == null) return 'bg-slate-100 text-slate-500';
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 70) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
};

// Lấy nhãn hiển thị cho điểm số
export const getScoreLabel = (score) => {
    if (score == null) return 'Chưa chấm';
    if (score >= 90) return 'Xuất sắc';
    if (score >= 70) return 'Phù hợp tốt';
    if (score >= 50) return 'Trung bình';
    return 'Yếu';
};