import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../store';

const ProductCard = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '/product-placeholder.jpg',
      quantity: 1
    });
  };

  // Ürün yoksa boş div döndür
  if (!product) {
    return <div className="product-card animate-pulse bg-gray-200 dark:bg-gray-700 h-64"></div>;
  }

  return (
    <Link 
      to={`/products/${product._id}`} 
      className="product-card group bg-white dark:bg-gray-800 overflow-hidden rounded-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span className="text-gray-400 dark:text-gray-500">Resim yok</span>
          </div>
        )}
        
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100"
          aria-label="Sepete ekle"
        >
          <FiShoppingCart size={16} />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 h-10 overflow-hidden">
          {product.description?.substring(0, 50)}
          {product.description?.length > 50 ? '...' : ''}
        </p>
        
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {product.price?.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            })}
          </p>
          
          {product.category && (
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;