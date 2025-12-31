import { body, validationResult } from "express-validator";

// Validation sonuçlarını kontrol eden middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation hatası",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }
  next();
};

// Kullanıcı kayıt validation
export const validateRegister = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Kullanıcı adı 3-30 karakter arasında olmalı")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir"),

  body("email")
    .isEmail()
    .withMessage("Geçerli bir email adresi girin")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Şifre en az 6 karakter olmalı")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermeli"
    ),

  body("firstName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Ad 2-50 karakter arasında olmalı")
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage("Ad sadece harf içerebilir"),

  body("lastName")
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyad 2-50 karakter arasında olmalı")
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage("Soyad sadece harf içerebilir"),

  handleValidationErrors,
];

// Kullanıcı giriş validation
export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Geçerli bir email adresi girin")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Şifre gerekli"),

  handleValidationErrors,
];

// Post oluşturma validation
export const validatePost = [
  body("title")
    .isLength({ min: 5, max: 200 })
    .withMessage("Başlık 5-200 karakter arasında olmalı")
    .trim(),

  body("content")
    .isLength({ min: 10, max: 5000 })
    .withMessage("İçerik 10-5000 karakter arasında olmalı")
    .trim(),

  // body("category")
  //   .isIn([
  //     "diabetes",
  //     "heart-disease",
  //     "cancer",
  //     "mental-health",
  //     "arthritis",
  //     "asthma",
  //     "digestive",
  //     "neurological",
  //     "autoimmune",
  //     "other",
  //   ])
  //   .withMessage("Geçerli bir kategori seçin"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 etiket ekleyebilirsiniz"),

  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Etiket 1-50 karakter arasında olmalı"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 resim ekleyebilirsiniz"),

  body("images.*")
    .optional()
    .custom((value) => {
      // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
      if (/^(https?:\/\/.+|\/uploads\/.+)/.test(value)) {
        return true;
      }
      throw new Error("Geçerli bir resim URL'si veya path girin");
    }),

  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonim değeri boolean olmalı"),

  body("isSensitive")
    .optional()
    .isBoolean()
    .withMessage("Hassas içerik değeri boolean olmalı"),

  handleValidationErrors,
];

// Kullanıcı güncelleme validation
export const validateUserUpdate = [
  body("firstName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Ad 2-50 karakter arasında olmalı")
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage("Ad sadece harf içerebilir"),

  body("lastName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Soyad 2-50 karakter arasında olmalı")
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage("Soyad sadece harf içerebilir"),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Biyografi en fazla 500 karakter olabilir"),

  body("profilePicture")
    .optional()
    .custom((value) => {
      // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
      if (!value || /^(https?:\/\/.+|\/uploads\/.+)/.test(value)) {
        return true;
      }
      throw new Error("Geçerli bir profil resmi URL'si veya path girin");
    }),

  handleValidationErrors,
];

