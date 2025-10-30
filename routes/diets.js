import express from "express";
import {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
  completeDiet,
  toggleDietStatus,
  getUserDietStats,
} from "../controllers/dietController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateExercise,
  validateExerciseCompletion,
} from "../middleware/validation.js";

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// GET /api/diets - Tüm diyetleri getir (filtreleme ve sayfalama ile)
router.get("/", getAllDiets);

// GET /api/diets/stats - Kullanıcı diyet istatistiklerini getir
router.get("/stats", getUserDietStats);

// GET /api/diets/:id - Tek diyet getir
router.get(":id", getDietById);

// POST /api/diets - Yeni diyet oluştur
router.post("/", validateExercise, createDiet);

// PUT /api/diets/:id - Diyet güncelle
router.put(":id", validateExercise, updateDiet);

// DELETE /api/diets/:id - Diyet sil
router.delete(":id", deleteDiet);

// POST /api/diets/:id/complete - Diyeti tamamla
router.post(":id/complete", validateExerciseCompletion, completeDiet);

// PATCH /api/diets/:id/toggle - Diyet durumunu değiştir (aktif/pasif)
router.patch(":id/toggle", toggleDietStatus);

export default router;
