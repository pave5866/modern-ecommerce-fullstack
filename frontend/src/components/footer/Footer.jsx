import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaHeart } from 'react-icons/fa'
import { motion } from 'framer-motion'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  // Animasyon varyantları
  const footerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  // Footer bölümleri
  const sections = [
    {
      title: t('footer.quickLinks'),
      links: [
        { name: t('nav.home'), path: '/' },
        { name: t('nav.products'), path: '/products' },
        { name: t('nav.categories'), path: '/categories' },
        { name: t('footer.aboutUs'), path: '/about' },
        { name: t('footer.contact'), path: '/contact' },
      ]
    },
    {
      title: t('footer.customerService'),
      links: [
        { name: t('footer.faq'), path: '/faq' },
        { name: t('footer.shipping'), path: '/shipping' },
        { name: t('footer.returns'), path: '/returns' },
        { name: t('footer.orderTracking'), path: '/track-order' },
        { name: t('footer.termsConditions'), path: '/terms' },
      ]
    },
    {
      title: t('footer.myAccount'),
      links: [
        { name: t('footer.login'), path: '/login' },
        { name: t('footer.register'), path: '/register' },
        { name: t('footer.cart'), path: '/cart' },
        { name: t('footer.wishlist'), path: '/wishlist' },
        { name: t('footer.orderHistory'), path: '/profile/orders' },
      ]
    }
  ]

  // Sosyal medya bağlantıları
  const socialLinks = [
    { icon: <FaFacebook />, url: 'https://facebook.com' },
    { icon: <FaTwitter />, url: 'https://twitter.com' },
    { icon: <FaInstagram />, url: 'https://instagram.com' },
    { icon: <FaLinkedin />, url: 'https://linkedin.com' },
  ]

  return (
    <motion.footer 
      className="bg-gray-100 dark:bg-gray-800 pt-12 pb-6 transition-colors duration-300"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={footerVariants}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Hakkımızda */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Modern Shop</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('footer.aboutText')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Linkler */}
          {sections.map((section, index) => (
            <motion.div key={index} variants={itemVariants}>
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, idx) => (
                  <li key={idx}>
                    <Link 
                      to={link.path} 
                      className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Alt kısım - Telif hakkı */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {currentYear} Modern E-Commerce. {t('footer.allRightsReserved')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center">
              {t('footer.madeWith')} <FaHeart className="mx-1 text-red-500" /> {t('footer.by')} Modern Shop
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

export { Footer }
export default Footer