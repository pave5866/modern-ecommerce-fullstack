import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FaHome, FaArrowLeft, FaSearch } from 'react-icons/fa'

const NotFound = () => {
  const { t } = useTranslation()

  return (
    <div className="not-found-page min-h-screen flex items-center justify-center px-4">
      <Helmet>
        <title>{t('notFound.title')} | Modern E-Ticaret</title>
      </Helmet>
      
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="md:flex">
          <motion.div 
            className="md:w-1/2 flex items-center justify-center p-12 bg-indigo-600"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.div
                className="text-white text-9xl font-bold mb-6"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                404
              </motion.div>
              
              <motion.div 
                className="text-indigo-200 text-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {t('notFound.pageNotFound')}
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div 
            className="md:w-1/2 p-12"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
              {t('notFound.oops')}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t('notFound.message')}
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/" 
                className="flex items-center justify-center space-x-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg transition-colors"
              >
                <FaHome />
                <span>{t('notFound.backToHome')}</span>
              </Link>
              
              <Link 
                to="/products" 
                className="flex items-center justify-center space-x-2 w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 py-3 px-6 rounded-lg transition-colors"
              >
                <FaArrowLeft />
                <span>{t('notFound.browseProducts')}</span>
              </Link>
              
              <div className="relative mt-8">
                <input 
                  type="text" 
                  placeholder={t('notFound.searchPlaceholder')}
                  className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
              <p>
                {t('notFound.contactSupport')}{' '}
                <a href="mailto:support@example.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  support@example.com
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default NotFound