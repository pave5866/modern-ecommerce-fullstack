import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { FiSun, FiMoon, FiShoppingCart, FiUser, FiHome, FiPackage, FiMenu, FiX } from 'react-icons/fi'

const Layout = ({ user, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  
  // Karanlık mod değiştiğinde HTML sınıfını güncelle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])
  
  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  // Sistem tercihine göre başlangıç değerini ayarla
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDarkMode)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleLogout = () => {
    if (onLogout) onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo ve Başlık */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl animate-fadeIn">
                  ModernShop
                </span>
              </Link>
            </div>
            
            {/* Masaüstü Menüsü */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                to="/" 
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                } transition-colors duration-200`}
              >
                <FiHome className="mr-1" />
                Ana Sayfa
              </Link>
              <Link 
                to="/products" 
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname.includes('/products') 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                } transition-colors duration-200`}
              >
                <FiPackage className="mr-1" />
                Ürünler
              </Link>
            </nav>
            
            {/* Sağ taraf butonları */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label={darkMode ? 'Aydınlık moda geç' : 'Karanlık moda geç'}
              >
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              
              <Link 
                to="/cart" 
                className="relative p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Sepet"
              >
                <FiShoppingCart size={20} />
              </Link>
              
              {user ? (
                <div className="relative">
                  <Link 
                    to="/profile" 
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  >
                    <FiUser className="mr-1" />
                    {user.name || 'Profil'}
                  </Link>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                >
                  Giriş Yap
                </Link>
              )}
              
              {/* Mobil menu buttonu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Ana menü"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobil menü */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg animate-fadeIn">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === '/' 
                    ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                } transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <FiHome className="mr-2" />
                  Ana Sayfa
                </div>
              </Link>
              <Link 
                to="/products" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname.includes('/products') 
                    ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                } transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <FiPackage className="mr-2" />
                  Ürünler
                </div>
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      location.pathname === '/profile' 
                        ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                    } transition-colors duration-200`}
                  >
                    <div className="flex items-center">
                      <FiUser className="mr-2" />
                      Profil
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname === '/login' 
                      ? 'text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-700' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
                  } transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <FiUser className="mr-2" />
                    Giriş Yap
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow-inner mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} ModernShop. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout