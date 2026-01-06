import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Blog from "../models/Blog.js";
import EventPost from "../models/EventPost.js";
import { validateComment } from "../middleware/validation.js";
import { createNotification } from "../utils/notifications.js";

// Yorum oluştur
export const createComment = async (req, res) => {
  try {
    const { content, isAnonymous, parentCommentId, postType } = req.body;
    const { postId } = req.params;

    console.log("Creating comment with data:", { content, isAnonymous, parentCommentId, postType, postId });

    // PostType'ı kontrol et (Post veya Blog)
    const validPostType = postType || "Post";
    if (!["Post", "Blog", "EventPost"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post, Blog veya EventPost olmalı.",
      });
    }

    let targetModel, targetDoc;
    if (validPostType === "Post") {
      targetModel = Post;
      targetDoc = await Post.findById(postId);
    } else if (validPostType === "Blog") {
      targetModel = Blog;
      targetDoc = await Blog.findById(postId);
    } else {
      targetModel = EventPost;
      targetDoc = await EventPost.findById(postId);
    }

    if (!targetDoc) {
      return res.status(404).json({
        message: `${validPostType} bulunamadı`,
      });
    }

    const comment = new Comment({
      postOrBlog: postId,
      postType: validPostType,
      author: req.user._id,
      content,
      isAnonymous: isAnonymous || false,
      parentComment: parentCommentId || null,
    });

    await comment.save();

    // Parent comment varsa, replies array'ine ekle
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $addToSet: { replies: comment._id },
      });
    }

    // Populate author bilgileri
    await comment.populate(
      "author",
      "username firstName lastName profilePicture"
    );

    // Notify post author
    // validPostType === 'Post' checks are already done
    await createNotification(req.io, {
      recipient: targetDoc.author,
      sender: req.user._id,
      type: "comment_post",
      post: validPostType === 'Post' ? postId : null, // If blog, maybe we handle differently, but schema allows post/comment ref. We might want to add 'blog' or 'eventPost' field to Notification or reuse 'post' generically?
      // Let's see Notification model: post: { type: ObjectId, ref: 'Post' }
      // If it's a Blog, 'post' field ref might fail if populated with Blog ID.
      // For simplicity/safety, let's only notify for Posts for now OR extend schema. 
      // User asked for "users post, comment, share". Implicitly Posts. 
      // But let's check properly: if(validPostType === 'Post') ...
      // If I put a Blog ID in a 'ref: Post' field, mongoose populate will return null if it doesn't find it in Post collection.
      // So safe to skip populate if wrong type, but ID storage works.
      // Recommended: Only populate 'post' if it's a Post.
      // For now, let's assume validPostType === 'Post' for the 'post' field.
      post: validPostType === 'Post' ? postId : null,
      comment: comment._id,
      senderInfo: req.user
    });

    res.status(201).json({
      message: "Yorum başarıyla oluşturuldu",
      comment,
    });
  } catch (error) {
    console.error("Yorum oluşturma hatası:", error);
    res.status(500).json({
      message: "Yorum oluşturulurken hata oluştu",
    });
  }
};

// Yoruma yanıt ver
export const replyToComment = async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    const { commentId } = req.params;

    // Ana yorumu bul
    const parentComment = await Comment.findById(commentId);

    if (!parentComment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    // Ana yorumun parent'i varsa, o parent'i kullan (iç içe yorumları engellemek için)
    // Ancak mevcut yapıda replies array'i parent'ta tutuluyor, bu yüzden her zaman
    // en üstteki yorumu parent olarak almalıyız.
    // Eğer parentComment.parentComment null değilse, bu bir alt yorumdur.
    // O zaman reply'i de en üstteki yoruma eklemeliyiz.
    const rootCommentId = parentComment.parentComment || commentId;

    const newComment = new Comment({
      postOrBlog: parentComment.postOrBlog,
      postType: parentComment.postType,
      author: req.user._id,
      content,
      isAnonymous: isAnonymous || false,
      parentComment: rootCommentId,
    });

    await newComment.save();

    // Parent comment'in replies array'ine ekle
    await Comment.findByIdAndUpdate(rootCommentId, {
      $addToSet: { replies: newComment._id },
    });

    // Populate yapıp döndür
    await newComment.populate(
      "author",
      "username firstName lastName profilePicture"
    );

    // Notify Parent Comment Author
    await createNotification(req.io, {
      recipient: parentComment.author,
      sender: req.user._id,
      type: "reply_comment",
      post: parentComment.postType === 'Post' ? parentComment.postOrBlog : null,
      comment: newComment._id,
      senderInfo: req.user
    });

    // Notify Original Post/Blog Author (if different from Parent Comment Author)
    // We need to fetch the post to know the author
    // Implementation choice: Maybe too much noise? Facebook notifies both.
    // Let's stick to Parent Comment Author for "Reply" and maybe Post Author for "Comment on your post" (technically a reply is a comment on post too).
    // Let's just notify parent comment author for replies to avoid double notifications to post author if they are the same person, or spam.
    // Actually, createNotification handles "don't notify self".
    if (parentComment.postType === 'Post') {
      const post = await Post.findById(parentComment.postOrBlog);
      if (post && post.author.toString() !== parentComment.author.toString()) {
        await createNotification(req.io, {
          recipient: post.author,
          sender: req.user._id,
          type: "comment_post",
          post: post._id,
          comment: newComment._id,
          senderInfo: req.user
        });
      }
    }

    res.status(201).json({
      message: "Yanıt başarıyla eklendi",
      comment: newComment,
    });
  } catch (error) {
    console.error("Yoruma yanıt verme hatası:", error);
    res.status(500).json({
      message: "Yanıt eklenirken hata oluştu",
    });
  }

};

