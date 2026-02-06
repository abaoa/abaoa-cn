import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AnimatedCounter from '../components/AnimatedCounter'
import { works } from '../data/works'

function TypeWriter({ text, speed = 100, onComplete }) {
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  // 光标闪烁效果
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <span>
      {displayText}
      {!isComplete && (
        <span className={`inline-block w-0.5 h-6 ml-1 bg-primary-500 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
      )}
    </span>
  )
}

function Home() {
  const { theme } = useTheme()
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    // 打字完成后显示副标题
    const timer = setTimeout(() => {
      setShowSubtitle(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className={`p-12 rounded-3xl text-center ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card max-w-4xl mx-4`}>
        <div className="mb-8">
          <div className={`inline-block px-6 py-2 rounded-full text-sm font-medium mb-6 ${
            theme === 'light' 
              ? 'bg-gradient-to-r from-primary-500/20 to-secondary/20 text-primary-600 border border-primary-500/30' 
              : 'bg-gradient-to-r from-primary-500/30 to-secondary/30 text-primary-300 border border-primary-500/40'
          }`}>
            ✨ 液态玻璃设计风格
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          欢迎来到 abaoa.cn
        </h1>
        
        <div className="text-xl md:text-2xl text-center max-w-3xl mb-12 leading-relaxed min-h-[4rem]">
          <TypeWriter text="我是一名 Qt/C++ 开发工程师，专注于跨平台桌面应用开发。" speed={80} />
        </div>
        
        {showSubtitle && (
          <p className="text-lg text-center max-w-2xl mb-8 opacity-70 animate-fade-in">
            热爱技术，追求极致，致力于创造优秀的软件产品。
          </p>
        )}
        
        <div className={`flex flex-col sm:flex-row gap-6 w-full max-w-lg mx-auto transition-all duration-500 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a 
            href="/works" 
            className="glass-button flex-1 text-center px-8 py-4 rounded-full text-lg font-semibold text-primary-500 hover:text-primary-600"
          >
            🎨 查看作品
          </a>
          <a 
            href="/about" 
            className="glass-button flex-1 text-center px-8 py-4 rounded-full text-lg font-semibold text-primary-500 hover:text-primary-600"
          >
            💡 了解更多
          </a>
        </div>
        
        {/* 统计数据 */}
        <div className={`mt-12 flex justify-center gap-8 sm:gap-12 transition-all duration-500 delay-200 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
              <AnimatedCounter end={10} suffix="+" />
            </div>
            <div className="text-sm mt-1 opacity-70">项目经验</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              <AnimatedCounter end={5} suffix="+" />
            </div>
            <div className="text-sm mt-1 opacity-70">年经验</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
              <AnimatedCounter end={100} suffix="%" />
            </div>
            <div className="text-sm mt-1 opacity-70">客户满意</div>
          </div>
        </div>
      </div>

      {/* 最近作品预览 */}
      <div className={`w-full max-w-6xl mx-auto mt-16 px-4 transition-all duration-500 delay-300 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">最新作品</h2>
          <p className="opacity-60 text-sm">使用 Qt 框架开发的跨平台应用</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {works.slice(0, 4).map((work, index) => (
            <Link
              key={work.id}
              to={`/works/${work.id}`}
              className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-2xl p-5 hover:scale-105 transition-all duration-300 group`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="iconify text-2xl text-primary-500 group-hover:scale-110 transition-transform" data-icon={work.icon}></span>
                <h3 className="font-bold text-sm truncate">{work.title}</h3>
              </div>
              <p className={`text-xs mb-3 line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                {work.description}
              </p>
              <div className="flex items-center justify-between text-xs opacity-60">
                <span>v{work.latestVersion}</span>
                <span className="flex items-center gap-1">
                  <span className="iconify" data-icon="simple-icons:windows" style={{ fontSize: '12px' }}></span>
                  {work.platforms.includes('Linux') && <span className="iconify" data-icon="simple-icons:linux" style={{ fontSize: '12px' }}></span>}
                  {work.platforms.includes('macOS') && <span className="iconify" data-icon="simple-icons:apple" style={{ fontSize: '12px' }}></span>}
                </span>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link 
            to="/works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-button text-primary-500 hover:text-primary-600 font-medium transition-all duration-300 hover:gap-3"
          >
            查看全部作品
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home