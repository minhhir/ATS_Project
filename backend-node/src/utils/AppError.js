// Vấn đề: Error mặc định không gắn được HTTP status code, error middleware phải đoán nên dễ trả 500 oan cho lỗi business logic.
// Giải pháp: AppError mang theo statusCode và stack sạch (bỏ frame của constructor) để middleware map thẳng ra response.
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;