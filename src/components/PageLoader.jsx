import { useTheme } from '../contexts/ThemeContext'

function PageLoader() {
  const { theme } = useTheme()

  return (
    <div 
      className={`min-h-[60vh] flex items-center justify-center ${theme === 'light' ? 'glass-light' : 'glass-dark'} rounded-3xl`}
      role="status"
      aria-live="polite"
      aria-label="页面加载中"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative" aria-hidden="true">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}></div>
        </div>
        <p className="text-sm opacity-60 animate-pulse">加载中...</p>
      </div>
    </div>
  )
}

export default PageLoader
