import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

// Kullanıcı kayıt
export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, dateOfBirth } =
      req.body;

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
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
    });

    await user.save();

    // Token oluşturma
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: "Kullanıcı başarıyla oluşturuldu",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
      },
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
    const isPasswordValid = await user.comparePassword(password);
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

    res.json({
      message: "Giriş başarılı",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
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
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followers", "username firstName lastName profilePicture")
      .populate("following", "username firstName lastName profilePicture")
      .populate(
        "medicalConditions.disease",
        "name description category severity"
      );

    res.json({
      user,
    });
  } catch (error) {
    console.error("Profil getirme hatası:", error);
    res.status(500).json({
      message: "Profil bilgileri alınırken hata oluştu",
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
