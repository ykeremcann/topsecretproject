# 🏥 Hasta Sosyal Medyası API

Hastaların hastalıklarını paylaştığı, deneyimlerini tartıştığı ve birbirlerine destek olduğu sosyal medya platformu için backend API'si.

## 📋 Özellikler

### 🔐 Kimlik Doğrulama & Yetkilendirme

- JWT tabanlı kimlik doğrulama
- Kullanıcı kayıt ve giriş sistemi
- Admin ve hasta rolleri
- Token yenileme sistemi

### 👥 Kullanıcı Yönetimi

- Kullanıcı profilleri ve biyografiler
- Takip etme/takip bırakma sistemi
- Kullanıcı arama
- Profil güncelleme
- Hastalık yönetimi (ekleme/çıkarma)

### 🏥 Hastalık Yönetimi

- Kapsamlı hastalık veritabanı
- Admin tarafından hastalık CRUD işlemleri
- Hastalık arama ve filtreleme
- Kategori bazlı sınıflandırma
- Ciddiyet ve yaygınlık seviyeleri
- Semptom ve tedavi bilgileri

### 📝 İçerik Yönetimi

- Hasta deneyimi paylaşımları
- Kategori bazlı post'lar (diyabet, kalp hastalığı, kanser, vb.)
- Anonim paylaşım seçeneği
- Hassas içerik işaretleme
- Beğeni/beğenmeme sistemi
- Görüntülenme sayacı

### 💬 Yorum Sistemi

- Post'lara yorum yapma
- Yanıtlama sistemi (nested comments)
- Anonim yorum seçeneği
- Beğeni/beğenmeme sistemi

### 🛡️ Admin Paneli

- Dashboard istatistikleri
- Kullanıcı yönetimi
- İçerik onaylama/reddetme
- Raporlanan içerikleri görüntüleme
- Kategori istatistikleri
- Hastalık yönetimi ve istatistikleri

### 🔍 Arama ve Filtreleme

- Post arama
- Kullanıcı arama
- Kategori bazlı filtreleme
- Sayfalama sistemi

## 🛠️ Teknolojiler

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens
- **bcryptjs** - Şifre hash'leme
- **express-validator** - Input validation
- **helmet** - Güvenlik middleware
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

## 📁 Proje Yapısı

```
patient-api/
├── config/
│   └── database.js          # MongoDB bağlantı konfigürasyonu
├── controllers/
│   ├── authController.js    # Kimlik doğrulama işlemleri
│   ├── userController.js    # Kullanıcı yönetimi
│   ├── postController.js    # Post işlemleri
│   ├── commentController.js # Yorum işlemleri
│   └── adminController.js   # Admin işlemleri
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── validation.js       # Input validation middleware
├── models/
│   ├── User.js             # Kullanıcı modeli
│   ├── Post.js             # Post modeli
│   ├── Comment.js          # Yorum modeli
│   └── Disease.js          # Hastalık modeli
├── routes/
│   ├── auth.js             # Kimlik doğrulama route'ları
│   ├── users.js            # Kullanıcı route'ları
│   ├── posts.js            # Post route'ları
│   ├── comments.js         # Yorum route'ları
│   ├── diseases.js         # Hastalık route'ları
│   └── admin.js            # Admin route'ları
├── utils/
│   └── jwt.js              # JWT utility fonksiyonları
├── index.js                # Ana server dosyası
├── package.json            # Proje bağımlılıkları
└── README.md               # Proje dokümantasyonu
```

## 🚀 Kurulum

### Gereksinimler

- Node.js (v14 veya üzeri)
- MongoDB (v4.4 veya üzeri)
- npm veya yarn

### Adımlar

1. **Projeyi klonlayın**

```bash
git clone <repository-url>
cd patient-api
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Environment variables dosyası oluşturun**

```bash
cp .env.example .env
```

4. **Environment variables'ları düzenleyin**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/patient-social-media

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. **MongoDB'yi başlatın**

```bash
# MongoDB'nin çalıştığından emin olun
mongod
```

6. **Uygulamayı başlatın**

```bash
# Development modunda
npm run dev

# Production modunda
npm start
```

## 📚 API Endpoints

### 🔐 Kimlik Doğrulama

- `POST /api/auth/register` - Kullanıcı kayıt
- `POST /api/auth/login` - Kullanıcı giriş
- `POST /api/auth/refresh` - Token yenileme
- `GET /api/auth/profile` - Kullanıcı profili
- `POST /api/auth/logout` - Çıkış yapma

### 👥 Kullanıcılar

- `GET /api/users` - Tüm kullanıcıları getir (admin)
- `GET /api/users/search` - Kullanıcı arama
- `GET /api/users/:userId` - Kullanıcı detayı
- `GET /api/users/:userId/stats` - Kullanıcı istatistikleri
- `PUT /api/users/profile` - Profil güncelleme
- `POST /api/users/:userId/follow` - Takip et/takibi bırak
- `POST /api/users/medical-conditions` - Hastalık ekle
- `DELETE /api/users/medical-conditions/:conditionId` - Hastalık çıkar

### 📝 Post'lar

- `POST /api/posts` - Post oluştur
- `GET /api/posts` - Tüm post'ları getir
- `GET /api/posts/:postId` - Post detayı
- `PUT /api/posts/:postId` - Post güncelle
- `DELETE /api/posts/:postId` - Post sil
- `POST /api/posts/:postId/like` - Post beğen/beğenme
- `POST /api/posts/:postId/dislike` - Post beğenme/beğenmeme
- `POST /api/posts/:postId/report` - Post raporla
- `GET /api/posts/user/:userId` - Kullanıcının post'larını getir

### 💬 Yorumlar

- `POST /api/comments/:postId` - Yorum oluştur
- `GET /api/comments/:postId` - Post'un yorumlarını getir
- `PUT /api/comments/:commentId` - Yorum güncelle
- `DELETE /api/comments/:commentId` - Yorum sil
- `POST /api/comments/:commentId/like` - Yorum beğen/beğenme
- `POST /api/comments/:commentId/dislike` - Yorum beğenme/beğenmeme
- `POST /api/comments/:commentId/report` - Yorum raporla

### 🏥 Hastalıklar

- `GET /api/diseases` - Tüm hastalıkları getir
- `GET /api/diseases/search` - Hastalık arama
- `GET /api/diseases/stats` - Hastalık istatistikleri (admin)
- `GET /api/diseases/:diseaseId` - Hastalık detayı
- `POST /api/diseases` - Hastalık oluştur (admin)
- `PUT /api/diseases/:diseaseId` - Hastalık güncelle (admin)
- `DELETE /api/diseases/:diseaseId` - Hastalık sil (admin)

### 🛡️ Admin

- `GET /api/admin/dashboard` - Dashboard istatistikleri
- `GET /api/admin/stats/categories` - Kategori istatistikleri
- `GET /api/admin/stats/diseases` - Hastalık istatistikleri
- `PUT /api/admin/users/:userId` - Kullanıcı durumu güncelle
- `PUT /api/admin/posts/:postId/approve` - Post onayla/reddet
- `PUT /api/admin/comments/:commentId/approve` - Yorum onayla/reddet
- `GET /api/admin/reported` - Raporlanan içerikleri getir
- `GET /api/admin/pending` - Bekleyen içerikleri getir

## 🔧 Kullanım Örnekleri

### Kullanıcı Kayıt

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hasta123",
    "email": "hasta@example.com",
    "password": "Güvenli123",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "dateOfBirth": "1990-05-15"
  }'
```

### Kullanıcı Giriş

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hasta@example.com",
    "password": "Güvenli123"
  }'
```

### Post Oluşturma

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Diyabet ile Yaşam Deneyimim",
    "content": "Diyabet teşhisi konulduktan sonra yaşadığım deneyimler...",
    "category": "diabetes",
    "tags": ["diyabet", "yaşam", "deneyim"],
    "isAnonymous": false,
    "symptoms": ["sık idrara çıkma", "aşırı susama"],
    "treatments": ["insülin", "diyet"]
  }'
```

### Hastalık Oluşturma (Admin)

```bash
curl -X POST http://localhost:5000/api/diseases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Tip 2 Diyabet",
    "description": "İnsülin direnci nedeniyle oluşan kronik hastalık",
    "category": "diabetes",
    "symptoms": ["aşırı susama", "sık idrara çıkma", "yorgunluk"],
    "commonTreatments": ["metformin", "diyet", "egzersiz"],
    "severity": "medium",
    "prevalence": "common",
    "tags": ["kronik", "metabolik"]
  }'
```

### Kullanıcıya Hastalık Ekleme

```bash
curl -X POST http://localhost:5000/api/users/medical-conditions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -d '{
    "diseaseId": "64f8b123abc123456789def0",
    "diagnosisDate": "2023-01-15",
    "notes": "Aile geçmişinde var, diyet kontrolü yapıyorum"
  }'
```

### Hastalık Arama

```bash
curl -X GET "http://localhost:5000/api/diseases/search?q=diyabet&limit=10" \
  -H "Content-Type: application/json"
```

## 🔒 Güvenlik

- JWT token tabanlı kimlik doğrulama
- Şifre hash'leme (bcryptjs)
- Rate limiting
- Input validation
- CORS koruması
- Helmet güvenlik middleware'i
- XSS ve CSRF koruması

## 📊 Veritabanı Şeması

### User Model

- Kullanıcı bilgileri (ad, soyad, email, şifre)
- Rol (patient/admin)
- Hastalık bilgileri
- Takip sistemi
- Profil bilgileri

### Post Model

- Başlık ve içerik
- Kategori ve etiketler
- Yazar bilgisi
- Beğeni/beğenmeme sistemi
- Onay durumu
- Raporlama sistemi

### Comment Model

- Yorum içeriği
- Post referansı
- Yanıtlama sistemi
- Beğeni/beğenmeme
- Onay durumu

### Disease Model

- Hastalık adı ve açıklaması
- Kategori (diabetes, heart-disease, cancer, vb.)
- Semptomlar ve tedaviler
- Ciddiyet seviyesi (low, medium, high, critical)
- Yaygınlık seviyesi (rare, uncommon, common, very-common)
- Aktiflik durumu
- Oluşturan admin bilgisi

## 🧪 Test

```bash
# Test çalıştırma
npm test
```

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilirsiniz.

## 🔄 Güncellemeler

### v1.1.0

- Hastalık yönetim sistemi eklendi
- Disease modeli ve API endpoint'leri
- Kullanıcı hastalık yönetimi (ekleme/çıkarma)
- Admin hastalık CRUD işlemleri
- Hastalık arama ve filtreleme
- Ciddiyet ve yaygınlık seviyeleri
- İstatistiksel raporlama

### v1.0.0

- İlk sürüm
- Temel CRUD işlemleri
- JWT authentication
- Admin paneli
- Yorum sistemi
