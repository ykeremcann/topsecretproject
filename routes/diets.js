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
// sabit endpoint’ler önce
router.get("/", getAllDiets);
router.get("/stats", getUserDietStats);
router.post("/", validateExercise, createDiet);
router.put("/:id", validateExercise, updateDiet);
router.delete("/:id", deleteDiet);
router.post("/:id/complete", validateExerciseCompletion, completeDiet);
router.patch("/:id/toggle", toggleDietStatus);

// PARAMETRİK route EN SONDA olmalı
router.get("/:id", getDietById);

export default router;
