const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        // Cập nhật tất cả thông báo của user này thành Đã đọc
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.markOneAsRead = async (req, res, next) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
};