# Comments API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin yorum yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/comments
```

## Endpoint'ler

### 1. Yorum Oluşturma
**POST** `/:postId`

Belirli bir post'a yeni yorum ekler.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "content": "Yorum içeriği burada yer alır...",
  "parentCommentId": "parent_comment_id_optional"
}
```

#### Response (201 Created)
```json
{
  "message": "Yorum başarıyla oluşturuldu",
  "comment": {
    "id": "comment_id",
    "content": "Yorum içeriği burada yer alır...",
    "author": {
      "id": "user_id",
      "username": "kullanici_adi",
      "firstName": "Ad",
      "lastName": "Soyad",
      "profilePicture": "profile_image_url"
    },
    "post": {
      "id": "post_id",
      "title": "Post Başlığı"
    },
    "parentComment": {
      "id": "parent_comment_id",
      "content": "Ana yorum içeriği"
    },
    "repliesCount": 0,
    "likesCount": 0,
    "dislikesCount": 0,
    "isLiked": false,
    "isDisliked": false,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const createComment = async (postId, commentData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.comment;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Yorum oluşturma hatası:', error);
    throw error;
  }
};
```

---

### 2. Post'un Yorumlarını Getir
**GET** `/:postId`

Belirli bir post'un tüm yorumlarını listeler.

#### Query Parameters
```
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "comments": [
    {
      "id": "comment_id",
      "content": "Yorum içeriği burada yer alır...",
      "author": {
        "id": "user_id",
        "username": "kullanici_adi",
        "firstName": "Ad",
        "lastName": "Soyad",
        "profilePicture": "profile_image_url"
      },
      "parentComment": null,
      "replies": [
        {
          "id": "reply_comment_id",
          "content": "Yanıt içeriği...",
          "author": {
            "id": "user_id_2",
            "username": "kullanici_adi_2",
            "firstName": "Ad2",
            "lastName": "Soyad2",
            "profilePicture": "profile_image_url_2"
          },
          "likesCount": 5,
          "dislikesCount": 1,
          "isLiked": false,
          "isDisliked": false,
          "createdAt": "2024-01-01T12:30:00.000Z"
        }
      ],
      "repliesCount": 1,
      "likesCount": 10,
      "dislikesCount": 2,
      "isLiked": true,
      "isDisliked": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalComments": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getPostComments = async (postId, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/comments/${postId}?${queryParams}`, {
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
    console.error('Yorumları getirme hatası:', error);
    throw error;
  }
};
```

---

### 3. Yorum Güncelleme
**PUT** `/:commentId`

Mevcut bir yorumu günceller (sadece yorum sahibi).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "content": "Güncellenmiş yorum içeriği..."
}
```

#### Response (200 OK)
```json
{
  "message": "Yorum başarıyla güncellendi",
  "comment": {
    "id": "comment_id",
    "content": "Güncellenmiş yorum içeriği...",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updateComment = async (commentId, commentData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.comment;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Yorum güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 4. Yorum Silme
**DELETE** `/:commentId`

Bir yorumu siler (sadece yorum sahibi veya admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Yorum başarıyla silindi"
}
```

#### Frontend Kullanımı
```javascript
const deleteComment = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}`, {
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
    console.error('Yorum silme hatası:', error);
    throw error;
  }
};
```

---

### 5. Yorum Beğenme/Beğenmeyi Geri Alma
**POST** `/:commentId/like`

Bir yorumu beğenir veya beğenmeyi geri alır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Yorum beğenildi",
  "isLiked": true,
  "likesCount": 11
}
```

#### Frontend Kullanımı
```javascript
const toggleLike = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}/like`, {
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
    console.error('Yorum beğeni işlemi hatası:', error);
    throw error;
  }
};
```

---

### 6. Yorum Beğenmeme/Beğenmemeyi Geri Alma
**POST** `/:commentId/dislike`

Bir yorumu beğenmez veya beğenmemeyi geri alır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Yorum beğenilmedi",
  "isDisliked": true,
  "dislikesCount": 3
}
```

#### Frontend Kullanımı
```javascript
const toggleDislike = async (commentId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}/dislike`, {
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
    console.error('Yorum beğenmeme işlemi hatası:', error);
    throw error;
  }
};
```

---

### 7. Yorum Raporlama
**POST** `/:commentId/report`

Bir yorumu raporlar.

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
  "message": "Yorum başarıyla raporlandı"
}
```

#### Frontend Kullanımı
```javascript
const reportComment = async (commentId, reportData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/comments/${commentId}/report`, {
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
    console.error('Yorum raporlama hatası:', error);
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
| 404 | Yorum bulunamadı |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "content",
      "message": "Yorum içeriği zorunludur"
    }
  ]
}
```

## Yorum Sistemi Özellikleri

### 1. Hiyerarşik Yapı
- **Ana Yorumlar**: Doğrudan post'a yapılan yorumlar
- **Yanıtlar**: Ana yorumlara yapılan yanıtlar
- **İç İçe Yanıtlar**: Yanıtlara yapılan yanıtlar (destekleniyorsa)

### 2. Etkileşim Sistemi
- **Beğeni**: Kullanıcılar yorumları beğenebilir
- **Beğenmeme**: Kullanıcılar yorumları beğenmeyebilir
- **Raporlama**: Uygunsuz yorumlar raporlanabilir

### 3. Yetkilendirme
- **Yorum Oluşturma**: Giriş yapmış kullanıcılar
- **Yorum Güncelleme**: Sadece yorum sahibi
- **Yorum Silme**: Yorum sahibi veya admin
- **Etkileşim**: Giriş yapmış kullanıcılar

### 4. Sayfalama ve Sıralama
- **Sayfalama**: Tüm yorum listeleri sayfalama destekler
- **Sıralama**: Tarih, beğeni sayısı gibi kriterlere göre sıralama
- **Filtreleme**: Ana yorumlar ve yanıtlar ayrı ayrı listelenebilir

## Notlar

1. **Yetkilendirme**: Yorum oluşturma, güncelleme, silme ve etkileşim için JWT token gerekir
2. **Hiyerarşi**: Yorumlar hiyerarşik yapıda organize edilir
3. **Etkileşim**: Beğeni/beğenmeme sistemi mevcuttur
4. **Raporlama**: Uygunsuz içerik raporlanabilir
5. **Sayfalama**: Tüm listeleme endpoint'leri sayfalama destekler
6. **Real-time**: Yorumlar gerçek zamanlı olarak güncellenebilir
7. **Moderasyon**: Admin kullanıcılar yorumları yönetebilir
