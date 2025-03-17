import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'

const Slider = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Eğer slides prop'u verilmediyse, varsayılan slider resimleri kullanılır
  const defaultSlides = [
    {
      id: 1,
      image: 'https://via.placeholder.com/1600x500',
      title: 'Yeni Sezonda İndirim',
      subtitle: 'Tüm ürünlerde %20 indirim',
      buttonText: 'Alışverişe Başla',
      buttonLink: '/products'
    },
    {
      id: 2,
      image: 'https://via.placeholder.com/1600x500',
      title: 'Elektronik Fırsatları',
      subtitle: 'En yeni teknoloji ürünlerinde özel fiyatlar',
      buttonText: 'Keşfet',
      buttonLink: '/products?category=electronics'
    },
    {
      id: 3,
      image: 'https://via.placeholder.com/1600x500',
      title: 'Ücretsiz Kargo',
      subtitle: '200 TL üzeri alışverişlerde kargo bedava',
      buttonText: 'Detaylar',
      buttonLink: '/shipping'
    }
  ]
  
  const slidesToShow = slides || defaultSlides
  
  // Otomatik kaydırma
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slidesToShow.length - 1 ? 0 : prev + 1))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [slidesToShow.length])
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slidesToShow.length - 1 : prev - 1))
  }
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slidesToShow.length - 1 ? 0 : prev + 1))
  }
  
  // Animasyon varyantları
  const slideVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.8 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.5 }
    }
  }
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.1,
      backgroundColor: '#4F46E5',
      transition: { duration: 0.2 }
    }
  }
  
  return (
    <div className="slider-container relative overflow-hidden h-[400px] md:h-[500px] rounded-xl my-8">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSlide}
          className="slide relative w-full h-full"
          variants={slideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <img 
            src={slidesToShow[currentSlide].image} 
            alt={slidesToShow[currentSlide].title} 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="text-white p-8 md:p-16 max-w-2xl">
              <motion.h2 
                className="text-3xl md:text-5xl font-bold mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {slidesToShow[currentSlide].title}
              </motion.h2>
              
              <motion.p 
                className="text-lg md:text-xl mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {slidesToShow[currentSlide].subtitle}
              </motion.p>
              
              <motion.a
                href={slidesToShow[currentSlide].buttonLink}
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full font-medium"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
              >
                {slidesToShow[currentSlide].buttonText}
              </motion.a>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Kontrol butonları */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Önceki slide"
      >
        <FaArrowLeft />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
        aria-label="Sonraki slide"
      >
        <FaArrowRight />
      </button>
      
      {/* İndikatörler */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slidesToShow.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default Slider