import { useState, useEffect } from 'react'

// 缓存数据
let cachedManifest = null
let cachedWorks = new Map()

/**
 * 获取作品清单
 */
export async function fetchManifest() {
  if (cachedManifest) return cachedManifest
  
  const response = await fetch('/works/manifest.json')
  if (!response.ok) {
    throw new Error('Failed to fetch manifest')
  }
  cachedManifest = await response.json()
  return cachedManifest
}

/**
 * 获取单个作品的详细信息
 */
export async function fetchWorkInfo(slug) {
  if (cachedWorks.has(slug)) return cachedWorks.get(slug)
  
  const response = await fetch(`/works/${slug}/info.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch work info: ${slug}`)
  }
  const data = await response.json()
  cachedWorks.set(slug, data)
  return data
}

/**
 * 将作品信息转换为旧格式（兼容现有组件）
 */
function convertToLegacyFormat(workInfo) {
  if (!workInfo) return null

  const latestVersion = workInfo.versions.find(v => v.isLatest) || workInfo.versions[0]
  
  return {
    id: workInfo.id,
    title: workInfo.title,
    description: workInfo.description,
    icon: workInfo.icon,
    tags: workInfo.tags,
    platforms: workInfo.platforms,
    latestVersion: workInfo.latestVersion,
    releaseDate: latestVersion?.date || '',
    fileSize: latestVersion?.downloads?.windows?.size || 
              Object.values(latestVersion?.downloads || {})[0]?.size || '',
    md5: latestVersion?.downloads?.windows?.md5 || 
         Object.values(latestVersion?.downloads || {})[0]?.md5 || '',
    coverImage: workInfo.coverImage,
    screenshots: latestVersion?.screenshots || [],
    changelog: workInfo.versions.map(v => ({
      version: v.version,
      date: v.date,
      changes: v.changes
    })),
    features: workInfo.features,
    systemRequirements: workInfo.systemRequirements,
    // 转换下载信息格式
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
  }
}

/**
 * Hook: 获取所有作品列表（简化信息）
 */
export function useWorksList() {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadWorks() {
      try {
        setLoading(true)
        const manifest = await fetchManifest()
        setWorks(manifest.works || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadWorks()
  }, [])

  return { works, loading, error }
}

/**
 * Hook: 获取单个作品详细信息（兼容旧格式）
 */
export function useWorkDetail(slug) {
  const [work, setWork] = useState(null)
  const [rawWork, setRawWork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadWork() {
      if (!slug) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const workInfo = await fetchWorkInfo(slug)
        setRawWork(workInfo)
        setWork(convertToLegacyFormat(workInfo))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadWork()
  }, [slug])

  return { work, rawWork, loading, error }
}

/**
 * 根据ID查找作品slug
 */
export function useWorkSlugById(id) {
  const { works, loading } = useWorksList()
  
  if (loading) return null
  const work = works.find(w => w.id === parseInt(id))
  return work?.slug || null
}

/**
 * Hook: 根据ID获取作品（兼容旧代码）
 */
export function useWorkById(id) {
  const slug = useWorkSlugById(id)
  return useWorkDetail(slug)
}

/**
 * 预加载所有作品数据（用于构建时）
 */
export async function preloadAllWorks() {
  const manifest = await fetchManifest()
  const works = await Promise.all(
    manifest.works.map(async (work) => {
      const info = await fetchWorkInfo(work.slug)
      return convertToLegacyFormat(info)
    })
  )
  return works
}

// 兼容旧的导出方式 - 同步获取（需要预加载）
let preloadedWorks = null

export function setPreloadedWorks(works) {
  preloadedWorks = works
}

export function getWorks() {
  return preloadedWorks || []
}

export function getWorkById(id) {
  return preloadedWorks?.find(w => w.id === parseInt(id)) || null
}
