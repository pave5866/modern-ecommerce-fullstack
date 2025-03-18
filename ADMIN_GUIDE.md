# Modern E-Commerce Admin Kullanım Kılavuzu

Bu belge, Modern E-Commerce uygulamasında admin kullanıcılarının nasıl oluşturulacağı ve yönetileceği hakkında bilgi verir.

## Admin Yardımcı Aracı

Projede admin kullanıcılarının kolay bir şekilde oluşturulması ve yönetilmesi için bir yardımcı HTML sayfası oluşturulmuştur. Bu sayfa doğrudan sunucu ile iletişim kurarak admin işlemlerini gerçekleştirir.

### Yardımcı Araca Erişim

Admin yardımcı aracına aşağıdaki URL'ler üzerinden erişebilirsiniz:

- **Netlify'da:** https://yoursitename.netlify.app/admin_helper.html
- **Localhost'ta:** http://localhost:5173/admin_helper.html
- **Render.com'da:** https://yoursitename.onrender.com/admin_helper.html

### Kullanım

Admin yardımcı aracı üç temel işlev sunar:

1. **Yeni Admin Oluşturma:** Sistemde hiç admin yoksa veya yeni bir admin eklemek istiyorsanız, bu seçeneği kullanabilirsiniz.
2. **Kendini Admin Yapma:** Halihazırda bir kullanıcı hesabınız varsa, bu seçeneği kullanarak hesabınıza admin yetkisi ekleyebilirsiniz.
3. **API Yapılandırma:** API sunucusunun URL'sini ve dummy veri ayarlarını değiştirebilirsiniz.

## Özel Admin API Endpoint'leri

Backend'de admin işlemleri için özel API endpoint'leri bulunmaktadır:

### 1. Admin Oluşturma

```
POST /api/admin/create
```

**Açıklama:** Yeni bir admin kullanıcısı oluşturur veya mevcut bir kullanıcıya admin rolü verir.

**İstek Gövdesi:**
```json
{
  "name": "Admin Adı",
  "email": "admin@example.com",
  "password": "güçlü-şifre"
}
```

**Yanıt (Başarılı):**
```json
{
  "success": true,
  "message": "Admin kullanıcısı başarıyla oluşturuldu",
  "user": {
    "id": "user_id",
    "name": "Admin Adı",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "jwt_token"
}
```

### 2. Kullanıcıyı Admin Yapma

```
PUT /api/admin/promote/:id
```

**Açıklama:** Mevcut bir kullanıcıyı admin rolüne yükseltir. Bu endpoint sadece admin kullanıcıları tarafından erişilebilir.

**İstek Parametresi:**
- `id`: Kullanıcı ID'si

**Yanıt (Başarılı):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla admin yapıldı",
  "user": {
    "id": "user_id",
    "name": "Kullanıcı Adı",
    "email": "kullanici@example.com",
    "role": "admin"
  }
}
```

### 3. Kendini Admin Yapma

```
PUT /api/admin/self-promote
```

**Açıklama:** Kimlik doğrulaması sonrası kullanıcının kendi hesabına admin rolü vermesini sağlar.

**İstek Gövdesi:**
```json
{
  "email": "kullanici@example.com",
  "password": "şifre"
}
```

**Yanıt (Başarılı):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla admin yapıldı",
  "user": {
    "id": "user_id",
    "name": "Kullanıcı Adı",
    "email": "kullanici@example.com",
    "role": "admin"
  },
  "token": "jwt_token"
}
```

## Admin Paneline Erişim

Admin kullanıcıları, uygulamanın normal kullanıcı arayüzünden admin paneline erişim sağlayabilirler. Admin paneline erişmek için:

1. Uygulamaya kullanıcı adı ve şifrenizle giriş yapın.
2. Kullanıcı menüsünden (sağ üst köşede) "Admin Paneli" seçeneğine tıklayın.

## Sorun Giderme

### API Bağlantı Sorunları

Admin yardımcı aracı, tarayıcınızın yerel depolama alanında saklanan API URL'sini kullanır. Eğer API'ye bağlanma sorunları yaşıyorsanız:

1. Yardımcı araçtaki "API Yapılandırma" sekmesini açın.
2. API URL'sini doğru şekilde ayarlayın:
   - Lokal geliştirme için: `http://localhost:5000/api`
   - Canlı site için: `https://modern-ecommerce-fullstack.onrender.com/api`
3. Ayarları kaydedin ve tekrar deneyin.

### Güvenlik ve CORS Sorunları

Backend'de tüm CORS ayarları yapılandırılmıştır. Eğer tarayıcınızda CORS hataları görüyorsanız:

1. Backend'in çalıştığından emin olun.
2. API URL'sinin doğru olduğunu kontrol edin.
3. Tarayıcınızın önbelleğini temizleyin ve sayfayı yenileyin.

## İletişim ve Destek

Sorularınız veya sorunlarınız için lütfen [kkadirerdem@gmail.com](mailto:kkadirerdem@gmail.com) adresine e-posta gönderin veya GitHub üzerinden bir issue açın.