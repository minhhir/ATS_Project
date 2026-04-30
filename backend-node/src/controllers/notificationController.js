const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');

exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        res.json({ success: true, data: notifications });
    } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) { next(err); }
};

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