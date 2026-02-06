// Qt 应用程序作品配置
export const works = [
  {
    id: 1,
    title: '文件管理器 Pro',
    description: '一款功能强大的跨平台文件管理工具，支持标签页、双窗格、文件预览等功能。',
    icon: 'simple-icons:qt',
    tags: ['Qt6', 'C++', '跨平台'],
    platforms: ['Windows', 'Linux', 'macOS'],
    latestVersion: '2.5.0',
    releaseDate: '2025-01-15',
    fileSize: '28.5 MB',
    md5: 'a1b2c3d4e5f6789012345678901234ab',
    downloads: {
      latest: {
        windows: { url: '#', filename: 'FileManagerPro-v2.5.0-Windows.exe', size: '28.5 MB' },
        linux: { url: '#', filename: 'FileManagerPro-v2.5.0-Linux.AppImage', size: '32.1 MB' },
        macos: { url: '#', filename: 'FileManagerPro-v2.5.0-macOS.dmg', size: '31.8 MB' }
      },
      history: [
        {
          version: '2.4.0',
          date: '2024-12-01',
          downloads: {
            windows: { url: '#', filename: 'FileManagerPro-v2.4.0-Windows.exe', size: '27.8 MB' },
            linux: { url: '#', filename: 'FileManagerPro-v2.4.0-Linux.AppImage', size: '31.5 MB' },
            macos: { url: '#', filename: 'FileManagerPro-v2.4.0-macOS.dmg', size: '31.2 MB' }
          }
        },
        {
          version: '2.3.0',
          date: '2024-10-20',
          downloads: {
            windows: { url: '#', filename: 'FileManagerPro-v2.3.0-Windows.exe', size: '26.5 MB' },
            linux: { url: '#', filename: 'FileManagerPro-v2.3.0-Linux.AppImage', size: '30.2 MB' },
            macos: { url: '#', filename: 'FileManagerPro-v2.3.0-macOS.dmg', size: '29.8 MB' }
          }
        }
      ]
    },
    screenshots: [
      'https://via.placeholder.com/800x600/41CD52/FFFFFF?text=文件管理器+截图1',
      'https://via.placeholder.com/800x600/41CD52/FFFFFF?text=文件管理器+截图2',
    ],
    changelog: [
      { version: '2.5.0', date: '2025-01-15', changes: ['新增标签页功能', '优化文件搜索速度', '修复内存泄漏问题'] },
      { version: '2.4.0', date: '2024-12-01', changes: ['添加深色模式', '支持云存储同步', '改进UI界面'] },
      { version: '2.3.0', date: '2024-10-20', changes: ['双窗格模式', '文件预览功能', '快捷键自定义'] },
    ],
    features: ['标签页浏览', '双窗格对比', '文件预览', '批量重命名', '快速搜索'],
    systemRequirements: {
      windows: 'Windows 10/11 64位',
      linux: 'Ubuntu 20.04+ / CentOS 8+',
      macos: 'macOS 11.0+'
    }
  },
  {
    id: 2,
    title: '代码编辑器 Lite',
    description: '轻量级代码编辑器，专为 Qt/C++ 开发设计，支持语法高亮、代码补全、调试等功能。',
    icon: 'simple-icons:qt',
    tags: ['Qt6', 'C++', '编辑器'],
    platforms: ['Windows', 'Linux'],
    latestVersion: '1.8.2',
    releaseDate: '2025-01-10',
    fileSize: '15.2 MB',
    md5: 'b2c3d4e5f6789012345678901234abc5',
    downloads: {
      latest: {
        windows: { url: '#', filename: 'CodeEditorLite-v1.8.2-Windows.exe', size: '15.2 MB' },
        linux: { url: '#', filename: 'CodeEditorLite-v1.8.2-Linux.AppImage', size: '18.5 MB' }
      },
      history: [
        {
          version: '1.8.0',
          date: '2024-11-15',
          downloads: {
            windows: { url: '#', filename: 'CodeEditorLite-v1.8.0-Windows.exe', size: '14.8 MB' },
            linux: { url: '#', filename: 'CodeEditorLite-v1.8.0-Linux.AppImage', size: '18.1 MB' }
          }
        }
      ]
    },
    screenshots: [
      'https://via.placeholder.com/800x600/659AD3/FFFFFF?text=代码编辑器+截图1',
    ],
    changelog: [
      { version: '1.8.2', date: '2025-01-10', changes: ['修复语法高亮bug', '优化启动速度'] },
      { version: '1.8.0', date: '2024-11-15', changes: ['新增插件系统', '支持LSP协议', '多语言支持'] },
    ],
    features: ['语法高亮', '代码补全', '调试支持', 'Git集成', '插件系统'],
    systemRequirements: {
      windows: 'Windows 10 64位',
      linux: 'Ubuntu 18.04+'
    }
  },
  {
    id: 3,
    title: '数据库管理工具',
    description: '支持 MySQL、PostgreSQL、SQLite 等多种数据库的可视化管理工具。',
    icon: 'simple-icons:qt',
    tags: ['Qt5', 'C++', '数据库'],
    platforms: ['Windows', 'Linux', 'macOS'],
    latestVersion: '3.0.1',
    releaseDate: '2024-12-20',
    fileSize: '42.8 MB',
    md5: 'c3d4e5f6789012345678901234abc5d6',
    downloads: {
      latest: {
        windows: { url: '#', filename: 'DBManager-v3.0.1-Windows.exe', size: '42.8 MB' },
        linux: { url: '#', filename: 'DBManager-v3.0.1-Linux.AppImage', size: '45.2 MB' },
        macos: { url: '#', filename: 'DBManager-v3.0.1-macOS.dmg', size: '44.1 MB' }
      },
      history: [
        {
          version: '3.0.0',
          date: '2024-11-01',
          downloads: {
            windows: { url: '#', filename: 'DBManager-v3.0.0-Windows.exe', size: '41.5 MB' },
            linux: { url: '#', filename: 'DBManager-v3.0.0-Linux.AppImage', size: '44.1 MB' },
            macos: { url: '#', filename: 'DBManager-v3.0.0-macOS.dmg', size: '43.0 MB' }
          }
        }
      ]
    },
    screenshots: [
      'https://via.placeholder.com/800x600/F34F29/FFFFFF?text=数据库工具+截图1',
    ],
    changelog: [
      { version: '3.0.1', date: '2024-12-20', changes: ['修复连接池问题', '优化查询性能'] },
      { version: '3.0.0', date: '2024-11-01', changes: ['全新UI设计', '支持Redis', '数据可视化'] },
    ],
    features: ['多数据库支持', '可视化查询', '数据导入导出', 'ER图生成', '性能监控'],
    systemRequirements: {
      windows: 'Windows 10/11 64位',
      linux: 'Ubuntu 20.04+',
      macos: 'macOS 12.0+'
    }
  },
  {
    id: 4,
    title: '图像处理工具',
    description: '专业的图像处理软件，支持批量处理、滤镜效果、格式转换等功能。',
    icon: 'simple-icons:qt',
    tags: ['Qt6', 'C++', '图像处理'],
    platforms: ['Windows', 'macOS'],
    latestVersion: '1.2.0',
    releaseDate: '2025-01-05',
    fileSize: '35.6 MB',
    md5: 'd4e5f6789012345678901234abc5d6e7',
    downloads: {
      latest: {
        windows: { url: '#', filename: 'ImageTool-v1.2.0-Windows.exe', size: '35.6 MB' },
        macos: { url: '#', filename: 'ImageTool-v1.2.0-macOS.dmg', size: '38.2 MB' }
      },
      history: []
    },
    screenshots: [
      'https://via.placeholder.com/800x600/FFD845/FFFFFF?text=图像处理+截图1',
    ],
    changelog: [
      { version: '1.2.0', date: '2025-01-05', changes: ['新增AI抠图功能', '支持RAW格式', 'GPU加速'] },
    ],
    features: ['批量处理', '滤镜效果', '格式转换', 'AI抠图', 'GPU加速'],
    systemRequirements: {
      windows: 'Windows 10 64位',
      macos: 'macOS 11.0+'
    }
  }
]

export default works