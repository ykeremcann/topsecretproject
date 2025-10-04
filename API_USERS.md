# Users API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin kullanıcı yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/users
```

## Endpoint'ler

### 1. Tüm Kullanıcıları Getir (Admin)
**GET** `/`

Sadece admin kullanıcılar tüm kullanıcıları listeleyebilir.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
```
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

#### Response (200 OK)
```json
{
  "users": [
    {
      "id": "user_id",
      "username": "kullanici_adi",
      "email": "email@example.com",
      "firstName": "Ad",
      "lastName": "Soyad",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/users?page=${page}&limit=${limit}`, {
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
    console.error('Kullanıcıları getirme hatası:', error);
    throw error;
  }
};
```

---

### 2. Kullanıcı Arama
**GET** `/search`

Kullanıcıları arama yapar.

#### Query Parameters
```
?q=arama_terimi&page=1&limit=10
```

#### Response (200 OK)
```json
{
  "users": [
    {
      "id": "user_id",
      "username": "kullanici_adi",
      "firstName": "Ad",
      "lastName": "Soyad",
      "profilePicture": "profile_image_url",
      "isFollowing": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalUsers": 15,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const searchUsers = async (searchTerm, page = 1) => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/search?q=${encodeURIComponent(searchTerm)}&page=${page}`, {
      method: 'GET',
      headers: {
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
    console.error('Kullanıcı arama hatası:', error);
    throw error;
  }
};
```

---

### 3. Kullanıcı Detayı
**GET** `/:userId`

Belirli bir kullanıcının detay bilgilerini getirir.

#### Response (200 OK)
```json
{
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "firstName": "Ad",
    "lastName": "Soyad",
    "email": "email@example.com",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phone": "+905551234567",
    "profilePicture": "profile_image_url",
    "bio": "Kullanıcı hakkında kısa bilgi",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "followersCount": 150,
    "followingCount": 75,
    "postsCount": 25,
    "isFollowing": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getUserById = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kullanıcı detayı getirme hatası:', error);
    throw error;
  }
};
```

---

### 4. Kullanıcı İstatistikleri
**GET** `/:userId/stats`

Kullanıcının istatistik bilgilerini getirir.

#### Response (200 OK)
```json
{
  "stats": {
    "totalPosts": 25,
    "totalComments": 150,
    "totalLikes": 500,
    "totalFollowers": 150,
    "totalFollowing": 75,
    "accountAge": 365,
    "lastActive": "2024-01-01T12:00:00.000Z",
    "postEngagement": 0.15,
    "commentEngagement": 0.08
  }
}
```

#### Frontend Kullanımı
```javascript
const getUserStats = async (userId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.stats;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kullanıcı istatistikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 5. Profil Güncelleme
**PUT** `/profile`

Giriş yapmış kullanıcının profil bilgilerini günceller.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "firstName": "Yeni Ad",
  "lastName": "Yeni Soyad",
  "bio": "Güncellenmiş bio bilgisi",
  "phone": "+905559876543",
  "profilePicture": "yeni_profil_resmi_url"
}
```

#### Response (200 OK)
```json
{
  "message": "Profil başarıyla güncellendi",
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "firstName": "Yeni Ad",
    "lastName": "Yeni Soyad",
    "bio": "Güncellenmiş bio bilgisi",
    "phone": "+905559876543",
    "profilePicture": "yeni_profil_resmi_url",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/users/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 6. Kullanıcı Takip Et/Bırak
**POST** `/:userId/follow`

Bir kullanıcıyı takip eder veya takibi bırakır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Kullanıcı takip edildi",
  "isFollowing": true,
  "followersCount": 151
}
```

#### Frontend Kullanımı
```javascript
const toggleFollow = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/users/${userId}/follow`, {
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
    console.error('Takip işlemi hatası:', error);
    throw error;
  }
};
```

---

### 7. Hastalık Ekleme
**POST** `/medical-conditions`

Kullanıcıya hastalık ekler.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "diseaseId": "disease_id",
  "diagnosisDate": "2024-01-01",
  "severity": "medium",
  "notes": "Hastalık hakkında notlar"
}
```

#### Response (201 Created)
```json
{
  "message": "Hastalık başarıyla eklendi",
  "medicalCondition": {
    "id": "condition_id",
    "disease": {
      "id": "disease_id",
      "name": "Hastalık Adı",
      "category": "Kategori"
    },
    "diagnosisDate": "2024-01-01",
    "severity": "medium",
    "notes": "Hastalık hakkında notlar",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const addMedicalCondition = async (conditionData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/users/medical-conditions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conditionData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.medicalCondition;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Hastalık ekleme hatası:', error);
    throw error;
  }
};
```

---

### 8. Hastalık Çıkarma
**DELETE** `/medical-conditions/:conditionId`

Kullanıcıdan hastalık çıkarır.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Hastalık başarıyla çıkarıldı"
}
```

#### Frontend Kullanımı
```javascript
const removeMedicalCondition = async (conditionId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/users/medical-conditions/${conditionId}`, {
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
    console.error('Hastalık çıkarma hatası:', error);
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
| 404 | Kullanıcı bulunamadı |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "firstName",
      "message": "Ad alanı zorunludur"
    }
  ]
}
```

## Notlar

1. **Yetkilendirme**: Çoğu endpoint için JWT token gerekir
2. **Admin Yetkisi**: Tüm kullanıcıları listeleme sadece admin kullanıcılar için
3. **Takip Sistemi**: Kullanıcılar birbirlerini takip edebilir
4. **Hastalık Yönetimi**: Kullanıcılar kendi hastalık geçmişlerini yönetebilir
5. **Arama**: Kullanıcı arama işlemi herkese açıktır
