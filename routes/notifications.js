import express from "express";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getUserNotifications);
router.put("/:notificationId/read", markAsRead);
router.put("/mark-all-read", markAllAsRead);

export default router;
