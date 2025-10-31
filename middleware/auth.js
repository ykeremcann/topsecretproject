import jwt from "jsonwebtoken";
import User from "../models/User.js";

// JWT token doğrulama middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Erişim token'ı gerekli",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "Geçersiz token",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Hesabınız deaktif edilmiş",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Geçersiz token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token süresi dolmuş",
      });
    }
    return res.status(500).json({
      message: "Token doğrulama hatası",
    });
  }
};

// Admin yetkisi kontrolü middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Giriş yapmanız gerekli",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin yetkisi gerekli",
    });
  }

  next();
};

// Kullanıcı doğrulama middleware (kendi hesabı veya admin)
export const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Giriş yapmanız gerekli",
    });
  }

  const resourceUserId = req.params.userId || req.body.userId;

  if (req.user.role === "admin" || req.user._id.toString() === resourceUserId) {
    next();
  } else {
    return res.status(403).json({
      message: "Bu işlem için yetkiniz yok",
    });
  }
};

// Optional authentication (giriş yapmış kullanıcı varsa bilgilerini ekle)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Token geçersizse sessizce devam et
    next();
  }
};



//! ____

export const optionalAuthOrAnonymous = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      const user = await User.findById(decoded.userId).select("-password");
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (e) {
      // Token hatalıysa sessiz geç
    }
  }
  next();
};