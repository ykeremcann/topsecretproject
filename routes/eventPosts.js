import express from "express";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";
import {
    createEventPost,
    getEventPosts,
    toggleLike,
    toggleDislike,
    deleteEventPost,
} from "../controllers/eventPostController.js";

const router = express.Router();

// Public routes (Get posts) with optional auth for likes status
router.get("/:eventId", optionalAuth, getEventPosts);

// Protected routes
router.post("/", authenticateToken, createEventPost);
router.delete("/:postId", authenticateToken, deleteEventPost);
router.post("/:postId/like", authenticateToken, toggleLike);
router.post("/:postId/dislike", authenticateToken, toggleDislike);

export default router;
