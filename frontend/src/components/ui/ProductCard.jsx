import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useCartStore } from '../../store';
import { formatPrice } from '../../utils';
import { showToast } from '../../utils';

const ProductCard = ({ product }) => {
  const addItem = useCartStore((state) => state.addItem);

  // Ürün kontrolü
  if (!product) {
    return null;
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product._id, // Backend'den gelen _id alanını kullan
      name: product.name,
      price: product.price,
      images: product.images,
      category: product.category
    });
    
    showToast.success('Ürün sepete eklendi');
  };

  return (
    <div className="product-card group bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
      <Link to={`/products/${product._id}`} className="block relative">
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="object-cover object-center w-full h-full transform group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <span className="text-gray-400">Resim yok</span>
            </div>
          )}
          
          <div className="absolute top-0 right-0 m-2">
            <button
              onClick={handleAddToCart}
              className="p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors duration-200 transform hover:scale-110"
              aria-label="Add to cart"
            >
              <FiShoppingCart />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
            {product.name}
          </h3>
          
          {product.category && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {product.category}
            </p>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatPrice(product.price)}
            </p>
            
            {product.oldPrice && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(product.oldPrice)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;