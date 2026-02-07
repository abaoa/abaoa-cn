/**
 * 作品数据加载器
 * 从 /public/works/ 目录动态加载 JSON 数据
 * 
 * 目录结构：
 * /public/works/
 *   ├── manifest.json          # 作品清单
 *   ├── filemanager-pro/
 *   │   ├── info.json          # 作品基本信息和所有版本
 *   │   ├── cover.jpg          # 封面图
 *   │   └── versions/
 *   │       ├── 2.5.0/
 *   │       │   └── screenshots/  # 版本截图
 *   │       ├── 2.4.0/
 *   │       │   └── screenshots/
 *   │       └── 2.3.0/
 *   │           └── screenshots/
 *   └── ...其他作品
 */

// 同步加载数据的辅助函数（用于构建时预加载）
export async function loadWorksData() {
  try {
    // 在浏览器环境中，使用 fetch 加载
    if (typeof window !== 'undefined') {
      const response = await fetch('/works/manifest.json')
      const manifest = await response.json()
      
      const works = await Promise.all(
        manifest.works.map(async (workMeta) => {
          const infoResponse = await fetch(`/works/${workMeta.slug}/info.json`)
          const workInfo = await infoResponse.json()
          return convertWorkInfo(workInfo)
        })
      )
      
      return works
    }
    
    // 服务器端或构建时，返回空数组
    return []
  } catch (error) {
    console.error('Failed to load works data:', error)
    return []
  }
}

// 将新的 JSON 格式转换为旧的格式（兼容现有组件）
function convertWorkInfo(workInfo) {
  if (!workInfo) return null

  const latestVersion = workInfo.versions?.find(v => v.isLatest) || workInfo.versions?.[0]
  
  if (!latestVersion) return null

  // 获取第一个可用平台的大小和MD5
  const firstDownload = Object.values(latestVersion.downloads || {})[0] || {}
  
  return {
    id: workInfo.id,
    title: workInfo.title,
    description: workInfo.description,
    icon: workInfo.icon,
    tags: workInfo.tags,
    platforms: workInfo.platforms,
    latestVersion: workInfo.latestVersion,
    releaseDate: latestVersion.date,
    fileSize: firstDownload.size || '',
    md5: firstDownload.md5 || '',
    coverImage: workInfo.coverImage,
    screenshots: latestVersion.screenshots || [],
    changelog: workInfo.versions.map(v => ({
      version: v.version,
      date: v.date,
      changes: v.changes
    })),
    features: workInfo.features,
    systemRequirements: workInfo.systemRequirements,
    downloads: {
      latest: latestVersion.downloads || {},
      history: workInfo.versions
        .filter(v => !v.isLatest)
        .map(v => ({
          version: v.version,
          date: v.date,
          downloads: v.downloads
        }))
    }
  }
}

// 用于 Works.jsx 的简化数据
export async function loadWorksList() {
  try {
    const response = await fetch('/works/manifest.json')
    const manifest = await response.json()
    return manifest.works || []
  } catch (error) {
    console.error('Failed to load works list:', error)
    return []
  }
}

// 用于 WorkDetail.jsx 的完整数据
export async function loadWorkDetail(slug) {
  try {
    const response = await fetch(`/works/${slug}/info.json`)
    const workInfo = await response.json()
    return convertWorkInfo(workInfo)
  } catch (error) {
    console.error(`Failed to load work detail: ${slug}`, error)
    return null
  }
}

// 根据 slug 查找作品ID
export async function getWorkIdBySlug(slug) {
  try {
    const works = await loadWorksList()
    const work = works.find(w => w.slug === slug)
    return work?.id || null
  } catch (error) {
    return null
  }
}

// 根据 ID 查找作品 slug
export async function getWorkSlugById(id) {
  try {
    const works = await loadWorksList()
    const work = works.find(w => w.id === parseInt(id))
    return work?.slug || null
  } catch (error) {
    return null
  }
}
