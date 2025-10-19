# Upload API Dokümantasyonu

Bu API endpoint'leri resim yükleme, silme ve yönetme işlemleri için kullanılır.

## Base URL
```
/api/upload
```

## Authentication
Tüm upload endpoint'leri authentication gerektirir. İsteklere `Authorization` header'ı eklenmelidir:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Tek Resim Yükleme

**POST** `/api/upload/single`

Tek bir resim dosyası yükler. Profil resmi veya tek resim gereken durumlarda kullanılır.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `image` (file, required): Yüklenecek resim dosyası

#### Desteklenen Formatlar
- JPEG, JPG, PNG, GIF, WEBP

#### Maksimum Dosya Boyutu
- 5MB

#### Response (200 OK)
```json
{
  "message": "Resim başarıyla yüklendi",
  "imageUrl": "/uploads/profile-1234567890-123456789.jpg",
  "fileName": "profile-1234567890-123456789.jpg",
  "fileSize": 245678,
  "mimeType": "image/jpeg"
}
```

#### Hata Durumları
- **400 Bad Request**: Dosya seçilmedi
- **400 Bad Request**: Geçersiz dosya tipi
- **413 Payload Too Large**: Dosya boyutu 5MB'dan büyük
- **401 Unauthorized**: Token geçersiz veya eksik
- **500 Internal Server Error**: Sunucu hatası

---

### 2. Çoklu Resim Yükleme

**POST** `/api/upload/multiple`

Birden fazla resim dosyası yükler (max 10 adet). Blog, post ve event resimleri için kullanılır.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `images` (file[], required): Yüklenecek resim dosyaları (maksimum 10 adet)

#### Desteklenen Formatlar
- JPEG, JPG, PNG, GIF, WEBP

#### Maksimum Dosya Boyutu
- Her dosya için 5MB
- Toplam maksimum 10 dosya

#### Response (200 OK)
```json
{
  "message": "5 resim başarıyla yüklendi",
  "images": [
    {
      "imageUrl": "/uploads/blog-1234567890-123456789.jpg",
      "fileName": "blog-1234567890-123456789.jpg",
      "fileSize": 245678,
      "mimeType": "image/jpeg"
    },
    {
      "imageUrl": "/uploads/blog-1234567891-123456790.png",
      "fileName": "blog-1234567891-123456790.png",
      "fileSize": 345678,
      "mimeType": "image/png"
    }
  ]
}
```

#### Hata Durumları
- **400 Bad Request**: Dosya seçilmedi
- **400 Bad Request**: Geçersiz dosya tipi
- **400 Bad Request**: 10'dan fazla dosya seçildi
- **413 Payload Too Large**: Dosya boyutu 5MB'dan büyük
- **401 Unauthorized**: Token geçersiz veya eksik
- **500 Internal Server Error**: Sunucu hatası

---

### 3. Resim Silme

**DELETE** `/api/upload/:fileName`

Belirtilen dosya adına sahip resmi siler.

#### Request Parameters
- `fileName` (string, required): Silinecek dosyanın adı

#### Response (200 OK)
```json
{
  "message": "Resim başarıyla silindi",
  "fileName": "profile-1234567890-123456789.jpg"
}
```

#### Hata Durumları
- **400 Bad Request**: Dosya adı belirtilmedi
- **404 Not Found**: Dosya bulunamadı
- **401 Unauthorized**: Token geçersiz veya eksik
- **500 Internal Server Error**: Sunucu hatası

---

## Kullanım Örnekleri

### JavaScript (Fetch API) - Tek Resim

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Yüklenen resim URL:', data.imageUrl);
```

### JavaScript (Fetch API) - Çoklu Resim

```javascript
const formData = new FormData();
for (let i = 0; i < fileInput.files.length; i++) {
  formData.append('images', fileInput.files[i]);
}

const response = await fetch('http://localhost:5000/api/upload/multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log('Yüklenen resimler:', data.images);
```

### cURL - Tek Resim

```bash
curl -X POST http://localhost:5000/api/upload/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### cURL - Çoklu Resim

```bash
curl -X POST http://localhost:5000/api/upload/multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

### cURL - Resim Silme

```bash
curl -X DELETE http://localhost:5000/api/upload/profile-1234567890-123456789.jpg \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Resim Erişimi

Yüklenen resimlere direkt URL üzerinden erişilebilir:

```
http://localhost:5000/uploads/dosya-adi.jpg
```

Örnek:
```
http://localhost:5000/uploads/profile-1234567890-123456789.jpg
```

---

## Kullanım Alanları

### Profil Resmi
```javascript
// Tek resim yükleme endpoint'ini kullan
POST /api/upload/single
```

### Blog Resimleri
```javascript
// Çoklu resim yükleme endpoint'ini kullan
POST /api/upload/multiple
```

### Post Resimleri
```javascript
// Çoklu resim yükleme endpoint'ini kullan
POST /api/upload/multiple
```

### Event Resimleri
```javascript
// Çoklu resim yükleme endpoint'ini kullan
POST /api/upload/multiple
```

---

## Notlar

1. **Dosya Adlandırma**: Yüklenen dosyalar otomatik olarak benzersiz isimler alır (timestamp + random number).
2. **Güvenlik**: Sadece kimlik doğrulaması yapılmış kullanıcılar resim yükleyebilir.
3. **Format Kontrolü**: Sadece resim dosyaları kabul edilir (JPEG, PNG, GIF, WEBP).
4. **Boyut Limiti**: Her dosya maksimum 5MB olabilir.
5. **Depolama**: Resimler `/uploads` klasöründe saklanır.
6. **Git**: `uploads/` klasörü `.gitignore`'a eklenmiştir, Git'e commit edilmez.

