import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from 'antd';
import { FaShoppingCart, FaRegHeart, FaHeart, FaEye } from 'react-icons/fa';
import { useCartStore, useAuthStore } from '../store';
import logger from '../utils/logger';

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  if (!product) {
    return null;
  }

  // MongoDB/Supabase ID uyumluluğu için
  const productId = product._id || product.id;

  // Resim URL'sini güvenli bir şekilde al
  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return 'https://res.cloudinary.com/dlkrduwav/image/upload/v1716066139/default-product_dljmyw.png';
  };

  // Sepete ekle
  const handleAddToCart = () => {
    addItem(product);
    logger.info('Ürün sepete eklendi', { productId });
  };

  // Stok durumuna göre badge rengi
  const getStockStatus = () => {
    if (!product.stock || product.stock <= 0) {
      return { color: 'red', text: 'Stokta Yok' };
    } else if (product.stock < 5) {
      return { color: 'orange', text: 'Son Birkaç Ürün' };
    } else {
      return { color: 'green', text: 'Stokta' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
      {/* Badge */}
      {(product.featured || stockStatus.text !== 'Stokta') && (
        <div 
          className={`absolute top-2 right-2 z-10 px-2 py-1 text-xs font-medium text-white rounded-full
            ${product.featured ? 'bg-blue-500' : `bg-${stockStatus.color}-500`}`}
        >
          {product.featured ? 'Öne Çıkan' : stockStatus.text}
        </div>
      )}
      
      {/* Ürün Resmi */}
      <Link to={`/product/${productId}`} className="block relative overflow-hidden">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 group-hover:opacity-75">
          <img
            src={getImageUrl()}
            alt={product.name}
            className="h-48 w-full object-cover object-center"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://res.cloudinary.com/dlkrduwav/image/upload/v1716066139/default-product_dljmyw.png";
            }}
          />
        </div>
        
        {/* Hızlı İşlem Butonları */}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/product/${productId}`;
              }}
              className="bg-white dark:bg-gray-800 p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors"
              aria-label="Ürün detayını görüntüle"
            >
              <FaEye />
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={!product.stock || product.stock <= 0}
              className={`p-2 rounded-full text-white transition-colors
                ${product.stock > 0
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
              aria-label="Sepete ekle"
            >
              <FaShoppingCart />
            </button>
          </div>
        </div>
      </Link>
      
      {/* Ürün Bilgileri */}
      <div className="p-4">
        <Link to={`/product/${productId}`} className="block">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 truncate hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {product.category?.name || product.category || 'Genel'}
        </p>
        
        {/* Fiyat */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {product.price?.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY',
            }) || '₺0.00'}
          </div>
          
          {/* Satın Al Butonu */}
          <button
            onClick={handleAddToCart}
            disabled={!product.stock || product.stock <= 0}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors
              ${product.stock > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {product.stock > 0 ? 'Sepete Ekle' : 'Stokta Yok'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;