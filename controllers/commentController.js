import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Blog from "../models/Blog.js";
import { validateComment } from "../middleware/validation.js";

// Yorum oluştur
export const createComment = async (req, res) => {
  try {
    const { content, isAnonymous, parentComment, postType } = req.body;
    const { postId } = req.params;

    // PostType'ı kontrol et (Post veya Blog)
    const validPostType = postType || "Post";
    if (!["Post", "Blog"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post veya Blog olmalı.",
      });
    }

    let targetModel, targetDoc;
    if (validPostType === "Post") {
      targetModel = Post;
      targetDoc = await Post.findById(postId);
    } else {
      targetModel = Blog;
      targetDoc = await Blog.findById(postId);
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
      parentComment: parentComment || null,
    });

    await comment.save();

    // Parent comment varsa, replies array'ine ekle
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $addToSet: { replies: comment._id },
      });
    }

    // Populate author bilgileri
    await comment.populate(
      "author",
      "username firstName lastName profilePicture"
    );

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
    if (!["Post", "Blog"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post veya Blog olmalı.",
      });
    }

    let targetModel, targetDoc;
    if (validPostType === "Post") {
      targetModel = Post;
      targetDoc = await Post.findById(postId);
    } else {
      targetModel = Blog;
      targetDoc = await Blog.findById(postId);
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

    const total = await Comment.countDocuments({
      postOrBlog: postId,
      postType: validPostType,
      parentComment: null,
      isApproved: true,
    });

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

    await comment.toggleLike(req.user._id);

    res.json({
      message: "Beğeni durumu güncellendi",
      likes: comment.likes.length,
      dislikes: comment.dislikes.length,
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

    await comment.toggleDislike(req.user._id);

    res.json({
      message: "Beğenmeme durumu güncellendi",
      likes: comment.likes.length,
      dislikes: comment.dislikes.length,
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
    const { reason } = req.body;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    comment.reportCount += 1;
    comment.isReported = true;
    await comment.save();

    res.json({
      message: "Yorum başarıyla raporlandı",
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
    if (!["Post", "Blog"].includes(validPostType)) {
      return res.status(400).json({
        message: "Geçersiz post türü. Post veya Blog olmalı.",
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
