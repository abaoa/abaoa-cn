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
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">我的作品</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {works.map(work => (
          <div 
            key={work.id}
            className={`rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 backdrop-blur-lg p-6 ${theme === 'light' ? 'bg-white/70 hover:bg-white/90' : 'bg-gray-900/70 hover:bg-gray-900/90'}`}
            style={{
              boxShadow: theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div className="aspect-square mb-4 rounded-lg overflow-hidden">
              <img src={work.image} alt={work.title} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{work.title}</h2>
            <p className="text-gray-600 dark:text-gray-300">{work.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Works