import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className={`py-4 px-6 sticky top-0 z-50 ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          to="/" 
          className={`text-2xl font-bold bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
        >
          abaoa.cn
        </Link>
        
        <div className="flex items-center space-x-2 md:space-x-8">
          <div className="hidden md:flex space-x-2">
            {[
              { path: '/', label: '首页', icon: '🏠' },
              { path: '/works', label: '作品', icon: '🎨' },
              { path: '/about', label: '关于', icon: '👤' }
            ].map(item => (
              <Link 
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-primary-500/30 to-purple-500/30 text-primary-500 border border-primary-500/40'
                    : 'hover:bg-white/20 opacity-70 hover:opacity-100'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          
          <button 
            className={`p-2 rounded-full glass-button flex items-center justify-center ${
              theme === 'light' ? 'text-primary-500' : 'text-primary-300'
            }`}
            onClick={toggleTheme}
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        </div>
      </div>
    </nav>
  )
}

export default Navbar