import Notification from "../models/Notification.js";

/**
 * Creates a notification and emits a socket event
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Notification data
 * @param {string} data.recipient - Recipient User ID
 * @param {string} data.sender - Sender User ID
 * @param {string} data.type - Notification type (like_post, comment_post, etc.)
 * @param {string} [data.post] - Post ID
 * @param {string} [data.comment] - Comment ID
 * @param {Object} [data.senderInfo] - Sender info for immediate UI update (populated)
 */
export const createNotification = async (io, { recipient, sender, type, post, comment, senderInfo }) => {
    try {
        if (recipient.toString() === sender.toString()) {
            return; // Don't notify self
        }

        const notification = new Notification({
            recipient,
            sender,
            type,
            post,
            comment
        });

        await notification.save();

        // Emit to recipient room
        // Make sure to populate basic info if needed for the toast/popup
        // Or send the simplified data

        // Populate sender if not provided mostly for safety, though caller usually has it
        // We will just send what we have + the notification ID

        const payload = {
            _id: notification._id,
            recipient,
            sender: senderInfo || sender, // Should ideally be an object with name/avatar
            type,
            post,
            createdAt: notification.createdAt,
            isRead: false
        };

        if (io) {
            io.to(recipient.toString()).emit("new_notification", payload);
        }

    } catch (error) {
        console.error("Notification creation failed:", error);
    }
};
