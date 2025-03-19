import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { PaginationControls } from '../components/PaginationControls';
import { FilterPanel } from '../components/FilterPanel';
import logger from '../utils/logger';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    totalPages: 1,
    totalProducts: 0,
  });

  // URL'den parametreleri al
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    setPagination((prev) => ({ ...prev, page }));
    
    if (category) {
      setSelectedCategories(category.split(','));
    }
    
    if (sort) {
      setSortBy(sort);
    }
    
    if (minPrice || maxPrice) {
      setPriceRange({
        min: minPrice ? parseInt(minPrice, 10) : 0,
        max: maxPrice ? parseInt(maxPrice, 10) : 1000,
      });
    }
  }, [searchParams]);

  // Filtrelemeleri URL'ye yansıt
  const updateSearchParams = useCallback((newParams) => {
    const params = { ...Object.fromEntries(searchParams) };
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        delete params[key];
      } else {
        params[key] = value;
      }
    });
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  // Kategori filtresini değiştir
  const handleCategoryChange = (categoryId) => {
    let newSelectedCategories;
    
    if (selectedCategories.includes(categoryId)) {
      newSelectedCategories = selectedCategories.filter((id) => id !== categoryId);
    } else {
      newSelectedCategories = [...selectedCategories, categoryId];
    }
    
    setSelectedCategories(newSelectedCategories);
    
    // Sayfa 1'e dön ve URL'i güncelle
    updateSearchParams({
      page: 1,
      category: newSelectedCategories.length > 0 ? newSelectedCategories.join(',') : null,
    });
  };

  // Fiyat aralığını değiştir
  const handlePriceRangeChange = (min, max) => {
    setPriceRange({ min, max });
    
    updateSearchParams({
      page: 1,
      minPrice: min > 0 ? min : null,
      maxPrice: max < 1000 ? max : null,
    });
  };

  // Sıralama değiştir
  const handleSortChange = (sort) => {
    setSortBy(sort);
    updateSearchParams({ sort: sort || null });
  };

  // Sayfa değiştir
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    updateSearchParams({ page: newPage });
  };

  // Ürünleri getir
  const fetchProducts = useCallback(async () => {
    const page = pagination.page;
    const limit = pagination.pageSize;
    const categories = selectedCategories.length > 0 ? selectedCategories.join(',') : '';
    const minPrice = priceRange.min;
    const maxPrice = priceRange.max;
    
    try {
      setLoading(true);
      
      const response = await productAPI.getProducts({
        page,
        limit,
        categories,
        minPrice,
        maxPrice,
        sort: sortBy,
      });
      
      // Veri yapısı kontrolü
      if (!response || !response.data) {
        logger.error('API yanıtı beklenen formatta değil', { response });
        setError('Ürün verilerini alırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setProducts([]);
        return;
      }
      
      // Array kontrolü
      const productData = Array.isArray(response.data.products) 
        ? response.data.products 
        : [];
      
      setProducts(productData);
      
      // Pagination bilgilerini güncelle
      setPagination({
        page: response.data.page || 1,
        pageSize: response.data.limit || 9,
        totalPages: response.data.totalPages || 1,
        totalProducts: response.data.totalProducts || 0,
      });
      
      logger.info('Ürünler başarıyla alındı', { 
        count: productData.length, 
        page, 
        totalPages: response.data.totalPages 
      });
      
      setError(null);
    } catch (err) {
      logger.error('Ürünleri getirirken hata oluştu', { error: err.message });
      setError('Ürünleri getirirken bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, selectedCategories, priceRange, sortBy]);

  // Kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productAPI.getCategories();
        
        if (response && Array.isArray(response.data)) {
          setCategories(response.data);
          logger.info('Kategoriler başarıyla alındı', { count: response.data.length });
        } else {
          logger.warn('Kategori verisi beklenen formatta değil', { response });
          setCategories([]);
        }
      } catch (err) {
        logger.error('Kategorileri getirirken hata oluştu', { error: err.message });
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Filtre veya sayfa değişikliklerinde ürünleri getir
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Ürünlerimiz</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filtre Bölümü */}
        <div className="lg:w-1/4">
          <FilterPanel
            categories={categories || []}
            selectedCategories={selectedCategories}
            priceRange={priceRange}
            sortBy={sortBy}
            onCategoryChange={handleCategoryChange}
            onPriceRangeChange={handlePriceRangeChange}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Ürün Listesi */}
        <div className="lg:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Tekrar Dene
              </button>
            </div>
          ) : (
            <>
              {/* Sonuç sayısı */}
              <div className="mb-4 text-gray-600 dark:text-gray-300">
                Toplam {pagination.totalProducts} ürün bulundu
                {selectedCategories.length > 0 && ` (${selectedCategories.length} kategori filtrelendi)`}
              </div>

              {/* Ürün grid */}
              {Array.isArray(products) && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500 dark:text-gray-400">Bu kriterlere uygun ürün bulunamadı.</p>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Lütfen filtrelerinizi değiştirip tekrar deneyin.</p>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8">
                  <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;