import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Breadcrumb } from '../components/ui'

const Home = () => {
  const { t } = useTranslation()

  // Sayfa animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2
      } 
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  }

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)"
    },
    tap: { scale: 0.95 }
  }

  return (
    <>
      <Helmet>
        <title>{t('home.title')} | Modern E-Commerce</title>
        <meta name="description" content={t('home.metaDescription')} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          {/* Hero Section */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-8 shadow-lg"
            variants={itemVariants}
          >
            <div className="text-white mb-8 md:mb-0 md:mr-8 md:w-1/2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {t('home.heroTitle')}
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-6">
                {t('home.heroSubtitle')}
              </p>
              <motion.button
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-medium shadow-md hover:bg-gray-100 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {t('home.shopNow')}
              </motion.button>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Hero banner" 
                className="rounded-lg shadow-lg max-w-full h-auto"
              />
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div className="my-16" variants={itemVariants}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">
              {t('home.whyChooseUs')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🚚",
                  title: t('home.freeShipping'),
                  description: t('home.freeShippingDesc')
                },
                {
                  icon: "🛡️",
                  title: t('home.securePayment'),
                  description: t('home.securePaymentDesc')
                },
                {
                  icon: "💯",
                  title: t('home.qualityProducts'),
                  description: t('home.qualityProductsDesc')
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all hover:shadow-lg text-center"
                  whileHover={{ y: -5 }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Featured Products */}
          <motion.div className="my-16" variants={itemVariants}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">
              {t('home.featuredProducts')}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <motion.div 
                  key={item}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  whileHover={{ y: -5 }}
                >
                  <img 
                    src={`https://via.placeholder.com/300x300?text=Product+${item}`} 
                    alt={`Product ${item}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      {t('product.name', { number: item })}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        ${(item * 25).toFixed(2)}
                      </span>
                      <motion.button
                        className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-700 transition-colors"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        {t('product.addToCart')}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <motion.button
                className="bg-purple-600 text-white px-6 py-3 rounded-full font-medium shadow-md hover:bg-purple-700 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {t('home.viewAllProducts')}
              </motion.button>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div className="my-16 bg-gray-100 dark:bg-gray-800 rounded-xl p-8" variants={itemVariants}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200">
              {t('home.customerReviews')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Ahmet Y.",
                  rating: 5,
                  text: t('home.reviewText1')
                },
                {
                  name: "Ayşe K.",
                  rating: 4,
                  text: t('home.reviewText2')
                },
                {
                  name: "Mehmet S.",
                  rating: 5,
                  text: t('home.reviewText3')
                }
              ].map((review, index) => (
                <motion.div 
                  key={index}
                  className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md"
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center mr-4">
                      <span className="text-purple-700 text-lg font-bold">
                        {review.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">{review.name}</h4>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">"{review.text}"</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            className="my-16 bg-purple-600 text-white rounded-xl p-8 text-center"
            variants={itemVariants}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('home.stayUpdated')}
            </h2>
            <p className="mb-6 max-w-2xl mx-auto">
              {t('home.newsletterDesc')}
            </p>
            <div className="flex flex-col sm:flex-row max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder={t('home.emailPlaceholder')}
                className="flex-grow px-4 py-3 rounded-l-full sm:rounded-r-none rounded-r-full mb-2 sm:mb-0 text-gray-800 focus:outline-none"
              />
              <motion.button
                className="bg-purple-800 hover:bg-purple-900 px-6 py-3 rounded-r-full sm:rounded-l-none rounded-l-full transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {t('home.subscribe')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}

export default Home