import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Link } from 'react-router-dom'

// 空模板
const emptyWork = {
  id: '',
  slug: '',
  title: '',
  description: '',
  icon: 'simple-icons:qt',
  tags: ['Qt6', 'C++'],
  platforms: ['Windows'],
  latestVersion: '1.0.0',
  features: [''],
  systemRequirements: {
    windows: 'Windows 10 64位',
    linux: '',
    macos: ''
  },
  versions: [
    {
      version: '1.0.0',
      date: new Date().toISOString().split('T')[0],
      changes: ['初始版本发布'],
      isLatest: true,
      downloads: {
        windows: { url: '', filename: '', size: '', md5: '' }
      },
      screenshots: ['']
    }
  ]
}

function Admin() {
  const { theme } = useTheme()
  const [works, setWorks] = useState([])
  const [editingWork, setEditingWork] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [activeVersionIndex, setActiveVersionIndex] = useState(0)

  // 加载作品列表
  useEffect(() => {
    fetch('/works/manifest.json')
      .then(res => res.json())
      .then(data => setWorks(data.works || []))
      .catch(err => console.error('加载失败:', err))
  }, [])

  // 加载单个作品详情
  const loadWorkDetail = async (slug) => {
    try {
      const res = await fetch(`/works/${slug}/info.json`)
      const data = await res.json()
      setEditingWork(data)
      setIsCreating(false)
    } catch (err) {
      setMessage('❌ 加载作品详情失败')
    }
  }

  // 新建作品
  const createNewWork = () => {
    const newId = works.length > 0 ? Math.max(...works.map(w => w.id)) + 1 : 1
    setEditingWork({ ...emptyWork, id: newId })
    setIsCreating(true)
  }

  // 更新字段
  const updateField = (field, value) => {
    setEditingWork(prev => ({ ...prev, [field]: value }))
  }

  // 更新数组字段
  const updateArrayField = (field, index, value) => {
    setEditingWork(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  // 添加数组项
  const addArrayItem = (field, defaultValue = '') => {
    setEditingWork(prev => ({
      ...prev,
      [field]: [...prev[field], defaultValue]
    }))
  }

  // 删除数组项
  const removeArrayItem = (field, index) => {
    setEditingWork(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // 更新系统要求
  const updateSystemReq = (platform, value) => {
    setEditingWork(prev => ({
      ...prev,
      systemRequirements: {
        ...prev.systemRequirements,
        [platform]: value
      }
    }))
  }



  // 删除下载平台
  const removeDownloadPlatform = (platform) => {
    setEditingWork(prev => {
      const newDownloads = { ...prev.versions[activeVersionIndex].downloads }
      delete newDownloads[platform]
      return {
        ...prev,
        versions: prev.versions.map((v, i) => 
          i === activeVersionIndex ? { ...v, downloads: newDownloads } : v
        )
      }
    })
  }

  // 添加新版本
  const addVersion = () => {
    const newVersion = {
      version: '',
      date: new Date().toISOString().split('T')[0],
      changes: [''],
      isLatest: false,
      downloads: {},
      screenshots: ['']
    }
    setEditingWork(prev => ({
      ...prev,
      versions: [newVersion, ...prev.versions]
    }))
    setActiveVersionIndex(0)
  }

  // 删除版本
  const removeVersion = (index) => {
    if (editingWork.versions.length <= 1) {
      setMessage('❌ 至少需要保留一个版本')
      return
    }
    setEditingWork(prev => {
      const newVersions = prev.versions.filter((_, i) => i !== index)
      // 确保至少有一个最新版本
      const hasLatest = newVersions.some(v => v.isLatest)
      if (!hasLatest && newVersions.length > 0) {
        newVersions[0].isLatest = true
      }
      return { ...prev, versions: newVersions }
    })
    if (activeVersionIndex >= index && activeVersionIndex > 0) {
      setActiveVersionIndex(activeVersionIndex - 1)
    }
  }

  // 设置最新版本
  const setLatestVersion = (index) => {
    setEditingWork(prev => ({
      ...prev,
      latestVersion: prev.versions[index].version,
      versions: prev.versions.map((v, i) => ({
        ...v,
        isLatest: i === index
      }))
    }))
  }

  // 更新指定版本的字段
  const updateVersionField = (field, value) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => 
        i === activeVersionIndex ? { ...v, [field]: value } : v
      )
    }))
  }

  // 更新指定版本的下载信息
  const updateVersionDownload = (platform, field, value) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => 
        i === activeVersionIndex ? {
          ...v,
          downloads: {
            ...v.downloads,
            [platform]: { ...v.downloads[platform], [field]: value }
          }
        } : v
      )
    }))
  }

  // 添加下载平台到指定版本
  const addVersionDownloadPlatform = (platform) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => 
        i === activeVersionIndex ? {
          ...v,
          downloads: {
            ...v.downloads,
            [platform]: { url: '', filename: '', size: '', md5: '' }
          }
        } : v
      )
    }))
  }

  // 导出 JSON
  const exportJSON = () => {
    const dataStr = JSON.stringify(editingWork, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `info.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    setMessage('✅ 已下载 info.json，请放入对应作品文件夹')
  }

  // 复制到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(editingWork, null, 2))
      .then(() => setMessage('✅ 已复制到剪贴板'))
      .catch(() => setMessage('❌ 复制失败'))
  }

  if (!editingWork) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">作品管理</h1>
          <button
            onClick={createNewWork}
            className={`px-6 py-3 rounded-xl font-semibold ${
              theme === 'light' 
                ? 'bg-primary-500 text-white' 
                : 'bg-primary-500/80 text-white'
            }`}
          >
            + 新建作品
          </button>
        </div>

        <div className="grid gap-4">
          {works.map(work => (
            <div 
              key={work.id}
              className={`p-6 rounded-2xl flex items-center justify-between ${
                theme === 'light' ? 'glass-light' : 'glass-dark'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  theme === 'light' ? 'bg-primary-100' : 'bg-white/10'
                }`}>
                  <span className="iconify text-2xl text-primary-500" data-icon={work.icon}></span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{work.title}</h3>
                  <p className="text-sm opacity-60">ID: {work.id} | Slug: {work.slug}</p>
                </div>
              </div>
              <button
                onClick={() => loadWorkDetail(work.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === 'light' 
                    ? 'bg-gray-100 hover:bg-gray-200' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                编辑
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          {isCreating ? '新建作品' : '编辑作品'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingWork(null)}
            className={`px-4 py-2 rounded-lg ${
              theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'
            }`}
          >
            返回列表
          </button>
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg font-medium ${
              theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            复制 JSON
          </button>
          <button
            onClick={exportJSON}
            className={`px-6 py-2 rounded-lg font-medium ${
              theme === 'light' 
                ? 'bg-primary-500 text-white' 
                : 'bg-primary-500/80 text-white'
            }`}
          >
            下载 info.json
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${
          message.startsWith('✅') 
            ? 'bg-green-500/20 text-green-600' 
            : 'bg-red-500/20 text-red-600'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* 基本信息 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="lucide:info"></span>
            基本信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID</label>
              <input
                type="number"
                value={editingWork.id}
                onChange={e => updateField('id', parseInt(e.target.value))}
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'light' 
                    ? 'border-gray-200 bg-white' 
                    : 'border-white/10 bg-white/5'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL标识)</label>
              <input
                type="text"
                value={editingWork.slug}
                onChange={e => updateField('slug', e.target.value)}
                placeholder="my-app"
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'light' 
                    ? 'border-gray-200 bg-white' 
                    : 'border-white/10 bg-white/5'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标题</label>
              <input
                type="text"
                value={editingWork.title}
                onChange={e => updateField('title', e.target.value)}
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'light' 
                    ? 'border-gray-200 bg-white' 
                    : 'border-white/10 bg-white/5'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">图标</label>
              <input
                type="text"
                value={editingWork.icon}
                onChange={e => updateField('icon', e.target.value)}
                placeholder="simple-icons:qt"
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'light' 
                    ? 'border-gray-200 bg-white' 
                    : 'border-white/10 bg-white/5'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea
                value={editingWork.description}
                onChange={e => updateField('description', e.target.value)}
                rows={2}
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'light' 
                    ? 'border-gray-200 bg-white' 
                    : 'border-white/10 bg-white/5'
                }`}
              />
            </div>
          </div>
        </section>

        {/* 标签和平台 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="lucide:tags"></span>
            标签和平台
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editingWork.tags.map((tag, i) => (
                <div key={i} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  theme === 'light' ? 'bg-primary-100 text-primary-700' : 'bg-primary-500/20 text-primary-400'
                }`}>
                  <input
                    type="text"
                    value={tag}
                    onChange={e => updateArrayField('tags', i, e.target.value)}
                    className="bg-transparent border-none outline-none w-20"
                  />
                  <button onClick={() => removeArrayItem('tags', i)} className="opacity-60 hover:opacity-100">×</button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addArrayItem('tags')}
              className={`text-sm px-3 py-1 rounded-lg ${
                theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              + 添加标签
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">支持平台</label>
            <div className="flex flex-wrap gap-2">
              {['Windows', 'Linux', 'macOS'].map(platform => (
                <label key={platform} className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer ${
                  theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
                }`}>
                  <input
                    type="checkbox"
                    checked={editingWork.platforms.includes(platform)}
                    onChange={e => {
                      if (e.target.checked) {
                        updateField('platforms', [...editingWork.platforms, platform])
                      } else {
                        updateField('platforms', editingWork.platforms.filter(p => p !== platform))
                      }
                    }}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* 功能特性 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="lucide:star"></span>
            功能特性
          </h2>
          <div className="space-y-2">
            {editingWork.features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={e => updateArrayField('features', i, e.target.value)}
                  placeholder={`功能 ${i + 1}`}
                  className={`flex-1 px-4 py-2 rounded-xl border ${
                    theme === 'light' 
                      ? 'border-gray-200 bg-white' 
                      : 'border-white/10 bg-white/5'
                  }`}
                />
                <button
                  onClick={() => removeArrayItem('features', i)}
                  className={`px-3 py-2 rounded-xl ${
                    theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addArrayItem('features')}
            className={`mt-3 text-sm px-4 py-2 rounded-lg ${
              theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            + 添加功能
          </button>
        </section>

        {/* 系统要求 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="lucide:monitor"></span>
            系统要求
          </h2>
          <div className="space-y-4">
            {editingWork.platforms.map(platform => {
              const key = platform.toLowerCase()
              return (
                <div key={platform}>
                  <label className="block text-sm font-medium mb-2">{platform}</label>
                  <input
                    type="text"
                    value={editingWork.systemRequirements[key] || ''}
                    onChange={e => updateSystemReq(key, e.target.value)}
                    placeholder={`${platform} 系统要求`}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      theme === 'light' 
                        ? 'border-gray-200 bg-white' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* 版本信息 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="iconify text-primary-500" data-icon="lucide:package"></span>
              版本管理 ({editingWork.versions.length} 个版本)
            </h2>
            <button
              onClick={addVersion}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                theme === 'light' 
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
                  : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
              }`}
            >
              + 添加新版本
            </button>
          </div>

          {/* 版本切换标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {editingWork.versions.map((version, index) => (
              <button
                key={index}
                onClick={() => setActiveVersionIndex(index)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeVersionIndex === index
                    ? theme === 'light'
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-500/80 text-white'
                    : theme === 'light'
                      ? 'bg-gray-100 hover:bg-gray-200'
                      : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                v{version.version || '未命名'}
                {version.isLatest && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">
                    最新
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 当前版本编辑 */}
          {editingWork.versions[activeVersionIndex] && (
            <div className={`p-6 rounded-xl ${
              theme === 'light' ? 'bg-gray-50' : 'bg-white/5'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">编辑版本 v{editingWork.versions[activeVersionIndex].version || '未命名'}</h3>
                <div className="flex items-center gap-2">
                  {!editingWork.versions[activeVersionIndex].isLatest && (
                    <button
                      onClick={() => setLatestVersion(activeVersionIndex)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        theme === 'light'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      设为最新
                    </button>
                  )}
                  <button
                    onClick={() => removeVersion(activeVersionIndex)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      theme === 'light'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                  >
                    删除版本
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">版本号</label>
                  <input
                    type="text"
                    value={editingWork.versions[activeVersionIndex].version}
                    onChange={e => {
                      updateVersionField('version', e.target.value)
                      if (editingWork.versions[activeVersionIndex].isLatest) {
                        updateField('latestVersion', e.target.value)
                      }
                    }}
                    placeholder="1.0.0"
                    className={`w-full px-4 py-2 rounded-xl border ${
                      theme === 'light' 
                        ? 'border-gray-200 bg-white' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">发布日期</label>
                  <input
                    type="date"
                    value={editingWork.versions[activeVersionIndex].date}
                    onChange={e => updateVersionField('date', e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      theme === 'light' 
                        ? 'border-gray-200 bg-white' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingWork.versions[activeVersionIndex].isLatest}
                      onChange={e => {
                        if (e.target.checked) {
                          setLatestVersion(activeVersionIndex)
                        }
                      }}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm">标记为最新版本</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">更新内容</label>
                <div className="space-y-2">
                  {editingWork.versions[activeVersionIndex].changes.map((change, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={change}
                        onChange={e => {
                          const newChanges = [...editingWork.versions[activeVersionIndex].changes]
                          newChanges[i] = e.target.value
                          updateVersionField('changes', newChanges)
                        }}
                        placeholder={`更新内容 ${i + 1}`}
                        className={`flex-1 px-4 py-2 rounded-xl border ${
                          theme === 'light' 
                            ? 'border-gray-200 bg-white' 
                            : 'border-white/10 bg-white/5'
                        }`}
                      />
                      <button
                        onClick={() => {
                          const newChanges = editingWork.versions[activeVersionIndex].changes.filter((_, idx) => idx !== i)
                          updateVersionField('changes', newChanges)
                        }}
                        className={`px-3 py-2 rounded-xl ${
                          theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => updateVersionField('changes', [...editingWork.versions[activeVersionIndex].changes, ''])}
                  className={`mt-3 text-sm px-4 py-2 rounded-lg ${
                    theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  + 添加更新内容
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">下载信息</label>
                <div className="space-y-4">
                  {Object.entries(editingWork.versions[activeVersionIndex].downloads).map(([platform, info]) => (
                    <div key={platform} className={`p-4 rounded-xl ${
                      theme === 'light' ? 'bg-white' : 'bg-white/5'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium capitalize">{platform}</span>
                        <button
                          onClick={() => removeDownloadPlatform(platform)}
                          className="text-sm text-red-500"
                        >
                          删除平台
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={info.url}
                          onChange={e => updateVersionDownload(platform, 'url', e.target.value)}
                          placeholder="下载链接"
                          className={`px-3 py-2 rounded-lg border text-sm ${
                            theme === 'light' 
                              ? 'border-gray-200 bg-white' 
                              : 'border-white/10 bg-white/5'
                          }`}
                    />
                    <input
                      type="text"
                      value={info.filename}
                      onChange={e => updateVersionDownload(platform, 'filename', e.target.value)}
                      placeholder="文件名"
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'light' 
                          ? 'border-gray-200 bg-white' 
                          : 'border-white/10 bg-white/5'
                      }`}
                    />
                    <input
                      type="text"
                      value={info.size}
                      onChange={e => updateVersionDownload(platform, 'size', e.target.value)}
                      placeholder="文件大小 (如: 25.0 MB)"
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'light' 
                          ? 'border-gray-200 bg-white' 
                          : 'border-white/10 bg-white/5'
                      }`}
                    />
                    <input
                      type="text"
                      value={info.md5}
                      onChange={e => updateVersionDownload(platform, 'md5', e.target.value)}
                      placeholder="MD5 值"
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        theme === 'light' 
                          ? 'border-gray-200 bg-white' 
                          : 'border-white/10 bg-white/5'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {['windows', 'linux', 'macos'].filter(p => !editingWork.versions[0].downloads[p]).map(platform => (
                <button
                  key={platform}
                  onClick={() => addVersionDownloadPlatform(platform)}
                  className={`text-sm px-3 py-2 rounded-lg ${
                    theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  + {platform}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 截图 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="iconify text-primary-500" data-icon="lucide:image"></span>
            截图路径
          </h2>
          <div className="space-y-2">
            {editingWork.versions[activeVersionIndex].screenshots.map((screenshot, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={screenshot}
                  onChange={e => {
                    const newScreenshots = [...editingWork.versions[activeVersionIndex].screenshots]
                    newScreenshots[i] = e.target.value
                    updateVersionField('screenshots', newScreenshots)
                  }}
                  placeholder="/works/myapp/screenshots/1.jpg"
                  className={`flex-1 px-4 py-2 rounded-xl border ${
                    theme === 'light' 
                      ? 'border-gray-200 bg-white' 
                      : 'border-white/10 bg-white/5'
                  }`}
                />
                <button
                  onClick={() => {
                    const newScreenshots = editingWork.versions[activeVersionIndex].screenshots.filter((_, idx) => idx !== i)
                    updateVersionField('screenshots', newScreenshots)
                  }}
                  className={`px-3 py-2 rounded-xl ${
                    theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => updateVersionField('screenshots', [...editingWork.versions[activeVersionIndex].screenshots, ''])}
            className={`mt-3 text-sm px-4 py-2 rounded-lg ${
              theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            + 添加截图
          </button>
        </section>
      </div>

      {/* 底部固定操作栏 */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t z-40 sm:hidden ${
        theme === 'light' 
          ? 'bg-white/95 border-gray-200' 
          : 'bg-gray-900/95 border-gray-700'
      }`}>
        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className={`flex-1 py-3 rounded-xl font-medium ${
              theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
            }`}
          >
            复制 JSON
          </button>
          <button
            onClick={exportJSON}
            className={`flex-1 py-3 rounded-xl font-medium text-white ${
              theme === 'light' ? 'bg-primary-500' : 'bg-primary-500/80'
            }`}
          >
            下载文件
          </button>
        </div>
      </div>
    </div>
  )
}

export default Admin
