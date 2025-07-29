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

  body("category")
    .isIn([
      "diabetes",
      "heart-disease",
      "cancer",
      "mental-health",
      "arthritis",
      "asthma",
      "digestive",
      "neurological",
      "autoimmune",
      "other",
    ])
    .withMessage("Geçerli bir kategori seçin"),

  body("tags")
    .optional()
    .isArray({ max: 10 })
    .withMessage("En fazla 10 etiket ekleyebilirsiniz"),

  body("tags.*")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Etiket 1-50 karakter arasında olmalı"),

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

// Yorum oluşturma validation
export const validateComment = [
  body("content")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Yorum 1-1000 karakter arasında olmalı")
    .trim(),

  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("Anonim değeri boolean olmalı"),

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

  body("medicalConditions")
    .optional()
    .isArray({ max: 20 })
    .withMessage("En fazla 20 hastalık ekleyebilirsiniz"),

  body("medicalConditions.*.disease")
    .optional()
    .isMongoId()
    .withMessage("Geçerli bir hastalık ID'si girin"),

  body("medicalConditions.*.notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notlar en fazla 500 karakter olabilir"),

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

  body("category")
    .isIn([
      "diabetes",
      "heart-disease",
      "cancer",
      "mental-health",
      "arthritis",
      "asthma",
      "digestive",
      "neurological",
      "autoimmune",
      "other",
    ])
    .withMessage("Geçerli bir kategori seçin"),

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
