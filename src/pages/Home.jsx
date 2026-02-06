import { useTheme } from '../contexts/ThemeContext'

function Home() {
  const { theme } = useTheme()

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
        
        <p className="text-xl md:text-2xl text-center max-w-3xl mb-12 leading-relaxed">
          一个展示个人作品和技能的平台，采用现代苹果液态玻璃风格设计，为您带来极致的视觉体验。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg mx-auto">
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
        
        <div className="mt-12 flex justify-center gap-8">
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