import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  searchUsers,
  getUserStats,
  checkDoctorApprovalStatus,
  getApprovedDoctors,
} from "../controllers/userController.js";
import { validateUserUpdate } from "../middleware/validation.js";
import {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
} from "../middleware/auth.js";

const router = express.Router();

// GET /api/users - Tüm kullanıcıları getir (admin)
router.get("/", authenticateToken, requireAdmin, getAllUsers);

// GET /api/users/search - Kullanıcı arama
router.get("/search", searchUsers);

// GET /api/users/experts - Onaylanmış doktorları listele (experts)
router.get("/experts", getApprovedDoctors);

// GET /api/users/doctor/approval-status - Doktor onay durumu kontrol et
router.get("/doctor/approval-status", authenticateToken, checkDoctorApprovalStatus);

// GET /api/users/:userId/stats - Kullanıcı istatistikleri
router.get("/:userId/stats", getUserStats);

// GET /api/users/:userId - Kullanıcı detayı
router.get("/:userId", getUserById);

// PUT /api/users/profile - Profil güncelleme
router.put("/profile", authenticateToken, validateUserUpdate, updateUser);

export default router;
