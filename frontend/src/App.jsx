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
import apiService from './utils/api'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
        // Token'ın geçerliliğini kontrol et
        apiService.getProfile()
          .catch((error) => {
            if (error.response && error.response.status === 401) {
              // Token geçersiz, çıkış yap
              handleLogout()
            }
          })
      } catch (error) {
        handleLogout()
      }
    }
    
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
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
          element={user ? <Profile user={user} /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App