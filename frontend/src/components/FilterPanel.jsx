import React, { useState } from 'react';
import { FaFilter, FaSort, FaTag, FaMoneyBillWave } from 'react-icons/fa';

export const FilterPanel = ({
  categories = [],
  selectedCategories = [],
  priceRange = { min: 0, max: 1000 },
  sortBy = '',
  onCategoryChange,
  onPriceRangeChange,
  onSortChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);

  // Mobil görünümde filtre panelini aç/kapat
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Fiyat aralığını değiştir
  const handlePriceChange = (e, type) => {
    const value = parseInt(e.target.value, 10);
    const newPriceRange = { ...localPriceRange, [type]: value };
    setLocalPriceRange(newPriceRange);
  };

  // Fiyat değişiklikleri onaylandığında ana bileşene bildir
  const applyPriceFilter = () => {
    onPriceRangeChange(localPriceRange.min, localPriceRange.max);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      {/* Mobil Filtre Başlığı */}
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <FaFilter className="mr-2" /> Filtreler
        </h3>
        <button
          onClick={toggleExpand}
          className="text-blue-500 text-sm font-medium"
        >
          {isExpanded ? 'Gizle' : 'Göster'}
        </button>
      </div>

      {/* Filtre İçeriği - Mobilde toggle edilebilir */}
      <div className={`${isExpanded ? 'block' : 'hidden'} lg:block`}>
        {/* Kategori Filtresi */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 flex items-center">
            <FaTag className="mr-2" /> Kategoriler
          </h4>
          <div className="space-y-2">
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((category) => (
                <div key={category._id || category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category._id || category.id}`}
                    checked={selectedCategories.includes(category._id || category.id)}
                    onChange={() => onCategoryChange(category._id || category.id)}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`category-${category._id || category.id}`}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    {category.name}
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Kategoriler yüklenemedi</p>
            )}
          </div>
        </div>

        {/* Fiyat Aralığı Filtresi */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3 flex items-center">
            <FaMoneyBillWave className="mr-2" /> Fiyat Aralığı
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min: {localPriceRange.min} ₺
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={localPriceRange.min}
                onChange={(e) => handlePriceChange(e, 'min')}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max: {localPriceRange.max} ₺
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={localPriceRange.max}
                onChange={(e) => handlePriceChange(e, 'max')}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={applyPriceFilter}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>

        {/* Sıralama Filtresi */}
        <div>
          <h4 className="text-md font-semibold mb-3 flex items-center">
            <FaSort className="mr-2" /> Sıralama
          </h4>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">Varsayılan</option>
            <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
            <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
            <option value="name_asc">İsim: A-Z</option>
            <option value="name_desc">İsim: Z-A</option>
            <option value="newest">En Yeniler</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;