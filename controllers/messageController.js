import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user._id;

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: "Alıcı bulunamadı" });
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

        // Initialize unreadCounts if it doesn't exist (for old conversations)
        if (!conversation.unreadCounts) {
            conversation.unreadCounts = new Map();
            conversation.unreadCounts.set(senderId.toString(), 0);
            conversation.unreadCounts.set(receiverId.toString(), 0);
        }

        // Increment unread count for receiver
        const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
        conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);

        await conversation.save();

        // Emit socket event (handled in index.js, but we can also emit here if we import io)
        // For now, we'll rely on the client to emit 'send_message' or handle it in index.js via API call trigger if we refactor.
        // Ideally, the controller should just save to DB, and the socket handler calls this or we emit from here.
        // To keep it simple and clean as per request, we will return the message and let the client/socket handler manage real-time.
        // BUT, to ensure "hatasız ve tamamen çalışır", we should probably emit from here if we had access to IO.
        // Since we don't have IO here easily without passing it, we will assume the client sends the message via Socket AND API, or the Socket handler calls this.
        // Actually, a better pattern for 1-1 chat is: Client emits 'send_message' -> Socket Handler calls Controller/Service -> Socket emits 'receive_message'.
        // OR: Client calls API -> Controller saves & emits -> Client receives response.
        // Let's go with Client calls API -> Controller saves -> Controller returns data -> Client emits socket event OR we attach IO to req.

        // We will attach io to req in index.js to make this robust.
        if (req.io) {
            req.io.to(receiverId.toString()).emit("receive_message", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Message send error:", error);
        res.status(500).json({ message: "Mesaj gönderilemedi", error: error.message });
    }
};

// Get conversations (Inbox)
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate({
                path: "participants",
                select: "firstName lastName profilePicture username role",
            })
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        // Format conversations for frontend
        const formattedConversations = conversations.map((conv) => {
            const otherParticipant = conv.participants.find(
                (p) => p._id.toString() !== userId.toString()
            );

            const unreadCount = conv.unreadCounts ? conv.unreadCounts.get(userId.toString()) || 0 : 0;

            return {
                _id: conv._id,
                participant: otherParticipant,
                lastMessage: conv.lastMessage,
                unreadCount,
                updatedAt: conv.updatedAt,
            };
        });

        res.json(formattedConversations);
    } catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({ message: "Sohbetler alınamadı", error: error.message });
    }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // Verify participation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Sohbet bulunamadı" });
        }

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({ message: "Bu sohbete erişim yetkiniz yok" });
        }

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: 1 }); // Oldest first

        // Mark messages as read
        // We can do this asynchronously or here.
        // Reset unread count for this user
        if (conversation.unreadCounts) {
            conversation.unreadCounts.set(userId.toString(), 0);
            await conversation.save();
        }

        res.json(messages);
    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ message: "Mesajlar alınamadı", error: error.message });
    }
};
