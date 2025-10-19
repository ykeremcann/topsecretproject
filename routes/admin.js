import express from "express";
import {
  getDashboardStats,
  updateUserStatus,
  approvePost,
  approveComment,
  getReportedContent,
  getPendingContent,
} from "../controllers/adminController.js";
import {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
} from "../controllers/userController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Tüm admin route'ları için authentication ve admin yetkisi gerekli
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Kapsamlı dashboard istatistikleri
router.get("/dashboard", getDashboardStats);

// PUT /api/admin/users/:userId - Kullanıcı durumu güncelle
router.put("/users/:userId", updateUserStatus);

// PUT /api/admin/posts/:postId/approve - Post onayla/reddet
router.put("/posts/:postId/approve", approvePost);

// PUT /api/admin/comments/:commentId/approve - Yorum onayla/reddet
router.put("/comments/:commentId/approve", approveComment);

// GET /api/admin/reported - Raporlanan içerikleri getir
router.get("/reported", getReportedContent);

// GET /api/admin/pending - Bekleyen içerikleri getir
router.get("/pending", getPendingContent);

// Doktor onay sistemi route'ları
// GET /api/admin/doctors/pending - Onay bekleyen doktorları listele
router.get("/doctors/pending", getPendingDoctors);

// PUT /api/admin/doctors/:doctorId/approve - Doktor onayla
router.put("/doctors/:doctorId/approve", approveDoctor);

// PUT /api/admin/doctors/:doctorId/reject - Doktor reddet
router.put("/doctors/:doctorId/reject", rejectDoctor);

export default router;
