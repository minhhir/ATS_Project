const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    message: 'Quá nhiều request từ IP này, vui lòng thử lại sau 15 phút!'
});
app.use('/api', limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req, res) => {
    res.send('Backend Mini ATS đang chạy!');
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