import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './index.css'
import './i18n' // i18next başlatma
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </>
  </React.StrictMode>,
)