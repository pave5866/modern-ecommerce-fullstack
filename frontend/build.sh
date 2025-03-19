#!/bin/bash

# Direkt olarak toast.js dosyasını düzelt
echo "Toast.js dosyasını düzenleme"
sed -i 's/from "react-toastify"/from "react-hot-toast"/g' src/utils/toast.js

# Build işlemini başlat
echo "Build işlemini başlat"
npm run build