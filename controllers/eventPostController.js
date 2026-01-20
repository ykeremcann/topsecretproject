import EventPost from "../models/EventPost.js";
import Event from "../models/Event.js";
import Comment from "../models/Comment.js";
import { createNotification } from "../utils/notifications.js";

// Create a new event post
export const createEventPost = async (req, res) => {
    try {
        const { title, content, images, eventId } = req.body;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Etkinlik bulunamadı" });
        }

        const newPost = new EventPost({
            event: eventId,
            author: req.user._id,
            title,
            content,
            images: images || [],
        });

        await newPost.save();
        await newPost.populate("author", "username firstName lastName profilePicture");

        res.status(201).json({
            message: "Paylaşım başarıyla oluşturuldu",
            post: newPost,
        });
    } catch (error) {
        console.error("Event post creation error:", error);
        res.status(500).json({ message: "Paylaşım oluşturulurken hata oluştu" });
    }
};

// Get posts for a specific event
export const getEventPosts = async (req, res) => {
    try {
        const { eventId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await EventPost.find({ event: eventId, isApproved: true })
            .populate("author", "username firstName lastName profilePicture")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await EventPost.countDocuments({
            event: eventId,
            isApproved: true,
        });

        // Add isLiked/isDisliked fields and commentCount
        const userId = req.user ? req.user._id : null;
        const postsWithExtras = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            postObj.isLiked = userId ? post.likes.includes(userId) : false;
            postObj.isDisliked = userId ? post.dislikes.includes(userId) : false;

            // Get comment count
            const commentCount = await Comment.countDocuments({
                postOrBlog: post._id,
                postType: "EventPost",
                isApproved: true
            });
            postObj.commentCount = commentCount;

            return postObj;
        }));

        res.json({
            posts: postsWithExtras,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching event posts:", error);
        res.status(500).json({ message: "Paylaşımlar alınırken hata oluştu" });
    }
};

// Toggle like
export const toggleLike = async (req, res) => {
    try {
        const post = await EventPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: "Paylaşım bulunamadı",
            });
        }

        // Önceki durumunu kontrol et (bildirim için)
        const wasLiked = post.likes.includes(req.user._id);

        // Toggle işlemi
        await post.toggleLike(req.user._id);

        // Yeni durumları kontrol et
        const isLiked = post.likes.includes(req.user._id);
        const isDisliked = post.dislikes.includes(req.user._id);

        // Eğer kullanıcı yeni beğendiyse (önceden beğenmemişse ve şimdi beğenmişse) bildirim gönder
        if (!wasLiked && isLiked) {
            // Kendi postunu beğendiyse bildirim gönderme
            if (post.author.toString() !== req.user._id.toString()) {
                await createNotification(req.io, {
                    recipient: post.author,
                    sender: req.user._id,
                    type: "like_event_post", // Assuming new type or reuse like_post if generic
                    post: post._id,
                    senderInfo: req.user
                });
            }
        }

        res.json({
            message: "Beğeni durumu güncellendi",
            likeCount: post.likes.length,
            dislikeCount: post.dislikes.length,
            isLiked,
            isDisliked
        });
    } catch (error) {
        console.error("Beğeni işlemi hatası:", error);
        res.status(500).json({
            message: "Beğeni işlemi sırasında hata oluştu",
        });
    }
};

// Toggle dislike
export const toggleDislike = async (req, res) => {
    try {
        const post = await EventPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: "Paylaşım bulunamadı",
            });
        }

        // Toggle işlemi
        await post.toggleDislike(req.user._id);

        // Yeni durumları kontrol et
        const isLiked = post.likes.includes(req.user._id);
        const isDisliked = post.dislikes.includes(req.user._id);

        res.json({
            message: "Beğenmeme durumu güncellendi",
            likeCount: post.likes.length,
            dislikeCount: post.dislikes.length,
            isLiked,
            isDisliked
        });
    } catch (error) {
        console.error("Beğenmeme işlemi hatası:", error);
        res.status(500).json({
            message: "Beğenmeme işlemi sırasında hata oluştu",
        });
    }
};

// Delete post
export const deleteEventPost = async (req, res) => {
    try {
        const post = await EventPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: "Post bulunamadı" });
        }

        if (
            post.author.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Yetkiniz yok" });
        }

        await EventPost.findByIdAndDelete(req.params.postId);
        res.json({ message: "Post silindi" });
    } catch (error) {
        res.status(500).json({ message: "Silme hatası" });
    }
};

// Report event post
export const reportEventPost = async (req, res) => {
    try {
        const { reason, description } = req.body;

        const post = await EventPost.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({
                message: "Paylaşım bulunamadı",
            });
        }

        // Check if already reported
        const existingReport = post.reports.find(
            (report) => report.userId.toString() === req.user._id.toString()
        );

        if (existingReport) {
            return res.status(400).json({
                message: "Bu paylaşımı zaten raporladınız",
            });
        }

        // Add new report
        post.reports.push({
            userId: req.user._id,
            reason,
            description: description || "",
            reportedAt: new Date(),
        });

        post.reportCount = post.reports.length;
        post.isReported = true;

        await post.save();

        res.json({
            message: "Paylaşım başarıyla raporlandı",
            reportCount: post.reportCount,
        });
    } catch (error) {
        console.error("Post raporlama hatası:", error);
        res.status(500).json({
            message: "Paylaşım raporlanırken hata oluştu",
        });
    }
};
