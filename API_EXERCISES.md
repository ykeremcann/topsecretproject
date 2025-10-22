# Egzersiz Takip API Dokümantasyonu

Bu API, kullanıcıların egzersizlerini oluşturması, takip etmesi ve tamamlaması için geliştirilmiştir.

## Temel Özellikler

- ✅ Egzersiz oluşturma ve düzenleme
- ✅ Egzersiz tamamlama takibi
- ✅ Günlük/haftalık/aylık periyot desteği
- ✅ İstatistik ve raporlama
- ✅ Streak (ardışık gün) takibi

## Authentication

Tüm endpoint'ler JWT token ile korunmaktadır. İstek header'ında `Authorization: Bearer <token>` bulunmalıdır.

---

## Endpoints

### 1. Tüm Egzersizleri Getir

```http
GET /api/exercises
```

**Query Parameters:**
- `page` (number, optional): Sayfa numarası (varsayılan: 1)
- `limit` (number, optional): Sayfa başına öğe sayısı (varsayılan: 10)
- `isActive` (boolean, optional): Aktif durumu filtresi
- `sortBy` (string, optional): Sıralama alanı (varsayılan: "createdAt")
- `sortOrder` (string, optional): Sıralama yönü "asc" veya "desc" (varsayılan: "desc")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "exercise_id",
      "user": "user_id",
      "name": "Koşu",
      "description": "Sabah koşusu",
      "duration": 30,
      "period": "daily",
      "completedCount": 5,
      "isActive": true,
      "completionHistory": [...],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### 2. Aktif Egzersizleri Getir

```http
GET /api/exercises/active
```

**Query Parameters:**
- `period` (string, optional): Periyot filtresi (daily, weekly, monthly, custom)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01T00:00:00.000Z",
    "totalExercises": 5,
    "completedExercises": 3,
    "totalDuration": 90,
    "exercises": [
      {
        "_id": "exercise_id",
        "name": "Koşu",
        "targetDuration": 30,
        "completedDuration": 30,
        "completions": 1,
        "isCompleted": true
      }
    ]
  }
}
```

### 3. Kullanıcı İstatistiklerini Getir

```http
GET /api/exercises/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExercises": 15,
    "activeExercises": 8,
    "totalCompletions": 45,
    "totalDuration": 1350,
    "longestStreak": 7
  }
}
```

### 4. Günlük Egzersiz Özeti

```http
GET /api/exercises/daily-summary?date=2024-01-01
```

**Query Parameters:**
- `date` (string, optional): Tarih (ISO format, varsayılan: bugün)

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01T00:00:00.000Z",
    "totalExercises": 5,
    "completedExercises": 3,
    "totalDuration": 90,
    "exercises": [
      {
        "_id": "exercise_id",
        "name": "Koşu",
        "targetDuration": 30,
        "completedDuration": 30,
        "completions": 1,
        "isCompleted": true
      }
    ]
  }
}
```

### 5. Tek Egzersiz Getir

```http
GET /api/exercises/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "exercise_id",
    "user": {...},
    "name": "Koşu",
    "description": "Sabah koşusu",
    "duration": 30,
      "period": "daily",
      "customPeriod": null,
      "completedCount": 5,
    "isActive": true,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": null,
    "completionHistory": [...],
    "reminder": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. Egzersiz Tamamlama Geçmişini Getir

```http
GET /api/exercises/:id/history?startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `startDate` (string, optional): Başlangıç tarihi
- `endDate` (string, optional): Bitiş tarihi

**Response:**
```json
{
  "success": true,
  "data": {
    "exercise": {
      "_id": "exercise_id",
        "name": "Koşu"
    },
    "history": [
      {
        "completedAt": "2024-01-01T07:00:00.000Z",
        "duration": 30,
        "notes": "Güzel bir koşu oldu"
      }
    ],
    "totalCompletions": 1
  }
}
```

### 8. Yeni Egzersiz Oluştur

```http
POST /api/exercises
```

**Request Body:**
```json
{
  "name": "Koşu",
  "description": "Sabah koşusu",
  "duration": 30,
  "period": "daily",
  "customPeriod": null,
  "reminder": {
    "enabled": true,
    "time": "07:00",
    "days": ["monday", "wednesday", "friday"]
  }
}
```

