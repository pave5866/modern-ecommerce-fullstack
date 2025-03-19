import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Görüntülenecek sayfa numaralarını hesapla
  const getPageNumbers = () => {
    // Ekranda gösterilecek maksimum sayfa sayısı
    const maxVisiblePages = 5;
    const pageNumbers = [];
    
    if (totalPages <= maxVisiblePages) {
      // Toplam sayfa sayısı az ise hepsini göster
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Mevcut sayfanın etrafındaki sayfaları göster
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Eğer son sayfa sınırı aşılırsa, başlangıç sayfasını ayarla
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // İlk sayfa her zaman erişilebilir olsun
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
          pageNumbers.push('...');
        }
      }
      
      // Orta sayfalar
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          pageNumbers.push(i);
        }
      }
      
      // Son sayfa her zaman erişilebilir olsun
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <nav className="flex justify-center" aria-label="Pagination">
      <ul className="inline-flex items-center -space-x-px">
        {/* Önceki Sayfa Butonu */}
        <li>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`block px-3 py-2 ml-0 leading-tight rounded-l-lg 
              ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
              } border border-gray-300 dark:border-gray-700`}
          >
            <span className="sr-only">Önceki</span>
            <FaChevronLeft className="w-4 h-4" />
          </button>
        </li>

        {/* Sayfa Numaraları */}
        {getPageNumbers().map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 leading-tight text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 dark:text-gray-300">
                ...
              </span>
            ) : (
              <button
                onClick={() => page !== currentPage && onPageChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={`px-3 py-2 leading-tight border border-gray-300 dark:border-gray-700
                  ${
                    page === currentPage
                      ? 'z-10 text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-white border-blue-300 dark:border-blue-800'
                      : 'text-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                  }`}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Sonraki Sayfa Butonu */}
        <li>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`block px-3 py-2 leading-tight rounded-r-lg 
              ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-500 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
              } border border-gray-300 dark:border-gray-700`}
          >
            <span className="sr-only">Sonraki</span>
            <FaChevronRight className="w-4 h-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default PaginationControls;