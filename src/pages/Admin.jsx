import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

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
      downloads: { windows: { url: '', filename: '', size: '', md5: '' } },
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
  const [activeVersionIdx, setActiveVersionIdx] = useState(0)

  useEffect(() => {
    fetch('/works/manifest.json')
      .then(res => res.json())
      .then(data => setWorks(data.works || []))
      .catch(err => console.error('加载失败:', err))
  }, [])

  const loadWorkDetail = async (slug) => {
    try {
      const res = await fetch(`/works/${slug}/info.json`)
      const data = await res.json()
      setEditingWork(data)
      setActiveVersionIdx(0)
      setIsCreating(false)
    } catch (err) {
      setMessage('❌ 加载失败')
    }
  }

  const createNewWork = () => {
    const newId = works.length > 0 ? Math.max(...works.map(w => w.id)) + 1 : 1
    setEditingWork({ ...emptyWork, id: newId })
    setActiveVersionIdx(0)
    setIsCreating(true)
  }

  const updateField = (field, value) => {
    setEditingWork(prev => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field, index, value) => {
    setEditingWork(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field, defaultValue = '') => {
    setEditingWork(prev => ({ ...prev, [field]: [...prev[field], defaultValue] }))
  }

  const removeArrayItem = (field, index) => {
    setEditingWork(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  const updateSystemReq = (platform, value) => {
    setEditingWork(prev => ({
      ...prev,
      systemRequirements: { ...prev.systemRequirements, [platform]: value }
    }))
  }

  // 版本相关操作
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
    setActiveVersionIdx(0)
  }

  const removeVersion = (idx) => {
    if (editingWork.versions.length <= 1) {
      setMessage('❌ 至少保留一个版本')
      return
    }
    const newVersions = editingWork.versions.filter((_, i) => i !== idx)
    if (!newVersions.some(v => v.isLatest) && newVersions.length > 0) {
      newVersions[0].isLatest = true
    }
    setEditingWork(prev => ({ ...prev, versions: newVersions }))
    if (activeVersionIdx >= idx && activeVersionIdx > 0) {
      setActiveVersionIdx(activeVersionIdx - 1)
    }
  }

  const setLatestVersion = (idx) => {
    setEditingWork(prev => ({
      ...prev,
      latestVersion: prev.versions[idx].version,
      versions: prev.versions.map((v, i) => ({ ...v, isLatest: i === idx }))
    }))
  }

  const updateVersionField = (field, value) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => i === activeVersionIdx ? { ...v, [field]: value } : v)
    }))
  }

  const updateVersionDownload = (platform, field, value) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => {
        if (i !== activeVersionIdx) return v
        return {
          ...v,
          downloads: {
            ...v.downloads,
            [platform]: { ...v.downloads[platform], [field]: value }
          }
        }
      })
    }))
  }

  const addDownloadPlatform = (platform) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => {
        if (i !== activeVersionIdx) return v
        return {
          ...v,
          downloads: { ...v.downloads, [platform]: { url: '', filename: '', size: '', md5: '' } }
        }
      })
    }))
  }

  const removeDownloadPlatform = (platform) => {
    setEditingWork(prev => ({
      ...prev,
      versions: prev.versions.map((v, i) => {
        if (i !== activeVersionIdx) return v
        const newDownloads = { ...v.downloads }
        delete newDownloads[platform]
        return { ...v, downloads: newDownloads }
      })
    }))
  }

  const exportJSON = () => {
    const dataStr = JSON.stringify(editingWork, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const link = document.createElement('a')
    link.setAttribute('href', dataUri)
    link.setAttribute('download', 'info.json')
    link.click()
    setMessage('✅ 已下载')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(editingWork, null, 2))
      .then(() => setMessage('✅ 已复制'))
      .catch(() => setMessage('❌ 复制失败'))
  }

  if (!editingWork) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">作品管理</h1>
          <button onClick={createNewWork} className={`px-6 py-3 rounded-xl font-semibold ${theme === 'light' ? 'bg-primary-500 text-white' : 'bg-primary-500/80 text-white'}`}>
            + 新建作品
          </button>
        </div>
        <div className="grid gap-4">
          {works.map(work => (
            <div key={work.id} className={`p-6 rounded-2xl flex items-center justify-between ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-primary-100' : 'bg-white/10'}`}>
                  <span className="iconify text-2xl text-primary-500" data-icon={work.icon}></span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{work.title}</h3>
                  <p className="text-sm opacity-60">ID: {work.id} | {work.slug}</p>
                </div>
              </div>
              <button onClick={() => loadWorkDetail(work.slug)} className={`px-4 py-2 rounded-lg text-sm font-medium ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>
                编辑
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentVersion = editingWork.versions[activeVersionIdx]
  const downloads = currentVersion?.downloads || {}

  return (
    <div className="py-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{isCreating ? '新建作品' : '编辑作品'}</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingWork(null)} className={`px-4 py-2 rounded-lg ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>返回列表</button>
          <button onClick={copyToClipboard} className={`px-4 py-2 rounded-lg font-medium ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>复制 JSON</button>
          <button onClick={exportJSON} className={`px-6 py-2 rounded-lg font-medium ${theme === 'light' ? 'bg-primary-500 text-white' : 'bg-primary-500/80 text-white'}`}>下载 info.json</button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${message.startsWith('✅') ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* 基本信息 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID</label>
              <input type="number" value={editingWork.id} onChange={e => updateField('id', parseInt(e.target.value))} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input type="text" value={editingWork.slug} onChange={e => updateField('slug', e.target.value)} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">标题</label>
              <input type="text" value={editingWork.title} onChange={e => updateField('title', e.target.value)} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">图标</label>
              <input type="text" value={editingWork.icon} onChange={e => updateField('icon', e.target.value)} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">描述</label>
              <textarea value={editingWork.description} onChange={e => updateField('description', e.target.value)} rows={2} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
            </div>
          </div>
        </section>

        {/* 功能特性 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <h2 className="text-xl font-bold mb-4">功能特性</h2>
          <div className="space-y-2">
            {editingWork.features.map((feature, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={feature} onChange={e => updateArrayField('features', i, e.target.value)} className={`flex-1 px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                <button onClick={() => removeArrayItem('features', i)} className={`px-3 py-2 rounded-xl ${theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'}`}>删除</button>
              </div>
            ))}
          </div>
          <button onClick={() => addArrayItem('features')} className={`mt-3 text-sm px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>+ 添加功能</button>
        </section>

        {/* 版本管理 */}
        <section className={`p-6 rounded-2xl ${theme === 'light' ? 'glass-light' : 'glass-dark'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">版本管理 ({editingWork.versions.length})</h2>
            <button onClick={addVersion} className={`px-4 py-2 rounded-lg text-sm font-medium ${theme === 'light' ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'}`}>+ 添加版本</button>
          </div>

          {/* 版本标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {editingWork.versions.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveVersionIdx(i)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeVersionIdx === i
                    ? theme === 'light' ? 'bg-primary-500 text-white' : 'bg-primary-500/80 text-white'
                    : theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                v{v.version || '未命名'}
                {v.isLatest && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-500 text-white">最新</span>}
              </button>
            ))}
          </div>

          {/* 版本编辑 */}
          {currentVersion && (
            <div className={`p-6 rounded-xl ${theme === 'light' ? 'bg-gray-50' : 'bg-white/5'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">编辑 v{currentVersion.version || '未命名'}</h3>
                <div className="flex items-center gap-2">
                  {!currentVersion.isLatest && (
                    <button onClick={() => setLatestVersion(activeVersionIdx)} className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'light' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>设为最新</button>
                  )}
                  <button onClick={() => removeVersion(activeVersionIdx)} className={`px-3 py-1.5 rounded-lg text-sm ${theme === 'light' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>删除版本</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">版本号</label>
                  <input
                    type="text"
                    value={currentVersion.version}
                    onChange={e => {
                      updateVersionField('version', e.target.value)
                      if (currentVersion.isLatest) updateField('latestVersion', e.target.value)
                    }}
                    className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">发布日期</label>
                  <input type="date" value={currentVersion.date} onChange={e => updateVersionField('date', e.target.value)} className={`w-full px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={currentVersion.isLatest} onChange={e => { if (e.target.checked) setLatestVersion(activeVersionIdx) }} className="w-5 h-5 rounded" />
                    <span className="text-sm">最新版本</span>
                  </label>
                </div>
              </div>

              {/* 更新内容 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">更新内容</label>
                <div className="space-y-2">
                  {currentVersion.changes.map((change, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={change}
                        onChange={e => {
                          const newChanges = [...currentVersion.changes]
                          newChanges[i] = e.target.value
                          updateVersionField('changes', newChanges)
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`}
                      />
                      <button onClick={() => updateVersionField('changes', currentVersion.changes.filter((_, idx) => idx !== i))} className={`px-3 py-2 rounded-xl ${theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'}`}>删除</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => updateVersionField('changes', [...currentVersion.changes, ''])} className={`mt-3 text-sm px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>+ 添加更新</button>
              </div>

              {/* 下载信息 */}
              <div>
                <label className="block text-sm font-medium mb-2">下载信息</label>
                <div className="space-y-4">
                  {Object.entries(downloads).map(([platform, info]) => (
                    <div key={platform} className={`p-4 rounded-xl ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium capitalize">{platform}</span>
                        <button onClick={() => removeDownloadPlatform(platform)} className="text-sm text-red-500">删除平台</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={info.url} onChange={e => updateVersionDownload(platform, 'url', e.target.value)} placeholder="下载链接" className={`px-3 py-2 rounded-lg border text-sm ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                        <input type="text" value={info.filename} onChange={e => updateVersionDownload(platform, 'filename', e.target.value)} placeholder="文件名" className={`px-3 py-2 rounded-lg border text-sm ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                        <input type="text" value={info.size} onChange={e => updateVersionDownload(platform, 'size', e.target.value)} placeholder="文件大小" className={`px-3 py-2 rounded-lg border text-sm ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                        <input type="text" value={info.md5} onChange={e => updateVersionDownload(platform, 'md5', e.target.value)} placeholder="MD5" className={`px-3 py-2 rounded-lg border text-sm ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {['windows', 'linux', 'macos'].filter(p => !downloads[p]).map(platform => (
                    <button key={platform} onClick={() => addDownloadPlatform(platform)} className={`text-sm px-3 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>+ {platform}</button>
                  ))}
                </div>
              </div>

              {/* 截图 */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">截图路径</label>
                <div className="space-y-2">
                  {currentVersion.screenshots.map((screenshot, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={screenshot}
                        onChange={e => {
                          const newScreenshots = [...currentVersion.screenshots]
                          newScreenshots[i] = e.target.value
                          updateVersionField('screenshots', newScreenshots)
                        }}
                        placeholder="/works/myapp/screenshots/1.jpg"
                        className={`flex-1 px-4 py-2 rounded-xl border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-white/10 bg-white/5'}`}
                      />
                      <button onClick={() => updateVersionField('screenshots', currentVersion.screenshots.filter((_, idx) => idx !== i))} className={`px-3 py-2 rounded-xl ${theme === 'light' ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-400'}`}>删除</button>
                    </div>
                  ))}
                </div>
                <button onClick={() => updateVersionField('screenshots', [...currentVersion.screenshots, ''])} className={`mt-3 text-sm px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/10 hover:bg-white/20'}`}>+ 添加截图</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Admin
