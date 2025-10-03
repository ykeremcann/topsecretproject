import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  toggleLike,
  toggleDislike,
  reportBlog,
  getUserBlogs,
  getFeaturedBlogs,
  getBlogCategories,
} from "../controllers/blogController.js";
import { validateBlog } from "../middleware/validation.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/blogs - Blog oluştur (sadece doctor ve admin)
router.post("/", authenticateToken, validateBlog, createBlog);

// GET /api/blogs - Tüm blog'ları getir
router.get("/", optionalAuth, getAllBlogs);

// GET /api/blogs/featured - Öne çıkan blog'ları getir
router.get("/featured", getFeaturedBlogs);

// GET /api/blogs/categories - Blog kategorilerini getir
router.get("/categories", getBlogCategories);

// GET /api/blogs/:blogId - Blog detayı (ID ile)
router.get("/:blogId", optionalAuth, getBlogById);

// GET /api/blogs/slug/:slug - Blog detayı (slug ile)
router.get("/slug/:slug", optionalAuth, getBlogBySlug);

// PUT /api/blogs/:blogId - Blog güncelle
router.put("/:blogId", authenticateToken, validateBlog, updateBlog);

// DELETE /api/blogs/:blogId - Blog sil
router.delete("/:blogId", authenticateToken, deleteBlog);

// POST /api/blogs/:blogId/like - Blog beğen/beğenme
router.post("/:blogId/like", authenticateToken, toggleLike);

// POST /api/blogs/:blogId/dislike - Blog beğenme/beğenmeme
router.post("/:blogId/dislike", authenticateToken, toggleDislike);

// POST /api/blogs/:blogId/report - Blog raporla
router.post("/:blogId/report", authenticateToken, reportBlog);

// GET /api/blogs/user/:userId - Kullanıcının blog'larını getir
router.get("/user/:userId", optionalAuth, getUserBlogs);

export default router;
