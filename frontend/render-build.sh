#!/bin/bash

# Gerekli bağımlılıkları yükle
echo "Bağımlılıkları yüklüyorum..."
npm install --production=false

# Loglama
echo "Node ve NPM versiyonları:"
node -v
npm -v

# Package.json içeriğindeki baımlılıkları göster
echo "Package.json içeriği:"
cat package.json

# Antd sürümünü loglama
npm list antd

# Build işlemini başlat
echo "Build işlemi başlıyor..."
npm run build

# Build başarılı olup olmadığını kontrol et
if [ $? -eq 0 ]; then
  echo "Build başarıyla tamamlandı!"
  exit 0
else
  echo "Build hatası! Çıkış kodu: $?"
  exit 1
fi