const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

// Vấn đề: Notification có thể tích lũy hàng nghìn record, kéo hết về sẽ làm dropdown bell load lâu.
// Giải pháp: Chỉ trả 10 thông báo mới nhất, sort desc theo createdAt và lean() để response nhỏ gọn.
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
};

// Vấn đề: User mở dropdown thấy hàng loạt notification chưa đọc, click "đánh dấu tất cả" cần 1 query duy nhất.
// Giải pháp: updateMany filter theo recipient + isRead=false để chỉ ghi vào các record cần thiết.
exports.markAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
};

// Vấn đề: Cho phép update bằng id thuần sẽ để user A đánh dấu đọc thông báo của user B.
// Giải pháp: findOneAndUpdate với filter có recipient: req.user.id, không khớp thì 404 thay vì update nhầm.
exports.markOneAsRead = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            throw new AppError('ID không hợp lệ', 400);
        }
        const result = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true }
        );
        if (!result) throw new AppError('Không tìm thấy thông báo', 404);
        res.json({ success: true });
    } catch (err) { next(err); }
};