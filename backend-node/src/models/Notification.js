const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận (HR)
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Link bấm vào nhảy tới trang chi tiết
    isRead: { type: Boolean, default: false } // Trạng thái chưa đọc
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);