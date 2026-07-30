// Vấn đề: Lưu file (CV, ảnh) trên ổ đĩa server không scale và mất khi container restart.
// Giải pháp: Cấu hình SDK Cloudinary từ env để upload file lên CDN dùng chung cho cả frontend lẫn AI service.
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;