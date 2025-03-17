import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'

// Stiller
import './App.css'

function App() {
  const { t } = useTranslation()
  
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<div className="welcome-container">
            <h1>Modern E-Ticaret Uygulaması</h1>
            <p>Hoş geldiniz! Uygulama başarıyla çalışıyor.</p>
          </div>} />
          <Route path="*" element={<div>Sayfa bulunamadı</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App