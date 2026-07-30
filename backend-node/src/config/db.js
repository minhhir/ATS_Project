const mongoose = require('mongoose');

// Vấn đề: Nếu MongoDB không kết nối được mà server vẫn chạy, mọi request đụng DB sẽ treo.
// Giải pháp: Try kết nối ngay khi boot, lỗi thì process.exit(1) để PM2/Docker tự restart.
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;