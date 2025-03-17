import React, { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'
import { motion } from 'framer-motion'

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState(false)

  // Sayfa yüklendiğinde tema tercihini kontrol et
  useEffect(() => {
    // Yerel depolamada veya sistem tercihinde karanlık modu kontrol et
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                     (!localStorage.getItem('darkMode') && 
                      window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setDarkMode(isDarkMode)
    updateTheme(isDarkMode)
  }, [])

  // Temayı güncelle
  const updateTheme = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', isDark)
  }

  // Tema değiştirme fonksiyonu
  const toggleTheme = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    updateTheme(newDarkMode)
  }

  // Geçiş animasyonu varyantları
  const springTransition = {
    type: 'spring',
    stiffness: 700,
    damping: 30
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-full focus:outline-none"
      whileTap={{ scale: 0.9 }}
      aria-label={darkMode ? 'Açık tema' : 'Koyu tema'}
    >
      <motion.div
        initial={false}
        animate={{ 
          rotate: darkMode ? 180 : 0 
        }}
        transition={springTransition}
      >
        {darkMode ? (
          <FaMoon className="text-indigo-300 hover:text-indigo-400 transition-colors" size={22} />
        ) : (
          <FaSun className="text-amber-500 hover:text-amber-600 transition-colors" size={22} />
        )}
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle