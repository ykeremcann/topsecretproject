import Blog from "../models/Blog.js";
import User from "../models/User.js";
import { requireDoctorApproval } from "../middleware/doctorApproval.js";

// Blog oluştur
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      images,
      featuredImage,
      isPublished,
      isFeatured,
      medicalDisclaimer,
      references,
      seoTitle,
      seoDescription,
    } = req.body;

    // Sadece doctor ve admin blog oluşturabilir
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Blog oluşturmak için doktor veya admin yetkisi gerekli",
      });
    }

    // Eğer doktor ise onay durumunu kontrol et
    if (req.user.role === "doctor") {
      const user = await User.findById(req.user._id).select("doctorInfo");
      if (!user.doctorInfo || user.doctorInfo.approvalStatus !== "approved") {
        return res.status(403).json({
          message: "Blog oluşturmak için doktor onayınız gerekli",
          approvalStatus: user.doctorInfo?.approvalStatus || "pending",
        });
      }
    }

    const blog = new Blog({
      author: req.user._id,
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      images: images || [],
      featuredImage,
      isPublished: isPublished || false,
      isFeatured: isFeatured || false,
      medicalDisclaimer,
      references: references || [],
      seoTitle,
      seoDescription,
    });

    await blog.save();

    // Populate author bilgileri
    await blog.populate("author", "username firstName lastName profilePicture role");

    res.status(201).json({
      message: "Blog başarıyla oluşturuldu",
      blog,
    });
  } catch (error) {
    console.error("Blog oluşturma hatası:", error);
    res.status(500).json({
      message: "Blog oluşturulurken hata oluştu",
    });
  }
};

// Tüm blog'ları getir
export const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, author, search, featured, published } = req.query;

    let query = { isApproved: true };

    // Sadece yayınlanmış blog'ları göster (admin hariç)
    if (req.user?.role !== "admin") {
      query.isPublished = true;
    } else if (published !== undefined) {
      query.isPublished = published === "true";
    }

    // Kategori filtresi
    if (category) {
      query.category = category;
    }

    // Yazar filtresi
    if (author) {
      query.author = author;
    }

    // Öne çıkan blog filtresi
    if (featured === "true") {
      query.isFeatured = true;
    }

    // Arama filtresi
    if (search) {
      query.$text = { $search: search };
    }

    const blogs = await Blog.find(query)
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Her blog için isLiked ve isDisliked alanlarını ekle
    const blogsWithLikes = blogs.map(blog => {
      const blogObj = blog.toObject();
      blogObj.isLiked = userId ? blog.likes.includes(userId) : false;
      blogObj.isDisliked = userId ? blog.dislikes.includes(userId) : false;
      return blogObj;
    });

    const total = await Blog.countDocuments(query);

    // Trend kategorileri hesapla
    const trendCategories = await Blog.aggregate([
      { $match: { isApproved: true, isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      blogs: blogsWithLikes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      trendCategories,
    });
  } catch (error) {
    console.error("Blog'ları getirme hatası:", error);
    res.status(500).json({
      message: "Blog'lar alınırken hata oluştu",
    });
  }
};

