import { useTheme } from '../contexts/ThemeContext'

function Home() {
  const { theme } = useTheme()

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[80vh]"
      style={{
        background: theme === 'light' ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}
    >
      <div 
        className={`p-8 rounded-2xl text-center ${theme === 'light' ? 'bg-white/70' : 'bg-gray-900/70'}`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: theme === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h1 className="text-4xl font-bold mb-4">欢迎来到 abaoa.cn</h1>
        <p className="text-xl text-center max-w-2xl mb-8">
          一个展示个人作品和技能的平台，采用现代苹果液态玻璃风格设计。
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md mx-auto">
          <a 
            href="/works" 
            className={`flex-1 text-center px-6 py-3 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'light' ? '0 4px 15px rgba(0, 0, 0, 0.1)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
              border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: theme === 'light' ? '#646cff' : '#9499ff'
            }}
          >
            查看作品
          </a>
          <a 
            href="/about" 
            className={`flex-1 text-center px-6 py-3 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'light' ? '0 4px 15px rgba(0, 0, 0, 0.1)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
              border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: theme === 'light' ? '#646cff' : '#9499ff'
            }}
          >
            了解更多
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home