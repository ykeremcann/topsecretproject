# Posts API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin post yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/posts
```

## Endpoint'ler

### 1. Post Oluşturma
**POST** `/`

Yeni bir post oluşturur.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "title": "Post Başlığı",
  "content": "Post içeriği burada yer alır...",
  "category": "diabetes|heart-disease|cancer|mental-health|arthritis|asthma|digestive|neurological|autoimmune|other",
  "tags": ["tag1", "tag2", "tag3"],
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  "isAnonymous": false,
  "isSensitive": false,
  "medicalAdvice": false,
  "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
  "treatments": ["Tedavi 1", "Tedavi 2", "Tedavi 3"]
}
```

#### Response (201 Created)
```json
{
  "message": "Post başarıyla oluşturuldu",
  "post": {
    "id": "post_id",
    "title": "Post Başlığı",
    "content": "Post içeriği burada yer alır...",
    "category": "diabetes",
    "tags": ["tag1", "tag2", "tag3"],
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "isAnonymous": false,
    "isSensitive": false,
    "medicalAdvice": false,
    "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
    "treatments": ["Tedavi 1", "Tedavi 2", "Tedavi 3"],
    "author": {
      "id": "user_id",
      "username": "kullanici_adi",
      "firstName": "Ad",
      "lastName": "Soyad",
      "profilePicture": "profile_image_url"
    },
    "likes": [],
    "dislikes": [],
    "views": 0,
    "isApproved": true,
    "isReported": false,
    "reportCount": 0,
    "likesCount": 0,
    "dislikesCount": 0,
    "commentCount": 0,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const createPost = async (postData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.post;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post oluşturma hatası:', error);
    throw error;
  }
};
```

---

### 2. Tüm Post'ları Getir
**GET** `/`

Tüm post'ları listeler (sayfalama ile).

#### Query Parameters
```
?page=1&limit=10&category=genel&sortBy=createdAt&sortOrder=desc&search=arama_terimi
```

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "posts": [
    {
      "id": "post_id",
      "title": "Post Başlığı",
      "content": "Post içeriği...",
      "category": "diabetes",
      "tags": ["tag1", "tag2"],
      "images": ["https://example.com/image1.jpg"],
      "isAnonymous": false,
      "isSensitive": false,
      "medicalAdvice": false,
      "symptoms": ["Belirti 1", "Belirti 2"],
      "treatments": ["Tedavi 1", "Tedavi 2"],
      "author": {
        "id": "user_id",
        "username": "kullanici_adi",
        "firstName": "Ad",
        "lastName": "Soyad",
        "profilePicture": "profile_image_url"
      },
      "likes": ["user_id_1", "user_id_2"],
      "dislikes": ["user_id_3"],
      "views": 150,
      "isApproved": true,
      "isReported": false,
      "reportCount": 0,
      "likesCount": 15,
      "dislikesCount": 2,
      "commentCount": 8,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalPosts": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getAllPosts = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/posts?${queryParams}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post\'ları getirme hatası:', error);
    throw error;
  }
};
```

---

### 3. Post Detayı
**GET** `/:postId`

Belirli bir post'un detay bilgilerini getirir.

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "post": {
    "id": "post_id",
    "title": "Post Başlığı",
    "content": "Post içeriği burada yer alır...",
    "category": "diabetes",
    "tags": ["tag1", "tag2", "tag3"],
    "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "isAnonymous": false,
    "isSensitive": false,
    "medicalAdvice": false,
    "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
    "treatments": ["Tedavi 1", "Tedavi 2", "Tedavi 3"],
    "author": {
      "id": "user_id",
      "username": "kullanici_adi",
      "firstName": "Ad",
      "lastName": "Soyad",
      "profilePicture": "profile_image_url"
    },
    "likes": [
      {
        "id": "user_id_1",
        "username": "kullanici1",
        "firstName": "Ad1",
        "lastName": "Soyad1",
        "profilePicture": "profile1.jpg"
      }
    ],
    "dislikes": [
      {
        "id": "user_id_2",
        "username": "kullanici2",
        "firstName": "Ad2",
        "lastName": "Soyad2",
        "profilePicture": "profile2.jpg"
      }
    ],
    "views": 250,
    "isApproved": true,
    "isReported": false,
    "reportCount": 0,
    "likesCount": 15,
    "dislikesCount": 2,
    "commentCount": 8,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const getPostById = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.post;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post detayı getirme hatası:', error);
    throw error;
  }
};
```

