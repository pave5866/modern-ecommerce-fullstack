import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FaFilter, FaSearch, FaSort } from 'react-icons/fa'
import { ProductCard } from '../components/ui'

const Products = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  
  // Örnek kategoriler
  const categories = [
    { id: 1, name: 'Elektronik' },
    { id: 2, name: 'Giyim' },
    { id: 3, name: 'Ev & Yaşam' },
    { id: 4, name: 'Kitap & Müzik' },
    { id: 5, name: 'Spor' }
  ]
  
  // Örnek veri
  const products = [
    { id: 1, name: 'Akıllı Telefon', price: 14999, images: ['https://via.placeholder.com/300'], rating: 4.5, reviewCount: 120 },
    { id: 2, name: 'Laptop', price: 24999, images: ['https://via.placeholder.com/300'], rating: 4.8, reviewCount: 80 },
    { id: 3, name: 'Kablosuz Kulaklık', price: 1999, images: ['https://via.placeholder.com/300'], rating: 4.2, reviewCount: 65 },
    { id: 4, name: 'Smart TV', price: 17999, images: ['https://via.placeholder.com/300'], rating: 4.7, reviewCount: 42 },
    { id: 5, name: 'Tablet', price: 8999, images: ['https://via.placeholder.com/300'], rating: 4.0, reviewCount: 38 },
    { id: 6, name: 'Bluetooth Hoparlör', price: 899, images: ['https://via.placeholder.com/300'], rating: 4.3, reviewCount: 54 },
    { id: 7, name: 'Akıllı Saat', price: 3999, images: ['https://via.placeholder.com/300'], rating: 4.1, reviewCount: 27 },
    { id: 8, name: 'Oyun Konsolu', price: 12999, images: ['https://via.placeholder.com/300'], rating: 4.9, reviewCount: 95 }
  ]
  
  // Filtrelenen ürünleri tutacak
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Container animasyonu
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  // Sayfa başlığını ayarla
  return (
    <div className="products-page container mx-auto py-8 px-4">
      <Helmet>
        <title>{t('products.title')} | Modern E-Ticaret</title>
      </Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('products.title')}</h1>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FaFilter />
            <span className="hidden md:inline">{t('products.filter')}</span>
          </button>
          
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('products.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          
          <div className="relative dropdown">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <FaSort />
              <span className="hidden md:inline">{t('products.sort')}</span>
            </button>
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-10 hidden">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                {t('products.sortByPrice')}
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                {t('products.sortByRating')}
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                {t('products.sortByNewest')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Filtreler paneli */}
        <aside className={`w-full md:w-1/4 lg:w-1/5 pr-8 md:block ${filterOpen ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">{t('products.categories')}</h2>
            <ul className="space-y-2 mb-8">
              {categories.map(category => (
                <li key={category.id}>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="form-checkbox text-indigo-600 h-5 w-5" />
                    <span>{category.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            
            <h2 className="text-xl font-semibold mb-4">{t('products.priceRange')}</h2>
            <div>
              <input
                type="range"
                min="0"
                max="30000"
                step="1000"
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between mt-2">
                <span>₺0</span>
                <span>₺30,000</span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold my-4">{t('products.rating')}</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <label key={star} className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="form-checkbox text-indigo-600 h-5 w-5" />
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 ${i < star ? 'fill-current' : 'text-gray-300'}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span>{t('products.andAbove')}</span>
                </label>
              ))}
            </div>
            
            <button className="w-full mt-8 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
              {t('products.applyFilters')}
            </button>
          </div>
        </aside>
        
        {/* Ürün listesi */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-medium">{t('products.noProductsFound')}</h3>
              <p className="text-gray-500 mt-2">{t('products.tryAnotherSearch')}</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          )}
          
          {/* Pagination */}
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-1">
              <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                &laquo;
              </button>
              <button className="px-3 py-2 rounded-md bg-indigo-600 text-white">1</button>
              <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">2</button>
              <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">3</button>
              <span className="px-3 py-2 text-gray-600 dark:text-gray-300">...</span>
              <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">10</button>
              <button className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                &raquo;
              </button>
            </nav>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Products