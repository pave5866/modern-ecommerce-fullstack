import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../navbar'
import { Footer } from '../footer'
import { PageTransition, BackToTop, Breadcrumb } from '../ui'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      
      <BackToTop />
      <Footer />
    </div>
  )
}

export default Layout