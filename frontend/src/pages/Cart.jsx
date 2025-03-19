import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { useCartStore, useAuthStore } from '../store';
import { formatPrice } from '../utils';
import Button from '../components/ui/Button';

export default function Cart() {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const { user } = useAuthStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Sepet boş mu kontrol et
  const isCartEmpty = cartItems.length === 0;
  
  // Sepet toplamı
  const cartTotal = getTotalPrice();
  
  // Kargo ücreti (200 TL üzeri ücretsiz)
  const shippingCost = cartTotal > 200 ? 0 : 19.99;
  
  // Genel toplam
  const orderTotal = cartTotal + shippingCost;
  
  // Ürün miktarını güncelle
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity > 10) return;
    
    updateQuantity(productId, newQuantity);
  };
  
  // Ürünü sepetten çıkar
  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };
  
  // Sepeti temizle
  const handleClearCart = () => {
    clearCart();
  };
  
  // Satın alma işlemi
  const handleCheckout = () => {
    if (!user) {
      // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
      navigate('/login');
      return;
    }
    
    setIsProcessing(true);
    
    // Burada gerçek bir ödeme işlemi yapılabilir
    // API entegrasyonu vb.
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      navigate('/profile');
    }, 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Alışveriş Sepeti</h1>
      
      {isCartEmpty ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center animate-fadeIn">
          <div className="text-gray-400 mb-4">
            <FiShoppingBag size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Sepetiniz Boş
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Sepetinizde ürün bulunmuyor. Alışverişe başlamak için ürünlerimize göz atabilirsiniz.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <FiShoppingBag className="mr-2" />
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sepet Ürünleri */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {cartItems.map((item) => (
                  <li key={item.id} className="p-4 sm:p-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row">
                      {/* Ürün Görseli */}
                      <div className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden mb-4 sm:mb-0">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                            <span className="text-gray-400">Resim yok</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Ürün Bilgileri */}
                      <div className="flex-1 sm:ml-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              <Link to={`/products/${item.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                                {item.name}
                              </Link>
                            </h3>
                            
                            {item.category && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Kategori: {item.category}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-2 sm:mt-0 flex flex-col items-start sm:items-end">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">
                              {formatPrice(item.price)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Birim Fiyatı: {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Alt Kısım - Miktar ve Silme */}
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                            <button
                              type="button"
                              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <FiMinus size={16} />
                            </button>
                            <span className="w-10 text-center text-gray-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <FiTrash2 size={16} className="mr-1" />
                            <span>Sil</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <Link
                  to="/products"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <FiArrowLeft className="mr-1" />
                  Alışverişe Devam Et
                </Link>
                
                <button
                  type="button"
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                  onClick={handleClearCart}
                >
                  <FiTrash2 size={16} className="mr-1" />
                  <span>Sepeti Temizle</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Sipariş Özeti */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fadeIn">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Sipariş Özeti
              </h2>
              
              <div className="flow-root">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <div className="py-3 flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-300">Ara Toplam</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(cartTotal)}
                    </dd>
                  </div>
                  
                  <div className="py-3 flex items-center justify-between">
                    <dt className="text-sm text-gray-600 dark:text-gray-300">Kargo</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {shippingCost === 0 
                        ? <span className="text-green-600 dark:text-green-400">Ücretsiz</span>
                        : formatPrice(shippingCost)}
                    </dd>
                  </div>
                  
                  {/* Kupon Kodu (opsiyonel) */}
                  <div className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <dt className="text-sm text-gray-600 dark:text-gray-300">İndirim Kuponu</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        -
                      </dd>
                    </div>
                    
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Kupon kodu"
                        className="flex-grow min-w-0 block rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Uygula
                      </button>
                    </div>
                  </div>
                  
                  <div className="py-3 flex items-center justify-between">
                    <dt className="text-base font-medium text-gray-900 dark:text-white">Toplam</dt>
                    <dd className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {formatPrice(orderTotal)}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'İşleniyor...' : 'Ödemeye Geç'}
                </Button>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>Güvenli ödeme yöntemleri ile işlem yapabilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}