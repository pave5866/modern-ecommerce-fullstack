import React from 'react'
import { motion } from 'framer-motion'

// Sayfa geçişi animasyonu için kullanılan bileşen
const PageTransition = ({ children }) => {
  // Sayfa animasyon varyantları
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.3,
        when: 'beforeChildren',
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}

export { PageTransition }
export default PageTransition