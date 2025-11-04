import express from "express";
import {
  getAllDiets,
  getDietById,
  createDiet,
  updateDiet,
  deleteDiet,
  logDietProgress,
  toggleDietStatus,
  getUserDietStats,
} from "../controllers/dietController.js";
import { authenticateToken } from "../middleware/auth.js";
import {
  validateDiet,
  validateDietCompletion,
} from "../middleware/validation.js";

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

// sabit endpoint’ler önce
router.get("/", getAllDiets);
router.get("/stats", getUserDietStats);
router.post("/", validateDiet, createDiet);
router.put("/:id", validateDiet, updateDiet);
router.delete("/:id", deleteDiet);
router.post("/:id/log-progress", validateDietCompletion, logDietProgress);
router.patch("/:id/toggle", toggleDietStatus);

// PARAMETRİK route EN SONDA olmalı
router.get("/:id", getDietById);

export default router;
