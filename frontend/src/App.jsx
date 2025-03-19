import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import ProductList from './pages/ProductList'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { authAPI } from './services/api'
import { useAuthStore } from './store'
import logger from './utils/logger'

function App() {
  const { user, login: storeLogin, logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('token')

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser)
          storeLogin(userData, token)
          
          // Token'ın geçerliliğini kontrol et
          const profileResponse = await authAPI.getProfile()
          
          if (!profileResponse.success) {
            // Profil getirme başarısız, çıkış yap
            logger.warn('Oturum doğrulanamadı, çıkış yapılıyor')
            handleLogout()
          } else {
            // Profil bilgilerini güncelle
            storeLogin(profileResponse.user, token)
            logger.info('Kullanıcı oturumu doğrulandı')
          }
        } catch (error) {
          logger.error('Token kontrolü sırasında hata', { error: error.message })
          handleLogout()
        }
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = (userData, token) => {
    storeLogin(userData, token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    logger.info('Kullanıcı giriş yaptı', { userId: userData._id })
  }

  const handleLogout = () => {
    storeLogout()
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    logger.info('Kullanıcı çıkış yaptı')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
        <Route index element={<Home />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route 
          path="login" 
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="register" 
          element={user ? <Navigate to="/" replace /> : <Register onLogin={handleLogin} />} 
        />
        <Route 
          path="profile" 
          element={user ? <Profile /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App