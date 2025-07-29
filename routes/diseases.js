import express from "express";
import {
  getAllDiseases,
  getDiseaseById,
  createDisease,
  updateDisease,
  deleteDisease,
  getDiseaseStats,
  searchDiseases,
} from "../controllers/diseaseController.js";
import { validateDisease } from "../middleware/validation.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// GET /api/diseases - Tüm hastalıkları getir
router.get("/", optionalAuth, getAllDiseases);

// GET /api/diseases/search - Hastalık arama
router.get("/search", searchDiseases);

// GET /api/diseases/stats - Hastalık istatistikleri (admin)
router.get("/stats", authenticateToken, requireAdmin, getDiseaseStats);

// GET /api/diseases/:diseaseId - Hastalık detayı
router.get("/:diseaseId", optionalAuth, getDiseaseById);

// POST /api/diseases - Hastalık oluştur (admin)
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  validateDisease,
  createDisease
);

// PUT /api/diseases/:diseaseId - Hastalık güncelle (admin)
router.put(
  "/:diseaseId",
  authenticateToken,
  requireAdmin,
  validateDisease,
  updateDisease
);

// DELETE /api/diseases/:diseaseId - Hastalık sil (admin)
router.delete("/:diseaseId", authenticateToken, requireAdmin, deleteDisease);

export default router;
