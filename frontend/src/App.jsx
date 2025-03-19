import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store'
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
import logger from './utils/logger'

function App() {
  const { user, login, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('auth-storage')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      try {
        // Zustand persist plugin ile kaydedilen verileri çekiyoruz
        const parsedState = JSON.parse(storedUser)
        
        if (parsedState.state && parsedState.state.user) {
          // Token'ın geçerliliğini kontrol et
          const verifyToken = async () => {
            try {
              logger.info('Token doğrulanıyor')
              const response = await authAPI.getProfile()
              
              if (response.success) {
                // Token geçerli
                logger.info('Token geçerli, kullanıcı girişi yapıldı')
                login(parsedState.state.user, token)
              } else {
                // Token geçersiz, çıkış yap
                logger.warn('Token geçersiz, çıkış yapılıyor')
                logout()
              }
            } catch (error) {
              logger.error('Token doğrulama hatası', { error: error.message })
              logout()
            } finally {
              setLoading(false)
            }
          }
          
          verifyToken()
        } else {
          setLoading(false)
        }
      } catch (error) {
        logger.error('Oturum verilerini çözümleme hatası', { error: error.message })
        logout()
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [login, logout])

  const handleLogin = (userData, token) => {
    login(userData, token)
  }

  const handleLogout = () => {
    logout()
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
      <Route path="/" element={<Layout onLogout={handleLogout} />}>
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