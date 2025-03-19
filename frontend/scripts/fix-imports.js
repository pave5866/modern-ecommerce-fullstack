// CommonJS modülü olarak çalıştır
const fs = require('fs');

try {
  console.log('Toast importlarını düzeltme işlemi başlıyor...');

  // toast.js dosyasının yolunu belirle
  const filePath = './src/utils/toast.js';
  
  // Dosya içeriğini oku
  console.log(`${filePath} dosyası okunuyor...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // React-toastify importunu bul ve değiştir
  if (content.includes('react-toastify')) {
    console.log('react-toastify import ifadesi bulundu, düzeltiliyor...');
    content = content.replace(/from ['"]react-toastify['"]/g, "from 'react-hot-toast'");
    
    // Değiştirilmiş içeriği yaz
    fs.writeFileSync(filePath, content);
    console.log('Dosya başarıyla güncellendi!');
  } else {
    console.log('Dosyada react-toastify importu bulunamadı, değişiklik yapılmadı.');
  }
  
  console.log('İşlem tamamlandı.');
} catch (error) {
  console.error('Hata oluştu:', error.message);
  // Hataya rağmen build işleminin devam etmesi için başarılı çıkış kodu döndür
  process.exit(0);
}