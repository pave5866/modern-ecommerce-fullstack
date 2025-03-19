import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mt-4 mb-6">
          Sayfa Bulunamadı
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <FiHome className="mr-2" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
};

export default NotFound;