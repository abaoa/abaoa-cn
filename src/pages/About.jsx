import { useTheme } from '../contexts/ThemeContext'

function About() {
  const { theme } = useTheme()

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">关于我</h1>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary">
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20photo%20of%20a%20developer&image_size=square" 
              alt="个人头像" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-4">abaoa</h2>
            <p className="mb-4">
              我是一名前端开发工程师，专注于创建美观、实用的网站和应用。
              我热爱学习新技术，不断提升自己的技能水平。
            </p>
            <p>
              我的技术栈包括：React、JavaScript、CSS、Tailwind CSS等。
              我擅长创建响应式设计，确保网站在各种设备上都能完美展示。
            </p>
          </div>
        </div>
        <div 
          className={`rounded-xl p-6 backdrop-blur-lg transition-all duration-300 ${theme === 'light' ? 'bg-white/70' : 'bg-gray-900/70'}`}
          style={{
            boxShadow: theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          }}
        >
          <h3 className="text-xl font-semibold mb-4">我的技能</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <span>React</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-4V4h-4v6H6l6 6 6-6z"></path>
                </svg>
              </div>
              <span>JavaScript</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <span>CSS/Tailwind</span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                  <line x1="2" y1="20" x2="2" y2="20"></line>
                </svg>
              </div>
              <span>响应式设计</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About