import express from "express";
import {
  getDashboardStats,
  updateUserStatus,
  approvePost,
  approveComment,
  getReportedContent,
  getPendingContent,
  getCategoryStats,
} from "../controllers/adminController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Tüm admin route'ları için authentication ve admin yetkisi gerekli
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Dashboard istatistikleri
router.get("/dashboard", getDashboardStats);

// GET /api/admin/stats/categories - Kategori istatistikleri
router.get("/stats/categories", getCategoryStats);

// GET /api/admin/stats/diseases - Hastalık istatistikleri
router.get("/stats/diseases", async (req, res) => {
  try {
    const Disease = (await import("../models/Disease.js")).default;

    const categoryStats = await Disease.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          severityBreakdown: {
            $push: "$severity",
          },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          lowSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "low"] },
              },
            },
          },
          mediumSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "medium"] },
              },
            },
          },
          highSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "high"] },
              },
            },
          },
          criticalSeverity: {
            $size: {
              $filter: {
                input: "$severityBreakdown",
                cond: { $eq: ["$$this", "critical"] },
              },
            },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const totalDiseases = await Disease.countDocuments({ isActive: true });
    const totalInactiveDiseases = await Disease.countDocuments({
      isActive: false,
    });

    res.json({
      categoryStats,
      totalDiseases,
      totalInactiveDiseases,
    });
  } catch (error) {
    console.error("Hastalık istatistikleri hatası:", error);
    res.status(500).json({
      message: "Hastalık istatistikleri alınırken hata oluştu",
    });
  }
});

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

export default router;
