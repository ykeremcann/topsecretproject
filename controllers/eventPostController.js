import EventPost from "../models/EventPost.js";
import Event from "../models/Event.js";

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

        // Add isLiked/isDisliked fields
        const userId = req.user ? req.user._id : null;
        const postsWithExtras = posts.map((post) => {
            const postObj = post.toObject();
            postObj.isLiked = userId ? post.likes.includes(userId) : false;
            postObj.isDisliked = userId ? post.dislikes.includes(userId) : false;
            return postObj;
        });

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
        if (!post) return res.status(404).json({ message: "Paylaşım bulunamadı" });

        await post.toggleLike(req.user._id);

        res.json({
            message: "Beğeni güncellendi",
            likeCount: post.likeCount,
            isLiked: post.likes.includes(req.user._id),
        });
    } catch (error) {
        res.status(500).json({ message: "İşlem hatası" });
    }
};

// Toggle dislike
export const toggleDislike = async (req, res) => {
    try {
        const post = await EventPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Paylaşım bulunamadı" });

        await post.toggleDislike(req.user._id);

        res.json({
            message: "Beğenmeme güncellendi",
            dislikeCount: post.dislikeCount,
            isDisliked: post.dislikes.includes(req.user._id),
        });
    } catch (error) {
        res.status(500).json({ message: "İşlem hatası" });
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
