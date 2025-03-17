import React from 'react'
import { Link, useRouteError } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FaHome, FaExclamationTriangle } from 'react-icons/fa'

const ErrorPage = () => {
  const error = useRouteError()
  const { t } = useTranslation()
  
  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.2,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  // Hata mesajını belirle
  let errorTitle = t('error.notFound')
  let errorMessage = t('error.pageNotFoundMessage')
  
  if (error && error.status === 500) {
    errorTitle = t('error.serverError')
    errorMessage = t('error.serverErrorMessage')
  } else if (error && error.status !== 404) {
    errorTitle = t('error.unexpectedError')
    errorMessage = error.message || t('error.somethingWentWrong')
  }

  return (
    <>
      <Helmet>
        <title>{errorTitle} | Modern E-Commerce</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center px-4 py-16">
        <motion.div 
          className="text-center max-w-md w-full mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            className="text-red-500 mb-6 flex justify-center"
            variants={itemVariants}
          >
            <FaExclamationTriangle size={64} />
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold mb-4 text-gray-800 dark:text-white"
            variants={itemVariants}
          >
            {errorTitle}
          </motion.h1>
          
          <motion.p 
            className="text-gray-600 dark:text-gray-300 mb-8"
            variants={itemVariants}
          >
            {errorMessage}
          </motion.p>
          
          <motion.div variants={itemVariants}>
            <Link 
              to="/"
              className="inline-flex items-center justify-center bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors"
            >
              <FaHome className="mr-2" />
              {t('error.backToHome')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}

export default ErrorPage