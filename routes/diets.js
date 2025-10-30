
import express from "express";
import dietController from "../controllers/dietController.js";
import { authenticateToken } from "../middleware/auth.js";
// import { validateDiet, validateDietCompletion } from "../middleware/validation.js"; // Uncomment if you add validation

const router = express.Router();

// GET /api/diets - Tüm diyetleri getir
router.get("/", authenticateToken, dietController.getDiets);

// GET /api/diets/stats - Kullanıcı diyet istatistiklerini getir
router.get("/stats", authenticateToken, dietController.getStats);

// POST /api/diets - Yeni diyet oluştur
// router.post("/", authenticateToken, validateDiet, dietController.createDiet); // Uncomment validateDiet if you add validation
router.post("/", authenticateToken, dietController.createDiet);

// PUT /api/diets/:id - Diyet güncelle
// router.put("/:id", authenticateToken, validateDiet, dietController.updateDiet); // Uncomment validateDiet if you add validation
router.put("/:id", authenticateToken, dietController.updateDiet);

// DELETE /api/diets/:id - Diyet sil
router.delete("/:id", authenticateToken, dietController.deleteDiet);

// POST /api/diets/:id/complete - Diyeti tamamla
// router.post("/:id/complete", authenticateToken, validateDietCompletion, dietController.completeDiet); // Uncomment validateDietCompletion if you add validation
router.post("/:id/complete", authenticateToken, dietController.completeDiet);

// PATCH /api/diets/:id/toggle - Diyet durumunu değiştir (aktif/pasif)
router.patch("/:id/toggle", authenticateToken, dietController.toggleDiet);

export default router;
