import { useTheme } from '../contexts/ThemeContext'
import { useState, useEffect } from 'react'

function TypeWriter({ text, speed = 100 }) {
  const [displayText, setDisplayText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

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
      <span className={`inline-block w-0.5 h-6 ml-1 bg-primary-500 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}></span>
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
        
        <div className={`mt-12 flex justify-center gap-8 transition-all duration-500 delay-200 ${showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">10+</div>
            <div className="text-sm mt-1 opacity-70">项目经验</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">5+</div>
            <div className="text-sm mt-1 opacity-70">年经验</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">100%</div>
            <div className="text-sm mt-1 opacity-70">客户满意</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home