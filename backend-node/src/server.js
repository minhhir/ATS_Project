const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();

// Vấn đề: Express mặc định không gắn header bảo mật (XSS, clickjacking, MIME sniffing).
// Giải pháp: Helmet thêm sẵn các header an toàn cho mọi response.
app.use(helmet());

// Vấn đề: Frontend chạy ở origin khác và cần gửi cookie (session/JWT) nên trình duyệt sẽ chặn nếu không cấu hình CORS đúng.
// Giải pháp: Whitelist đúng origin từ env và bật credentials để cookie cross-origin chạy được.
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Vấn đề: API public dễ bị spam/abuse, gây tốn tài nguyên và làm chậm user thật.
// Giải pháp: Giới hạn 300 request / 15 phút / IP cho toàn bộ /api.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút!' }
});

// Vấn đề: Endpoint login dễ bị brute-force password.
// Giải pháp: Limit chặt hơn (20 request/15 phút) áp riêng cho /auth.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút!' }
});

app.use('/api', limiter);
// Vấn đề: Body quá lớn có thể gây DoS hoặc OOM nếu không giới hạn.
// Giải pháp: Cap JSON & urlencoded body ở 1MB, đồng thời parse cookie để middleware auth đọc được token.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
    res.send('Backend Mini ATS đang chạy!');
});

// Vấn đề: Express trả HTML mặc định cho route không khớp, không hợp với client gọi JSON API.
// Giải pháp: Tự bắt route không khớp và trả JSON 404 thống nhất với các response khác.
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Không tìm thấy tài nguyên yêu cầu' });
});

// Vấn đề: Mỗi controller tự handle lỗi sẽ phát sinh boilerplate và không thống nhất format trả về.
// Giải pháp: Một error middleware tập trung map các loại lỗi (Mongoose, duplicate key, Multer) thành response JSON chuẩn.
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi server nội bộ';
    // Vấn đề: ValidationError của Mongoose chứa nhiều field, message gốc khó đọc cho user.
    // Giải pháp: Gộp message của từng field thành 1 chuỗi và trả 400.
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    // Vấn đề: Lỗi Mongo code 11000 (unique violation) trả message kỹ thuật, không thân thiện.
    // Giải pháp: Đổi thành thông báo "trùng dữ liệu" để frontend hiển thị trực tiếp.
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Dữ liệu đã bị trùng lặp (Duplicate Key)';
    }
    // Vấn đề: Multer ném lỗi với code khác nhau (file size, file type), cần phân loại để trả message đúng.
    // Giải pháp: Bắt riêng LIMIT_FILE_SIZE để hiển thị rõ giới hạn 5MB.
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Kích thước file quá lớn (Tối đa 5MB)';
        } else {
            message = err.message;
        }
    }
    // Vấn đề: Lộ stack trace ở production sẽ giúp attacker dò cấu trúc code.
    // Giải pháp: Chỉ trả stack ở môi trường development.
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});