import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Disease from "../models/Disease.js";
import Blog from "../models/Blog.js";
import Event from "../models/Event.js";
import EventPost from "../models/EventPost.js";

// Kapsamlı Dashboard İstatistikleri
export const getDashboardStats = async (req, res) => {
  try {
    // Genel sayılar
    const totalUsers = await User.countDocuments({});
    const totalPosts = await Post.countDocuments({});
    const totalBlogs = await Blog.countDocuments({});
    const totalEvents = await Event.countDocuments({});
    const totalComments = await Comment.countDocuments({});
    const totalDiseases = await Disease.countDocuments({ isActive: true });

    // Kullanıcı türleri
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const doctors = await User.countDocuments({ role: "doctor" });
    const patients = await User.countDocuments({ role: "patient" });
    const admins = await User.countDocuments({ role: "admin" });

    // Son 7 günün istatistikleri
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newPosts = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newBlogs = await Blog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newEvents = await Event.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });
    const newComments = await Comment.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // En çok beğenilen postlar (populate ile)
    const topLikedPosts = await Post.find({ isApproved: true })
      .populate("author", "username firstName lastName role")
      .sort({ likes: -1 })
      .limit(5)
      .select("title content category likes views createdAt");

    // En çok görüntülenen postlar (populate ile)
    const topViewedPosts = await Post.find({ isApproved: true })
      .populate("author", "username firstName lastName role")
      .sort({ views: -1 })
      .limit(5)
      .select("title content category likes views createdAt");

    // En çok beğenilen bloglar (populate ile)
    const topLikedBlogs = await Blog.find({ isPublished: true, isApproved: true })
      .populate("author", "username firstName lastName role")
      .sort({ likes: -1 })
      .limit(5)
      .select("title content category likes views createdAt");

    // En çok görüntülenen bloglar (populate ile)
    const topViewedBlogs = await Blog.find({ isPublished: true, isApproved: true })
      .populate("author", "username firstName lastName role")
      .sort({ views: -1 })
      .limit(5)
      .select("title content category likes views createdAt");

    // En çok beğenilen yorumlar (populate ile)
    const topLikedComments = await Comment.find({ isApproved: true })
      .populate("author", "username firstName lastName role")
      .populate("postOrBlog", "title")
      .sort({ likes: -1 })
      .limit(5)
      .select("content postType likes createdAt");

    // En çok post atan kullanıcılar (populate ile)
    const topPosters = await Post.aggregate([
      {
        $group: {
          _id: "$author",
          postCount: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
          totalViews: { $sum: "$views" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          role: "$user.role",
          profilePicture: "$user.profilePicture",
          postCount: 1,
          totalLikes: 1,
          totalViews: 1,
        },
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 },
    ]);

    // En çok blog oluşturan kullanıcılar (populate ile)
    const topBloggers = await Blog.aggregate([
      {
        $group: {
          _id: "$author",
          blogCount: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
          totalViews: { $sum: "$views" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          role: "$user.role",
          profilePicture: "$user.profilePicture",
          blogCount: 1,
          totalLikes: 1,
          totalViews: 1,
        },
      },
      { $sort: { blogCount: -1 } },
      { $limit: 5 },
    ]);

    // En çok yorum yapan kullanıcılar (populate ile)
    const topCommenters = await Comment.aggregate([
      {
        $group: {
          _id: "$author",
          commentCount: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          role: "$user.role",
          profilePicture: "$user.profilePicture",
          commentCount: 1,
          totalLikes: 1,
        },
      },
      { $sort: { commentCount: -1 } },
      { $limit: 5 },
    ]);

    // En çok etkinliğe katılan kullanıcılar (populate ile)
    const topEventParticipants = await Event.aggregate([
      { $unwind: "$participants" },
      {
        $group: {
          _id: "$participants.user",
          eventCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          role: "$user.role",
          profilePicture: "$user.profilePicture",
          eventCount: 1,
        },
      },
      { $sort: { eventCount: -1 } },
      { $limit: 5 },
    ]);

    // Son kayıt olan kullanıcılar (populate ile)
    const recentUsers = await User.find({})
      .select("username firstName lastName role profilePicture createdAt isActive isVerified")
      .sort({ createdAt: -1 })
      .limit(10);

    // En popüler etkinlikler (populate ile)
    const topEvents = await Event.find({ status: "active" })
      .populate("authorId", "username firstName lastName role")
      .sort({ currentParticipants: -1 })
      .limit(5)
      .select("title description category currentParticipants maxParticipants date location organizer");

    // Kategori istatistikleri
    const postCategories = await Post.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
          totalViews: { $sum: "$views" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const blogCategories = await Blog.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalLikes: { $sum: { $size: "$likes" } },
          totalViews: { $sum: "$views" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const eventCategories = await Event.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalParticipants: { $sum: "$currentParticipants" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Toplam etkileşimler
    const totalPostLikes = await Post.aggregate([
      { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }
    ]);
    const totalBlogLikes = await Blog.aggregate([
      { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }
    ]);
    const totalCommentLikes = await Comment.aggregate([
      { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }
    ]);
    const totalPostViews = await Post.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalBlogViews = await Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);

    // Son 24 saatteki aktivite
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentActivity = {
      newUsers: await User.countDocuments({ createdAt: { $gte: last24Hours } }),
      newPosts: await Post.countDocuments({ createdAt: { $gte: last24Hours } }),
      newBlogs: await Blog.countDocuments({ createdAt: { $gte: last24Hours } }),
      newEvents: await Event.countDocuments({ createdAt: { $gte: last24Hours } }),
      newComments: await Comment.countDocuments({ createdAt: { $gte: last24Hours } }),
    };

    res.json({
      success: true,
      data: {
        general: {
          totalUsers,
          totalPosts,
          totalBlogs,
          totalEvents,
          totalComments,
          totalDiseases,
        },
        users: {
          activeUsers,
          verifiedUsers,
          doctors,
          patients,
          admins,
        },
        recent: {
          newUsers,
          newPosts,
          newBlogs,
          newEvents,
          newComments,
        },
        topContent: {
          topLikedPosts,
          topViewedPosts,
          topLikedBlogs,
          topViewedBlogs,
          topLikedComments,
          topEvents,
        },
        topUsers: {
          topPosters,
          topBloggers,
          topCommenters,
          topEventParticipants,
        },
        recentUsers,
        categories: {
          postCategories,
          blogCategories,
          eventCategories,
        },
        interactions: {
          totalPostLikes: totalPostLikes[0]?.totalLikes || 0,
          totalBlogLikes: totalBlogLikes[0]?.totalLikes || 0,
          totalCommentLikes: totalCommentLikes[0]?.totalLikes || 0,
          totalPostViews: totalPostViews[0]?.totalViews || 0,
          totalBlogViews: totalBlogViews[0]?.totalViews || 0,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Dashboard istatistikleri hatası:", error);
    res.status(500).json({
      success: false,
      message: "İstatistikler alınırken hata oluştu",
      error: error.message,
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

    const [
      reportedPosts,
      reportedComments,
      reportedEventPosts,
      totalReportedPosts,
      totalReportedComments,
      totalReportedEventPosts,
    ] = await Promise.all([
      Post.find({ isReported: true })
        .populate("author", "username firstName lastName")
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.find({ isReported: true })
        .populate("author", "username firstName lastName")
        .populate("postOrBlog", "title")
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EventPost.find({ isReported: true })
        .populate("author", "username firstName lastName")
        .populate("event", "title")
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ isReported: true }),
      Comment.countDocuments({ isReported: true }),
      EventPost.countDocuments({ isReported: true }),
    ]);

    const maxTotal = Math.max(
      totalReportedPosts,
      totalReportedComments,
      totalReportedEventPosts
    );

    res.json({
      reportedPosts,
      reportedComments,
      reportedEventPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(maxTotal / limit) || 1, // 0'a bölme hatasını önle
        hasNext: page * limit < maxTotal,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Raporlanan içerik getirme hatası:", error);
    res.status(500).json({
      message: "Raporlanan içerikler alınırken hata oluştu",
      error: error.message,
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
      .populate("postOrBlog", "title")
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

