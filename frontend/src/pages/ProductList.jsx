import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { productAPI, categoryAPI } from '../services/api';
import Loading from '../components/ui/Loading';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import logger from '../utils/logger';

export default function ProductList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useState(new URLSearchParams(location.search));
  
  // Filtre durum değişkenleri
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '12'),
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Ürünleri getir
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        logger.info('Ürünler getiriliyor', { filters });
        
        // API parametrelerini hazırla
        const params = {
          page: filters.page,
          limit: filters.limit,
          sort: filters.sort,
        };
        
        // İsteğe bağlı parametreler
        if (filters.search) params.search = filters.search;
        if (filters.category) params.category = filters.category;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        
        const response = await productAPI.getAll(params);
        
        if (!response.success) {
          throw new Error(response.error || 'Ürünler getirilemedi');
        }
        
        return {
          products: response.data || [],
          total: response.total || 0,
          page: response.page || 1,
          limit: response.limit || 12,
          totalPages: Math.ceil((response.total || 0) / (response.limit || 12)),
        };
      } catch (error) {
        logger.error('Ürünleri getirme hatası', { error: error.message });
        throw error;
      }
    },
  });
  
  // Kategorileri getir
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoryAPI.getAll();
        return response.success ? response.data : [];
      } catch (error) {
        logger.error('Kategorileri getirme hatası', { error: error.message });
        return [];
      }
    },
  });
  
  // URL'i güncelle
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.limit !== 12) params.set('limit', filters.limit.toString());
    
    navigate({
      pathname: location.pathname,
      search: params.toString(),
    }, { replace: true });
  }, [filters, navigate, location.pathname]);
  
  // Filtre değişikliklerini işle
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // Filtre değiştiğinde sayfa 1'e dön
      ...((name !== 'page' && name !== 'limit') ? { page: 1 } : {}),
    }));
  };
  
  // Arama formunu işle
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Filtreleri güncelle ve sayfa 1'e dön
    setFilters((prev) => ({
      ...prev,
      page: 1,
    }));
    refetch();
  };
  
  // Filtreleri temizle
  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1,
      limit: 12,
    });
  };
  
  // Sayfa değiştirme
  const handlePageChange = (newPage) => {
    if (newPage < 1 || (productsData && newPage > productsData.totalPages)) {
      return;
    }
    
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    
    // Sayfa üstüne scroll
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  
  // Toplam ürün sayısı
  const totalProducts = productsData?.total || 0;
  
  // Gösterilen ürün aralığı
  const startItem = (filters.page - 1) * filters.limit + 1;
  const endItem = Math.min(filters.page * filters.limit, totalProducts);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ürünler</h1>
          {!isLoading && !error && productsData && (
            <p className="text-gray-600 dark:text-gray-300">
              Toplam {totalProducts} ürün içinden {startItem}-{endItem} arası gösteriliyor
            </p>
          )}
        </div>
        
        {/* Mobil filtre butonu */}
        <div className="mt-4 md:hidden w-full">
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? (
              <>
                <FiX className="mr-2" /> Filtreleri Gizle
              </>
            ) : (
              <>
                <FiFilter className="mr-2" /> Filtreleri Göster
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row">
        {/* Filtreler - Mobil için açılır/kapanır */}
        <div className={`${
          showFilters ? 'block' : 'hidden'
        } md:block w-full md:w-64 md:mr-8 mb-6 md:mb-0`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Arama</h2>
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Ürün ara..."
                    className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
                  >
                    <FiSearch />
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Kategori</h2>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tüm Kategoriler</option>
                {!isCategoriesLoading && categories && categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Fiyat Aralığı</h2>
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  min="0"
                  className="block w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                  min="0"
                  className="block w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Sıralama</h2>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">En Yeniler</option>
                <option value="price,asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price,desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="name,asc">İsim: A-Z</option>
                <option value="name,desc">İsim: Z-A</option>
              </select>
            </div>
            
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleClearFilters}
            >
              Filtreleri Temizle
            </Button>
          </div>
        </div>
        
        {/* Ürün Listesi */}
        <div className="w-full">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 dark:text-red-200">
                Ürünler yüklenirken bir hata oluştu: {error.message}
              </p>
            </div>
          ) : (
            <>
              {productsData && productsData.products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productsData.products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Ürün bulunamadı
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Arama kriterlerinize uygun ürün bulunamadı.
                  </p>
                  <Button variant="primary" onClick={handleClearFilters}>
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
              
              {/* Sayfalama */}
              {productsData && productsData.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                      className={`px-3 py-1 rounded-l-md border ${
                        filters.page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-700'
                      }`}
                    >
                      Önceki
                    </button>
                    
                    {Array.from({ length: productsData.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Toplam sayfa sayısı 7'den fazla ise bazı sayfaları atlayarak göster
                        if (productsData.totalPages <= 7) return true;
                        
                        const current = filters.page;
                        return (
                          page === 1 ||
                          page === productsData.totalPages ||
                          (page >= current - 1 && page <= current + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Sayfa atlama göstergesi ekle
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-3 py-1 border-t border-b text-gray-500 dark:text-gray-400 dark:border-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 border-t border-b ${
                              filters.page === page
                                ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-700 dark:border-blue-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      type="button"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page === productsData.totalPages}
                      className={`px-3 py-1 rounded-r-md border ${
                        filters.page === productsData.totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:border-gray-700'
                      }`}
                    >
                      Sonraki
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}