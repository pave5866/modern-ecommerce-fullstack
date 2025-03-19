import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPackage, FiShoppingBag, FiLogOut, FiEdit3, FiSave } from 'react-icons/fi';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import { showToast } from '../utils';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import logger from '../utils/logger';

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  
  // Kullanıcı bilgilerini çek
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        logger.info('Kullanıcı profili getiriliyor');
        
        const response = await authAPI.getProfile();
        
        if (response.success && response.user) {
          const userData = response.user;
          
          // Form alanlarını doldur
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
          });
        }
      } catch (error) {
        logger.error('Profil getirme hatası', { error: error.message });
        showToast.error('Profil bilgileri alınamadı');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, navigate]);
  
  // Form değişikliklerini işle
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Hata varsa temizle
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };
  
  // Formu doğrula
  const validateForm = () => {
    const newErrors = {};
    
    if (!profileData.name) {
      newErrors.name = 'Ad Soyad gereklidir';
    }
    
    if (!profileData.email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }
    
    if (profileData.phone && !/^\d{10,11}$/.test(profileData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası giriniz';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Profil güncelleme
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // API'ye profil güncelleme isteği gönder
      // gerçek uygulamada burada API çağrısı yapılır
      
      // Kullanıcı bilgilerini güncelle
      updateUser({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
      });
      
      setIsEditing(false);
      showToast.success('Profil bilgileri güncellendi');
    } catch (error) {
      logger.error('Profil güncelleme hatası', { error: error.message });
      showToast.error('Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Kullanıcı çıkışı
  const handleLogout = () => {
    logout();
    navigate('/');
    showToast.info('Oturumunuz kapatıldı');
  };
  
  if (isLoading) {
    return <Loading />;
  }
  
  if (!user) {
    navigate('/login');
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Hesabım</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Yan Menü */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FiUser size={24} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            
            <nav className="py-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FiUser className="mr-3" />
                Profilim
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FiPackage className="mr-3" />
                Siparişlerim
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTab('wishlist')}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium ${
                  activeTab === 'wishlist'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FiShoppingBag className="mr-3" />
                Favorilerim
              </button>
              
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <FiLogOut className="mr-3" />
                Çıkış Yap
              </button>
            </nav>
          </div>
        </div>
        
        {/* İçerik */}
        <div className="lg:col-span-9">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fadeIn">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Profil Bilgileri
                </h2>
                
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <FiEdit3 className="mr-2" />
                    Düzenle
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    <FiSave className="mr-2" />
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${
                        errors.name 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } text-gray-900 dark:text-white dark:bg-gray-700 ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${
                        errors.email 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } text-gray-900 dark:text-white dark:bg-gray-700 ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${
                        errors.phone 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } text-gray-900 dark:text-white dark:bg-gray-700 ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Adres
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={profileData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 border ${
                        errors.address 
                          ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                      } text-gray-900 dark:text-white dark:bg-gray-700 ${
                        !isEditing ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Siparişlerim
                </h2>
              </div>
              
              <div className="p-6 text-center">
                <div className="flex flex-col items-center py-8">
                  <FiPackage size={64} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Henüz siparişiniz bulunmuyor
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Alışverişe başlayarak ilk siparişinizi oluşturabilirsiniz.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/products')}
                  >
                    Ürünlere Göz At
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'wishlist' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-fadeIn">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                  Favorilerim
                </h2>
              </div>
              
              <div className="p-6 text-center">
                <div className="flex flex-col items-center py-8">
                  <FiShoppingBag size={64} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Favori listeniz boş
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/products')}
                  >
                    Ürünlere Göz At
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}