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

    // Eğer doktor ise onay durumunu kontrol et
    if (req.user.role === "doctor") {
      const user = await User.findById(req.user._id).select("doctorInfo");
      if (!user.doctorInfo || user.doctorInfo.approvalStatus !== "approved") {
        return res.status(403).json({
          message: "Post oluşturmak için doktor onayınız gerekli",
          approvalStatus: user.doctorInfo?.approvalStatus || "pending",
        });
      }
    }

    const post = new Post({
      author: req.user?._id || "00xanonymus", // veya sabit bir "anonim" user ID
      title,
      content,
      category,
      tags: tags || [],
      images: images || [],
      isAnonymous: isAnonymous || false,
      isSensitive: isSensitive || false,
      symptoms: symptoms || [],
      treatments: treatments || [],
      isAnonymous: !req.user ? true : isAnonymous || false,
    });

    await post.save();

    // Populate author bilgileri
    await post.populate("author", "username firstName lastName profilePicture");

    // Post objesini dönüştür
    const postObj = post.toObject();

    // Eğer post anonim ise author bilgilerini gizle
    if (postObj.isAnonymous) {
      postObj.author = {
        _id: null,
        username: "Anonim Kullanıcı",
        firstName: "Anonim",
        lastName: "Kullanıcı",
        profilePicture: null,
      };
    }

    res.status(201).json({
      message: "Post başarıyla oluşturuldu",
      post: postObj,
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
    const { category, author, search, isAdmin } = req.query;

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

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Admin kontrolü - isAdmin query parametresi true ve kullanıcı admin ise
    const showAnonymousAuthors =
      isAdmin === "true" && req.user?.role === "admin";

    // Her post için isLiked ve isDisliked alanlarını ekle
    const postsWithLikes = posts.map((post) => {
      const postObj = post.toObject();
      postObj.isLiked = userId ? post.likes.includes(userId) : false;
      postObj.isDisliked = userId ? post.dislikes.includes(userId) : false;

      // Eğer post anonim ise ve admin değilse author bilgilerini gizle
      if (postObj.isAnonymous && !showAnonymousAuthors) {
        postObj.author = {
          _id: null,
          username: "Anonim Kullanıcı",
          firstName: "Anonim",
          lastName: "Kullanıcı",
          profilePicture: null,
        };
      }

      return postObj;
    });

    const total = await Post.countDocuments(query);

    // Trend kategorileri hesapla
    const trendCategories = await Post.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      posts: postsWithLikes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      trendCategorys: trendCategories,
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
    const post = await Post.findById(req.params.postId).populate(
      "author",
      "username firstName lastName profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    // Görüntülenme sayısını artır
    await post.incrementViews();

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Post objesine isLiked ve isDisliked ekle
    const postObj = post.toObject();
    postObj.isLiked = userId ? post.likes.includes(userId) : false;
    postObj.isDisliked = userId ? post.dislikes.includes(userId) : false;

    // Eğer post anonim ise author bilgilerini gizle
    if (postObj.isAnonymous) {
      postObj.author = {
        _id: null,
        username: "Anonim Kullanıcı",
        firstName: "Anonim",
        lastName: "Kullanıcı",
        profilePicture: null,
      };
    }

    // En yeni 3 post'u getir (newPosts)
    const newPosts = await Post.find({
      isApproved: true,
      _id: { $ne: post._id },
    })
      .populate("author", "username firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .limit(3);

    // newPosts için isLiked ve isDisliked ekle
    const newPostsWithLikes = newPosts.map((newPost) => {
      const newPostObj = newPost.toObject();
      newPostObj.isLiked = userId ? newPost.likes.includes(userId) : false;
      newPostObj.isDisliked = userId
        ? newPost.dislikes.includes(userId)
        : false;

      // Eğer post anonim ise author bilgilerini gizle
      if (newPostObj.isAnonymous) {
        newPostObj.author = {
          _id: null,
          username: "Anonim Kullanıcı",
          firstName: "Anonim",
          lastName: "Kullanıcı",
          profilePicture: null,
        };
      }

      return newPostObj;
    });

    // Benzer post'ları getir (kategori ve tag'e göre)
    const similarPosts = await Post.aggregate([
      {
        $match: {
          isApproved: true,
          _id: { $ne: post._id },
          $or: [{ category: post.category }, { tags: { $in: post.tags } }],
        },
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $cond: [{ $eq: ["$category", post.category] }, 1, 0] },
              { $size: { $setIntersection: ["$tags", post.tags] } },
            ],
          },
        },
      },
      { $sort: { similarityScore: -1, createdAt: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                profilePicture: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$author" },
    ]);

    // similarPosts için isLiked ve isDisliked ekle
    const similarPostsWithLikes = similarPosts.map((similarPost) => {
      const similarPostObj = { ...similarPost };
      // ObjectId'leri string'e çevirip kontrol et
      const likesStringIds = similarPost.likes.map((id) => id.toString());
      const dislikesStringIds = similarPost.dislikes.map((id) => id.toString());
      similarPostObj.isLiked = userId
        ? likesStringIds.includes(userId.toString())
        : false;
      similarPostObj.isDisliked = userId
        ? dislikesStringIds.includes(userId.toString())
        : false;

      // Eğer post anonim ise author bilgilerini gizle
      if (similarPostObj.isAnonymous) {
        similarPostObj.author = {
          _id: null,
          username: "Anonim Kullanıcı",
          firstName: "Anonim",
          lastName: "Kullanıcı",
          profilePicture: null,
        };
      }

      return similarPostObj;
    });

    res.json({
      post: postObj,
      newPosts: newPostsWithLikes,
      similarPosts: similarPostsWithLikes,
    });
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

    // Post'ları map'leyerek anonim olanları gizle
    const postsWithAnonymous = posts.map((post) => {
      const postObj = post.toObject();

      // Eğer post anonim ise author bilgilerini gizle
      if (postObj.isAnonymous) {
        postObj.author = {
          _id: null,
          username: "Anonim Kullanıcı",
          firstName: "Anonim",
          lastName: "Kullanıcı",
          profilePicture: null,
        };
      }

      return postObj;
    });

    res.json({
      posts: postsWithAnonymous,
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