// Post veya Blog'un yorumlarını getir
export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { postType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // PostType'ı kontrol et (Post veya Blog)
    const validPostType = postType || "Post";
    if (!["Post", "Blog", "EventPost"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post, Blog veya EventPost olmalı.",
      });
    }

    let targetModel, targetDoc;
    if (validPostType === "Post") {
      targetModel = Post;
      targetDoc = await Post.findById(postId);
    } else if (validPostType === "Blog") {
      targetModel = Blog;
      targetDoc = await Blog.findById(postId);
    } else {
      targetModel = EventPost;
      targetDoc = await EventPost.findById(postId);
    }

    if (!targetDoc) {
      return res.status(404).json({
        message: `${validPostType} bulunamadı`,
      });
    }

    // Sadece ana yorumları getir (parentComment null olanlar)
    const comments = await Comment.find({
      postOrBlog: postId,
      postType: validPostType,
      parentComment: null,
      isApproved: true,
    })
      .populate("author", "username firstName lastName profilePicture")
      .populate("reports.userId", "username firstName lastName")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username firstName lastName profilePicture",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Her comment için user'ın like/dislike durumunu ekle
    const commentsWithUserStatus = comments.map((comment) => {
      const commentObj = comment.toObject();
      commentObj.isLiked = req.user ? comment.likes.includes(req.user._id) : false;
      commentObj.isDisliked = req.user ? comment.dislikes.includes(req.user._id) : false;
      commentObj.likesCount = comment.likes.length;
      commentObj.dislikesCount = comment.dislikes.length;
      commentObj.repliesCount = comment.replies.length;

      // Replies için de aynı mantığı uygula
      if (commentObj.replies && commentObj.replies.length > 0) {
        commentObj.replies = commentObj.replies.map((reply) => {
          const replyObj = typeof reply.toObject === 'function' ? reply.toObject() : reply;
          replyObj.isLiked = req.user ? reply.likes && reply.likes.includes(req.user._id) : false;
          replyObj.isDisliked = req.user ? reply.dislikes && reply.dislikes.includes(req.user._id) : false;
          replyObj.likesCount = reply.likes ? reply.likes.length : 0;
          replyObj.dislikesCount = reply.dislikes ? reply.dislikes.length : 0;
          return replyObj;
        });
      }

      return commentObj;
    });

    const total = await Comment.countDocuments({
      postOrBlog: postId,
      postType: validPostType,
      parentComment: null,
      isApproved: true,
    });

    res.json({
      comments: commentsWithUserStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Yorumları getirme hatası:", error);
    res.status(500).json({
      message: "Yorumlar alınırken hata oluştu",
    });
  }
};

// Yorum güncelle
export const updateComment = async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    // Sadece yazar veya admin güncelleyebilir
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu yorumu güncelleme yetkiniz yok",
      });
    }

    const updateData = {};
    if (content) updateData.content = content;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "username firstName lastName profilePicture");

    res.json({
      message: "Yorum başarıyla güncellendi",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Yorum güncelleme hatası:", error);
    res.status(500).json({
      message: "Yorum güncellenirken hata oluştu",
    });
  }
};

// Yorum sil
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    // Sadece yazar veya admin silebilir
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu yorumu silme yetkiniz yok",
      });
    }

    // Parent comment'ten replies'i çıkar
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId },
      });
    }

    // Reply'leri de sil
    await Comment.deleteMany({ parentComment: commentId });

    // Ana yorumu sil
    await Comment.findByIdAndDelete(commentId);

    res.json({
      message: "Yorum başarıyla silindi",
    });
  } catch (error) {
    console.error("Yorum silme hatası:", error);
    res.status(500).json({
      message: "Yorum silinirken hata oluştu",
    });
  }
};

