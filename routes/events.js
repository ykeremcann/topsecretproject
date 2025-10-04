import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getEventParticipants,
  getUserEvents,
  searchEvents,
  getEventStats,
  approveEvent,
  reportEvent,
} from "../controllers/eventController.js";
import { validateEvent } from "../middleware/validation.js";
import {
  authenticateToken,
  requireAdmin,
  optionalAuth,
} from "../middleware/auth.js";

const router = express.Router();

// POST /api/events - Etkinlik oluştur
router.post("/", authenticateToken, validateEvent, createEvent);

// GET /api/events - Tüm etkinlikleri getir
router.get("/", optionalAuth, getAllEvents);

// GET /api/events/search - Etkinlik arama
router.get("/search", searchEvents);

// GET /api/events/stats - Etkinlik istatistikleri (admin)
router.get("/stats", authenticateToken, requireAdmin, getEventStats);

// GET /api/events/my-events - Kullanıcının etkinlikleri
router.get("/my-events", authenticateToken, getUserEvents);

// GET /api/events/:eventId - Etkinlik detayı
router.get("/:eventId", optionalAuth, getEventById);

// PUT /api/events/:eventId - Etkinlik güncelle
router.put("/:eventId", authenticateToken, validateEvent, updateEvent);

// DELETE /api/events/:eventId - Etkinlik sil
router.delete("/:eventId", authenticateToken, deleteEvent);

// POST /api/events/:eventId/register - Etkinliğe kayıt ol
router.post("/:eventId/register", authenticateToken, registerForEvent);

// DELETE /api/events/:eventId/unregister - Etkinlik kaydını iptal et
router.delete("/:eventId/unregister", authenticateToken, unregisterFromEvent);

// GET /api/events/:eventId/participants - Etkinlik katılımcıları
router.get("/:eventId/participants", authenticateToken, getEventParticipants);

// PUT /api/events/:eventId/approve - Etkinlik onayla/reddet (admin)
router.put("/:eventId/approve", authenticateToken, requireAdmin, approveEvent);

// POST /api/events/:eventId/report - Etkinlik raporla
router.post("/:eventId/report", authenticateToken, reportEvent);

export default router;
