import express from "express";
import {
  getAllDiets,
  createDiet,
  deleteDiet,
  getCalendarData,
} from "../controllers/dietController.js";
import { authenticateToken } from "../middleware/auth.js";
// validation şimdilik devre dışı bırakıyorum veya basit bir validation ekleyebiliriz
// import { validateDiet } from "../middleware/validation.js"; 

const router = express.Router();

router.use(authenticateToken);

router.get("/", getAllDiets);
router.get("/calendar", getCalendarData);
router.post("/", createDiet);
router.delete("/:id", deleteDiet);

export default router;
