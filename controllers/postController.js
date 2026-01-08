import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { createNotification } from "../utils/notifications.js";

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

      event,
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
      event: event || null,
    });

    await post.save();

    // Populate author bilgileri
    await post.populate("author", "username firstName lastName profilePicture role isVerified doctorInfo");

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
    const { category, author, search, isAdmin, event, hasEvent } = req.query;

    let query = { isApproved: true };

    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Yazar filtresi
    if (author) {
      query.author = author;
    }

    // Event filtresi (Belirli bir event'in postları)
    if (event) {
      query.event = event;
    }

    // Event'i olan postları getir (Timeline genel akış için)
    if (hasEvent === "true") {
      query.event = { $ne: null };
    }

    // Arama filtresi
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await Post.find(query)
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
      .populate("event", "title date")
      .populate("reports.userId", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Admin kontrolü - isAdmin query parametresi true ve kullanıcı admin ise
    const showAnonymousAuthors =
      isAdmin === "true" && req.user?.role === "admin";


    // Her post için isLiked, isDisliked ve commentCount alanlarını ekle
    const postsWithExtras = await Promise.all(posts.map(async (post) => {
      const postObj = post.toObject();
      postObj.isLiked = userId ? post.likes.includes(userId) : false;
      postObj.isDisliked = userId ? post.dislikes.includes(userId) : false;
      postObj.commentCount = await Comment.countDocuments({ postOrBlog: post._id, postType: "Post", isApproved: true });
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
    }));

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
      posts: postsWithExtras,
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
    const post = await Post.findById(req.params.postId)
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
      .populate("event", "title date");

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
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
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
                role: 1,
                isVerified: 1,
                doctorInfo: 1,
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

// Slug ile post getir
export const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
      .populate("event", "title date");

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
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
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
                role: 1,
                isVerified: 1,
                doctorInfo: 1,
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
    if (req.body.event !== undefined) updateData.event = req.body.event;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "username firstName lastName profilePicture role isVerified doctorInfo");

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
          type: "like_post",
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

// Post beğenme/beğenmeme
export const toggleDislike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
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

// Post raporla
export const reportPost = async (req, res) => {
  try {
    const { reason, description } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    // Kullanıcının daha önce bu postu raporlayıp raporlamadığını kontrol et
    const existingReport = post.reports.find(
      (report) => report.userId.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        message: "Bu postu zaten raporladınız",
      });
    }

    // Yeni rapor ekle
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
      message: "Post başarıyla raporlandı",
      reportCount: post.reportCount,
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

    const currentUserId = req.user ? req.user._id.toString() : null;
    const isOwner = currentUserId === userId;

    let query = {
      author: userId,
      isApproved: true,
    };

    // Eğer kullanıcı kendi profiline bakmıyorsa, anonim postları gizle
    if (!isOwner) {
      query.isAnonymous = { $ne: true };
    }

    const posts = await Post.find(query)
      .populate("author", "username firstName lastName profilePicture role isVerified doctorInfo")
      .populate("event", "title date")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    // Post'ları map'leyerek anonim olanları gizle (owner olsa bile anonimler anonim görünmeli ama listelenmeli)
    // Owner kendisi anonim postunu görse bile "Anonim" olarak görmesi mantıklı olabilir veya
    // "Senin anonim postun" gibi bir işaret olabilir. Şimdilik mevcut mantığı koruyoruz.

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