// Hastalık oluşturma validation
export const validateDisease = [
  body("name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Hastalık adı 2-100 karakter arasında olmalı")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Açıklama en fazla 500 karakter olabilir"),

  // body("category")
  //   .isIn([
  //     "diabetes",
  //     "heart-disease",
  //     "cancer",
  //     "mental-health",
  //     "arthritis",
  //     "asthma",
  //     "digestive",
  //     "neurological",
  //     "autoimmune",
  //     "other",
  //   ])
  //   .withMessage("Geçerli bir kategori seçin"),

  body("symptoms")
    .optional()
    .isArray({ max: 20 })
    .withMessage("En fazla 20 semptom ekleyebilirsiniz"),

  body("symptoms.*")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Semptom 1-100 karakter arasında olmalı"),

  body("commonTreatments")
    .optional()
    .isArray({ max: 20 })
    .withMessage("En fazla 20 tedavi ekleyebilirsiniz"),

  body("commonTreatments.*")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Tedavi 1-200 karakter arasında olmalı"),

  body("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Geçerli bir ciddiyet seviyesi seçin"),

  body("prevalence")
    .optional()
    .isIn(["rare", "uncommon", "common", "very-common"])
    .withMessage("Geçerli bir yaygınlık seviyesi seçin"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 etiket ekleyebilirsiniz"),

  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Etiket 1-50 karakter arasında olmalı"),

  handleValidationErrors,
];

// Event oluşturma/güncelleme validation
export const validateEvent = [
  body("title")
    .isLength({ min: 5, max: 200 })
    .withMessage("Etkinlik başlığı 5-200 karakter arasında olmalı")
    .trim(),

  body("description")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Etkinlik açıklaması 10-2000 karakter arasında olmalı")
    .trim(),

  // body("category")
  //   .isIn([
  //     "Meditasyon",
  //     "Yoga",
  //     "Beslenme",
  //     "Egzersiz",
  //     "Psikoloji",
  //     "Tıp",
  //     "Alternatif Tıp",
  //     "Sağlık Teknolojisi",
  //     "Diğer"
  //   ])
  //   .withMessage("Geçerli bir kategori seçin"),

  body("instructor")
    .isLength({ min: 2, max: 100 })
    .withMessage("Eğitmen adı 2-100 karakter arasında olmalı")
    .trim(),

  body("instructorTitle")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Eğitmen unvanı en fazla 100 karakter olabilir")
    .trim(),

  body("date")
    .isISO8601()
    .withMessage("Geçerli bir başlangıç tarihi girin")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error("Etkinlik tarihi gelecekte olmalı");
      }
      return true;
    }),

  body("endDate")
    .isISO8601()
    .withMessage("Geçerli bir bitiş tarihi girin")
    .custom((value, { req }) => {
      if (req.body.date) {
        const startDate = new Date(req.body.date);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error("Bitiş tarihi başlangıç tarihinden sonra olmalı");
        }
      }
      return true;
    }),

  body("location")
    .isLength({ min: 2, max: 200 })
    .withMessage("Etkinlik yeri 2-200 karakter arasında olmalı")
    .trim(),

  body("locationAddress")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Adres en fazla 300 karakter olabilir")
    .trim(),

  body("maxParticipants")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Maksimum katılımcı sayısı 1-10000 arasında olmalı"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fiyat 0 veya pozitif bir değer olmalı"),

  body("isOnline")
    .optional()
    .isBoolean()
    .withMessage("Online değeri boolean olmalı"),

  body("organizer")
    .isLength({ min: 2, max: 100 })
    .withMessage("Organizatör adı 2-100 karakter arasında olmalı")
    .trim(),

  body("organizerType")
    .isIn(["individual", "organization", "hospital", "clinic", "university", "government", "private", "ngo"])
    .withMessage("Geçerli bir organizatör türü seçin"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 etiket ekleyebilirsiniz"),

  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Etiket 1-50 karakter arasında olmalı"),

  body("requirements")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Gereksinimler en fazla 500 karakter olabilir")
    .trim(),

  body("image")
    .optional()
    .custom((value) => {
      // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
      if (!value || /^(https?:\/\/.+|\/uploads\/.+)/.test(value)) {
        return true;
      }
      throw new Error("Geçerli bir resim URL'si veya path girin");
    }),

  handleValidationErrors,
];

