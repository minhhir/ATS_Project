const mongoose = require('mongoose');

// Vấn đề: HR cần biết ngay khi có ứng viên mới hoặc sự kiện liên quan, gửi email lại chậm và có thể bị spam folder.
// Giải pháp: Lưu notification trong DB để FE poll/socket render bell + đánh dấu đã đọc, kèm link nhảy thẳng tới trang liên quan.
const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận (HR)
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Link bấm vào nhảy tới trang chi tiết
    isRead: { type: Boolean, default: false } // Trạng thái chưa đọc
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);