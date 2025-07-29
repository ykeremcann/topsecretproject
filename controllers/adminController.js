import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Disease from "../models/Disease.js";

// Dashboard istatistikleri
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const totalComments = await Comment.countDocuments({});
    const totalDiseases = await Disease.countDocuments({ isActive: true });
    const pendingPosts = await Post.countDocuments({ isApproved: false });
    const reportedPosts = await Post.countDocuments({ isReported: true });
    const reportedComments = await Comment.countDocuments({ isReported: true });

    // Son 7 günün istatistikleri
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const newPosts = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    const newComments = await Comment.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalComments,
        totalDiseases,
        pendingPosts,
        reportedPosts,
        reportedComments,
        newUsers,
        newPosts,
        newComments,
      },
    });
  } catch (error) {
    console.error("Dashboard istatistikleri hatası:", error);
    res.status(500).json({
      message: "İstatistikler alınırken hata oluştu",
    });
  }
};

// Kullanıcı yönetimi
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, isVerified, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (role) updateData.role = role;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Kullanıcı durumu güncellendi",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Kullanıcı güncelleme hatası:", error);
    res.status(500).json({
      message: "Kullanıcı güncellenirken hata oluştu",
    });
  }
};

// Post onaylama/reddetme
export const approvePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { isApproved } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post bulunamadı",
      });
    }

    post.isApproved = isApproved;
    await post.save();

    res.json({
      message: isApproved ? "Post onaylandı" : "Post reddedildi",
      post,
    });
  } catch (error) {
    console.error("Post onaylama hatası:", error);
    res.status(500).json({
      message: "Post onaylanırken hata oluştu",
    });
  }
};

// Yorum onaylama/reddetme
export const approveComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isApproved } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        message: "Yorum bulunamadı",
      });
    }

    comment.isApproved = isApproved;
    await comment.save();

    res.json({
      message: isApproved ? "Yorum onaylandı" : "Yorum reddedildi",
      comment,
    });
  } catch (error) {
    console.error("Yorum onaylama hatası:", error);
    res.status(500).json({
      message: "Yorum onaylanırken hata oluştu",
    });
  }
};

// Raporlanan içerikleri getir
export const getReportedContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reportedPosts = await Post.find({ isReported: true })
      .populate("author", "username firstName lastName")
      .sort({ reportCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const reportedComments = await Comment.find({ isReported: true })
      .populate("author", "username firstName lastName")
      .populate("post", "title")
      .sort({ reportCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReportedPosts = await Post.countDocuments({ isReported: true });
    const totalReportedComments = await Comment.countDocuments({
      isReported: true,
    });

    res.json({
      reportedPosts,
      reportedComments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(
          Math.max(totalReportedPosts, totalReportedComments) / limit
        ),
        hasNext:
          page * limit < Math.max(totalReportedPosts, totalReportedComments),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Raporlanan içerik getirme hatası:", error);
    res.status(500).json({
      message: "Raporlanan içerikler alınırken hata oluştu",
    });
  }
};

// Bekleyen içerikleri getir
export const getPendingContent = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pendingPosts = await Post.find({ isApproved: false })
      .populate("author", "username firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pendingComments = await Comment.find({ isApproved: false })
      .populate("author", "username firstName lastName")
      .populate("post", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPendingPosts = await Post.countDocuments({ isApproved: false });
    const totalPendingComments = await Comment.countDocuments({
      isApproved: false,
    });

    res.json({
      pendingPosts,
      pendingComments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(
          Math.max(totalPendingPosts, totalPendingComments) / limit
        ),
        hasNext:
          page * limit < Math.max(totalPendingPosts, totalPendingComments),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Bekleyen içerik getirme hatası:", error);
    res.status(500).json({
      message: "Bekleyen içerikler alınırken hata oluştu",
    });
  }
};

// Kategori istatistikleri
export const getCategoryStats = async (req, res) => {
  try {
    const categoryStats = await Post.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      categoryStats,
    });
  } catch (error) {
    console.error("Kategori istatistikleri hatası:", error);
    res.status(500).json({
      message: "Kategori istatistikleri alınırken hata oluştu",
    });
  }
};