// Blog oluşturma/güncelleme validation
export const validateBlog = [
  body("title")
    .isLength({ min: 5, max: 200 })
    .withMessage("Blog başlığı 5-200 karakter arasında olmalı")
    .trim(),

  body("content")
    .isLength({ min: 100, max: 10000 })
    .withMessage("Blog içeriği 100-10000 karakter arasında olmalı")
    .trim(),

  body("excerpt")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Özet en fazla 500 karakter olabilir")
    .trim(),

  // body("category")
  //   .isIn([
  //     "Meditasyon",
  //     "Yoga",
  //     "Beslenme",
  //     "Egzersiz",
  //     "Psikoloji",
  //     "Tıp",
  //     "Alternatif Tıp",
  //     "Sağlık Teknolojisi",
  //     "Diğer"
  //   ])
  //   .withMessage("Geçerli bir kategori seçin"),

  body("tags")
    .optional()
    .isArray({ max: 15 })
    .withMessage("En fazla 15 etiket ekleyebilirsiniz"),

  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Etiket 1-50 karakter arasında olmalı"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 resim ekleyebilirsiniz"),

  body("images.*")
    .optional()
    .custom((value) => {
      // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
      if (/^(https?:\/\/.+|\/uploads\/.+)/.test(value)) {
        return true;
      }
      throw new Error("Geçerli bir resim URL'si veya path girin");
    }),

  body("featuredImage")
    .optional()
    .custom((value) => {
      // Hem relative path (/uploads/...) hem de full URL (http://... veya https://...) kabul et
      if (!value || /^(https?:\/\/.+|\/uploads\/.+)/.test(value)) {
        return true;
      }
      throw new Error("Geçerli bir öne çıkan resim URL'si veya path girin");
    }),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("Yayın durumu boolean olmalı"),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("Öne çıkarma durumu boolean olmalı"),

  body("medicalDisclaimer")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Tıbbi uyarı en fazla 1000 karakter olabilir")
    .trim(),

  body("references")
    .optional()
    .isArray({ max: 20 })
    .withMessage("En fazla 20 kaynak ekleyebilirsiniz"),

  body("references.*")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Kaynak 1-200 karakter arasında olmalı"),

  body("seoTitle")
    .optional()
    .isLength({ max: 60 })
    .withMessage("SEO başlığı en fazla 60 karakter olabilir")
    .trim(),

  body("seoDescription")
    .optional()
    .isLength({ max: 160 })
    .withMessage("SEO açıklaması en fazla 160 karakter olabilir")
    .trim(),

  handleValidationErrors,
];

export const validateComment = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Yorum içeriği 1-1000 karakter arasında olmalı")
    .trim(),
  body("postType")
    .optional()
    .isIn(["Post", "Blog", "EventPost"])
    .withMessage("Post türü Post, Blog veya EventPost olmalı"),
  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonim değeri boolean olmalı"),
  body("parentComment")
    .optional()
    .isMongoId()
    .withMessage("Geçerli bir parent comment ID'si girin"),
  handleValidationErrors,
];

// Egzersiz oluşturma/güncelleme validation
export const validateExercise = [
  body("name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Egzersiz adı 2-100 karakter arasında olmalı")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Açıklama en fazla 500 karakter olabilir")
    .trim(),

  body("duration")
    .isInt({ min: 1, max: 300 })
    .withMessage("Egzersiz süresi 1-300 dakika arasında olmalı"),

  body("period")
    .isIn(["daily", "weekly", "monthly", "custom"])
    .withMessage("Geçerli bir periyot seçin"),

  body("customPeriod")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Özel periyot 1-365 gün arasında olmalı"),

  handleValidationErrors,
];

// Egzersiz tamamlama validation
export const validateExerciseCompletion = [
  body("duration")
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage("Egzersiz süresi 1-300 dakika arasında olmalı"),

  body("notes")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Notlar en fazla 200 karakter olabilir")
    .trim(),

  handleValidationErrors,
];

// Diyet oluşturma/güncelleme validation
export const validateDiet = [
  body("name")
    .isLength({ min: 2, max: 100 })
    .withMessage("Diyet adı 2-100 karakter arasında olmalı")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Açıklama en fazla 500 karakter olabilir")
    .trim(),

  body("duration")
    .isInt({ min: 1, max: 365 }) // Modelde gün olarak belirtilmiş, 1-365 gün arası
    .withMessage("Diyet süresi 1-365 gün arasında olmalı"),

  body("period")
    .isIn(["daily", "weekly", "monthly", "custom"])
    .withMessage("Geçerli bir periyot seçin"),

  body("customPeriod")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Özel periyot 1-365 gün arasında olmalı"),

  body("startDate")
    .isISO8601() // Geçerli bir tarih formatı (YYYY-MM-DD)
    .withMessage("Başlangıç tarihi geçerli bir tarih formatında olmalı"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Bitiş tarihi geçerli bir tarih formatında olmalı"),

  // İsteğe bağlı, isActive sadece boolean olmalı
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Aktiflik durumu boolean olmalı"),

  handleValidationErrors,
];

// Diyet tamamlama validation
export const validateDietCompletion = [
  body("notes")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Notlar en fazla 200 karakter olabilir")
    .trim(),

  handleValidationErrors,
];
