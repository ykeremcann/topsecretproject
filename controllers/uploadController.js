import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tek resim yükleme
export const uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Lütfen bir resim dosyası seçin",
      });
    }

    // Dosya URL'i oluştur
    const imageUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      message: "Resim başarıyla yüklendi",
      imageUrl: imageUrl,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("Resim yükleme hatası:", error);
    res.status(500).json({
      message: "Resim yüklenirken hata oluştu",
    });
  }
};

// Çoklu resim yükleme
export const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Lütfen en az bir resim dosyası seçin",
      });
    }

    const images = req.files.map((file) => ({
      imageUrl: `/uploads/${file.filename}`,
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
    }));

    res.status(200).json({
      message: `${req.files.length} resim başarıyla yüklendi`,
      images: images,
    });
  } catch (error) {
    console.error("Çoklu resim yükleme hatası:", error);
    res.status(500).json({
      message: "Resimler yüklenirken hata oluştu",
    });
  }
};

// Resim silme
export const deleteImage = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({
        message: "Dosya adı belirtilmedi",
      });
    }

    const filePath = path.join(__dirname, "../uploads", fileName);

    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Dosya bulunamadı",
      });
    }

    // Dosyayı sil
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Resim başarıyla silindi",
      fileName: fileName,
    });
  } catch (error) {
    console.error("Resim silme hatası:", error);
    res.status(500).json({
      message: "Resim silinirken hata oluştu",
    });
  }
};