**Validation Rules:**
- `name`: 2-100 karakter, gerekli
- `description`: En fazla 500 karakter, opsiyonel
- `duration`: 1-300 dakika, gerekli
- `period`: "daily", "weekly", "monthly", "custom" değerlerinden biri, gerekli
- `customPeriod`: 1-365 gün, period "custom" ise gerekli
- `reminder.enabled`: Boolean
- `reminder.time`: HH:MM formatında saat
- `reminder.days`: Haftanın günleri array'i

**Response:**
```json
{
  "success": true,
  "message": "Egzersiz başarıyla oluşturuldu",
  "data": {...}
}
```

### 9. Egzersiz Güncelle

```http
PUT /api/exercises/:id
```

**Request Body:** (Aynı validation kuralları geçerli)

**Response:**
```json
{
  "success": true,
  "message": "Egzersiz başarıyla güncellendi",
  "data": {...}
}
```

### 10. Egzersiz Sil

```http
DELETE /api/exercises/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Egzersiz başarıyla silindi"
}
```

### 11. Egzersizi Tamamla

```http
POST /api/exercises/:id/complete
```

**Request Body:**
```json
{
  "duration": 35,
  "notes": "Bugün çok iyi hissettim"
}
```

**Validation Rules:**
- `duration`: 1-300 dakika, opsiyonel (varsayılan: egzersizin süresi)
- `notes`: En fazla 200 karakter, opsiyonel

**Response:**
```json
{
  "success": true,
  "message": "Egzersiz başarıyla tamamlandı",
  "data": {...}
}
```

### 12. Egzersiz Durumunu Değiştir

```http
PATCH /api/exercises/:id/toggle
```

**Response:**
```json
{
  "success": true,
  "message": "Egzersiz aktif hale getirildi",
  "data": {...}
}
```

---

## Veri Modelleri

### Exercise Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  name: String (2-100 karakter),
  description: String (max 500 karakter),
  duration: Number (1-300 dakika),
  period: String ("daily" | "weekly" | "monthly" | "custom"),
  customPeriod: Number (1-365 gün),
  completedCount: Number (min 0),
  isActive: Boolean,
  startDate: Date,
  endDate: Date,
  completionHistory: [
    {
      completedAt: Date,
      duration: Number,
      notes: String
    }
  ],
  reminder: {
    enabled: Boolean,
    time: String (HH:MM format),
    days: [String] (haftanın günleri)
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Hata Kodları

- `400`: Bad Request - Validasyon hatası veya eksik parametre
- `401`: Unauthorized - Geçersiz veya eksik token
- `404`: Not Found - Egzersiz bulunamadı
- `500`: Internal Server Error - Sunucu hatası

---

## Örnek Kullanım Senaryoları

### 1. Günlük Koşu Egzersizi Oluşturma

```javascript
const response = await fetch('/api/exercises', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    name: "Sabah Koşusu",
    description: "Her sabah 30 dakika koşu",
    duration: 30,
    period: "daily",
    reminder: {
      enabled: true,
      time: "07:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
    }
  })
});
```

### 2. Egzersiz Tamamlama

```javascript
const response = await fetch('/api/exercises/exercise_id/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    duration: 35,
    notes: "Bugün çok iyi hissettim, hava güzeldi"
  })
});
```

### 3. Günlük İlerleme Kontrolü

```javascript
const response = await fetch('/api/exercises/daily-summary', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
const data = await response.json();
console.log(`Bugün ${data.data.completedExercises}/${data.data.totalExercises} egzersiz tamamlandı`);
```

---

## Notlar

- Tüm tarihler ISO 8601 formatında gönderilmeli ve döndürülür
- Streak hesaplaması tamamlanma tarihlerine göre yapılır
- Hatırlatıcı sistemi gelecekte push notification entegrasyonu için hazırlanmıştır
- Kullanıcı sadece kendi egzersizlerini görüntüleyebilir ve düzenleyebilir
- Tamamlanan egzersizler completionHistory array'ine eklenir
- Egzersizler varsayılan olarak aktif durumda oluşturulur
