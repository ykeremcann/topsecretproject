import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload klasörünü oluştur
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Dosya adını temizle: boşlukları ve özel karakterleri kaldır
    const cleanName = nameWithoutExt
      .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
      .replace(/[^\w\-]/g, '') // Alfanumerik, tire ve alt çizgi dışındaki karakterleri kaldır
      .replace(/\-+/g, '-') // Birden fazla tireyi tek tireye indir
      .toLowerCase(); // Küçük harfe çevir

    cb(null, `${cleanName}-${uniqueSuffix}${ext.toLowerCase()}`);
  },
});

// Dosya filtresi - sadece resim dosyalarına izin ver
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Geçersiz dosya tipi. Sadece JPEG, JPG, PNG, GIF ve WEBP dosyaları yüklenebilir."),
      false
    );
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maksimum dosya boyutu
  },
});

export default upload;

