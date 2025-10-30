import express from "express";
import dietController from "../controllers/dietController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

router.get("/", dietController.getDiets);
router.get("/stats", dietController.getStats);
router.post("/", dietController.createDiet);
router.put("/:id", dietController.updateDiet);
router.delete("/:id", dietController.deleteDiet);
router.post("/:id/complete", dietController.completeDiet);
router.patch("/:id/toggle", dietController.toggleDiet);

export default router;
