import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FaShoppingCart, 
  FaHeart, 
  FaTruck, 
  FaShieldAlt, 
  FaExchangeAlt, 
  FaStar 
} from 'react-icons/fa'

const ProductDetail = () => {
  const { t } = useTranslation()
  const { productId } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  
  // Örnek veri
  const product = {
    id: productId,
    name: 'Akıllı Telefon XYZ Pro',
    price: 18999,
    oldPrice: 21999,
    discount: 13,
    stock: 42,
    rating: 4.8,
    reviewCount: 124,
    description: 'En son teknolojiyle donatılmış yüksek performanslı akıllı telefon. 8GB RAM, 256GB depolama, 6.7 inç AMOLED ekran ve 108MP ana kamera ile gelişmiş fotoğrafçılık deneyimi sunuyor.',
    details: [
      '8GB RAM, 256GB Depolama',
      '6.7 inç AMOLED Ekran',
      '108MP Ana Kamera',
      '5000mAh Batarya',
      'Android 13 İşletim Sistemi'
    ],
    images: [
      'https://via.placeholder.com/600x600',
      'https://via.placeholder.com/600x600',
      'https://via.placeholder.com/600x600',
      'https://via.placeholder.com/600x600'
    ],
    colors: ['Siyah', 'Mavi', 'Gümüş', 'Yeşil'],
    variants: ['128GB', '256GB', '512GB']
  }
  
  // Renk ve varyant
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedVariant, setSelectedVariant] = useState(product.variants[1])
  
  // Miktarı arttır/azalt
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1)
  const increaseQuantity = () => setQuantity(prev => prev < product.stock ? prev + 1 : prev)
  
  // Animasyon varyantları
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }
  
  return (
    <div className="product-detail-page container mx-auto py-8 px-4">
      <Helmet>
        <title>{product.name} | Modern E-Ticaret</title>
      </Helmet>
      
      {/* Breadcrumb */}
      <nav className="text-sm mb-6">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
              {t('nav.home')}
            </Link>
          </li>
          <li className="text-gray-500 dark:text-gray-400">/</li>
          <li>
            <Link to="/products" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
              {t('nav.products')}
            </Link>
          </li>
          <li className="text-gray-500 dark:text-gray-400">/</li>
          <li className="text-indigo-600 dark:text-indigo-400 font-medium">{product.name}</li>
        </ol>
      </nav>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Ürün Resimleri */}
          <motion.div 
            className="md:w-1/2 p-6"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="relative h-80 md:h-96 mb-4 rounded-lg overflow-hidden">
              <img 
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {product.discount > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {product.discount}% {t('product.discount')}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button 
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-indigo-500' : 'border-transparent'}`}
                >
                  <img src={image} alt={`${product.name} - ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Ürün Bilgileri */}
          <motion.div 
            className="md:w-1/2 p-6 md:border-l dark:border-gray-700"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
            
            {/* Puanlama */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                ({product.reviewCount} {t('product.reviews')})
              </span>
            </div>
            
            {/* Fiyat */}
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  ₺{product.price.toLocaleString()}
                </span>
                {product.oldPrice && (
                  <span className="ml-3 text-lg text-gray-500 line-through">
                    ₺{product.oldPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <span className="text-green-500 text-sm">
                {t('product.inStock', { count: product.stock })}
              </span>
            </div>
            
            {/* Kısa Açıklama */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {product.description}
            </p>
            
            {/* Renk Seçimi */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('product.color')}
              </h3>
              <div className="flex space-x-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 border rounded-full text-sm ${
                      selectedColor === color 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700' 
                        : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Varyant Seçimi */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('product.storage')}
              </h3>
              <div className="flex space-x-2">
                {product.variants.map(variant => (
                  <button
                    key={variant}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3 py-1 border rounded-full text-sm ${
                      selectedVariant === variant 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700' 
                        : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Miktar */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('product.quantity')}
              </h3>
              <div className="flex items-center">
                <button 
                  onClick={decreaseQuantity}
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-l-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={quantity} 
                  readOnly
                  className="w-16 h-10 text-center border-y border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                />
                <button 
                  onClick={increaseQuantity}
                  className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-r-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <motion.button 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaShoppingCart />
                <span>{t('product.addToCart')}</span>
              </motion.button>
              
              <motion.button 
                className="flex-1 bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-200 py-3 px-6 rounded-lg flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaHeart />
                <span>{t('product.addToWishlist')}</span>
              </motion.button>
            </div>
            
            {/* Özellikler */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('product.features')}
              </h3>
              <ul className="space-y-2">
                {product.details.map((detail, index) => (
                  <li key={index} className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Bilgiler */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <FaTruck className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('product.freeShipping')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <FaShieldAlt className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('product.warranty')}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <FaExchangeAlt className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('product.easyReturns')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Ürün Detayları */}
      <div className="mt-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">{t('product.details')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-4">{t('product.description')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum at tellus ex. Vivamus elementum elit ut massa pretium, non condimentum felis faucibus. Proin vitae nunc eget massa placerat dignissim. Sed vehicula risus et congue rhoncus.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Etiam consectetur libero in tellus dignissim, id vestibulum arcu sollicitudin. Cras facilisis ipsum sit amet turpis tincidunt, id volutpat ipsum consequat. Donec venenatis nulla eget leo posuere, id pulvinar mi commodo. Integer in nisl quam. Morbi mattis turpis non molestie malesuada.
                </p>
                
                <h3 className="text-lg font-medium mb-4">{t('product.specifications')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Ekran</h4>
                    <p className="text-gray-600 dark:text-gray-400">6.7 inç AMOLED, 120Hz, HDR10+</p>
                  </div>
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">İşlemci</h4>
                    <p className="text-gray-600 dark:text-gray-400">Octa-core, 3.0 GHz</p>
                  </div>
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Bellek</h4>
                    <p className="text-gray-600 dark:text-gray-400">8GB RAM, 256GB Depolama</p>
                  </div>
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Batarya</h4>
                    <p className="text-gray-600 dark:text-gray-400">5000mAh, 65W Hızlı Şarj</p>
                  </div>
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Kamera</h4>
                    <p className="text-gray-600 dark:text-gray-400">108MP Ana + 12MP Ultra Geniş + 8MP Telefoto</p>
                  </div>
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium mb-2">İşletim Sistemi</h4>
                    <p className="text-gray-600 dark:text-gray-400">Android 13</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{t('product.customerReviews')}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="h-5 w-5" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">1 hafta önce</span>
                  </div>
                  <h4 className="font-medium mb-2">Ahmet Y.</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Harika bir telefon, özellikle kamera kalitesi muhteşem. Batarya ömrü beklediğimden daha iyi çıktı.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(4)].map((_, i) => (
                        <FaStar key={i} className="h-5 w-5" />
                      ))}
                      {[...Array(1)].map((_, i) => (
                        <FaStar key={i} className="h-5 w-5 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">2 hafta önce</span>
                  </div>
                  <h4 className="font-medium mb-2">Ayşe K.</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Şık tasarımı ve yüksek performansı ile memnun kaldım. Sadece biraz ısınma problemi yaşadım.
                  </p>
                </div>
                
                <button className="w-full mt-6 bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 py-2 px-4 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                  {t('product.readAllReviews')} ({product.reviewCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail