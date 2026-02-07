import { useTheme } from '../contexts/ThemeContext'
import ScrollReveal from '../components/ScrollReveal'

function About() {
  const { theme } = useTheme()

  const skills = [
    { name: 'Qt', level: 92, icon: 'simple-icons:qt' },
    { name: 'C++', level: 80, icon: 'simple-icons:cplusplus' },
    { name: 'CMake', level: 60, icon: 'simple-icons:cmake' },
    { name: 'Git', level: 70, icon: 'simple-icons:git' },
    { name: 'Python', level: 40, icon: 'simple-icons:python' },
    { name: 'Linux', level: 75, icon: 'simple-icons:linux' }
  ]

  return (
    <section className="py-12 min-h-[80vh]" aria-labelledby="about-title">
      <header className="text-center mb-12">
        <div className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-sm font-medium mb-4 ${
          theme === 'light' 
            ? 'bg-gradient-to-r from-primary-500/20 to-secondary/20 text-primary-600 border border-primary-500/30' 
            : 'bg-gradient-to-r from-primary-500/30 to-secondary/30 text-primary-300 border border-primary-500/40'
        }`}>
          <span className="iconify flex-shrink-0" data-icon="lucide:hand" style={{ fontSize: '16px' }} aria-hidden="true"></span>
          <span>关于我</span>
        </div>
        <h1 id="about-title" className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          了解更多
        </h1>
      </header>

      <div className="max-w-6xl mx-auto">
        <ScrollReveal variant="fadeInUp">
        <section className={`flex flex-col md:flex-row gap-12 items-center mb-16 p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`} aria-labelledby="intro-heading">
          <div className="relative">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-gradient-to-r from-primary-500 to-purple-500 shadow-2xl">
              <img 
                src="https://github.com/abaoa.png" 
                alt="abaoa 的个人头像"
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`absolute -bottom-4 -right-4 px-4 py-2 rounded-full text-sm font-bold ${
              theme === 'light'
                ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white'
                : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white'
            }`} aria-label="10年以上开发经验">
              10年+ 经验
            </div>
          </div>
          
          <div className="flex-1 text-left">
            <h2 id="intro-heading" className="text-3xl font-bold mb-4">你好，我是 abaoa</h2>
            <p className="text-lg mb-6 leading-relaxed">
              我是一名 Qt/C++ 开发工程师，专注于创建高性能、跨平台的桌面应用程序。
              我热爱学习新技术，不断提升自己的技能水平，追求极致的用户体验。
            </p>
            <p className="text-lg leading-relaxed opacity-80">
              我的技术栈以 C++ 和 Qt 框架为核心，擅长开发 Windows、Linux、macOS 跨平台应用。
              同时也具备现代前端开发能力，能够打造精美的用户界面和流畅的交互体验。
            </p>
          </div>
        </section>
        </ScrollReveal>

        <ScrollReveal variant="fadeInUp" delay={0.1}>
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
                    <span className="iconify" data-icon={skill.icon} style={{ fontSize: '20px' }}></span>
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
        </ScrollReveal>

        {/* 工作经历 */}
        <ScrollReveal variant="fadeInUp" delay={0.1}>
        <div className={`mt-12 p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`}>
          <h3 className="text-2xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              工作经历
            </span>
          </h3>
          
          <div className="space-y-6">
            {[
              { company: '科技公司 A', role: '高级 C++ 工程师', period: '2022 - 至今', desc: '负责核心产品的 Qt 桌面应用架构设计和开发，带领团队完成多个跨平台项目。' },
              { company: '互联网公司 B', role: 'C++ / Qt 开发工程师', period: '2020 - 2022', desc: '参与公司主要产品的 Qt 客户端开发，优化软件性能和用户交互体验。' },
              { company: '初创公司 C', role: '软件工程师', period: '2019 - 2020', desc: '负责公司产品从零到一的开发，使用 Qt 搭建完整的桌面应用解决方案。' }
            ].map((item, index) => (
              <ScrollReveal key={index} variant="fadeInLeft" delay={index * 0.1}>
              <div className={`p-6 rounded-2xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'} hover:bg-opacity-40 transition-all duration-300`}>
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
              </ScrollReveal>
            ))}
          </div>
        </div>
        </ScrollReveal>

        {/* 友情链接 */}
        <ScrollReveal variant="fadeInUp" delay={0.1}>
        <div className={`mt-12 p-8 rounded-3xl ${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card`}>
          <h3 className="text-2xl font-bold mb-8 text-center">
            <span className="bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              友情链接
            </span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { name: 'Qt 官方文档', url: 'https://doc.qt.io/', icon: 'simple-icons:qt' },
              { name: 'C++ Reference', url: 'https://cppreference.com/', icon: 'simple-icons:cplusplus' },
              { name: 'GitHub', url: 'https://github.com/', icon: 'simple-icons:github' },
              { name: 'Stack Overflow', url: 'https://stackoverflow.com/', icon: 'simple-icons:stackoverflow' },
              { name: 'CMake 文档', url: 'https://cmake.org/documentation/', icon: 'simple-icons:cmake' },
              { name: 'Vcpkg', url: 'https://vcpkg.io/', icon: 'simple-icons:microsoft' },
              { name: 'Conan', url: 'https://conan.io/', icon: 'simple-icons:conan' },
              { name: '掘金', url: 'https://juejin.cn/', icon: 'simple-icons:juejin' },
            ].map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                  theme === 'light' 
                    ? 'bg-white/40 hover:bg-white/60' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="iconify text-2xl text-primary-500" data-icon={link.icon}></span>
                <span className="text-sm font-medium truncate">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

export default About