# Blog API Dokümantasyonu

Bu dokümantasyon, blog sistemi için kullanılabilir API endpoint'lerini açıklar. Blog sistemi, doktorlar ve adminler tarafından sağlık içerikleri oluşturmak için kullanılır.

## Temel Bilgiler

- **Base URL**: `/api/blogs`
- **Kimlik Doğrulama**: JWT token gerekli (create, update, delete, like/dislike işlemleri için)
- **Yetki Seviyeleri**: 
  - `doctor`: Blog oluşturabilir, kendi blog'larını yönetebilir
  - `admin`: Tüm blog'ları yönetebilir
  - `patient`: Sadece blog'ları görüntüleyebilir, beğenebilir

## Endpoint'ler

### 1. Blog Oluştur
**POST** `/api/blogs`

Sadece doktor ve admin kullanıcılar blog oluşturabilir.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Diyabet Yönetimi İpuçları",
  "content": "Diyabet hastaları için günlük yaşamda dikkat edilmesi gerekenler...",
  "excerpt": "Diyabet yönetiminde beslenme, egzersiz ve ilaç kullanımı hakkında önemli bilgiler.",
  "category": "medical-advice",
  "tags": ["diyabet", "beslenme", "egzersiz"],
  "images": ["https://example.com/image1.jpg"],
  "featuredImage": "https://example.com/featured.jpg",
  "isPublished": true,
  "isFeatured": false,
  "medicalDisclaimer": "Bu içerik sadece bilgilendirme amaçlıdır...",
  "references": [
    {
      "title": "Diyabet Yönetimi Rehberi",
      "url": "https://example.com/reference1"
    }
  ],
  "seoTitle": "Diyabet Yönetimi - Uzman Tavsiyeleri",
  "seoDescription": "Diyabet hastaları için kapsamlı yönetim rehberi ve uzman tavsiyeleri."
}
```

**Response (201):**
```json
{
  "message": "Blog başarıyla oluşturuldu",
  "blog": {
    "_id": "blog_id",
    "title": "Diyabet Yönetimi İpuçları",
    "content": "Diyabet hastaları için günlük yaşamda dikkat edilmesi gerekenler...",
    "excerpt": "Diyabet yönetiminde beslenme, egzersiz ve ilaç kullanımı hakkında önemli bilgiler.",
    "category": "medical-advice",
    "tags": ["diyabet", "beslenme", "egzersiz"],
    "author": {
      "_id": "user_id",
      "username": "dr_ahmet",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "profilePicture": "profile_url",
      "role": "doctor"
    },
    "isPublished": true,
    "isFeatured": false,
    "readingTime": 5,
    "slug": "diyabet-yonetimi-ipuclari",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Tüm Blog'ları Getir
**GET** `/api/blogs`

**Query Parameters:**
- `page` (optional): Sayfa numarası (default: 1)
- `limit` (optional): Sayfa başına blog sayısı (default: 10)
- `category` (optional): Kategori filtresi
- `author` (optional): Yazar ID'si
- `search` (optional): Arama terimi
- `featured` (optional): Öne çıkan blog'lar (true/false)
- `published` (optional): Yayın durumu (sadece admin için)

**Response (200):**
```json
{
  "blogs": [
    {
      "_id": "blog_id",
      "title": "Blog Başlığı",
      "excerpt": "Blog özeti...",
      "category": "medical-advice",
      "tags": ["tag1", "tag2"],
      "featuredImage": "image_url",
      "author": {
        "_id": "user_id",
        "username": "dr_ahmet",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "profilePicture": "profile_url",
        "role": "doctor"
      },
      "isPublished": true,
      "isFeatured": false,
      "readingTime": 5,
      "views": 150,
      "likesCount": 25,
      "dislikesCount": 2,
      "commentCount": 8,
      "slug": "blog-basligi",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalBlogs": 50,
    "hasNext": true,
    "hasPrev": false
  },
  "trendCategories": [
    {
      "name": "medical-advice",
      "count": 15
    }
  ]
}
```

### 3. Blog Detayı (ID ile)
**GET** `/api/blogs/:blogId`

**Response (200):**
```json
{
  "blog": {
    "_id": "blog_id",
    "title": "Blog Başlığı",
    "content": "Tam blog içeriği...",
    "excerpt": "Blog özeti...",
    "category": "medical-advice",
    "tags": ["tag1", "tag2"],
    "images": ["image1_url", "image2_url"],
    "featuredImage": "featured_image_url",
    "author": {
      "_id": "user_id",
      "username": "dr_ahmet",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "profilePicture": "profile_url",
      "role": "doctor",
      "bio": "Doktor bio'su..."
    },
    "isPublished": true,
    "isFeatured": false,
    "readingTime": 5,
    "views": 151,
    "likes": [
      {
        "_id": "user_id",
        "username": "patient1",
        "firstName": "Ali",
        "lastName": "Veli"
      }
    ],
    "dislikes": [],
    "likesCount": 25,
    "dislikesCount": 0,
    "commentCount": 8,
    "medicalDisclaimer": "Tıbbi uyarı metni...",
    "references": [
      {
        "title": "Referans Başlığı",
        "url": "https://example.com/reference"
      }
    ],
    "seoTitle": "SEO Başlığı",
    "seoDescription": "SEO açıklaması",
    "slug": "blog-basligi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Blog Detayı (Slug ile)
**GET** `/api/blogs/slug/:slug`

Slug ile blog getirme endpoint'i. SEO dostu URL'ler için kullanılır.

### 5. Blog Güncelle
**PUT** `/api/blogs/:blogId`

Sadece blog yazarı veya admin güncelleyebilir.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (create ile aynı format)

### 6. Blog Sil
**DELETE** `/api/blogs/:blogId`

Sadece blog yazarı veya admin silebilir.

**Headers:**
```
Authorization: Bearer <token>
```

### 7. Blog Beğen/Beğenme
**POST** `/api/blogs/:blogId/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Beğeni durumu güncellendi",
  "likes": 26,
  "dislikes": 1
}
```

### 8. Blog Beğenme/Beğenmeme
**POST** `/api/blogs/:blogId/dislike`

**Headers:**
```
Authorization: Bearer <token>
```

### 9. Blog Raporla
**POST** `/api/blogs/:blogId/report`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Uygunsuz içerik"
}
```

### 10. Kullanıcının Blog'larını Getir
**GET** `/api/blogs/user/:userId`

**Query Parameters:**
- `page` (optional): Sayfa numarası
- `limit` (optional): Sayfa başına blog sayısı

### 11. Öne Çıkan Blog'ları Getir
**GET** `/api/blogs/featured`

**Query Parameters:**
- `limit` (optional): Getirilecek blog sayısı (default: 5)

### 12. Blog Kategorilerini Getir
**GET** `/api/blogs/categories`

**Response (200):**
```json
{
  "categories": [
    {
      "name": "medical-advice",
      "count": 15
    },
    {
      "name": "health-tips",
      "count": 12
    }
  ]
}
```

## Blog Kategorileri

- `medical-advice`: Tıbbi Tavsiyeler
- `health-tips`: Sağlık İpuçları
- `disease-information`: Hastalık Bilgileri
- `treatment-guides`: Tedavi Rehberleri
- `prevention`: Önleme
- `nutrition`: Beslenme
- `mental-health`: Ruh Sağlığı
- `pediatrics`: Çocuk Sağlığı
- `geriatrics`: Yaşlı Sağlığı
- `emergency-care`: Acil Bakım
- `research`: Araştırma
- `other`: Diğer

## Hata Kodları

- `400`: Validation hatası
- `401`: Kimlik doğrulama gerekli
- `403`: Yetki yetersiz
- `404`: Blog bulunamadı
- `500`: Sunucu hatası

## Özellikler

- **Slug Oluşturma**: Blog başlığından otomatik SEO dostu URL oluşturma
- **Okuma Süresi**: İçerik uzunluğuna göre otomatik hesaplama
- **Görüntülenme Sayısı**: Her görüntülemede otomatik artırma
- **Beğeni Sistemi**: Like/dislike mekanizması
- **Kategori Filtreleme**: Blog'ları kategoriye göre filtreleme
- **Arama**: Başlık ve içerikte arama
- **Pagination**: Sayfalama desteği
- **SEO Desteği**: SEO başlığı ve açıklaması
- **Tıbbi Uyarı**: Her blog için tıbbi uyarı metni
- **Referans Sistemi**: Kaynak referansları ekleme
- **Öne Çıkarma**: Önemli blog'ları öne çıkarma
- **Yayın Kontrolü**: Taslak/yayın durumu kontrolü
