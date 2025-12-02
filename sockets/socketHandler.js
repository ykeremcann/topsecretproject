import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export const handleSocketConnection = (io) => {
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        // Join room based on user ID
        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        });

        // Handle sending messages via socket
        socket.on("send_message", async (data, callback) => {
            try {
                const { senderId, receiverId, content } = data;
                console.log("Socket send_message received:", data);

                // Validate input
                if (!senderId || !receiverId || !content) {
                    console.error("Missing required fields for send_message");
                    if (typeof callback === "function") callback({ status: "error", message: "Eksik bilgi" });
                    return;
                }

                // Find or create conversation
                let conversation = await Conversation.findOne({
                    participants: { $all: [senderId, receiverId] },
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        participants: [senderId, receiverId],
                        unreadCounts: {
                            [senderId]: 0,
                            [receiverId]: 0,
                        },
                    });
                }

                // Create new message
                const newMessage = new Message({
                    sender: senderId,
                    receiver: receiverId,
                    content,
                    conversationId: conversation._id,
                });

                await newMessage.save();

                // Update conversation
                conversation.lastMessage = newMessage._id;

                if (!conversation.unreadCounts) {
                    conversation.unreadCounts = new Map();
                    conversation.unreadCounts.set(senderId.toString(), 0);
                    conversation.unreadCounts.set(receiverId.toString(), 0);
                }

                const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
                conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);

                await conversation.save();

                // Populate sender details for the receiver
                await newMessage.populate("sender", "firstName lastName profilePicture");

                // Emit to receiver
                io.to(receiverId).emit("receive_message", newMessage);

                // Acknowledge sender
                if (typeof callback === "function") {
                    callback({ status: "ok", data: newMessage });
                }

            } catch (error) {
                console.error("Socket send_message error:", error);
                if (typeof callback === "function") {
                    callback({ status: "error", message: "Mesaj gönderilemedi" });
                }
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};
