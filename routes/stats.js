import express from "express";
import { getPublicStats } from "../controllers/statsController.js";

const router = express.Router();

// GET /api/stats/public
router.get("/public", getPublicStats);

export default router;
