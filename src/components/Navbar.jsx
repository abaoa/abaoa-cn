import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/', label: '首页', icon: 'lucide:home' },
    { path: '/works', label: '作品', icon: 'lucide:code' },
    { path: '/about', label: '关于', icon: 'lucide:user' }
  ]

  return (
    <nav 
      className={`py-4 px-4 sm:px-6 sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? theme === 'light' 
            ? 'glass-light shadow-lg backdrop-blur-xl' 
            : 'glass-dark shadow-lg shadow-black/20 backdrop-blur-xl'
          : theme === 'light' 
            ? 'glass-light' 
            : 'glass-dark'
      }`}
      role="navigation"
      aria-label="主导航"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          to="/" 
          className={`text-2xl font-bold bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
          aria-label="返回首页"
        >
          abaoa.cn
        </Link>
        
        <div className="flex items-center space-x-2 md:space-x-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2" role="menubar">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                role="menuitem"
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'glass-button-active bg-gradient-to-r from-primary-500/30 to-purple-500/30 text-primary-500 border border-primary-500/40'
                    : 'glass-button opacity-70 hover:opacity-100'
                }`}
              >
                <span className="iconify" data-icon={item.icon} style={{ fontSize: '16px' }} aria-hidden="true"></span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Theme Toggle Button */}
          <button 
            className={`p-2 rounded-full glass-button flex items-center justify-center ${
              theme === 'light' ? 'text-primary-500' : 'text-primary-300'
            }`}
            onClick={toggleTheme}
            aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
            title={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full glass-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className={`md:hidden mt-4 p-4 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}
          role="menu"
        >
          <div className="flex flex-col space-y-2">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                role="menuitem"
                aria-current={isActive(item.path) ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-3 ${
                  isActive(item.path)
                    ? 'glass-button-active bg-gradient-to-r from-primary-500/30 to-purple-500/30 text-primary-500 border border-primary-500/40'
                    : 'glass-button opacity-70 hover:opacity-100'
                }`}
              >
                <span className="iconify" data-icon={item.icon} style={{ fontSize: '18px' }} aria-hidden="true"></span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar