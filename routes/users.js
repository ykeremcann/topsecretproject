import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  toggleFollow,
  searchUsers,
  getUserStats,
  addMedicalCondition,
  removeMedicalCondition,
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

// GET /api/users/:userId - Kullanıcı detayı
router.get("/:userId", getUserById);

// GET /api/users/:userId/stats - Kullanıcı istatistikleri
router.get("/:userId/stats", getUserStats);

// PUT /api/users/profile - Profil güncelleme
router.put("/profile", authenticateToken, validateUserUpdate, updateUser);

// POST /api/users/:userId/follow - Kullanıcı takip et/takibi bırak
router.post("/:userId/follow", authenticateToken, toggleFollow);

// POST /api/users/medical-conditions - Hastalık ekle
router.post("/medical-conditions", authenticateToken, addMedicalCondition);

// DELETE /api/users/medical-conditions/:conditionId - Hastalık çıkar
router.delete(
  "/medical-conditions/:conditionId",
  authenticateToken,
  removeMedicalCondition
);

export default router;
