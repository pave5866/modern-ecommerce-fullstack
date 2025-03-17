import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaChevronRight } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

// Sayfa lokasyonuna göre ekmek kırıntısı gezinme menüsü oluşturur
const Breadcrumb = ({ customPaths }) => {
  const location = useLocation()
  const { t } = useTranslation()
  
  // URL'den path parçalarını ayır
  const pathSnippets = location.pathname.split('/')
    .filter(i => i)
  
  // Özel yollar belirtilmişse onları kullan, yoksa URL'den oluştur
  const breadcrumbItems = customPaths || pathSnippets.map((snippet, index) => {
    // Her parça için ilgili URL'yi oluştur
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`
    
    // Sayfa ismi için özel durumlar (özelleştirme)
    let name = snippet
      // Tire ile ayrılmış kelimeleri ayır ve her kelimenin ilk harfini büyük yap
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    // Yaygın sayfa adları için çeviriler kullan
    if (snippet === 'products') name = t('nav.products')
    if (snippet === 'cart') name = t('nav.cart')
    if (snippet === 'login') name = t('nav.login')
    if (snippet === 'register') name = t('nav.register')
    if (snippet === 'profile') name = t('nav.profile')
    if (snippet === 'admin') name = t('nav.admin')
    if (snippet === 'categories') name = t('nav.categories')
    
    return { name, url }
  })

  // Anlamsız çok kısa ekmek kırıntısı menülerini gösterme
  if (breadcrumbItems.length <= 0) {
    return null
  }

  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.nav 
      className="p-4 text-sm text-gray-600 dark:text-gray-400"
      aria-label="Breadcrumb"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.ol className="inline-flex items-center space-x-1 md:space-x-3" variants={containerVariants}>
        {/* Ana sayfa linki (her zaman gösterilir) */}
        <motion.li className="inline-flex items-center" variants={itemVariants}>
          <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400">
            <FaHome className="mr-2" />
            {t('nav.home')}
          </Link>
        </motion.li>
        
        {/* Diğer breadcrumb öğeleri */}
        {breadcrumbItems.map((item, index) => (
          <motion.li key={item.url} variants={itemVariants}>
            <div className="flex items-center">
              <FaChevronRight className="text-gray-400 mx-2" size={10} />
              {index === breadcrumbItems.length - 1 ? (
                // Son öğe (aktif sayfa)
                <span className="text-purple-600 dark:text-purple-400 font-medium">{item.name}</span>
              ) : (
                // Gezinme linki
                <Link 
                  to={item.url} 
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </motion.li>
        ))}
      </motion.ol>
    </motion.nav>
  )
}

export { Breadcrumb }
export default Breadcrumb