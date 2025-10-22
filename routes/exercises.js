import express from "express";
import {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  completeExercise,
  toggleExerciseStatus,
  getUserStats,
  getActiveExercises,
  getExerciseHistory,
  getDailySummary,
  getCalendarData,
} from "../controllers/exerciseController.js";
import { authenticateToken } from "../middleware/auth.js";
import { validateExercise, validateExerciseCompletion } from "../middleware/validation.js";

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// GET /api/exercises - Tüm egzersizleri getir (filtreleme ve sayfalama ile)
router.get("/", getAllExercises);

// GET /api/exercises/active - Aktif egzersizleri getir
router.get("/active", getActiveExercises);

// GET /api/exercises/stats - Kullanıcı istatistiklerini getir
router.get("/stats", getUserStats);

// GET /api/exercises/daily-summary - Günlük egzersiz özeti
router.get("/daily-summary", getDailySummary);

// GET /api/exercises/calendar - Takvim verilerini getir
router.get("/calendar", getCalendarData);

// GET /api/exercises/:id - Tek egzersiz getir
router.get("/:id", getExerciseById);

// GET /api/exercises/:id/history - Egzersiz tamamlama geçmişini getir
router.get("/:id/history", getExerciseHistory);

// POST /api/exercises - Yeni egzersiz oluştur
router.post("/", validateExercise, createExercise);

// PUT /api/exercises/:id - Egzersiz güncelle
router.put("/:id", validateExercise, updateExercise);

// DELETE /api/exercises/:id - Egzersiz sil
router.delete("/:id", deleteExercise);

// POST /api/exercises/:id/complete - Egzersizi tamamla
router.post("/:id/complete", validateExerciseCompletion, completeExercise);

// PATCH /api/exercises/:id/toggle - Egzersiz durumunu değiştir (aktif/pasif)
router.patch("/:id/toggle", toggleExerciseStatus);

export default router;
