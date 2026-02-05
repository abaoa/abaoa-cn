import { useTheme } from '../contexts/ThemeContext'

function About() {
  const { theme } = useTheme()

  const skills = [
    { name: 'React', level: 95, icon: '⚛️' },
    { name: 'Vue.js', level: 90, icon: '💚' },
    { name: 'TypeScript', level: 88, icon: '📘' },
    { name: 'Node.js', level: 85, icon: '🟢' },
    { name: 'Tailwind CSS', level: 92, icon: '🎨' },
    { name: 'Git', level: 90, icon: '📚' },
    { name: 'Docker', level: 80, icon: '🐳' },
    { name: 'GraphQL', level: 85, icon: '◈' }
  ]

  return (
    <div className="py-12 min-h-[80vh]">
      <div className="text-center mb-12">
        <div className={`inline-block px-6 py-2 rounded-full text-sm font-medium mb-4 ${
          theme === 'light' 
            ? 'bg-gradient-to-r from-primary-500/20 to-secondary/20 text-primary-600 border border-primary-500/30' 
            : 'bg-gradient-to-r from-primary-500/30 to-secondary/30 text-primary-300 border border-primary-500/40'
        }`}>
          👋 关于我
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          了解更多
        </h1>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className={`flex flex-col md:flex-row gap-12 items-center mb-16 p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`}>
          <div className="relative">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-gradient-to-r from-primary-500 to-purple-500 shadow-2xl">
              <img 
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20of%20a%20developer%20with%20modern%20style&image_size=square" 
                alt="个人头像" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-4 -right-4 px-4 py-2 rounded-full text-sm font-bold ${
              theme === 'light'
                ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
            }`}>
              5年+ 经验
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-4">你好，我是 abaoa</h2>
            <p className="text-lg mb-6 leading-relaxed">
              我是一名前端开发工程师，专注于创建美观、实用的网站和应用。
              我热爱学习新技术，不断提升自己的技能水平，追求极致的用户体验。
            </p>
            <p className="text-lg leading-relaxed opacity-80">
              我的技术栈涵盖现代前端开发的各个方面，从 React、Vue.js 到 Node.js、GraphQL。
              我擅长创建响应式设计，确保网站在各种设备上都能完美展示。
            </p>
          </div>
        </div>

        <div className={`p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`}>
          <h3 className="text-2xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              专业技能
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill, index) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="text-xl">{skill.icon}</span>
                    {skill.name}
                  </span>
                  <span className="text-sm opacity-70">{skill.level}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-primary-500/20 to-purple-500/20">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
                    style={{ width: `${skill.level}%`, animationDelay: `${index * 0.1}s` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-12 p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`}>
          <h3 className="text-2xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              工作经历
            </span>
          </h3>
          
          <div className="space-y-6">
            {[
              { company: '科技公司 A', role: '高级前端工程师', period: '2022 - 至今', desc: '负责核心产品的前端架构设计和开发，带领团队完成多个重要项目。' },
              { company: '互联网公司 B', role: '前端开发工程师', period: '2020 - 2022', desc: '参与公司主要产品的开发，优化用户界面和交互体验。' },
              { company: '初创公司 C', role: '全栈开发工程师', period: '2019 - 2020', desc: '负责公司产品从零到一的开发，搭建完整的技术栈。' }
            ].map((item, index) => (
              <div key={index} className={`p-6 rounded-2xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'} hover:bg-opacity-40 transition-all duration-300`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <h4 className="text-xl font-bold">{item.role}</h4>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    theme === 'light'
                      ? 'bg-primary-500/20 text-primary-600'
                      : 'bg-primary-500/30 text-primary-300'
                  }`}>
                    {item.period}
                  </span>
                </div>
                <div className="text-lg font-semibold mb-2 opacity-70">{item.company}</div>
                <p className="opacity-80">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default About