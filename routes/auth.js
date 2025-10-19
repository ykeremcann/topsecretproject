import express from "express";
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateUser,
  logout,
} from "../controllers/authController.js";
import { validateRegister, validateLogin, validateUserUpdate } from "../middleware/validation.js";
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

// PUT /api/auth/profile - Kullanıcı profili güncelleme
router.put("/profile", authenticateToken, validateUserUpdate, updateUser);

// POST /api/auth/logout - Çıkış yapma
router.post("/logout", authenticateToken, logout);

export default router;
