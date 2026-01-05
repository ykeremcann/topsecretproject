import express from "express";
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
  toggleLike,
  toggleDislike,
  reportComment,
  getAllComments,
  replyToComment,
} from "../controllers/commentController.js";
import { validateComment } from "../middleware/validation.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Yeni endpoint: /api/comments
router.get("/", optionalAuth, getAllComments);

// POST /api/comments/:postId - Yorum oluştur
router.post("/:postId", authenticateToken, validateComment, createComment);

// GET /api/comments/:postId - Post'un yorumlarını getir
router.get("/:postId", optionalAuth, getPostComments);

// PUT /api/comments/:commentId - Yorum güncelle
router.put("/:commentId", authenticateToken, validateComment, updateComment);

// DELETE /api/comments/:commentId - Yorum sil
router.delete("/:commentId", authenticateToken, deleteComment);

// POST /api/comments/:commentId/like - Yorum beğen/beğenme
router.post("/:commentId/like", authenticateToken, toggleLike);

// POST /api/comments/:commentId/dislike - Yorum beğenme/beğenmeme
router.post("/:commentId/dislike", authenticateToken, toggleDislike);

// POST /api/comments/:commentId/report - Yorum raporla
router.post("/:commentId/report", authenticateToken, reportComment);


// POST /api/comments/:commentId/reply - Yoruma yanıt ver
router.post("/:commentId/reply", authenticateToken, validateComment, replyToComment);

export default router;
