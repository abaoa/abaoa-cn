import { NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function MobileNav() {
  const { theme } = useTheme()
  const location = useLocation()
  
  // 在作品详情页和版本页面隐藏底部导航
  if (location.pathname.match(/^\/works\/[^/]+(\/version\/[^/]+)?$/)) {
    return null
  }

  const navItems = [
    { path: '/', label: '首页', icon: 'lucide:home' },
    { path: '/works', label: '作品', icon: 'lucide:code' },
    { path: '/about', label: '关于', icon: 'lucide:user' }
  ]

  return (
    <nav 
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl ${
        theme === 'light' 
          ? 'bg-white/80 border-gray-200/50' 
          : 'bg-gray-900/80 border-gray-700/50'
      }`}
      aria-label="移动端导航"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 px-6 py-3 rounded-2xl transition-all duration-200
              ${isActive 
                ? 'text-primary-500 bg-primary-500/15 backdrop-blur-md shadow-inner scale-105' 
                : theme === 'light' ? 'text-gray-500' : 'text-gray-400'
              }
            `}
          >
            <span 
              className="iconify" 
              data-icon={item.icon} 
              style={{ fontSize: '20px' }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
      {/* 安全区域适配 */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}

export default MobileNav
