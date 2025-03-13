import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DevicePhoneMobileIcon, 
  ComputerDesktopIcon,
  SparklesIcon,
  HeartIcon,
  ShoppingBagIcon,
  CakeIcon,
  HomeIcon,
  BeakerIcon,
  DeviceTabletIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  SunIcon,
  UserIcon,
  ClockIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

const categoryIcons = {
  'beauty': BeakerIcon,
  'fragrances': SparklesIcon,
  'furniture': HomeIcon,
  'groceries': CakeIcon,
  'home-decoration': HomeIcon,
  'kitchen-accessories': WrenchScrewdriverIcon,
  'laptops': ComputerDesktopIcon,
  'mens-shirts': ShoppingBagIcon,
  'mens-shoes': ShoppingBagIcon,
  'mens-watches': ClockIcon,
  'mobile-accessories': PhoneIcon,
  'motorcycle': TruckIcon,
  'skin-care': HeartIcon,
  'smartphones': DevicePhoneMobileIcon,
  'sports-accessories': ShoppingBagIcon,
  'sunglasses': SunIcon,
  'tablets': DeviceTabletIcon,
  'tops': ShoppingBagIcon,
  'vehicle': TruckIcon,
  'womens-bags': ShoppingBagIcon,
  'womens-dresses': ShoppingBagIcon,
  'womens-jewellery': SparklesIcon,
  'womens-shoes': ShoppingBagIcon,
  'womens-watches': ClockIcon
}

const gradients = {
  'beauty': 'from-pink-500 to-rose-500',
  'fragrances': 'from-purple-500 to-indigo-500',
  'furniture': 'from-amber-500 to-orange-500',
  'groceries': 'from-green-500 to-emerald-500',
  'home-decoration': 'from-blue-500 to-cyan-500',
  'kitchen-accessories': 'from-red-500 to-pink-500',
  'laptops': 'from-blue-500 to-indigo-500',
  'mens-shirts': 'from-gray-500 to-slate-500',
  'mens-shoes': 'from-orange-500 to-amber-500',
  'mens-watches': 'from-slate-500 to-gray-500',
  'mobile-accessories': 'from-purple-500 to-pink-500',
  'motorcycle': 'from-red-500 to-orange-500',
  'skin-care': 'from-pink-500 to-rose-500',
  'smartphones': 'from-blue-500 to-purple-500',
  'sports-accessories': 'from-green-500 to-emerald-500',
  'sunglasses': 'from-amber-500 to-yellow-500',
  'tablets': 'from-indigo-500 to-purple-500',
  'tops': 'from-pink-500 to-rose-500',
  'vehicle': 'from-gray-500 to-slate-500',
  'womens-bags': 'from-purple-500 to-pink-500',
  'womens-dresses': 'from-rose-500 to-pink-500',
  'womens-jewellery': 'from-amber-500 to-yellow-500',
  'womens-shoes': 'from-pink-500 to-rose-500',
  'womens-watches': 'from-indigo-500 to-blue-500'
}

export function CategoryCard({ category }) {
  const Icon = categoryIcons[category.slug] || SparklesIcon
  const gradient = gradients[category.slug] || 'from-gray-500 to-gray-700'

  return (
    <Link
      to={category.href}
      className="group h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
        <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors duration-300">
          <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2">
          {category.name}
        </h3>
      </div>
    </Link>
  )
} 