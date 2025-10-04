# Events API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin etkinlik yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/events
```

## Endpoint'ler

### 1. Etkinlik Oluşturma
**POST** `/`

Yeni bir etkinlik oluşturur.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "title": "Mindfulness Meditasyon Atölyesi",
  "description": "Günlük yaşamda stresi azaltmak ve zihinsel sağlığı güçlendirmek için mindfulness meditasyon teknikleri öğreniyoruz. Başlangıç seviyesindeki katılımcılar için uygundur.",
  "category": "Meditasyon",
  "instructor": "Dr. Ayşe Kaya",
  "instructorTitle": "Klinik Psikolog",
  "date": "2024-02-15T19:00:00Z",
  "endDate": "2024-02-15T21:00:00Z",
  "location": "Çankaya Sağlık Merkezi, Salon A",
  "locationAddress": "Çankaya Mah. Sağlık Sk. No: 15 Çankaya/Ankara",
  "maxParticipants": 25,
  "price": 0,
  "isOnline": false,
  "organizer": "Sağlık Bakanlığı",
  "organizerType": "government",
  "tags": [
    "meditasyon",
    "mindfulness",
    "stres yönetimi",
    "zihin sağlığı"
  ],
  "requirements": "Rahat giyinme, yoga matı getirme (opsiyonel)",
  "image": "meditation-workshop.jpg"
}
```

#### Response (201 Created)
```json
{
  "message": "Etkinlik başarıyla oluşturuldu",
  "event": {
    "id": "event_id",
    "title": "Mindfulness Meditasyon Atölyesi",
    "description": "Günlük yaşamda stresi azaltmak ve zihinsel sağlığı güçlendirmek için mindfulness meditasyon teknikleri öğreniyoruz. Başlangıç seviyesindeki katılımcılar için uygundur.",
    "category": "Meditasyon",
    "instructor": "Dr. Ayşe Kaya",
    "instructorTitle": "Klinik Psikolog",
    "date": "2024-02-15T19:00:00Z",
    "endDate": "2024-02-15T21:00:00Z",
    "location": "Çankaya Sağlık Merkezi, Salon A",
    "locationAddress": "Çankaya Mah. Sağlık Sk. No: 15 Çankaya/Ankara",
    "maxParticipants": 25,
    "currentParticipants": 0,
    "price": 0,
    "isOnline": false,
    "organizer": "Sağlık Bakanlığı",
    "organizerType": "government",
    "tags": [
      "meditasyon",
      "mindfulness",
      "stres yönetimi",
      "zihin sağlığı"
    ],
    "requirements": "Rahat giyinme, yoga matı getirme (opsiyonel)",
    "publishDate": "2024-01-20T10:00:00Z",
    "status": "pending",
    "authorId": "user_id",
    "image": "meditation-workshop.jpg",
    "isRegistered": false,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const createEvent = async (eventData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.event;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    throw error;
  }
};
```

---

### 2. Tüm Etkinlikleri Getir
**GET** `/`

Tüm etkinlikleri listeler (sayfalama ile).