// Yorum beğen/beğenme
export const toggleLike = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    const wasLiked = comment.likes.includes(req.user._id);
    await comment.toggleLike(req.user._id);

    // Notify comment author if liked
    // Check if liked AFTER toggle (meaning it was added)
    // Same logic as Post: fetch or logic
    // We already reload below:
    const updatedCommentToCheck = await Comment.findById(commentId);
    if (updatedCommentToCheck.likes.includes(req.user._id) && !wasLiked) {
      await createNotification(req.io, {
        recipient: comment.author,
        sender: req.user._id,
        type: "like_comment",
        post: comment.postType === 'Post' ? comment.postOrBlog : null,
        comment: comment._id,
        senderInfo: req.user
      });
    }

    // Güncellenmiş comment'i tekrar yükle
    const updatedComment = await Comment.findById(commentId);

    res.json({
      message: wasLiked ? "Beğeni geri alındı" : "Yorum beğenildi",
      isLiked: updatedComment.likes.includes(req.user._id),
      isDisliked: updatedComment.dislikes.includes(req.user._id),
      likesCount: updatedComment.likes.length,
      dislikesCount: updatedComment.dislikes.length,
    });
  } catch (error) {
    console.error("Beğeni işlemi hatası:", error);
    res.status(500).json({
      message: "Beğeni işlemi sırasında hata oluştu",
    });
  }
};

// Yorum beğenme/beğenmeme
export const toggleDislike = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    const wasDisliked = comment.dislikes.includes(req.user._id);
    await comment.toggleDislike(req.user._id);

    // Güncellenmiş comment'i tekrar yükle
    const updatedComment = await Comment.findById(commentId);

    res.json({
      message: wasDisliked ? "Beğenmeme geri alındı" : "Yorum beğenilmedi",
      isLiked: updatedComment.likes.includes(req.user._id),
      isDisliked: updatedComment.dislikes.includes(req.user._id),
      likesCount: updatedComment.likes.length,
      dislikesCount: updatedComment.dislikes.length,
    });
  } catch (error) {
    console.error("Beğenmeme işlemi hatası:", error);
    res.status(500).json({
      message: "Beğenmeme işlemi sırasında hata oluştu",
    });
  }
};

// Yorum raporla
export const reportComment = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    // Kullanıcının daha önce bu yorumu raporlayıp raporlamadığını kontrol et
    const existingReport = comment.reports.find(
      (report) => report.userId.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        message: "Bu yorumu zaten raporladınız",
      });
    }

    // Yeni rapor ekle
    comment.reports.push({
      userId: req.user._id,
      reason,
      description: description || "",
      reportedAt: new Date(),
    });

    comment.reportCount = comment.reports.length;
    comment.isReported = true;

    await comment.save();

    res.json({
      message: "Yorum başarıyla raporlandı",
      reportCount: comment.reportCount,
    });
  } catch (error) {
    console.error("Yorum raporlama hatası:", error);
    res.status(500).json({
      message: "Yorum raporlanırken hata oluştu",
    });
  }
};

export const getAllComments = async (req, res) => {
  try {
    const { postType, isAdmin } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter nesnesini başlat
    const filters = {
      parentComment: null, // Sadece ana yorumları getir
    };

    // 1. Post Type Filtresi
    const validPostType = postType || "Post";
    if (!["Post", "Blog", "EventPost"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post, Blog veya EventPost olmalı.",
      });
    }
    filters.postType = validPostType;

    // 2. Onay Filtresi (Admin Yetkisi Kontrolü)
    const isAdminRequest = isAdmin === "true"; // Servis katmanından bu şekilde geliyor

    if (!isAdminRequest) {
      // Admin değilse sadece onaylı yorumları getir
      filters.isApproved = true;
    }
    // Admin ise (isAdmin=true), isApproved filtresini hiç eklemiyoruz,
    // yani onaylı veya onaysız tüm yorumları getiriyoruz.

    // 3. Yorumları Çekme
    const comments = await Comment.find(filters)
      .populate("author", "username firstName lastName profilePicture")
      .populate("reports.userId", "username firstName lastName")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "username firstName lastName profilePicture",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 4. Toplam Yorum Sayısını Hesaplama
    const total = await Comment.countDocuments(filters);

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Tüm yorumları getirme hatası (getAllComments):", error);
    res.status(500).json({
      message: "Tüm yorumlar alınırken hata oluştu",
    });
  }
};
