import express from "express";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getCalendarData
} from "../controllers/exerciseController.js";
import { authenticateToken } from "../middleware/auth.js";
// Validasyon middleware'ini şimdilik basitleştiriyoruz veya inline tanımlayabiliriz
// Simdilik validateExercise'i kaldırıyorum, controller icinde handle edecegiz veya generic validator kullanırız.
// Ancak import hatası olmaması icin kontrol etmeliyim. 
// Plan: validation.js'i sonra duzeltiriz, simdilik express-validator controller icinde calisiyor, route level middleware'i kaldiriyorum.

const router = express.Router();

router.use(authenticateToken);

// GET /api/exercises - Günlük veya aralık bazlı aktiviteler
router.get("/", getActivities);

// GET /api/exercises/calendar - Takvim verisi
router.get("/calendar", getCalendarData);

// POST /api/exercises - Yeni aktivite
router.post("/", createActivity);

// PUT /api/exercises/:id - Güncelle
router.put("/:id", updateActivity);

// DELETE /api/exercises/:id - Sil
router.delete("/:id", deleteActivity);

export default router;
