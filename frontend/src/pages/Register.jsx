import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, testAPI } from '../services/api';
import { showToast } from '../utils';
import Button from '../components/ui/Button';
import logger from '../utils/logger';

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  // Sayfa yüklendiğinde API durumunu kontrol et
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await testAPI();
        setApiStatus({
          working: response.success,
          message: response.message || response.error,
          status: response.status
        });
        
        if (!response.success) {
          logger.warn('API erişilemez durumda', { 
            status: response.status, 
            error: response.error 
          });
        }
      } catch (error) {
        setApiStatus({
          working: false,
          message: 'API bağlantısı kurulamadı',
          error: error.message
        });
        logger.error('API durumu kontrol edilirken hata', { error: error.message });
      }
    };
    
    checkApiStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Değer değiştiğinde hatayı temizle
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Ad Soyad gereklidir';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Ad Soyad en az 3 karakter olmalıdır';
    }

    if (!formData.email) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      logger.info('Kayıt yapılıyor', { email: formData.email });
      
      // Detaylı hata ayıklama için
      logger.info('Gönderilen kayıt verileri', {
        name: formData.name,
        email: formData.email,
        passwordLength: formData.password.length
      });
      
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Kayıt yapılamadı');
      }
      
      logger.info('Kayıt başarılı', { userId: response.user?._id });
      
      // Kayıt başarılı, kullanıcı bilgilerini ve token'ı sakla
      if (onLogin) {
        onLogin(response.user, response.token);
      }
      
      // Ana sayfaya yönlendir
      showToast.success('Kayıt başarılı. Hoş geldiniz!');
      navigate('/');
    } catch (error) {
      logger.error('Kayıt hatası', { error: error.message });
      
      // Hata mesajını göster
      if (error.message.includes('E-posta') || error.message.includes('email')) {
        setErrors((prev) => ({ ...prev, email: error.message }));
      } else if (error.message.includes('Şifre') || error.message.includes('password')) {
        setErrors((prev) => ({ ...prev, password: error.message }));
      } else if (error.message.includes('Ad') || error.message.includes('name')) {
        setErrors((prev) => ({ ...prev, name: error.message }));
      } else {
        setErrors((prev) => ({ ...prev, general: error.message }));
      }
      
      showToast.error('Kayıt yapılamadı: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fadeIn">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Yeni Hesap Oluşturun
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Zaten hesabınız var mı?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Giriş yapın
            </Link>
          </p>
        </div>
        
        {/* API Durum Bilgisi */}
        {apiStatus && !apiStatus.working && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  API bağlantısı kurulamadı. Kayıt işlemi geçici olarak kullanılamıyor olabilir.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Doğrulama Hatası */}
        {errors.general && (
          <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-sm text-red-700 dark:text-red-200">{errors.general}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Ad Soyad
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Ad Soyad"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                E-posta Adresi
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.email 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="E-posta adresi"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Şifre"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Şifre Tekrarı
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Şifre Tekrarı"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              variant="primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
            </Button>
          </div>
          
          <div className="text-sm text-center text-gray-600 dark:text-gray-300">
            Kayıt olarak, <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Gizlilik Politikası</a> ve <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">Kullanım Koşulları</a>'nı kabul etmiş olursunuz.
          </div>
        </form>
      </div>
    </div>
  );
}