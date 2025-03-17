import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaShoppingCart, FaUser, FaMoon, FaSun, FaBars, FaTimes } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../ui/ThemeToggle'
import LanguageSelector from '../ui/LanguageSelector'

const Navbar = () => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  
  // Mobil menüyü kapat - sayfa değiştiğinde
  useEffect(() => {
    setIsOpen(false)
  }, [location])

  // Ana navigasyon linkleri
  const navLinks = [
    { text: t('nav.home'), path: '/' },
    { text: t('nav.products'), path: '/products' },
    { text: t('nav.categories'), path: '/categories' }
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md py-4 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
          <span className="flex items-center">
            Modern Shop
          </span>
        </Link>

        {/* Masaüstü Navigasyon */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                location.pathname === link.path 
                  ? 'text-purple-600 dark:text-purple-400 font-medium' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {link.text}
            </Link>
          ))}
        </div>

        {/* Sağ Kısım - İkonlar */}
        <div className="hidden md:flex items-center space-x-6">
          <ThemeToggle />
          <LanguageSelector />
          
          <Link to="/cart" className="relative hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <FaShoppingCart size={22} />
            <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </Link>
          
          <Link to="/login" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <FaUser size={22} />
          </Link>
        </div>

        {/* Mobil Menü Açma Düğmesi */}
        <button 
          className="md:hidden text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobil Menü */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white dark:bg-gray-800 shadow-inner"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
              {navLinks.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className={`block py-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors ${
                    location.pathname === link.path 
                      ? 'text-purple-600 dark:text-purple-400 font-medium' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {link.text}
                </Link>
              ))}
              
              <hr className="border-gray-200 dark:border-gray-700" />
              
              <div className="flex justify-between items-center">
                <ThemeToggle />
                <LanguageSelector />
                
                <Link to="/cart" className="relative hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <FaShoppingCart size={22} />
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </Link>
                
                <Link to="/login" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <FaUser size={22} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export { Navbar }
export default Navbar