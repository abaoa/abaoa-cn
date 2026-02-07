import { useTheme } from '../contexts/ThemeContext'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

function NotFound() {
  const { theme } = useTheme()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div 
        className={`relative p-12 md:p-16 rounded-3xl text-center max-w-2xl mx-4 overflow-hidden ${
          theme === 'light' ? 'glass-light' : 'glass-dark'
        } glass-card`}
      >
        {/* 背景装饰 */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)',
            transform: `translate(${mousePos.x}px, ${mousePos.y}px)`
          }}
        />
        
        {/* 404 数字 */}
        <div className="relative mb-8">
          <h1 
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            style={{
              transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`
            }}
          >
            404
          </h1>
          <div 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full opacity-50"
            style={{
              transform: `translate(-50%, ${mousePos.y * 0.3}px)`
            }}
          />
        </div>
        
        {/* 错误信息 */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          页面走失了
        </h2>
        <p className="text-lg opacity-70 mb-2">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <p className="text-sm opacity-50 mb-8">
          错误代码: PAGE_NOT_FOUND
        </p>
        
        {/* 返回按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className={`inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 ${
              theme === 'light'
                ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            返回首页
          </Link>
          <Link 
            to="/works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold glass-button text-primary-500 hover:text-primary-600 transition-all duration-300 hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            浏览作品
          </Link>
        </div>
        
        {/* 趣味提示 */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-sm opacity-40 flex items-center gap-1.5 justify-center">
            <span className="iconify flex-shrink-0" data-icon="lucide:lightbulb" style={{ fontSize: '14px' }} aria-hidden="true"></span>
            <span>提示: 试试点击导航栏或返回首页重新开始探索</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
