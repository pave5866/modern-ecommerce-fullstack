import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { ProductCard, Slider, CategoryCard } from '../components/ui'

const Home = () => {
  const { t } = useTranslation()

  // Örnek veri
  const featuredProducts = [
    { id: 1, name: 'Ürün 1', price: 100, images: ['https://via.placeholder.com/300'] },
    { id: 2, name: 'Ürün 2', price: 200, images: ['https://via.placeholder.com/300'] },
    { id: 3, name: 'Ürün 3', price: 300, images: ['https://via.placeholder.com/300'] },
    { id: 4, name: 'Ürün 4', price: 400, images: ['https://via.placeholder.com/300'] }
  ]

  const categories = [
    { id: 1, name: 'Elektronik', image: 'https://via.placeholder.com/300' },
    { id: 2, name: 'Giyim', image: 'https://via.placeholder.com/300' },
    { id: 3, name: 'Ev & Yaşam', image: 'https://via.placeholder.com/300' },
    { id: 4, name: 'Kitap', image: 'https://via.placeholder.com/300' }
  ]

  return (
    <div className="home-container">
      <Helmet>
        <title>{t('home.title')} | Modern E-Ticaret</title>
      </Helmet>

      <section className="hero-section">
        <h1 className="text-4xl font-bold text-center mb-8">Modern E-Ticaret Uygulaması</h1>
        <p className="text-xl text-center mb-12">Hoş geldiniz! Uygulama başarıyla çalışıyor.</p>
      </section>

      <section className="featured-products">
        <h2 className="text-2xl font-bold mb-6">Öne Çıkan Ürünler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="categories-section my-12">
        <h2 className="text-2xl font-bold mb-6">Kategoriler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home