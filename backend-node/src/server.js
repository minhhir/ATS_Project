const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet'); // <-- Import helmet
const rateLimit = require('express-rate-limit'); // <-- Import rate limit
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();

// 1. Kích hoạt bảo mật HTTP Headers
app.use(helmet());

// 2. Chặn Request rác (Brute Force) - Tối đa 100 req/15 phút cho mỗi IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút!'
});
app.use('/api', limiter);

// 3. Middlewares cơ bản
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- Parse form html truyền thống
app.use(cookieParser());

// Định tuyến API
app.use('/api/auth', authRoutes);
// Test Route trang chủ
app.get('/', (req, res) => {
    res.send('Backend Mini ATS đang chạy chuẩn với Bảo mật tối đa!');
});
// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Lỗi server nội bộ',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});