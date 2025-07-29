import express from "express";
import {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
} from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middleware/validation.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register - Kullanıcı kayıt
router.post("/register", validateRegister, register);

// POST /api/auth/login - Kullanıcı giriş
router.post("/login", validateLogin, login);

// POST /api/auth/refresh - Token yenileme
router.post("/refresh", refreshToken);

// GET /api/auth/profile - Kullanıcı profili
router.get("/profile", authenticateToken, getProfile);

// POST /api/auth/logout - Çıkış yapma
router.post("/logout", authenticateToken, logout);

export default router;
