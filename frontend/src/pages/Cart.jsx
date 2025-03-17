import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaCreditCard } from 'react-icons/fa'

const Cart = () => {
  const { t } = useTranslation()
  
  // Örnek sepet öğeleri
  const [cartItems, setCartItems] = useState([
    { 
      id: 1, 
      name: 'Akıllı Telefon', 
      price: 14999, 
      image: 'https://via.placeholder.com/100',
      quantity: 1
    },
    { 
      id: 3, 
      name: 'Kablosuz Kulaklık', 
      price: 1999, 
      image: 'https://via.placeholder.com/100',
      quantity: 2
    }
  ])
  
  // Adet güncelleme fonksiyonu
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    )
  }
  
  // Ürünü sepetten kaldırma
  const removeItem = (id) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id))
  }
  
  // Toplam tutarı hesaplama
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const shipping = subtotal > 0 ? 29.99 : 0
  const total = subtotal + shipping
  
  // Animasyon varyantları
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  }
  
  return (
    <div className="cart-page container mx-auto py-8 px-4">
      <Helmet>
        <title>{t('cart.title')} | Modern E-Ticaret</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-8">{t('cart.title')}</h1>
      
      {cartItems.length === 0 ? (
        <div className="empty-cart flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg className="w-24 h-24 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-semibold mb-4">{t('cart.emptyTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{t('cart.emptyMessage')}</p>
          <Link 
            to="/products" 
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <FaArrowLeft />
            <span>{t('cart.continueShopping')}</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sepet Öğeleri */}
          <motion.div 
            className="lg:w-2/3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="hidden md:grid grid-cols-12 gap-4 mb-6 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <div className="col-span-6">{t('cart.product')}</div>
                <div className="col-span-2 text-center">{t('cart.price')}</div>
                <div className="col-span-2 text-center">{t('cart.quantity')}</div>
                <div className="col-span-2 text-center">{t('cart.total')}</div>
              </div>
              
              {cartItems.map(item => (
                <motion.div 
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b dark:border-gray-700 items-center"
                  variants={itemVariants}
                  layout
                >
                  <div className="col-span-6 flex items-center space-x-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="flex items-center space-x-1 text-sm text-red-500 mt-1 hover:text-red-700"
                      >
                        <FaTrash size={12} />
                        <span>{t('cart.remove')}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className="md:hidden inline-block font-medium mr-2">{t('cart.price')}:</span>
                    ₺{item.price.toLocaleString()}
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FaMinus size={12} />
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={item.quantity}
                        readOnly
                        className="w-12 text-center bg-white dark:bg-gray-800 border-x border-gray-300 dark:border-gray-600"
                      />
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-center font-medium">
                    <span className="md:hidden inline-block font-medium mr-2">{t('cart.total')}:</span>
                    ₺{(item.price * item.quantity).toLocaleString()}
                  </div>
                </motion.div>
              ))}
              
              <div className="mt-6 flex justify-between">
                <Link 
                  to="/products" 
                  className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaArrowLeft size={14} />
                  <span>{t('cart.continueShopping')}</span>
                </Link>
                
                <button 
                  onClick={() => setCartItems([])}
                  className="flex items-center space-x-2 text-red-500 hover:text-red-700"
                >
                  <FaTrash size={14} />
                  <span>{t('cart.clearCart')}</span>
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Özet */}
          <motion.div 
            className="lg:w-1/3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">{t('cart.orderSummary')}</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('cart.subtotal')}</span>
                  <span className="font-medium">₺{subtotal.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('cart.shipping')}</span>
                  <span className="font-medium">₺{shipping.toLocaleString()}</span>
                </div>
                
                <div className="border-t dark:border-gray-700 pt-4 flex justify-between">
                  <span className="font-bold">{t('cart.total')}</span>
                  <span className="font-bold text-xl">₺{total.toLocaleString()}</span>
                </div>
              </div>
              
              <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                <FaCreditCard />
                <span>{t('cart.checkout')}</span>
              </button>
              
              <div className="mt-6">
                <div className="flex items-center mb-2">
                  <input type="checkbox" id="terms" className="mr-2" />
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                    {t('cart.agreeToTerms')}
                  </label>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('cart.securePayment')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Cart