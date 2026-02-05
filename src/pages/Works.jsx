import { useTheme } from '../contexts/ThemeContext'

function Works() {
  const { theme } = useTheme()
  const works = [
    {
      id: 1,
      title: '项目一',
      description: '这是一个示例项目描述，展示了我在前端开发方面的技能。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20web%20development%20project%20interface&image_size=square'
    },
    {
      id: 2,
      title: '项目二',
      description: '这是另一个示例项目描述，展示了我在UI设计方面的能力。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20UI%20design%20project&image_size=square'
    },
    {
      id: 3,
      title: '项目三',
      description: '这是第三个示例项目描述，展示了我在响应式设计方面的专长。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=responsive%20website%20design&image_size=square'
    }
  ]

  return (
    <div 
      className="py-8 min-h-[80vh]"
      style={{
        background: theme === 'light' ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}
    >
      <h1 className="text-3xl font-bold mb-8 text-center">我的作品</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {works.map(work => (
          <div 
            key={work.id}
            className={`rounded-xl overflow-hidden transition-all duration-300 p-6 ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: theme === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              border: theme === 'light' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
              transform: 'translateY(0)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = theme === 'light' ? '0 12px 40px 0 rgba(31, 38, 135, 0.25)' : '0 12px 40px 0 rgba(0, 0, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = theme === 'light' ? '0 8px 32px 0 rgba(31, 38, 135, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="aspect-square mb-4 rounded-lg overflow-hidden shadow-lg">
              <img src={work.image} alt={work.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{work.title}</h2>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>{work.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Works