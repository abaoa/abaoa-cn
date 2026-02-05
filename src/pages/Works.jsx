import { useTheme } from '../contexts/ThemeContext'

function Works() {
  const { theme } = useTheme()
  const works = [
    {
      id: 1,
      title: '电商网站',
      description: '一个功能完善的电商平台，采用现代化的前端技术栈，提供流畅的用户体验。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20e-commerce%20website%20design%20with%20glassmorphism&image_size=square',
      tags: ['React', 'Node.js', 'MongoDB']
    },
    {
      id: 2,
      title: '任务管理系统',
      description: '高效的项目管理和团队协作工具，支持实时同步和多端访问。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=task%20management%20app%20dashboard%20glassmorphism%20design&image_size=square',
      tags: ['Vue.js', 'Firebase', 'Tailwind']
    },
    {
      id: 3,
      title: '社交应用',
      description: '创新的社交媒体平台，融合了即时通讯和内容分享功能。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=social%20media%20app%20interface%20with%20glassmorphism&image_size=square',
      tags: ['React Native', 'GraphQL', 'PostgreSQL']
    },
    {
      id: 4,
      title: '数据可视化',
      description: '交互式数据分析平台，帮助企业更好地理解和展示数据。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=data%20visualization%20dashboard%20analytics%20glassmorphism&image_size=square',
      tags: ['D3.js', 'Python', 'TensorFlow']
    },
    {
      id: 5,
      title: '创意设计平台',
      description: '为设计师打造的协作工具，支持实时设计和版本管理。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20design%20platform%20interface%20glassmorphism&image_size=square',
      tags: ['Next.js', 'WebGL', 'Redis']
    },
    {
      id: 6,
      title: '智能家居控制',
      description: '一体化的智能家居管理系统，通过手机远程控制家中设备。',
      image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20home%20control%20app%20interface%20glassmorphism&image_size=square',
      tags: ['IoT', 'React', 'MQTT']
    }
  ]

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="text-center mb-12">
        <div className={`inline-block px-6 py-2 rounded-full text-sm font-medium mb-4 ${
          theme === 'light' 
            ? 'bg-gradient-to-r from-primary-500/20 to-secondary/20 text-primary-600 border border-primary-500/30' 
            : 'bg-gradient-to-r from-primary-500/30 to-secondary/30 text-primary-300 border border-primary-500/40'
        }`}>
          💼 项目作品集
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          我的作品
        </h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto">
          这里展示了我近期完成的一些优秀项目，涵盖多个领域和技术栈
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {works.map((work, index) => (
          <div 
            key={work.id}
            className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-2xl overflow-hidden p-6`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="aspect-video mb-4 rounded-xl overflow-hidden shadow-lg">
              <img 
                src={work.image} 
                alt={work.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
              />
            </div>
            <h2 className="text-xl font-bold mb-2">{work.title}</h2>
            <p className={`mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>{work.description}</p>
            <div className="flex flex-wrap gap-2">
              {work.tags.map(tag => (
                <span 
                  key={tag}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    theme === 'light'
                      ? 'bg-primary-500/20 text-primary-600 border border-primary-500/30'
                      : 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Works