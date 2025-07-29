import Post from "../models/Post.js";
import User from "../models/User.js";

// Post oluştur
export const createPost = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      images,
      isAnonymous,
      isSensitive,
      symptoms,
      treatments,
    } = req.body;

    const post = new Post({
      author: req.user._id,
      title,
      content,
      category,
      tags: tags || [],
      images: images || [],
      isAnonymous: isAnonymous || false,
      isSensitive: isSensitive || false,
      symptoms: symptoms || [],
      treatments: treatments || [],
    });

    await post.save();

    // Populate author bilgileri
    await post.populate("author", "username firstName lastName profilePicture");

    res.status(201).json({
      message: "Post başarıyla oluşturuldu",
      post,
    });
  } catch (error) {
    console.error("Post oluşturma hatası:", error);
    res.status(500).json({
      message: "Post oluşturulurken hata oluştu",
    });
  }
};

// Tüm post'ları getir
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, author, search } = req.query;

    let query = { isApproved: true };

    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Yazar filtresi
    if (author) {
      query.author = author;
    }

    // Arama filtresi
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate("author", "username firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Post'ları getirme hatası:", error);
    res.status(500).json({
      message: "Post'lar alınırken hata oluştu",
    });
  }
};

// Post detayını getir
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "username firstName lastName profilePicture")
      .populate("likes", "username firstName lastName profilePicture")
      .populate("dislikes", "username firstName lastName profilePicture");

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    // Görüntülenme sayısını artır
    await post.incrementViews();

    res.json({ post });
  } catch (error) {
    console.error("Post getirme hatası:", error);
    res.status(500).json({
      message: "Post bilgileri alınırken hata oluştu",
    });
  }
};

// Post güncelle
export const updatePost = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      images,
      isAnonymous,
      isSensitive,
      symptoms,
      treatments,
    } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    // Sadece yazar veya admin güncelleyebilir
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu post'u güncelleme yetkiniz yok",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (images) updateData.images = images;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;
    if (isSensitive !== undefined) updateData.isSensitive = isSensitive;
    if (symptoms) updateData.symptoms = symptoms;
    if (treatments) updateData.treatments = treatments;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "username firstName lastName profilePicture");

    res.json({
      message: "Post başarıyla güncellendi",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Post güncelleme hatası:", error);
    res.status(500).json({
      message: "Post güncellenirken hata oluştu",
    });
  }
};

// Post sil
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    // Sadece yazar veya admin silebilir
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu post'u silme yetkiniz yok",
      });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({
      message: "Post başarıyla silindi",
    });
  } catch (error) {
    console.error("Post silme hatası:", error);
    res.status(500).json({
      message: "Post silinirken hata oluştu",
    });
  }
};

// Post beğen/beğenme
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    await post.toggleLike(req.user._id);

    res.json({
      message: "Beğeni durumu güncellendi",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (error) {
    console.error("Beğeni işlemi hatası:", error);
    res.status(500).json({
      message: "Beğeni işlemi sırasında hata oluştu",
    });
  }
};

// Post beğenme/beğenmeme
export const toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    await post.toggleDislike(req.user._id);

    res.json({
      message: "Beğenmeme durumu güncellendi",
      likes: post.likes.length,
      dislikes: post.dislikes.length,
    });
  } catch (error) {
    console.error("Beğenmeme işlemi hatası:", error);
    res.status(500).json({
      message: "Beğenmeme işlemi sırasında hata oluştu",
    });
  }
};

// Post raporla
export const reportPost = async (req, res) => {
  try {
    const { reason } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    post.reportCount += 1;
    post.isReported = true;
    await post.save();

    res.json({
      message: "Post başarıyla raporlandı",
    });
  } catch (error) {
    console.error("Post raporlama hatası:", error);
    res.status(500).json({
      message: "Post raporlanırken hata oluştu",
    });
  }
};

// Kullanıcının post'larını getir
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      author: userId,
      isApproved: true,
    })
      .populate("author", "username firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({
      author: userId,
      isApproved: true,
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Kullanıcı post'larını getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı post'ları alınırken hata oluştu",
    });
  }
};