#### Query Parameters
```
?page=1&limit=10&category=Meditasyon&status=active&isOnline=false&sortBy=date&sortOrder=asc&search=arama_terimi
```

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "events": [
    {
      "id": "event_id",
      "title": "Mindfulness Meditasyon Atölyesi",
      "description": "Günlük yaşamda stresi azaltmak...",
      "category": "Meditasyon",
      "instructor": "Dr. Ayşe Kaya",
      "instructorTitle": "Klinik Psikolog",
      "date": "2024-02-15T19:00:00Z",
      "endDate": "2024-02-15T21:00:00Z",
      "location": "Çankaya Sağlık Merkezi, Salon A",
      "locationAddress": "Çankaya Mah. Sağlık Sk. No: 15 Çankaya/Ankara",
      "maxParticipants": 25,
      "currentParticipants": 18,
      "price": 0,
      "isOnline": false,
      "organizer": "Sağlık Bakanlığı",
      "organizerType": "government",
      "tags": [
        "meditasyon",
        "mindfulness",
        "stres yönetimi",
        "zihin sağlığı"
      ],
      "requirements": "Rahat giyinme, yoga matı getirme (opsiyonel)",
      "publishDate": "2024-01-20T10:00:00Z",
      "status": "active",
      "authorId": "expert1",
      "image": "meditation-workshop.jpg",
      "isRegistered": true,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalEvents": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getAllEvents = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/events?${queryParams}`, {
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
    console.error('Etkinlikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 3. Etkinlik Arama
**GET** `/search`

Etkinlikleri arama yapar.

#### Query Parameters
```
?q=meditasyon&category=Meditasyon&location=Ankara&isOnline=false&dateFrom=2024-02-01&dateTo=2024-02-28&page=1&limit=10
```

#### Response (200 OK)
```json
{
  "events": [
    {
      "id": "event_id",
      "title": "Mindfulness Meditasyon Atölyesi",
      "description": "Günlük yaşamda stresi azaltmak...",
      "category": "Meditasyon",
      "instructor": "Dr. Ayşe Kaya",
      "date": "2024-02-15T19:00:00Z",
      "location": "Çankaya Sağlık Merkezi, Salon A",
      "maxParticipants": 25,
      "currentParticipants": 18,
      "price": 0,
      "isOnline": false,
      "organizer": "Sağlık Bakanlığı",
      "tags": ["meditasyon", "mindfulness"],
      "status": "active",
      "isRegistered": false
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalEvents": 15,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const searchEvents = async (searchTerm, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      q: searchTerm,
      ...filters
    }).toString();
    
    const response = await fetch(`http://localhost:3000/api/events/search?${queryParams}`, {
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
    console.error('Etkinlik arama hatası:', error);
    throw error;
  }
};
```

---

### 4. Etkinlik İstatistikleri (Admin)
**GET** `/stats`

Etkinlik istatistiklerini getirir (sadece admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "stats": {
    "totalEvents": 150,
    "activeEvents": 120,
    "pendingEvents": 15,
    "completedEvents": 15,
    "totalParticipants": 2500,
    "averageParticipants": 16.7,
    "categoryStats": [
      {
        "category": "Meditasyon",
        "count": 25,
        "totalParticipants": 500
      },
      {
        "category": "Yoga",
        "count": 20,
        "totalParticipants": 400
      }
    ],
    "organizerStats": [
      {
        "organizerType": "government",
        "count": 50,
        "totalParticipants": 1000
      },
      {
        "organizerType": "private",
        "count": 100,
        "totalParticipants": 1500
      }
    ]
  }
}
```

#### Frontend Kullanımı
```javascript
const getEventStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/events/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    console.error('Etkinlik istatistikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 5. Kullanıcının Etkinlikleri
**GET** `/my-events`

Giriş yapmış kullanıcının etkinliklerini getirir.

#### Query Parameters
```
?type=created|registered&status=active|completed&page=1&limit=10
```

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "events": [
    {
      "id": "event_id",
      "title": "Mindfulness Meditasyon Atölyesi",
      "category": "Meditasyon",
      "instructor": "Dr. Ayşe Kaya",
      "date": "2024-02-15T19:00:00Z",
      "location": "Çankaya Sağlık Merkezi, Salon A",
      "maxParticipants": 25,
      "currentParticipants": 18,
      "price": 0,
      "status": "active",
      "type": "registered",
      "registrationDate": "2024-01-25T14:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalEvents": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getUserEvents = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`http://localhost:3000/api/events/my-events?${queryParams}`, {
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
    console.error('Kullanıcı etkinlikleri getirme hatası:', error);
    throw error;
  }
};
```

---

### 6. Etkinlik Detayı
**GET** `/:eventId`

Belirli bir etkinliğin detay bilgilerini getirir.

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "event": {
    "id": "event_id",
    "title": "Mindfulness Meditasyon Atölyesi",
    "description": "Günlük yaşamda stresi azaltmak ve zihinsel sağlığı güçlendirmek için mindfulness meditasyon teknikleri öğreniyoruz. Başlangıç seviyesindeki katılımcılar için uygundur.",
    "category": "Meditasyon",
    "instructor": "Dr. Ayşe Kaya",
    "instructorTitle": "Klinik Psikolog",
    "date": "2024-02-15T19:00:00Z",
    "endDate": "2024-02-15T21:00:00Z",
    "location": "Çankaya Sağlık Merkezi, Salon A",
    "locationAddress": "Çankaya Mah. Sağlık Sk. No: 15 Çankaya/Ankara",
    "maxParticipants": 25,
    "currentParticipants": 18,
    "price": 0,
    "isOnline": false,
    "organizer": "Sağlık Bakanlığı",
    "organizerType": "government",
    "tags": [
      "meditasyon",
      "mindfulness",
      "stres yönetimi",
      "zihin sağlığı"
    ],
    "requirements": "Rahat giyinme, yoga matı getirme (opsiyonel)",
    "publishDate": "2024-01-20T10:00:00Z",
    "status": "active",
    "authorId": "expert1",
    "image": "meditation-workshop.jpg",
    "isRegistered": true,
    "canRegister": true,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const getEventById = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.event;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Etkinlik detayı getirme hatası:', error);
    throw error;
  }
};
```

