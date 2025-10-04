# Auth API Kullanım Kılavuzu

Bu dokümantasyon, SaglikHep API'sinin kimlik doğrulama (Authentication) endpoint'lerini açıklar.

## Base URL
```
http://localhost:3000/api/auth
```

## Endpoint'ler

### 1. Kullanıcı Kayıt (Register)
**POST** `/register`

Yeni kullanıcı kaydı oluşturur.

#### Request Body
```json
{
  "username": "kullanici_adi",
  "email": "email@example.com",
  "password": "güvenli_şifre",
  "firstName": "Ad",
  "lastName": "Soyad",
  "dateOfBirth": "1990-01-01",
  "gender": "male|female|other",
  "phone": "+905551234567"
}
```

#### Response (201 Created)
```json
{
  "message": "Kullanıcı başarıyla oluşturuldu",
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "email": "email@example.com",
    "firstName": "Ad",
    "lastName": "Soyad",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phone": "+905551234567",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('Kayıt başarılı:', data);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Kayıt hatası:', error);
    throw error;
  }
};
```

---

### 2. Kullanıcı Giriş (Login)
**POST** `/login`

Kullanıcı girişi yapar ve JWT token döner.

#### Request Body
```json
{
  "email": "email@example.com",
  "password": "güvenli_şifre"
}
```

#### Response (200 OK)
```json
{
  "message": "Giriş başarılı",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "email": "email@example.com",
    "firstName": "Ad",
    "lastName": "Soyad",
    "role": "user"
  }
}
```

#### Frontend Kullanımı
```javascript
const loginUser = async (credentials) => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (response.ok) {
      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Giriş hatası:', error);
    throw error;
  }
};
```

---

### 3. Token Yenileme (Refresh Token)
**POST** `/refresh`

Süresi dolmuş token'ı yeniler.

#### Request Body
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Response (200 OK)
```json
{
  "message": "Token başarıyla yenilendi",
  "token": "yeni_jwt_token",
  "refreshToken": "yeni_refresh_token"
}
```

#### Frontend Kullanımı
```javascript
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    } else {
      // Refresh token da geçersizse kullanıcıyı logout yap
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

---

### 4. Kullanıcı Profili Getir
**GET** `/profile`

Giriş yapmış kullanıcının profil bilgilerini getirir.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "user": {
    "id": "user_id",
    "username": "kullanici_adi",
    "email": "email@example.com",
    "firstName": "Ad",
    "lastName": "Soyad",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phone": "+905551234567",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Frontend Kullanımı
```javascript
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 401) {
      // Token geçersizse yenilemeyi dene
      await refreshToken();
      return getProfile(); // Recursive call
    }
    
    const data = await response.json();
    if (response.ok) {
      return data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    throw error;
  }
};
```

---

### 5. Çıkış Yapma (Logout)
**POST** `/logout`

Kullanıcı çıkışı yapar ve token'ı geçersiz kılar.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Response (200 OK)
```json
{
  "message": "Başarıyla çıkış yapıldı"
}
```

#### Frontend Kullanımı
```javascript
const logoutUser = async () => {
  try {
    const token = localStorage.getItem('token');
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Çıkış hatası:', error);
  } finally {
    // Her durumda local storage'ı temizle
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

---

## Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 400 | Geçersiz istek verisi |
| 401 | Yetkilendirme hatası |
| 409 | Kullanıcı zaten mevcut (kayıt) |
| 500 | Sunucu hatası |

## Örnek Hata Response
```json
{
  "message": "Hata açıklaması",
  "errors": [
    {
      "field": "email",
      "message": "Geçerli bir email adresi giriniz"
    }
  ]
}
```

## Güvenlik Notları

1. **Token Saklama**: JWT token'ları güvenli bir şekilde saklayın (localStorage veya httpOnly cookie)
2. **HTTPS**: Production ortamında mutlaka HTTPS kullanın
3. **Token Süresi**: Token'ların süresini makul bir süre ile sınırlayın
4. **Refresh Token**: Refresh token'ları güvenli bir şekilde saklayın ve düzenli olarak yenileyin
