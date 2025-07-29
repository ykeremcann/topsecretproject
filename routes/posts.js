import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  toggleDislike,
  reportPost,
  getUserPosts,
} from "../controllers/postController.js";
import { validatePost } from "../middleware/validation.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/posts - Post oluştur
router.post("/", authenticateToken, validatePost, createPost);

// GET /api/posts - Tüm post'ları getir
router.get("/", optionalAuth, getAllPosts);

// GET /api/posts/:postId - Post detayı
router.get("/:postId", optionalAuth, getPostById);

// PUT /api/posts/:postId - Post güncelle
router.put("/:postId", authenticateToken, validatePost, updatePost);

// DELETE /api/posts/:postId - Post sil
router.delete("/:postId", authenticateToken, deletePost);

// POST /api/posts/:postId/like - Post beğen/beğenme
router.post("/:postId/like", authenticateToken, toggleLike);

// POST /api/posts/:postId/dislike - Post beğenme/beğenmeme
router.post("/:postId/dislike", authenticateToken, toggleDislike);

// POST /api/posts/:postId/report - Post raporla
router.post("/:postId/report", authenticateToken, reportPost);

// GET /api/posts/user/:userId - Kullanıcının post'larını getir
router.get("/user/:userId", optionalAuth, getUserPosts);

export default router;
