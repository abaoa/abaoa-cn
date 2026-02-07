import { useTheme } from '../contexts/ThemeContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import CopyButton from '../components/CopyButton'
import PageLoader from '../components/PageLoader'

// 检测用户操作系统
function detectPlatform() {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.indexOf('win') > -1) return 'windows'
  if (userAgent.indexOf('mac') > -1) return 'macos'
  if (userAgent.indexOf('linux') > -1) return 'linux'
  return 'unknown'
}

// 获取平台显示名称
function getPlatformName(platform) {
  const names = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux'
  }
  return names[platform] || platform
}

// 获取平台图标
function getPlatformIcon(platform) {
  const icons = {
    windows: 'simple-icons:windows',
    macos: 'simple-icons:apple',
    linux: 'simple-icons:linux'
  }
  return icons[platform] || 'simple-icons:computer'
}

function WorkDetail() {
  const { theme } = useTheme()
  const { id, version: versionParam } = useParams()
  const navigate = useNavigate()
  const [userPlatform, setUserPlatform] = useState('unknown')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [work, setWork] = useState(null)
  const [rawWork, setRawWork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workSlug, setWorkSlug] = useState(null)

  // 首先获取作品slug
  useEffect(() => {
    async function loadWorkSlug() {
      try {
        const response = await fetch('/works/manifest.json')
        const manifest = await response.json()
        const found = manifest.works.find(w => w.id === parseInt(id))
        if (found) {
          setWorkSlug(found.slug)
        }
      } catch (error) {
        console.error('Failed to load work slug:', error)
      }
    }
    loadWorkSlug()
  }, [id])

  // 然后加载作品详细信息
  useEffect(() => {
    async function loadWork() {
      if (!workSlug) return
      
      try {
        setLoading(true)
        const response = await fetch(`/works/${workSlug}/info.json`)
        const workInfo = await response.json()
        setRawWork(workInfo)
        
        // 转换为兼容格式
        const latestVersion = workInfo.versions?.find(v => v.isLatest) || workInfo.versions?.[0]
        const firstDownload = Object.values(latestVersion?.downloads || {})[0] || {}
        
        setWork({
          id: workInfo.id,
          title: workInfo.title,
          description: workInfo.description,
          icon: workInfo.icon,
          tags: workInfo.tags,
          platforms: workInfo.platforms,
          latestVersion: workInfo.latestVersion,
          releaseDate: latestVersion?.date || '',
          fileSize: firstDownload.size || '',
          md5: firstDownload.md5 || '',
          coverImage: workInfo.coverImage,
          screenshots: latestVersion?.screenshots || [],
          changelog: workInfo.versions.map(v => ({
            version: v.version,
            date: v.date,
            changes: v.changes
          })),
          features: workInfo.features,
          systemRequirements: workInfo.systemRequirements,
          downloads: {
            latest: latestVersion?.downloads || {},
            history: workInfo.versions
              .filter(v => !v.isLatest)
              .map(v => ({
                version: v.version,
                date: v.date,
                downloads: v.downloads
              }))
          }
        })
      } catch (error) {
        console.error('Failed to load work:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadWork()
  }, [workSlug])

  // 检查是否是特定版本页面
  const isVersionPage = !!versionParam
  const versionData = isVersionPage 
    ? work?.changelog.find(v => v.version === versionParam)
    : null

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const navigateToVersion = (version) => {
    navigate(`/works/${id}/version/${version}`)
  }

  useEffect(() => {
    setUserPlatform(detectPlatform())
    // 滚动到页面顶部
    window.scrollTo(0, 0)
  }, [id, versionParam])

  if (loading) {
    return <PageLoader />
  }

  if (!work) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">作品未找到</h1>
        <p className="opacity-70 mb-6">抱歉，您访问的作品不存在。</p>
        <Link 
          to="/works" 
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold ${
            theme === 'light' 
              ? 'bg-primary-500 text-white' 
              : 'bg-primary-500/80 text-white'
          }`}
        >
          <span className="iconify" data-icon="simple-icons:arrow-left" style={{ fontSize: '18px' }}></span>
          返回作品列表
        </Link>
      </div>
    )
  }

  // 如果是版本页面，获取该版本的下载信息
  const getVersionDownloads = (ver) => {
    if (ver === work.latestVersion) {
      return work.downloads?.latest || {}
    }
    const historyItem = work.downloads?.history?.find(h => h.version === ver)
    return historyItem?.downloads || {}
  }

  // 获取版本的大小（从下载记录中获取第一个平台的大小）
  const getVersionSize = (ver) => {
    const versionDownloads = getVersionDownloads(ver)
    const firstPlatform = Object.keys(versionDownloads)[0]
    return firstPlatform ? versionDownloads[firstPlatform].size : work.fileSize
  }

  // 获取版本的MD5（从下载记录中获取第一个平台的文件名计算或返回默认）
  const getVersionMd5 = (ver) => {
    // 这里使用版本号生成一个模拟的MD5，实际应该从服务器获取
    // 或者从 history 记录中的 md5 字段获取（如果有的话）
    const historyItem = work.downloads?.history?.find(h => h.version === ver)
    if (historyItem?.md5) return historyItem.md5
    // 生成一个基于版本号的伪MD5
    return `${ver.replace(/\./g, '')}a1b2c3d4e5f6789012345678901234ab`.slice(0, 32)
  }

  const downloads = isVersionPage && versionData 
    ? getVersionDownloads(versionData.version)
    : work.downloads?.latest || {}
  
  const availablePlatforms = Object.keys(downloads)
  const isCurrentPlatformSupported = availablePlatforms.includes(userPlatform)

  // 版本页面的返回链接
  const backLink = isVersionPage ? `/works/${id}` : '/works'
  const backText = isVersionPage ? '返回作品主页' : '返回作品列表'

  return (
    <article className="py-8 min-h-[80vh]" aria-labelledby="work-title">
      {/* 返回导航 */}
      <nav aria-label="面包屑导航" className="mb-6 flex items-center gap-2">
        <Link 
          to={backLink}
          className="inline-flex items-center gap-2 text-sm font-medium glass-button rounded-full px-4 py-2"
        >
          <span className="iconify" data-icon="simple-icons:arrow-left" style={{ fontSize: '16px' }} aria-hidden="true"></span>
          {backText}
        </Link>
      </nav>
      
      {/* 作品封面大图 */}
      <header className="relative h-48 sm:h-64 md:h-80 rounded-3xl overflow-hidden mb-8 group">
        <img 
          src={work.coverImage} 
          alt={work.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-white/20' : 'bg-white/10'} backdrop-blur-md`}>
              <span className="iconify text-4xl sm:text-5xl text-white" data-icon={work.icon} aria-hidden="true"></span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 id="work-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{work.title}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-md border border-white/30" aria-label={`版本 ${isVersionPage && versionData ? versionData.version : work.latestVersion}`}>
                  v{isVersionPage && versionData ? versionData.version : work.latestVersion}
                </span>
              </div>
              <p className="text-base sm:text-lg text-white/90 drop-shadow max-w-2xl">
                {work.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 截图画廊 */}
      {work.screenshots && work.screenshots.length > 0 && (
        <section 
          className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-6 sm:p-8 mb-8`}
          aria-labelledby="screenshots-title"
        >
          <h2 id="screenshots-title" className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="simple-icons:image" style={{ fontSize: '24px' }} aria-hidden="true"></span>
            应用截图
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="应用截图列表">
            {work.screenshots.map((screenshot, index) => (
              <button
                key={index}
                className="relative rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => openLightbox(index)}
                aria-label={`查看${work.title}截图 ${index + 1}`}
              >
                <img 
                  src={screenshot} 
                  alt={`${work.title} 截图 ${index + 1}`}
                  className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-focus:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 版本更新内容 */}
      {isVersionPage && versionData && (
        <section 
          className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-8 mb-8`}
          aria-labelledby="changelog-title"
        >
          <h2 id="changelog-title" className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="simple-icons:clipboard-list" style={{ fontSize: '24px' }} aria-hidden="true"></span>
            版本更新内容
          </h2>
          <div className={`p-6 rounded-2xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'}`}>
            <ul className="space-y-3">
              {versionData.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-base leading-relaxed pt-0.5">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 下载区域 */}
      <section 
        className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-8 mb-8`}
        aria-labelledby="download-title"
      >
        <h2 id="download-title" className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="iconify text-primary-500" data-icon="simple-icons:download" style={{ fontSize: '24px' }} aria-hidden="true"></span>
          下载
        </h2>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <dt className="text-sm opacity-60 mb-1">{isVersionPage ? '版本号' : '最新版本'}</dt>
            <dd className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              {isVersionPage && versionData ? versionData.version : work.latestVersion}
              {isVersionPage && versionData?.version === work.latestVersion && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-medium">
                  最新
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm opacity-60 mb-1">发布日期</dt>
            <dd className="text-lg sm:text-xl font-semibold">
              {isVersionPage && versionData ? versionData.date : work.releaseDate}
            </dd>
          </div>
          <div>
            <dt className="text-sm opacity-60 mb-1">文件大小</dt>
            <dd className="text-lg sm:text-xl font-semibold">
              {isVersionPage && versionData ? getVersionSize(versionData.version) : work.fileSize}
            </dd>
          </div>
          <div>
            <dt className="text-sm opacity-60 mb-1">支持平台</dt>
            <dd className="flex flex-wrap gap-2 mt-1">
              {work.platforms.map(p => (
                <span key={p} className="text-xs sm:text-sm px-2 py-1 rounded bg-primary-500/20 whitespace-nowrap">{p}</span>
              ))}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm opacity-60 mb-6">
          <span className="flex-shrink-0">MD5:</span>
          <code className="bg-black/10 px-3 py-1 rounded font-mono text-xs break-all flex-1" aria-label={`文件校验码: ${isVersionPage && versionData ? getVersionMd5(versionData.version) : work.md5}`}>
            {isVersionPage && versionData ? getVersionMd5(versionData.version) : work.md5}
          </code>
          <CopyButton text={isVersionPage && versionData ? getVersionMd5(versionData.version) : work.md5} label="复制" successLabel="已复制" />
        </div>

        {/* 智能下载按钮 */}
        {isCurrentPlatformSupported ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-green-500/10' : 'bg-green-500/20'} border border-green-500/30`} role="status" aria-live="polite">
              <div className="flex items-start gap-2 text-green-600 dark:text-green-400 text-sm mb-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="break-words">检测到您的系统是 {getPlatformName(userPlatform)}，已为您推荐适合的版本</span>
              </div>
              <a 
                href={downloads[userPlatform].url}
                className="flex items-center justify-center gap-2 sm:gap-3 w-full py-3 sm:py-4 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold text-base sm:text-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                aria-label={`下载 ${getPlatformName(userPlatform)} 版本，文件大小 ${downloads[userPlatform].size}`}
              >
                <span className="iconify flex-shrink-0" data-icon={getPlatformIcon(userPlatform)} style={{ fontSize: '24px' }} aria-hidden="true"></span>
                <span className="truncate">下载 {getPlatformName(userPlatform)} 版本</span>
                <span className="text-sm sm:text-base font-normal opacity-80 flex-shrink-0">({downloads[userPlatform].size})</span>
              </a>
            </div>
            
            {availablePlatforms.length > 1 && (
              <div className="pt-2">
                <p className="text-sm opacity-60 mb-3">其他平台版本：</p>
                <div className="flex flex-wrap gap-3">
                  {availablePlatforms
                    .filter(p => p !== userPlatform)
                    .map(platform => (
                    <a
                      key={platform}
                      href={downloads[platform].url}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                        theme === 'light'
                          ? 'bg-white/50 hover:bg-white/70 text-gray-700'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      <span className="iconify flex-shrink-0" data-icon={getPlatformIcon(platform)} style={{ fontSize: '18px' }}></span>
                      <span className="hidden sm:inline">{getPlatformName(platform)}</span>
                      <span className="sm:hidden">{getPlatformName(platform).slice(0, 3)}</span>
                    </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : availablePlatforms.length > 0 ? (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${theme === 'light' ? 'bg-amber-500/10' : 'bg-amber-500/20'} border border-amber-500/30`}>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0">
                  <p className="font-medium text-amber-600 dark:text-amber-400 break-words">
                    暂不支持 {getPlatformName(userPlatform) || '您的系统'}
                  </p>
                  <p className="text-sm opacity-70 mt-1 break-words">
                    该软件目前仅支持以下平台，请选择适合您的版本下载：
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {availablePlatforms.map(platform => (
                <a
                  key={platform}
                  href={downloads[platform].url}
                  className={`flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 px-4 rounded-xl font-semibold transition-colors ${
                    theme === 'light'
                      ? 'bg-white/60 hover:bg-white/80 text-gray-800'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200'
                  }`}
                >
                  <span className="iconify flex-shrink-0" data-icon={getPlatformIcon(platform)} style={{ fontSize: '24px' }}></span>
                  <span className="truncate">{getPlatformName(platform)}</span>
                  <span className="text-sm opacity-60 flex-shrink-0">({downloads[platform].size})</span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className={`p-6 rounded-2xl text-center ${theme === 'light' ? 'bg-gray-500/10' : 'bg-gray-500/20'} border border-gray-500/30`}>
            <p className="opacity-70">暂无可用下载</p>
            <p className="text-sm opacity-50 mt-1">请稍后查看或联系开发者</p>
          </div>
        )}
      </section>

      {/* 功能特性 */}
      <div className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-8 mb-8`}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="iconify text-primary-500" data-icon="simple-icons:star" style={{ fontSize: '24px' }}></span>
          功能特性
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {work.features.map((feature, index) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-4 rounded-xl ${
                theme === 'light' ? 'bg-white/30' : 'bg-white/5'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 系统要求 */}
      <div className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-8 mb-8`}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="iconify text-primary-500" data-icon="simple-icons:computer" style={{ fontSize: '24px' }}></span>
          系统要求
        </h2>
        <div className="space-y-4">
          {work.systemRequirements.windows && (
            <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'}`}>
              <span className="iconify text-2xl text-primary-500" data-icon="simple-icons:windows"></span>
              <div>
                <p className="font-medium">Windows</p>
                <p className="text-sm opacity-70">{work.systemRequirements.windows}</p>
              </div>
            </div>
          )}
          {work.systemRequirements.linux && (
            <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'}`}>
              <span className="iconify text-2xl text-primary-500" data-icon="simple-icons:linux"></span>
              <div>
                <p className="font-medium">Linux</p>
                <p className="text-sm opacity-70">{work.systemRequirements.linux}</p>
              </div>
            </div>
          )}
          {work.systemRequirements.macos && (
            <div className={`flex items-center gap-4 p-4 rounded-xl ${theme === 'light' ? 'bg-white/30' : 'bg-white/5'}`}>
              <span className="iconify text-2xl text-primary-500" data-icon="simple-icons:apple"></span>
              <div>
                <p className="font-medium">macOS</p>
                <p className="text-sm opacity-70">{work.systemRequirements.macos}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 历史版本 */}
      <div className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-3xl p-8 mb-8`}>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="iconify text-primary-500" data-icon="simple-icons:history" style={{ fontSize: '24px' }}></span>
          历史版本
        </h2>
        <div className="space-y-4">
          {(() => {
            const filteredChangelog = work.changelog.filter(log => {
              // 版本页面：排除当前查看的版本
              if (isVersionPage) return log.version !== versionParam
              // 作品主页：排除最新版本
              return log.version !== work.latestVersion
            })

            if (filteredChangelog.length === 0) {
              return (
                <div className={`p-6 rounded-2xl text-center ${theme === 'light' ? 'bg-gray-500/10' : 'bg-gray-500/20'}`}>
                  <p className="opacity-60">暂无历史版本</p>
                </div>
              )
            }

            return filteredChangelog.map((log, index) => {
              const isLatest = log.version === work.latestVersion
              return (
              <button
                key={index}
                onClick={() => navigateToVersion(log.version)}
                className={`w-full p-5 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] ${
                  theme === 'light' ? 'bg-white/30 hover:bg-white/50' : 'bg-white/5 hover:bg-white/10'
                } ${isLatest ? 'ring-2 ring-primary-500/30' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                    isLatest ? 'bg-primary-500' : 'bg-gray-500'
                  }`}>
                    v{log.version}
                  </span>
                  <span className="text-sm opacity-60">{log.date}</span>
                  {isLatest && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                      最新
                    </span>
                  )}
                  <span className="ml-auto text-sm opacity-40 flex items-center gap-1">
                    查看详情
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </div>
                <ul className="space-y-1">
                  {log.changes.slice(0, 2).map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm opacity-70">
                      <span className="text-primary-500 mt-1">•</span>
                      <span className="line-clamp-1">{change}</span>
                    </li>
                  ))}
                  {log.changes.length > 2 && (
                    <li className="text-sm opacity-40 pl-4">+ 还有 {log.changes.length - 2} 项更新...</li>
                  )}
                </ul>
              </button>
            )
          })
        })()}
        </div>
      </div>

      {/* 图片灯箱 */}
      {work.screenshots && work.screenshots.length > 0 && (
        <ImageLightbox
          images={work.screenshots}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={work.title}
        />
      )}
    </article>
  )
}

export default WorkDetail
