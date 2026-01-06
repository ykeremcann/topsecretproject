import Notification from "../models/Notification.js";

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // Default 20 for notifications
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("sender", "username firstName lastName profilePicture")
            .populate("post", "title slug")
            .populate("comment", "content")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipient: req.user._id });
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        res.json({
            notifications,
            unreadCount,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                hasNext: page * limit < total,
            },
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Bildirimler alınırken hata oluştu" });
    }
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: "Bildirim bulunamadı" });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: "Bildirim okundu olarak işaretlendi", notification });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "İşlem sırasında hata oluştu" });
    }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: "Tüm bildirimler okundu olarak işaretlendi" });
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ message: "İşlem sırasında hata oluştu" });
    }
};
