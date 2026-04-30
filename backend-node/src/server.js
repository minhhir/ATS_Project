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

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Rate limiter chung cho toàn bộ API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút!' }
});

// Rate limiter nghiêm hơn cho auth (chống brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút!' }
});

app.use('/api', limiter);
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

// 404 handler cho các route không tồn tại
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Không tìm thấy tài nguyên yêu cầu' });
});

app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Lỗi server nội bộ';
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Dữ liệu đã bị trùng lặp (Duplicate Key)';
    }
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'Kích thước file quá lớn (Tối đa 5MB)';
        } else {
            message = err.message;
        }
    }
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