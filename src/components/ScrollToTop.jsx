import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function ScrollToTop() {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // 计算滚动进度
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(progress)
      
      // 显示/隐藏按钮
      setIsVisible(scrollTop > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {/* 滚动进度条 */}
      <div 
        className="fixed top-0 left-0 h-1 z-[60] transition-all duration-150"
        style={{ 
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)'
        }}
        aria-hidden="true"
      />
      
      {/* 返回顶部按钮 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          theme === 'light'
            ? 'glass-light shadow-lg hover:shadow-xl'
            : 'glass-dark shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30'
        }`}
        aria-label="返回顶部"
        title="返回顶部"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-primary-500"
        >
          <path d="M12 19V5"/>
          <path d="m5 12 7-7 7 7"/>
        </svg>
      </button>
    </>
  )
}

export default ScrollToTop
