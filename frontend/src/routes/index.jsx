import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '../components/layout'
import Home from '../pages/Home'
import ErrorPage from '../pages/ErrorPage'

// Ana router yapılandırması
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />
      },
      // Diğer sayfa rotaları buraya eklenecek
    ]
  }
])

export default router