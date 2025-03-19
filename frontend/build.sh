#!/bin/bash

echo "Build işlemi başlatılıyor..."

# Önce bağımlılıkları kuralım
npm install

# Direkt olarak toast.js dosyasını düzelt
if [ -f "src/utils/toast.js" ]; then
  echo "Toast.js dosyası bulundu, düzenleme yapılıyor..."
  # mac/linux için sed komutu
  sed -i 's/from ["'\''"]react-toastify["'\'']/from "react-hot-toast"/g' src/utils/toast.js
  echo "Toast.js dosyası düzenlendi!"
else
  echo "Toast.js dosyası bulunamadı, düzenleme yapılmadı."
fi

# Build işlemini başlat
echo "Vite build işlemi başlatılıyor..."
npm run build:render