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
  const [platformMessages, setPlatformMessages] = useState({})

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
      setMessage('')
    } catch (err) {
      setMessage('❌ 加载失败')
    }
  }

  const createNewWork = () => {
    const newId = works.length > 0 ? Math.max(...works.map(w => w.id)) + 1 : 1
    setEditingWork({ ...emptyWork, id: newId })
    setActiveVersionIdx(0)
    setIsCreating(true)
    setMessage('')
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

  // 计算文件 MD5（纯 JavaScript 实现）
  const calculateMD5 = async (file) => {
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // MD5 辅助函数
    const rotateLeft = (x, n) => (x << n) | (x >>> (32 - n))
    const addUnsigned = (x, y) => (x + y) >>> 0

    const s = [
      7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21
    ]
    const K = new Uint32Array([
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
      0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
      0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
      0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
      0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
      0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
      0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
      0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
      0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ])

    let a0 = 0x67452301
    let b0 = 0xefcdab89
    let c0 = 0x98badcfe
    let d0 = 0x10325476

    const originalLength = uint8Array.length
    const paddedLength = Math.ceil((originalLength + 9) / 64) * 64
    const padded = new Uint8Array(paddedLength)
    padded.set(uint8Array)
    padded[originalLength] = 0x80

    const view = new DataView(padded.buffer)
    view.setUint32(paddedLength - 8, originalLength * 8, true)
    view.setUint32(paddedLength - 4, (originalLength * 8) >>> 32, true)

    const M = new Uint32Array(16)
    for (let i = 0; i < paddedLength; i += 64) {
      for (let j = 0; j < 16; j++) {
        M[j] = view.getUint32(i + j * 4, true)
      }

      let A = a0, B = b0, C = c0, D = d0

      for (let j = 0; j < 64; j++) {
        let F, g
        if (j < 16) {
          F = (B & C) | (~B & D)
          g = j
        } else if (j < 32) {
          F = (D & B) | (~D & C)
          g = (5 * j + 1) % 16
        } else if (j < 48) {
          F = B ^ C ^ D
          g = (3 * j + 5) % 16
        } else {
          F = C ^ (B | ~D)
          g = (7 * j) % 16
        }

        const temp = D
        D = C
        C = B
        B = addUnsigned(B, rotateLeft(addUnsigned(addUnsigned(addUnsigned(A, F), K[j]), M[g]), s[Math.floor(j / 16) * 4 + j % 4]))
        A = temp
      }

      a0 = addUnsigned(a0, A)
      b0 = addUnsigned(b0, B)
      c0 = addUnsigned(c0, C)
      d0 = addUnsigned(d0, D)
    }

    const toHex = (n) => (n >>> 0).toString(16).padStart(8, '0')
    const result = toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0)
    return result.match(/../g).reverse().join('').match(/......../g).map(s => s.match(/../g).reverse().join('')).join('')
  }

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // 处理文件选择
  const handleFileSelect = async (platform, file) => {
    if (!file) return
    try {
      const md5 = await calculateMD5(file)
      const size = formatFileSize(file.size)
      const filename = file.name

      setEditingWork(prev => {
        const newVersions = [...prev.versions]
        const version = { ...newVersions[activeVersionIdx] }
        const downloads = { ...version.downloads }

        downloads[platform] = {
          url: downloads[platform]?.url || '',
          filename,
          size,
          md5
        }

        version.downloads = downloads
        newVersions[activeVersionIdx] = version

        return { ...prev, versions: newVersions }
      })

      setPlatformMessages(prev => ({
        ...prev,
        [platform]: { type: 'success', text: `✅ 已填充: ${filename} (${size})` }
      }))

      // 3秒后清除该平台的提示
      setTimeout(() => {
        setPlatformMessages(prev => ({ ...prev, [platform]: null }))
      }, 3000)
    } catch (err) {
      console.error('计算 MD5 失败:', err)
      setPlatformMessages(prev => ({
        ...prev,
        [platform]: { type: 'error', text: '❌ 计算 MD5 失败: ' + err.message }
      }))
    }
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
          <button onClick={() => { setEditingWork(null); setMessage('') }} className={`px-4 py-2 rounded-lg ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}>返回列表</button>
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
                onClick={() => { setActiveVersionIdx(i); setPlatformMessages({}) }}
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
                      
                      {/* 文件选择按钮 */}
                      <div className="mb-3">
                        <label className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          theme === 'light'
                            ? 'border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                            : 'border-gray-600 hover:border-primary-400 hover:bg-white/5'
                        }`}>
                          <span className="iconify" data-icon="lucide:upload-cloud"></span>
                          <span className="text-sm">选择 {platform} 安装包文件</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => handleFileSelect(platform, e.target.files[0])}
                          />
                        </label>
                      </div>

                      {/* 平台提示信息 */}
                      {platformMessages[platform] && (
                        <div className={`p-3 rounded-lg mb-3 text-sm ${
                          platformMessages[platform].type === 'success'
                            ? theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                            : theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {platformMessages[platform].text}
                        </div>
                      )}

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