---

### 7. Etkinlik Güncelleme
**PUT** `/:eventId`

Mevcut bir etkinliği günceller (sadece etkinlik sahibi).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "title": "Güncellenmiş Mindfulness Meditasyon Atölyesi",
  "description": "Güncellenmiş açıklama...",
  "maxParticipants": 30,
  "price": 50,
  "requirements": "Yeni gereksinimler..."
}
```

#### Response (200 OK)
```json
{
  "message": "Etkinlik başarıyla güncellendi",
  "event": {
    "id": "event_id",
    "title": "Güncellenmiş Mindfulness Meditasyon Atölyesi",
    "description": "Güncellenmiş açıklama...",
    "maxParticipants": 30,
    "price": 50,
    "requirements": "Yeni gereksinimler...",
    "updatedAt": "2024-01-21T10:00:00Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updateEvent = async (eventId, eventData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.event;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Etkinlik güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 8. Etkinlik Silme
**DELETE** `/:eventId`

Bir etkinliği siler (sadece etkinlik sahibi veya admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Etkinlik başarıyla silindi"
}
```

#### Frontend Kullanımı
```javascript
const deleteEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
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
    console.error('Etkinlik silme hatası:', error);
    throw error;
  }
};
```

---

### 9. Etkinliğe Kayıt Olma
**POST** `/:eventId/register`

Bir etkinliğe kayıt olur.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body (Opsiyonel)
```json
{
  "notes": "Özel notlar (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Etkinliğe başarıyla kayıt oldunuz",
  "registration": {
    "eventId": "event_id",
    "userId": "user_id",
    "registrationDate": "2024-01-25T14:30:00Z",
    "notes": "Özel notlar",
    "status": "confirmed"
  },
  "event": {
    "id": "event_id",
    "title": "Mindfulness Meditasyon Atölyesi",
    "currentParticipants": 19,
    "isRegistered": true
  }
}
```

#### Frontend Kullanımı
```javascript
const registerForEvent = async (eventId, registrationData = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Etkinlik kayıt hatası:', error);
    throw error;
  }
};
```

---

### 10. Etkinlik Kaydını İptal Etme
**DELETE** `/:eventId/unregister`

Etkinlik kaydını iptal eder.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Etkinlik kaydınız başarıyla iptal edildi",
  "event": {
    "id": "event_id",
    "title": "Mindfulness Meditasyon Atölyesi",
    "currentParticipants": 18,
    "isRegistered": false
  }
}
```

