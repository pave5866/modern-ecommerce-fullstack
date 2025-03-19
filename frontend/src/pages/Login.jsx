import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { showToast } from '../utils';
import Button from '../components/ui/Button';
import logger from '../utils/logger';

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
      logger.info('Giriş yapılıyor', { email: formData.email });
      
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Giriş yapılamadı');
      }
      
      logger.info('Giriş başarılı', { userId: response.user._id });
      
      // Giriş başarılı, kullanıcı bilgilerini ve token'ı sakla
      if (onLogin) {
        onLogin(response.user, response.token);
      }
      
      // Ana sayfaya yönlendir
      showToast.success('Giriş başarılı. Hoş geldiniz!');
      navigate('/');
    } catch (error) {
      logger.error('Giriş hatası', { error: error.message });
      
      // Hata mesajını göster
      if (error.message.includes('E-posta') || error.message.includes('email')) {
        setErrors((prev) => ({ ...prev, email: error.message }));
      } else if (error.message.includes('Şifre') || error.message.includes('password')) {
        setErrors((prev) => ({ ...prev, password: error.message }));
      } else {
        setErrors((prev) => ({ ...prev, general: error.message }));
      }
      
      showToast.error('Giriş yapılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fadeIn">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Hesabınıza Giriş Yapın
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            Veya{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              yeni hesap oluşturun
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 mb-4 rounded">
              <p className="text-sm text-red-700 dark:text-red-200">{errors.general}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
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
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:z-10 sm:text-sm`}
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errors.password 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:z-10 sm:text-sm`}
                placeholder="Şifre"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Beni hatırla
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Şifrenizi mi unuttunuz?
              </a>
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
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}