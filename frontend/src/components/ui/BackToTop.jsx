import React, { useEffect, useState } from 'react'
import { FaArrowUp } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false)

  // Sayfa aşağı indikçe butonu göster
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Sayfanın başına kaydırma fonksiyonu
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed right-5 bottom-5 p-3 rounded-full bg-purple-600 text-white shadow-lg z-50 hover:bg-purple-700 transition-colors duration-300"
          aria-label="Sayfanın başına git"
        >
          <FaArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export { BackToTop }
export default BackToTop