// Blog detayını getir
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId)
      .populate("author", "username firstName lastName profilePicture role bio")


    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    // Yayınlanmamış blog'ları sadece yazar ve admin görebilir
    if (!blog.isPublished && 
        req.user?.role !== "admin" && 
        blog.author._id.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({
        message: "Bu blog'a erişim yetkiniz yok",
      });
    }

    // Görüntülenme sayısını artır
    await blog.incrementViews();

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Blog objesine isLiked ve isDisliked ekle
    const blogObj = blog.toObject();
    blogObj.isLiked = userId ? blog.likes.includes(userId) : false;
    blogObj.isDisliked = userId ? blog.dislikes.includes(userId) : false;

    // En yeni 3 blog'u getir (newBlogs)
    const newBlogs = await Blog.find({ 
      isApproved: true, 
      isPublished: true,
      _id: { $ne: blog._id } 
    })
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(3);

    // newBlogs için isLiked ve isDisliked ekle
    const newBlogsWithLikes = newBlogs.map(newBlog => {
      const newBlogObj = newBlog.toObject();
      newBlogObj.isLiked = userId ? newBlog.likes.includes(userId) : false;
      newBlogObj.isDisliked = userId ? newBlog.dislikes.includes(userId) : false;
      return newBlogObj;
    });

    // Benzer blog'ları getir (kategori ve tag'e göre)
    const similarBlogs = await Blog.aggregate([
      {
        $match: {
          isApproved: true,
          isPublished: true,
          _id: { $ne: blog._id },
          $or: [
            { category: blog.category },
            { tags: { $in: blog.tags } }
          ]
        }
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $cond: [{ $eq: ["$category", blog.category] }, 1, 0] },
              { $size: { $setIntersection: ["$tags", blog.tags] } }
            ]
          }
        }
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
            { $project: { username: 1, firstName: 1, lastName: 1, profilePicture: 1, role: 1 } }
          ]
        }
      },
      { $unwind: "$author" }
    ]);

    // similarBlogs için isLiked ve isDisliked ekle
    const similarBlogsWithLikes = similarBlogs.map(similarBlog => {
      const similarBlogObj = { ...similarBlog };
      // ObjectId'leri string'e çevirip kontrol et
      const likesStringIds = similarBlog.likes.map(id => id.toString());
      const dislikesStringIds = similarBlog.dislikes.map(id => id.toString());
      similarBlogObj.isLiked = userId ? likesStringIds.includes(userId.toString()) : false;
      similarBlogObj.isDisliked = userId ? dislikesStringIds.includes(userId.toString()) : false;
      return similarBlogObj;
    });

    res.json({
      blog: blogObj,
      newBlogs: newBlogsWithLikes,
      similarBlogs: similarBlogsWithLikes
    });
  } catch (error) {
    console.error("Blog getirme hatası:", error);
    res.status(500).json({
      message: "Blog bilgileri alınırken hata oluştu",
    });
  }
};

// Slug ile blog getir
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "username firstName lastName profilePicture role bio")
      .populate("likes", "username firstName lastName profilePicture")
      .populate("dislikes", "username firstName lastName profilePicture");

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    // Yayınlanmamış blog'ları sadece yazar ve admin görebilir
    if (!blog.isPublished && 
        req.user?.role !== "admin" && 
        blog.author._id.toString() !== req.user?._id?.toString()) {
      return res.status(403).json({
        message: "Bu blog'a erişim yetkiniz yok",
      });
    }

    // Görüntülenme sayısını artır
    await blog.incrementViews();

    // Kullanıcı token'dan ID'sini al
    const userId = req.user ? req.user._id : null;

    // Blog objesine isLiked ve isDisliked ekle
    const blogObj = blog.toObject();
    blogObj.isLiked = userId ? blog.likes.includes(userId) : false;
    blogObj.isDisliked = userId ? blog.dislikes.includes(userId) : false;

    // En yeni 3 blog'u getir (newBlogs)
    const newBlogs = await Blog.find({ 
      isApproved: true, 
      isPublished: true,
      _id: { $ne: blog._id } 
    })
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(3);

    // newBlogs için isLiked ve isDisliked ekle
    const newBlogsWithLikes = newBlogs.map(newBlog => {
      const newBlogObj = newBlog.toObject();
      newBlogObj.isLiked = userId ? newBlog.likes.includes(userId) : false;
      newBlogObj.isDisliked = userId ? newBlog.dislikes.includes(userId) : false;
      return newBlogObj;
    });

    // Benzer blog'ları getir (kategori ve tag'e göre)
    const similarBlogs = await Blog.aggregate([
      {
        $match: {
          isApproved: true,
          isPublished: true,
          _id: { $ne: blog._id },
          $or: [
            { category: blog.category },
            { tags: { $in: blog.tags } }
          ]
        }
      },
      {
        $addFields: {
          similarityScore: {
            $add: [
              { $cond: [{ $eq: ["$category", blog.category] }, 1, 0] },
              { $size: { $setIntersection: ["$tags", blog.tags] } }
            ]
          }
        }
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
            { $project: { username: 1, firstName: 1, lastName: 1, profilePicture: 1, role: 1 } }
          ]
        }
      },
      { $unwind: "$author" }
    ]);

    // similarBlogs için isLiked ve isDisliked ekle
    const similarBlogsWithLikes = similarBlogs.map(similarBlog => {
      const similarBlogObj = { ...similarBlog };
      // ObjectId'leri string'e çevirip kontrol et
      const likesStringIds = similarBlog.likes.map(id => id.toString());
      const dislikesStringIds = similarBlog.dislikes.map(id => id.toString());
      similarBlogObj.isLiked = userId ? likesStringIds.includes(userId.toString()) : false;
      similarBlogObj.isDisliked = userId ? dislikesStringIds.includes(userId.toString()) : false;
      return similarBlogObj;
    });

    res.json({
      blog: blogObj,
      newBlogs: newBlogsWithLikes,
      similarBlogs: similarBlogsWithLikes
    });
  } catch (error) {
    console.error("Blog getirme hatası:", error);
    res.status(500).json({
      message: "Blog bilgileri alınırken hata oluştu",
    });
  }
};

// Blog güncelle
export const updateBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      images,
      featuredImage,
      isPublished,
      isFeatured,
      medicalDisclaimer,
      references,
      seoTitle,
      seoDescription,
    } = req.body;

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    // Sadece yazar veya admin güncelleyebilir
    if (
      blog.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu blog'u güncelleme yetkiniz yok",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (images) updateData.images = images;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (medicalDisclaimer) updateData.medicalDisclaimer = medicalDisclaimer;
    if (references) updateData.references = references;
    if (seoTitle) updateData.seoTitle = seoTitle;
    if (seoDescription) updateData.seoDescription = seoDescription;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "username firstName lastName profilePicture role");

    res.json({
      message: "Blog başarıyla güncellendi",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Blog güncelleme hatası:", error);
    res.status(500).json({
      message: "Blog güncellenirken hata oluştu",
    });
  }
};

// Blog sil
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    // Sadece yazar veya admin silebilir
    if (
      blog.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bu blog'u silme yetkiniz yok",
      });
    }

    await Blog.findByIdAndDelete(req.params.blogId);

    res.json({
      message: "Blog başarıyla silindi",
    });
  } catch (error) {
    console.error("Blog silme hatası:", error);
    res.status(500).json({
      message: "Blog silinirken hata oluştu",
    });
  }
};

// Blog beğen/beğenme
export const toggleLike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    await blog.toggleLike(req.user._id);

    res.json({
      message: "Beğeni durumu güncellendi",
      likes: blog.likes.length,
      dislikes: blog.dislikes.length,
    });
  } catch (error) {
    console.error("Beğeni işlemi hatası:", error);
    res.status(500).json({
      message: "Beğeni işlemi sırasında hata oluştu",
    });
  }
};

// Blog beğenme/beğenmeme
export const toggleDislike = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    await blog.toggleDislike(req.user._id);

    res.json({
      message: "Beğenmeme durumu güncellendi",
      likes: blog.likes.length,
      dislikes: blog.dislikes.length,
    });
  } catch (error) {
    console.error("Beğenmeme işlemi hatası:", error);
    res.status(500).json({
      message: "Beğenmeme işlemi sırasında hata oluştu",
    });
  }
};

// Blog raporla
export const reportBlog = async (req, res) => {
  try {
    const { reason } = req.body;

    const blog = await Blog.findById(req.params.blogId);

    if (!blog) {
      return res.status(404).json({
        message: "Blog bulunamadı",
      });
    }

    blog.reportCount += 1;
    blog.isReported = true;
    await blog.save();

    res.json({
      message: "Blog başarıyla raporlandı",
    });
  } catch (error) {
    console.error("Blog raporlama hatası:", error);
    res.status(500).json({
      message: "Blog raporlanırken hata oluştu",
    });
  }
};

// Kullanıcının blog'larını getir
export const getUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { author: userId };

    // Sadece yayınlanmış blog'ları göster (kendi blog'ları hariç)
    if (req.user?._id?.toString() !== userId && req.user?.role !== "admin") {
      query.isPublished = true;
    }

    const blogs = await Blog.find(query)
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Kullanıcı blog'larını getirme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı blog'ları alınırken hata oluştu",
    });
  }
};

// Öne çıkan blog'ları getir
export const getFeaturedBlogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({
      isFeatured: true,
      isPublished: true,
      isApproved: true,
    })
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ blogs });
  } catch (error) {
    console.error("Öne çıkan blog'ları getirme hatası:", error);
    res.status(500).json({
      message: "Öne çıkan blog'lar alınırken hata oluştu",
    });
  }
};

// Blog kategorilerini getir
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { isPublished: true, isApproved: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error("Blog kategorilerini getirme hatası:", error);
    res.status(500).json({
      message: "Blog kategorileri alınırken hata oluştu",
    });
  }
};
