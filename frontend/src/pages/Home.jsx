import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTag, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { productAPI, categoryAPI } from '../services/api';
import logger from '../utils/logger';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        logger.info('Ana sayfa verileri yükleniyor');

        // Öne çıkan ürünleri ve kategorileri getir
        const productsResponse = await productAPI.getAll({ limit: 4, sort: 'newest' });
        const categoriesResponse = await categoryAPI.getAll();

        // Veri kontrolü ve varsayılan değerler
        if (productsResponse.success) {
          setFeaturedProducts(Array.isArray(productsResponse.data) ? productsResponse.data : []);
        } else {
          throw new Error(productsResponse.error || 'Ürünler yüklenemedi');
        }

        if (categoriesResponse.success) {
          setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
        } else {
          throw new Error(categoriesResponse.error || 'Kategoriler yüklenemedi');
        }

        logger.info('Ana sayfa verileri başarıyla yüklendi', {
          productsCount: featuredProducts.length,
          categoriesCount: categories.length
        });
      } catch (err) {
        logger.error('Ana sayfa verilerini getirirken hata oluştu:', err);
        setError('Ürünler ve kategoriler yüklenirken bir hata oluştu.');
        
        // Hata durumunda örnek veriler göster
        setFeaturedProducts([
          { _id: "1", name: 'Örnek Ürün 1', price: 99.99, images: ['https://via.placeholder.com/300'] },
          { _id: "2", name: 'Örnek Ürün 2', price: 149.99, images: ['https://via.placeholder.com/300'] },
          { _id: "3", name: 'Örnek Ürün 3', price: 199.99, images: ['https://via.placeholder.com/300'] },
          { _id: "4", name: 'Örnek Ürün 4', price: 129.99, images: ['https://via.placeholder.com/300'] }
        ]);
        
        setCategories([
          { _id: "1", name: 'Örnek Kategori 1', image: 'https://via.placeholder.com/200' },
          { _id: "2", name: 'Örnek Kategori 2', image: 'https://via.placeholder.com/200' },
          { _id: "3", name: 'Örnek Kategori 3', image: 'https://via.placeholder.com/200' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Yükleme ve hata durumlarını kontrol et
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Hero bölümü */}
      <section className="py-12 bg-gradient-to-r from-primary-600 to-blue-700 text-white rounded-xl shadow-xl mb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0 animate-slideIn">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Alışverişin Modern Hali</h1>
              <p className="text-lg mb-6 text-blue-100">
                En yeni ürünleri keşfedin ve benzersiz bir alışveriş deneyimi yaşayın.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-md text-white bg-primary-800 hover:bg-primary-900 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Hemen Alışverişe Başla
                <FiArrowRight className="ml-2" />
              </Link>
            </div>
            <div className="md:w-1/2 animate-slideIn" style={{animationDelay: '0.2s'}}>
              <img
                src="https://via.placeholder.com/600x400"
                alt="ModernShop"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler bölümü */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Neden Bizi Tercih Etmelisiniz?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary-600 dark:text-primary-400 mb-4">
                <FiTag className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2 text-gray-800 dark:text-white">En İyi Fiyatlar</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Piyasadaki en rekabetçi fiyatlarla kaliteli ürünler sunuyoruz.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary-600 dark:text-primary-400 mb-4">
                <FiShoppingBag className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2 text-gray-800 dark:text-white">Kaliteli Ürünler</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Tüm ürünlerimiz en kaliteli malzemelerden üretilmektedir.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-soft hover:shadow-lg transition-shadow duration-300">
              <div className="text-primary-600 dark:text-primary-400 mb-4">
                <FiTruck className="h-10 w-10 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2 text-gray-800 dark:text-white">Hızlı Teslimat</h3>
              <p className="text-center text-gray-600 dark:text-gray-300">
                Siparişleriniz aynı gün içinde hazırlanır ve en hızlı şekilde elinize ulaşır.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Öne çıkan ürünler */}
      <section className="py-12 mb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Öne Çıkan Ürünler</h2>
            <Link 
              to="/products" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center"
            >
              Tümünü Gör <FiArrowRight className="ml-1" />
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-6 rounded">
              <p>{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div 
                  key={product._id} 
                  className="product-card group bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={`/products/${product._id}`} className="block relative">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <img
                        src={(product.images && product.images.length > 0) ? product.images[0] : "https://via.placeholder.com/300"}
                        alt={product.name}
                        className="object-cover object-center w-full h-full transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                        {product.name}
                      </h3>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {product.price?.toFixed(2)} TL
                      </p>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-4 text-center p-8">
                <p className="text-gray-500 dark:text-gray-400">Henüz gösterilecek ürün bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kategoriler */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800 dark:text-white">Kategoriler</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link 
                  key={category._id} 
                  to={`/products?category=${category.name}`}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="aspect-w-16 aspect-h-9 w-full">
                    <img
                      src={category.image || "https://via.placeholder.com/400x225"}
                      alt={category.name}
                      className="object-cover object-center w-full h-full"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-white">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center p-8">
                <p className="text-gray-500 dark:text-gray-400">Henüz gösterilecek kategori bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;