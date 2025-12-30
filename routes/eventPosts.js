import express from "express";
import { protect } from "../middleware/auth.js";
import {
    createEventPost,
    getEventPosts,
    toggleLike,
    toggleDislike,
    deleteEventPost,
} from "../controllers/eventPostController.js";

const router = express.Router();

// Public routes (Get posts)
router.get("/:eventId", getEventPosts);

// Protected routes
router.post("/", protect, createEventPost);
router.delete("/:postId", protect, deleteEventPost);
router.post("/:postId/like", protect, toggleLike);
router.post("/:postId/dislike", protect, toggleDislike);

export default router;
