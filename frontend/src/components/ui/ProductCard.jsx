import { Link } from 'react-router-dom'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCartStore } from '../../store'
import { showToast } from '../../utils'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store'

export function ProductCard({ product }) {
  const { addItem } = useCartStore()
  const { user } = useAuthStore()

  const handleAddToCart = (e) => {
    e.preventDefault()
    
    if (user?.role === 'admin') {
      showToast.error('Admin kullanıcılar sepete ürün ekleyemez')
      return
    }

    // Sepette ürünler varsa ve admin hesabına geçildiyse (yanlış state durumu)
    // sepeti temizle ve uyarı göster
    const cartItems = useCartStore.getState().items
    if (user?.role === 'admin' && cartItems.length > 0) {
      const clearCart = useCartStore.getState().clearCart
      clearCart()
      showToast.warning('Admin hesabına geçiş yapıldığı için sepetiniz temizlendi')
      return
    }

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category
    })
    showToast.success('Ürün sepete eklendi')
  }

  // Varsayılan ürün resmi
  const defaultImage = 'https://via.placeholder.com/300x400'

  // Resim URL'sini kontrol et ve varsayılan resmi kullan
  const imageUrl = product?.images?.length > 0 && product.images[0] 
    ? product.images[0] 
    : defaultImage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full"
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <Link
        to={`/products/${product._id}`}
        className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 h-full w-full shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="relative h-[200px] xs:h-[220px] sm:h-[180px] md:h-[160px] lg:h-[180px] flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <motion.img
            src={imageUrl}
            alt={product?.name || 'Ürün'}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = defaultImage
            }}
            className="max-h-full max-w-full h-auto w-auto object-contain transition-all duration-500"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
          />
          <motion.div 
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </div>
        <div className="flex flex-col p-2 md:p-3 mt-auto">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
            {product?.name || 'İsimsiz Ürün'}
          </h3>
          <p className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
            {product?.category || 'Kategorisiz'}
          </p>
          <p className="text-sm xs:text-base font-medium text-gray-900 dark:text-white mt-1">
            ₺{product?.price?.toLocaleString('tr-TR') || '0'}
          </p>
        </div>
        <motion.button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 rounded-full bg-primary-600 p-1.5 sm:p-2 text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
        </motion.button>
      </Link>
    </motion.div>
  )
} 