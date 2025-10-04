# Diseases API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin hastalık yönetimi endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/diseases
```

## Endpoint'ler

### 1. Tüm Hastalıkları Getir
**GET** `/`

Tüm hastalıkları listeler (sayfalama ile).

#### Query Parameters
```
?page=1&limit=10&category=kategori&severity=low|medium|high|critical&sortBy=name&sortOrder=asc
```

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "diseases": [
    {
      "id": "disease_id",
      "name": "Hastalık Adı",
      "description": "Hastalık açıklaması...",
      "category": "kardiyoloji",
      "severity": "medium",
      "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
      "treatments": ["Tedavi 1", "Tedavi 2"],
      "prevention": ["Önleme 1", "Önleme 2"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalDiseases": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const getAllDiseases = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/diseases?${queryParams}`, {
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
    console.error('Hastalıkları getirme hatası:', error);
    throw error;
  }
};
```

---

### 2. Hastalık Arama
**GET** `/search`

Hastalıkları arama yapar.

#### Query Parameters
```
?q=arama_terimi&category=kategori&severity=medium&page=1&limit=10
```

#### Response (200 OK)
```json
{
  "diseases": [
    {
      "id": "disease_id",
      "name": "Hastalık Adı",
      "description": "Hastalık açıklaması...",
      "category": "kardiyoloji",
      "severity": "medium",
      "symptoms": ["Belirti 1", "Belirti 2"],
      "isActive": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalDiseases": 15,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### Frontend Kullanımı
```javascript
const searchDiseases = async (searchTerm, filters = {}) => {
  try {
    const queryParams = new URLSearchParams({
      q: searchTerm,
      ...filters
    }).toString();
    
    const response = await fetch(`http://localhost:3000/api/diseases/search?${queryParams}`, {
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
    console.error('Hastalık arama hatası:', error);
    throw error;
  }
};
```

---

### 3. Hastalık İstatistikleri (Admin)
**GET** `/stats`

Hastalık istatistiklerini getirir (sadece admin).

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
  "totalDiseases": 100,
  "totalInactiveDiseases": 5
}
```

#### Frontend Kullanımı
```javascript
const getDiseaseStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/diseases/stats', {
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

### 4. Hastalık Detayı
**GET** `/:diseaseId`

Belirli bir hastalığın detay bilgilerini getirir.

#### Headers (Opsiyonel)
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "disease": {
    "id": "disease_id",
    "name": "Hastalık Adı",
    "description": "Detaylı hastalık açıklaması...",
    "category": "kardiyoloji",
    "severity": "medium",
    "symptoms": [
      "Göğüs ağrısı",
      "Nefes darlığı",
      "Yorgunluk",
      "Baş dönmesi"
    ],
    "treatments": [
      "İlaç tedavisi",
      "Yaşam tarzı değişiklikleri",
      "Cerrahi müdahale"
    ],
    "prevention": [
      "Düzenli egzersiz",
      "Sağlıklı beslenme",
      "Sigara bırakma"
    ],
    "riskFactors": [
      "Yaş",
      "Aile geçmişi",
      "Yüksek tansiyon",
      "Diyabet"
    ],
    "diagnosis": [
      "EKG",
      "Ekokardiyografi",
      "Kan testleri"
    ],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const getDiseaseById = async (diseaseId) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/diseases/${diseaseId}`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.disease;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Hastalık detayı getirme hatası:', error);
    throw error;
  }
};
```

---

### 5. Hastalık Oluşturma (Admin)
**POST** `/`

Yeni bir hastalık oluşturur (sadece admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "name": "Yeni Hastalık Adı",
  "description": "Hastalık açıklaması...",
  "category": "kardiyoloji",
  "severity": "medium",
  "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
  "treatments": ["Tedavi 1", "Tedavi 2"],
  "prevention": ["Önleme 1", "Önleme 2"],
  "riskFactors": ["Risk faktörü 1", "Risk faktörü 2"],
  "diagnosis": ["Tanı yöntemi 1", "Tanı yöntemi 2"]
}
```

#### Response (201 Created)
```json
{
  "message": "Hastalık başarıyla oluşturuldu",
  "disease": {
    "id": "new_disease_id",
    "name": "Yeni Hastalık Adı",
    "description": "Hastalık açıklaması...",
    "category": "kardiyoloji",
    "severity": "medium",
    "symptoms": ["Belirti 1", "Belirti 2", "Belirti 3"],
    "treatments": ["Tedavi 1", "Tedavi 2"],
    "prevention": ["Önleme 1", "Önleme 2"],
    "riskFactors": ["Risk faktörü 1", "Risk faktörü 2"],
    "diagnosis": ["Tanı yöntemi 1", "Tanı yöntemi 2"],
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const createDisease = async (diseaseData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/diseases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diseaseData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.disease;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Hastalık oluşturma hatası:', error);
    throw error;
  }
};
```

---

### 6. Hastalık Güncelleme (Admin)
**PUT** `/:diseaseId`

Mevcut bir hastalığı günceller (sadece admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "name": "Güncellenmiş Hastalık Adı",
  "description": "Güncellenmiş açıklama...",
  "category": "nöroloji",
  "severity": "high",
  "symptoms": ["Yeni belirti 1", "Yeni belirti 2"],
  "treatments": ["Yeni tedavi 1", "Yeni tedavi 2"],
  "prevention": ["Yeni önleme 1"],
  "isActive": true
}
```

#### Response (200 OK)
```json
{
  "message": "Hastalık başarıyla güncellendi",
  "disease": {
    "id": "disease_id",
    "name": "Güncellenmiş Hastalık Adı",
    "description": "Güncellenmiş açıklama...",
    "category": "nöroloji",
    "severity": "high",
    "symptoms": ["Yeni belirti 1", "Yeni belirti 2"],
    "treatments": ["Yeni tedavi 1", "Yeni tedavi 2"],
    "prevention": ["Yeni önleme 1"],
    "isActive": true,
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const updateDisease = async (diseaseId, diseaseData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/diseases/${diseaseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diseaseData)
    });
    
    const data = await response.json();
    if (response.ok) {
      return data.disease;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Hastalık güncelleme hatası:', error);
    throw error;
  }
};
```

---

### 7. Hastalık Silme (Admin)
**DELETE** `/:diseaseId`

Bir hastalığı siler (sadece admin).

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Hastalık başarıyla silindi"
}
```

#### Frontend Kullanımı
```javascript
const deleteDisease = async (diseaseId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3000/api/diseases/${diseaseId}`, {
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
    console.error('Hastalık silme hatası:', error);
    throw error;
  }
};
```

---

## Hastalık Kategorileri

| Kategori | Açıklama |
|----------|----------|
| kardiyoloji | Kalp ve damar hastalıkları |
| nöroloji | Sinir sistemi hastalıkları |
| onkoloji | Kanser hastalıkları |
| endokrinoloji | Hormon hastalıkları |
| gastroenteroloji | Sindirim sistemi hastalıkları |
| pulmonoloji | Solunum sistemi hastalıkları |
| dermatoloji | Cilt hastalıkları |
| ortopedi | Kemik ve eklem hastalıkları |
| psikiyatri | Ruh sağlığı hastalıkları |
| jinekoloji | Kadın hastalıkları |

## Hastalık Şiddet Seviyeleri

| Seviye | Açıklama |
|--------|----------|
| low | Düşük şiddet - Hafif belirtiler |
| medium | Orta şiddet - Orta düzeyde belirtiler |
| high | Yüksek şiddet - Ciddi belirtiler |
| critical | Kritik şiddet - Acil müdahale gerekli |

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek verisi |
| 401 | Yetkilendirme hatası |
| 403 | Yetki yetersizliği (Admin gerekli) |
| 404 | Hastalık bulunamadı |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "name",
      "message": "Hastalık adı zorunludur"
    }
  ]
}
```

## Notlar

1. **Yetkilendirme**: Hastalık oluşturma, güncelleme, silme ve istatistikler için admin yetkisi gerekir
2. **Arama**: Hastalık arama işlemi herkese açıktır
3. **Kategoriler**: Hastalıklar kategorilere ayrılır
4. **Şiddet Seviyeleri**: Hastalıklar şiddet seviyelerine göre sınıflandırılır
5. **Sayfalama**: Tüm listeleme endpoint'leri sayfalama destekler
6. **Filtreleme**: Kategori, şiddet seviyesi gibi kriterlere göre filtreleme
7. **İstatistikler**: Admin kullanıcılar detaylı istatistikleri görüntüleyebilir
8. **Aktif/Pasif**: Hastalıklar aktif/pasif durumda olabilir
