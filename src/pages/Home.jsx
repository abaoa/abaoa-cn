import { useTheme } from '../contexts/ThemeContext'

function Home() {
  const { theme } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-4">欢迎来到 abaoa.cn</h1>
      <p className="text-xl text-center max-w-2xl mb-8">
        一个展示个人作品和技能的平台，采用现代苹果液态玻璃风格设计。
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-md">
        <a 
          href="/works" 
          className={`flex-1 text-center px-6 py-3 rounded-full border border-primary hover:border-secondary transition-all duration-300 backdrop-blur-lg ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
        >
          查看作品
        </a>
        <a 
          href="/about" 
          className={`flex-1 text-center px-6 py-3 rounded-full border border-primary hover:border-secondary transition-all duration-300 backdrop-blur-lg ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
        >
          了解更多
        </a>
      </div>
    </div>
  )
}

export default Home