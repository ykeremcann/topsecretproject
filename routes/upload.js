import express from "express";
import upload from "../config/multer.js";
import {
  uploadSingleImage,
  uploadMultipleImages,
  deleteImage,
} from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Tek resim yükleme - profil resmi, tek resim gereken yerler için
router.post(
  "/single",
  authenticateToken,
  upload.single("image"),
  uploadSingleImage
);

// Çoklu resim yükleme - blog, post, event resimleri için (max 10 resim)
router.post(
  "/multiple",
  authenticateToken,
  upload.array("images", 10),
  uploadMultipleImages
);

// Resim silme
router.delete("/:fileName", authenticateToken, deleteImage);

export default router;

