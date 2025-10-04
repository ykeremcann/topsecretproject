# Admin API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin admin yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/admin
```

## Önemli Not
**Tüm admin endpoint'leri için admin yetkisi gerekir!**

## Endpoint'ler

### 1. Dashboard İstatistikleri
**GET** `/dashboard`

Admin dashboard için genel istatistikleri getirir.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "stats": {
    "totalUsers": 1250,
    "activeUsers": 1100,
    "totalPosts": 3500,
    "pendingPosts": 25,
    "totalComments": 8500,
    "pendingComments": 15,
    "totalDiseases": 150,
    "reportedContent": 8,
    "newUsersToday": 12,
    "newPostsToday": 45,
    "newCommentsToday": 120
  },
  "recentActivity": [
    {
      "type": "new_user",
      "message": "Yeni kullanıcı kaydı: Ahmet Yılmaz",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "type": "reported_post",
      "message": "Post raporlandı: 'Sağlık hakkında'",
      "timestamp": "2024-01-01T11:30:00.000Z"
    }
  ]
}
```

#### Frontend Kullanımı
```javascript
const getDashboardStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Dashboard istatistikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 2. Kategori İstatistikleri
**GET** `/stats/categories`

Kategori bazında istatistikleri getirir.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "categoryStats": [
    {
      "category": "genel",
      "postsCount": 1200,
      "commentsCount": 3500,
      "usersCount": 800
    },
    {
      "category": "hastalik",
      "postsCount": 900,
      "commentsCount": 2200,
      "usersCount": 600
    },
    {
      "category": "tedavi",
      "postsCount": 750,
      "commentsCount": 1800,
      "usersCount": 450
    },
    {
      "category": "deneyim",
      "postsCount": 650,
      "commentsCount": 1000,
      "usersCount": 400
    }
  ]
}
```

#### Frontend Kullanımı
```javascript
const getCategoryStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/admin/stats/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kategori istatistikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 3. Hastalık İstatistikleri
**GET** `/stats/diseases`

Hastalık bazında detaylı istatistikleri getirir.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "categoryStats": [
    {
      "category": "kardiyoloji",
      "count": 25,
      "lowSeverity": 5,
      "mediumSeverity": 12,
      "highSeverity": 6,
      "criticalSeverity": 2
    },
    {
      "category": "nöroloji",
      "count": 18,
      "lowSeverity": 8,
      "mediumSeverity": 7,
      "highSeverity": 2,
      "criticalSeverity": 1
    }
  ],
  "totalDiseases": 150,
  "totalInactiveDiseases": 5
}
```

#### Frontend Kullanımı
```javascript
const getDiseaseStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/admin/stats/diseases', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Hastalık istatistikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 4. Kullanıcı Durumu Güncelleme
**PUT** `/users/:userId`

Kullanıcının durumunu günceller (aktif/pasif, ban vb.).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "status": "active|inactive|banned",
  "reason": "Durum değişikliği nedeni (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Kullanıcı durumu başarıyla güncellendi",
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "email": "email@example.com",
    "status": "banned",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updateUserStatus = async (userId, statusData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kullanıcı durumu güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 5. Post Onaylama/Reddetme
**PUT** `/posts/:postId/approve`

Post'u onaylar veya reddeder.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "action": "approve|reject",
  "reason": "Onay/red nedeni (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Post başarıyla onaylandı",
  "post": {
    "id": "post_id",
    "title": "Post Başlığı",
    "status": "approved",
    "approvedAt": "2024-01-01T12:00:00.000Z",
    "approvedBy": "admin_user_id"
  }
}
```

#### Frontend Kullanımı
```javascript
const approvePost = async (postId, actionData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/admin/posts/${postId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post onaylama hatası:', error);
    throw error;
  }
};
```

---

### 6. Yorum Onaylama/Reddetme
**PUT** `/comments/:commentId/approve`

Yorumu onaylar veya reddeder.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "action": "approve|reject",
  "reason": "Onay/red nedeni (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Yorum başarıyla onaylandı",
  "comment": {
    "id": "comment_id",
    "content": "Yorum içeriği...",
    "status": "approved",
    "approvedAt": "2024-01-01T12:00:00.000Z",
    "approvedBy": "admin_user_id"
  }
}
```

#### Frontend Kullanımı
```javascript
const approveComment = async (commentId, actionData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/admin/comments/${commentId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(actionData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Yorum onaylama hatası:', error);
    throw error;
  }
};
```

---

### 7. Raporlanan İçerikleri Getir
**GET** `/reported`

Raporlanan post ve yorumları listeler.

#### Query Parameters
```
?page=1&limit=10&type=post|comment&status=pending|reviewed&sortBy=reportedAt&sortOrder=desc
```

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "reportedContent": [
    {
      "id": "report_id",
      "type": "post",
      "content": {
        "id": "post_id",
        "title": "Raporlanan Post Başlığı",
        "content": "Post içeriği...",
        "author": {
          "id": "user_id",
          "username": "kullanici_adi"
        }
      },
      "reportedBy": {
        "id": "reporter_id",
        "username": "raporlayan_kullanici"
      },
      "reason": "spam",
      "description": "Rapor açıklaması",
      "status": "pending",
      "reportedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalReports": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getReportedContent = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`http://localhost:3000/api/admin/reported?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Raporlanan içerikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 8. Bekleyen İçerikleri Getir
**GET** `/pending`

Onay bekleyen post ve yorumları listeler.

#### Query Parameters
```
?page=1&limit=10&type=post|comment&sortBy=createdAt&sortOrder=desc
```

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "pendingContent": [
    {
      "id": "post_id",
      "type": "post",
      "title": "Bekleyen Post Başlığı",
      "content": "Post içeriği...",
      "author": {
        "id": "user_id",
        "username": "kullanici_adi",
        "firstName": "Ad",
        "lastName": "Soyad"
      },
      "category": "genel",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalPending": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getPendingContent = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`http://localhost:3000/api/admin/pending?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Bekleyen içerikleri getirme hatası:', error);
    throw error;
  }
};
```

---

## Admin Yetkileri

### 1. Kullanıcı Yönetimi
- Kullanıcı durumunu değiştirme (aktif/pasif/ban)
- Kullanıcı istatistiklerini görüntüleme
- Kullanıcı hesaplarını yönetme

### 2. İçerik Yönetimi
- Post'ları onaylama/reddetme
- Yorumları onaylama/reddetme
- Raporlanan içerikleri inceleme
- Bekleyen içerikleri yönetme

### 3. Hastalık Yönetimi
- Hastalık ekleme/düzenleme/silme
- Hastalık istatistiklerini görüntüleme
- Hastalık kategorilerini yönetme

### 4. İstatistik ve Raporlama
- Dashboard istatistikleri
- Kategori bazında analizler
- Kullanıcı aktivite raporları
- İçerik performans metrikleri

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek verisi |
| 401 | Yetkilendirme hatası |
| 403 | Admin yetkisi gerekli |
| 404 | İçerik bulunamadı |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Admin yetkisi gerekli",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

## Güvenlik Notları

1. **Admin Yetkisi**: Tüm endpoint'ler admin yetkisi gerektirir
2. **JWT Token**: Geçerli admin token'ı gerekli
3. **Audit Log**: Tüm admin işlemleri loglanır
4. **Rate Limiting**: Admin endpoint'leri rate limiting'e tabidir
5. **IP Whitelist**: Production'da admin erişimi IP kısıtlaması olabilir

## Notlar

1. **Yetkilendirme**: Tüm admin endpoint'leri için admin yetkisi zorunludur
2. **İstatistikler**: Gerçek zamanlı istatistikler sağlanır
3. **Moderasyon**: İçerik moderasyonu için gerekli araçlar
4. **Raporlama**: Detaylı raporlama ve analiz imkanları
5. **Kullanıcı Yönetimi**: Kullanıcı hesaplarını yönetme
6. **İçerik Yönetimi**: Post ve yorum onaylama sistemi
7. **Dashboard**: Kapsamlı admin dashboard
8. **Audit Trail**: Tüm admin işlemleri kayıt altına alınır
