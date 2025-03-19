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
import { authAPI, testAPI } from './services/api'
import { useAuthStore } from './store'
import { showToast } from './utils'
import logger from './utils/logger'

function App() {
  const { user, login: storeLogin, logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [apiConnected, setApiConnected] = useState(true)

  // API bağlantısını kontrol et
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await testAPI();
        if (!response.success) {
          setApiConnected(false);
          logger.warn('API bağlantısı testi başarısız oldu', {
            status: response.status,
            message: response.error
          });
        } else {
          logger.info('API bağlantısı testi başarılı', {
            status: response.status,
            message: response.message
          });
        }
      } catch (error) {
        setApiConnected(false);
        logger.error('API bağlantısı testi hatası', { error: error.message });
      }
    };
    
    checkApiConnection();
  }, []);

  // Kullanıcı kimlik doğrulaması
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        const token = localStorage.getItem('token')

        if (storedUser && token) {
          try {
            const userData = JSON.parse(storedUser)
            // Önce mevcut bilgilerle kullanıcıyı ayarla
            storeLogin(userData, token)
            
            logger.info('Oturum doğrulanıyor', { userId: userData._id });
            
            // Token'ın geçerliliğini kontrol et
            const profileResponse = await authAPI.getProfile()
            
            if (!profileResponse.success) {
              // Profil getirme başarısız, çıkış yap
              logger.warn('Oturum doğrulanamadı, çıkış yapılıyor', { 
                error: profileResponse.error 
              });
              handleLogout()
              showToast.error('Oturumunuz sona erdi, lütfen tekrar giriş yapın.');
            } else {
              // Profil bilgilerini güncelle
              storeLogin(profileResponse.user, token)
              logger.info('Kullanıcı oturumu doğrulandı', { 
                userId: profileResponse.user._id
              });
            }
          } catch (error) {
            logger.error('Token kontrolü sırasında hata', { error: error.message });
            handleLogout();
            showToast.error('Oturum hatası, lütfen tekrar giriş yapın.');
          }
        } else {
          logger.info('Kullanıcı oturumu bulunamadı');
        }
      } catch (error) {
        logger.error('Kimlik doğrulama sırasında beklenmedik hata', { 
          error: error.message 
        });
      } finally {
        setLoading(false);
      }
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
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  // API bağlantısı yoksa uyarı göster
  if (!apiConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-4">
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-4">
            Sunucu Bağlantı Hatası
          </h2>
          <p className="text-red-600 dark:text-red-200 mb-4">
            Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </div>
    );
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