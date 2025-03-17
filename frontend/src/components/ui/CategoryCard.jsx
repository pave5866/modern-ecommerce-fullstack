import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const CategoryCard = ({ category }) => {
  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: { 
      y: -5,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      className="category-card relative overflow-hidden rounded-xl"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Link to={`/products?category=${category.id}`}>
        <div className="relative h-44 w-full">
          <img 
            src={category.image} 
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold text-white">{category.name}</h3>
            <motion.div 
              className="w-1/4 h-1 bg-indigo-500 mt-2"
              initial={{ width: 0 }}
              whileInView={{ width: '25%' }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default CategoryCard