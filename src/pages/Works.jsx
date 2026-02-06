import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { works } from '../data/works'

function Works() {
  const { theme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="text-center mb-12">
        <div className={`inline-block px-6 py-2 rounded-full text-sm font-medium mb-4 ${
          theme === 'light' 
            ? 'bg-gradient-to-r from-primary-500/20 to-secondary/20 text-primary-600 border border-primary-500/30' 
            : 'bg-gradient-to-r from-primary-500/30 to-secondary/30 text-primary-300 border border-primary-500/40'
        }`}>
          💼 Qt 应用程序作品集
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          我的作品
        </h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto">
          使用 Qt 框架开发的跨平台桌面应用程序
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {works.map((work, index) => (
          <div 
            key={work.id}
            onClick={() => navigate(`/works/${work.id}`)}
            className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 group`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* 封面图 */}
            <div className="relative h-40 overflow-hidden">
              <img 
                src={work.coverImage} 
                alt={work.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center gap-2">
                  <span className="iconify text-2xl text-white drop-shadow-lg" data-icon={work.icon}></span>
                  <div>
                    <h2 className="text-lg font-bold text-white drop-shadow-lg">{work.title}</h2>
                    <p className="text-xs text-white/80">v{work.latestVersion}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <p className={`mb-4 text-sm line-clamp-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                {work.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {work.tags.map(tag => (
                  <span 
                    key={tag}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      theme === 'light'
                        ? 'bg-primary-500/20 text-primary-600 border border-primary-500/30'
                        : 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm opacity-70">
                <div className="flex items-center gap-2">
                  <span className="iconify" data-icon="simple-icons:windows" style={{ fontSize: '16px' }}></span>
                  {work.platforms.includes('Linux') && <span className="iconify" data-icon="simple-icons:linux" style={{ fontSize: '16px' }}></span>}
                  {work.platforms.includes('macOS') && <span className="iconify" data-icon="simple-icons:apple" style={{ fontSize: '16px' }}></span>}
                </div>
                <span className="text-xs">{work.fileSize}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Works
