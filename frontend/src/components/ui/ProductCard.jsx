import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaShoppingCart, FaHeart } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

const ProductCard = ({ product }) => {
  const { t } = useTranslation()
  
  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { 
      scale: 1.05, 
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
      transition: { duration: 0.2 }
    }
  }

  const buttonVariants = {
    hover: { scale: 1.1, transition: { duration: 0.2 } }
  }
  
  return (
    <motion.div 
      className="product-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Link to={`/products/${product.id}`}>
        <div className="relative overflow-hidden h-48">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {product.discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              {product.discount}% {t('product.discount')}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{product.name}</h3>
        
        <div className="flex justify-between items-center mt-2">
          <div>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              ₺{product.price}
            </span>
            {product.oldPrice && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                ₺{product.oldPrice}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <motion.button 
              className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full"
              variants={buttonVariants}
              whileHover="hover"
              aria-label={t('product.addToCart')}
            >
              <FaShoppingCart />
            </motion.button>
            
            <motion.button 
              className="p-2 bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 rounded-full"
              variants={buttonVariants}
              whileHover="hover"
              aria-label={t('product.addToWishlist')}
            >
              <FaHeart />
            </motion.button>
          </div>
        </div>
        
        {/* Rating */}
        {product.rating && (
          <div className="mt-2 flex items-center">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({product.reviewCount} {t('product.reviews')})
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard