import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  searchUsers,
  getUserStats,
  checkDoctorApprovalStatus,
  getApprovedDoctors,
  updateUserById,
  getApprovedDoctorByUsername,
  toggleFollow,
  deleteUser
} from "../controllers/userController.js";
import { validateUserUpdate } from "../middleware/validation.js";
import {
  authenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// GET /api/users - Tüm kullanıcıları getir (admin)
router.get("/", authenticateToken, requireAdmin, getAllUsers);

//id update
router.put("/:userId", authenticateToken, requireAdmin, updateUserById);

// GET /api/users/search - Kullanıcı arama
router.get("/search", searchUsers);

// GET /api/users/experts - Onaylanmış doktorları listele (experts)
router.get("/experts", getApprovedDoctors);

// GET /api/users/doctor/approval-status - Doktor onay durumu kontrol et
router.get("/doctor/approval-status", authenticateToken, checkDoctorApprovalStatus);

// GET /api/users/experts/:username - Onaylanmış doktoru username ile getir
router.get("/experts/:username", optionalAuth, getApprovedDoctorByUsername);

// GET /api/users/:userId/stats - Kullanıcı istatistikleri
router.get("/:userId/stats", getUserStats);

// GET /api/users/:userId - Kullanıcı detayı
router.get("/:userId", getUserById);

// PUT /api/users/profile - Profil güncelleme
router.put("/profile", authenticateToken, validateUserUpdate, updateUser);

// POST /api/users/:userId/follow - Kullanıcı takip et/bırak
router.post("/:userId/follow", authenticateToken, toggleFollow);

// DELETE /api/users/:userId - Kullanıcı sil (admin)
router.delete("/:userId", authenticateToken, requireAdmin, deleteUser);

export default router;