---

### 4. Post Güncelleme
**PUT** `/:postId`

Mevcut bir post'u günceller (sadece post sahibi).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "title": "Güncellenmiş Post Başlığı",
  "content": "Güncellenmiş post içeriği...",
  "category": "heart-disease",
  "tags": ["yeni_tag1", "yeni_tag2"],
  "images": ["https://example.com/new_image.jpg"],
  "isAnonymous": true,
  "isSensitive": true,
  "medicalAdvice": true,
  "symptoms": ["Yeni belirti 1", "Yeni belirti 2"],
  "treatments": ["Yeni tedavi 1", "Yeni tedavi 2"]
}
```

#### Response (200 OK)
```json
{
  "message": "Post başarıyla güncellendi",
  "post": {
    "id": "post_id",
    "title": "Güncellenmiş Post Başlığı",
    "content": "Güncellenmiş post içeriği...",
    "category": "heart-disease",
    "tags": ["yeni_tag1", "yeni_tag2"],
    "images": ["https://example.com/new_image.jpg"],
    "isAnonymous": true,
    "isSensitive": true,
    "medicalAdvice": true,
    "symptoms": ["Yeni belirti 1", "Yeni belirti 2"],
    "treatments": ["Yeni tedavi 1", "Yeni tedavi 2"],
    "author": {
      "id": "user_id",
      "username": "kullanici_adi",
      "firstName": "Ad",
      "lastName": "Soyad",
      "profilePicture": "profile_image_url"
    },
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updatePost = async (postId, postData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.post;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 5. Post Silme
**DELETE** `/:postId`

Bir post'u siler (sadece post sahibi veya admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Post başarıyla silindi"
}
```

#### Frontend Kullanımı
```javascript
const deletePost = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/posts/${postId}`, {
      method: 'DELETE',
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
    console.error('Post silme hatası:', error);
    throw error;
  }
};
```

---

### 6. Post Beğenme/Beğenmeme
**POST** `/:postId/like`

Bir post'u beğenir veya beğenmeyi geri alır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Post beğenildi",
  "isLiked": true,
  "likesCount": 16
}
```

#### Frontend Kullanımı
```javascript
const toggleLike = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/posts/${postId}/like`, {
      method: 'POST',
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
    console.error('Beğeni işlemi hatası:', error);
    throw error;
  }
};
```

---

### 7. Post Beğenmeme/Beğenmemeyi Geri Alma
**POST** `/:postId/dislike`

Bir post'u beğenmez veya beğenmemeyi geri alır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Post beğenilmedi",
  "isDisliked": true,
  "dislikesCount": 3
}
```

#### Frontend Kullanımı
```javascript
const toggleDislike = async (postId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/posts/${postId}/dislike`, {
      method: 'POST',
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
    console.error('Beğenmeme işlemi hatası:', error);
    throw error;
  }
};
```

---

### 8. Post Raporlama
**POST** `/:postId/report`

Bir post'u raporlar.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "reason": "spam|inappropriate|harassment|false_information|other",
  "description": "Rapor açıklaması (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Post başarıyla raporlandı"
}
```

#### Frontend Kullanımı
```javascript
const reportPost = async (postId, reportData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/posts/${postId}/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Post raporlama hatası:', error);
    throw error;
  }
};
```

---

### 9. Kullanıcının Post'larını Getir
**GET** `/user/:userId`

Belirli bir kullanıcının post'larını listeler.

#### Query Parameters
```
?page=1&limit=10&category=genel
```

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "posts": [
    {
      "id": "post_id",
      "title": "Post Başlığı",
      "content": "Post içeriği...",
      "category": "diabetes",
      "tags": ["tag1", "tag2"],
      "images": ["https://example.com/image1.jpg"],
      "isAnonymous": false,
      "isSensitive": false,
      "medicalAdvice": false,
      "symptoms": ["Belirti 1", "Belirti 2"],
      "treatments": ["Tedavi 1", "Tedavi 2"],
      "author": {
        "id": "user_id",
        "username": "kullanici_adi",
        "firstName": "Ad",
        "lastName": "Soyad",
        "profilePicture": "profile_image_url"
      },
      "views": 150,
      "isApproved": true,
      "isReported": false,
      "reportCount": 0,
      "likesCount": 15,
      "dislikesCount": 2,
      "commentCount": 8,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getUserPosts = async (userId, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/posts/user/${userId}?${queryParams}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kullanıcı post\'ları getirme hatası:', error);
    throw error;
  }
};
```

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek verisi |
| 401 | Yetkilendirme hatası |
| 403 | Yetki yetersizliği |
| 404 | Post bulunamadı |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "title",
      "message": "Başlık alanı zorunludur"
    }
  ]
}
```

## Post Kategorileri

| Kategori | Açıklama |
|----------|----------|
| diabetes | Diyabet |
| heart-disease | Kalp hastalıkları |
| cancer | Kanser |
| mental-health | Ruh sağlığı |
| arthritis | Artrit |
| asthma | Astım |
| digestive | Sindirim sistemi |
| neurological | Nörolojik hastalıklar |
| autoimmune | Otoimmün hastalıklar |
| other | Diğer |

## Post Alanları

### Temel Alanlar
- **title**: Post başlığı (5-200 karakter)
- **content**: Post içeriği (10-5000 karakter)
- **category**: Post kategorisi (enum)
- **tags**: Etiketler (max 10, her biri max 50 karakter)
- **images**: Resim URL'leri (geçerli HTTP/HTTPS URL'leri)

### Durum Alanları
- **isAnonymous**: Anonim post mu? (boolean)
- **isSensitive**: Hassas içerik mi? (boolean)
- **medicalAdvice**: Tıbbi tavsiye içeriyor mu? (boolean)
- **isApproved**: Onaylandı mı? (boolean, default: true)
- **isReported**: Raporlandı mı? (boolean, default: false)
- **reportCount**: Rapor sayısı (number, default: 0)

### Tıbbi Alanlar
- **symptoms**: Belirtiler (max 20, her biri max 100 karakter)
- **treatments**: Tedaviler (max 20, her biri max 200 karakter)

### Etkileşim Alanları
- **likes**: Beğenen kullanıcılar (ObjectId array)
- **dislikes**: Beğenmeyen kullanıcılar (ObjectId array)
- **views**: Görüntülenme sayısı (number, default: 0)
- **likesCount**: Beğeni sayısı (virtual field)
- **dislikesCount**: Beğenmeme sayısı (virtual field)
- **commentCount**: Yorum sayısı (virtual field)

## Notlar

1. **Yetkilendirme**: Post oluşturma, güncelleme, silme ve etkileşim için JWT token gerekir
2. **Anonim Post'lar**: Kullanıcılar anonim post oluşturabilir
3. **Kategori Sistemi**: Post'lar kategorilere ayrılabilir
4. **Etiket Sistemi**: Post'lara etiket eklenebilir
5. **Resim Desteği**: Post'lara birden fazla resim eklenebilir
6. **Tıbbi İçerik**: Belirti ve tedavi bilgileri eklenebilir
7. **Hassas İçerik**: Hassas içerik işaretlenebilir
8. **Tıbbi Tavsiye**: Tıbbi tavsiye içeren post'lar işaretlenebilir
9. **Beğeni Sistemi**: Kullanıcılar post'ları beğenebilir/beğenmeyebilir
10. **Raporlama**: Uygunsuz içerik raporlanabilir
11. **Görüntülenme**: Post görüntülenme sayısı takip edilir
12. **Sayfalama**: Tüm listeleme endpoint'leri sayfalama destekler
13. **Arama**: Başlık ve içerikte metin arama yapılabilir
14. **Filtreleme**: Kategori, yazar gibi kriterlere göre filtreleme
