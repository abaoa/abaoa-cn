import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav 
      className={`py-4 px-6 sticky top-0 z-50 backdrop-blur-lg transition-all duration-300 ${theme === 'light' ? 'bg-white/70' : 'bg-gray-900/70'}`}
      style={{
        boxShadow: theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">abaoa.cn</Link>
        <div className="flex space-x-8">
          <Link to="/" className="hover:text-primary transition-colors">首页</Link>
          <Link to="/works" className="hover:text-primary transition-colors">作品</Link>
          <Link to="/about" className="hover:text-primary transition-colors">关于</Link>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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