const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

// Varsayılan görsel URL'si
const DEFAULT_IMAGE_URL = 'https://res.cloudinary.com/dlkrduwav/image/upload/v1716066139/default-product_dljmyw.png';
const uploadFolder = path.join(__dirname, '..', '..', 'public', 'uploads');

// uploads klasörünün varlığını kontrol et ve yoksa oluştur
try {
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
    logger.info(`Uploads klasörü oluşturuldu: ${uploadFolder}`);
  }
} catch (error) {
  logger.error(`Uploads klasörü oluşturulamadı: ${error.message}`);
}

// Cloudinary yapılandırması
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlkrduwav',
    api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_secret_key',
    secure: true
  });
  
  logger.info('Cloudinary yapılandırıldı: ' + cloudinary.config().cloud_name);
} catch (error) {
  logger.error(`Cloudinary yapılandırma hatası: ${error.message}`);
}

// Yardımcı fonksiyonlar
const cloudinaryUpload = {
  // Resim yükleme fonksiyonu
  upload: async (file, folder = 'default') => {
    try {
      // Eğer file bir string ise ve data:image formatındaysa, Cloudinary'ye yüklemeyi dene
      if (typeof file === 'string' && file.startsWith('data:image')) {
        try {
          const result = await cloudinary.uploader.upload(file, {
            folder: folder,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
          });
          
          return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id
          };
        } catch (cloudinaryError) {
          logger.error(`Cloudinary yükleme hatası: ${cloudinaryError.message}`);
          
          // Cloudinary hatası durumunda yerel dosya sistemi çözümüne geç
          return cloudinaryUpload.uploadToLocal(file, folder);
        }
      } 
      // Eğer file bir Buffer veya URL ise
      else if (file) {
        return cloudinaryUpload.uploadToLocal(file, folder);
      }
      
      throw new Error('Geçersiz dosya formatı');
    } catch (error) {
      logger.error(`Resim yükleme hatası: ${error.message}`);
      
      // Hata durumunda varsayılan resim URL'si döndür
      return {
        success: false,
        url: DEFAULT_IMAGE_URL,
        error: error.message
      };
    }
  },
  
  // Yerel dosya sistemine yükleme
  uploadToLocal: async (file, folder = 'default') => {
    try {
      // Base64 formatındaysa
      if (typeof file === 'string' && file.startsWith('data:image')) {
        // Base64'ten dosyaya dönüştür
        const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        
        if (!matches || matches.length !== 3) {
          throw new Error('Geçersiz base64 formatı');
        }
        
        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = type.split('/')[1];
        const fileName = `${Date.now()}.${extension}`;
        const filePath = path.join(uploadFolder, fileName);
        
        // Dosyayı kaydet
        fs.writeFileSync(filePath, buffer);
        
        // Public URL oluştur
        const publicURL = `/uploads/${fileName}`;
        
        return {
          success: true,
          url: publicURL,
          public_id: fileName,
          provider: 'local'
        };
      }
      // Buffer veya dosya yoluysa
      else {
        // Burada dosyayı kopyalama işlemi yapılabilir
        const fileName = `${Date.now()}.jpg`;
        // ... Dosya kopyalama işlemleri ...
        
        return {
          success: false,
          url: DEFAULT_IMAGE_URL,
          error: 'Desteklenmeyen dosya formatı'
        };
      }
    } catch (error) {
      logger.error(`Yerel dosya yükleme hatası: ${error.message}`);
      return {
        success: false,
        url: DEFAULT_IMAGE_URL,
        error: error.message
      };
    }
  },
  
  // Resim silme fonksiyonu
  destroy: async (publicId) => {
    try {
      if (!publicId) {
        throw new Error('Silinecek resim ID\'si bulunamadı');
      }
      
      // Cloudinary'den silmeyi dene
      try {
        if (publicId.includes('cloudinary')) {
          const result = await cloudinary.uploader.destroy(publicId);
          return {
            success: result.result === 'ok',
            result: result.result
          };
        }
      } catch (cloudinaryError) {
        logger.error(`Cloudinary silme hatası: ${cloudinaryError.message}`);
      }
      
      // Yerel dosya sisteminden silmeyi dene
      if (publicId.includes('/uploads/')) {
        const fileName = publicId.split('/uploads/')[1];
        const filePath = path.join(uploadFolder, fileName);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return {
            success: true,
            result: 'ok'
          };
        }
      }
      
      return {
        success: false,
        error: 'Resim bulunamadı'
      };
    } catch (error) {
      logger.error(`Resim silme hatası: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Varsayılan resim URL'si
  getDefaultImageUrl: () => DEFAULT_IMAGE_URL
};

module.exports = cloudinaryUpload;