#### Frontend Kullanımı
```javascript
const unregisterFromEvent = async (eventId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/unregister`, {
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
    console.error('Etkinlik kayıt iptal hatası:', error);
    throw error;
  }
};
```

---

### 11. Etkinlik Katılımcıları
**GET** `/:eventId/participants`

Etkinliğin katılımcılarını listeler.

#### Query Parameters
```
?page=1&limit=10&status=confirmed|pending
```

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "participants": [
    {
      "id": "participant_id",
      "user": {
        "id": "user_id",
        "username": "kullanici_adi",
        "firstName": "Ad",
        "lastName": "Soyad",
        "profilePicture": "profile_image_url"
      },
      "registrationDate": "2024-01-25T14:30:00Z",
      "status": "confirmed",
      "notes": "Özel notlar"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalParticipants": 18,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getEventParticipants = async (eventId, filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/participants?${queryParams}`, {
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
    console.error('Etkinlik katılımcıları getirme hatası:', error);
    throw error;
  }
};
```

---

### 12. Etkinlik Onaylama/Reddetme (Admin)
**PUT** `/:eventId/approve`

Etkinliği onaylar veya reddeder (sadece admin).

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
  "message": "Etkinlik başarıyla onaylandı",
  "event": {
    "id": "event_id",
    "title": "Mindfulness Meditasyon Atölyesi",
    "status": "active",
    "approvedAt": "2024-01-21T10:00:00Z",
    "approvedBy": "admin_user_id"
  }
}
```

#### Frontend Kullanımı
```javascript
const approveEvent = async (eventId, actionData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/approve`, {
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
    console.error('Etkinlik onaylama hatası:', error);
    throw error;
  }
};
```

---

### 13. Etkinlik Raporlama
**POST** `/:eventId/report`

Bir etkinliği raporlar.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "reason": "spam|inappropriate|false_information|other",
  "description": "Rapor açıklaması (opsiyonel)"
}
```

#### Response (200 OK)
```json
{
  "message": "Etkinlik başarıyla raporlandı"
}
```

#### Frontend Kullanımı
```javascript
const reportEvent = async (eventId, reportData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/report`, {
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
    console.error('Etkinlik raporlama hatası:', error);
    throw error;
  }
};
```

---

## Etkinlik Kategorileri

| Kategori | Açıklama |
|----------|----------|
| Meditasyon | Meditasyon ve mindfulness etkinlikleri |
| Yoga | Yoga dersleri ve atölyeleri |
| Beslenme | Sağlıklı beslenme seminerleri |
| Egzersiz | Fiziksel aktivite etkinlikleri |
| Psikoloji | Ruh sağlığı ve psikoloji etkinlikleri |
| Tıp | Tıbbi bilgilendirme seminerleri |
| Alternatif Tıp | Geleneksel ve alternatif tedavi yöntemleri |
| Sağlık Teknolojisi | Sağlık teknolojileri etkinlikleri |

## Organizatör Tipleri

| Tip | Açıklama |
|-----|----------|
| government | Devlet kurumları |
| private | Özel şirketler |
| ngo | Sivil toplum kuruluşları |
| individual | Bireysel organizatörler |
| hospital | Hastaneler |
| university | Üniversiteler |

## Etkinlik Durumları

| Durum | Açıklama |
|-------|----------|
| pending | Onay bekliyor |
| active | Aktif (kayıt alıyor) |
| full | Kontenjan dolu |
| completed | Tamamlandı |
| cancelled | İptal edildi |
| rejected | Reddedildi |

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek verisi |
| 401 | Yetkilendirme hatası |
| 403 | Yetki yetersizliği |
| 404 | Etkinlik bulunamadı |
| 409 | Zaten kayıtlısınız / Kontenjan dolu |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "title",
      "message": "Etkinlik başlığı zorunludur"
    }
  ]
}
```

## Notlar

1. **Yetkilendirme**: Etkinlik oluşturma, güncelleme, silme ve kayıt için JWT token gerekir
2. **Onay Sistemi**: Yeni etkinlikler admin onayı bekler
3. **Kayıt Sistemi**: Kullanıcılar etkinliklere kayıt olabilir
4. **Kontenjan**: Etkinliklerin maksimum katılımcı sayısı vardır
5. **Online/Offline**: Etkinlikler online veya offline olabilir
6. **Fiyatlandırma**: Etkinlikler ücretsiz veya ücretli olabilir
7. **Kategoriler**: Etkinlikler kategorilere ayrılır
8. **Arama**: Gelişmiş arama ve filtreleme imkanları
9. **İstatistikler**: Admin kullanıcılar detaylı istatistikleri görüntüleyebilir
10. **Raporlama**: Uygunsuz etkinlikler raporlanabilir
