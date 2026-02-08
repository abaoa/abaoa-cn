import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function SEO({ 
  title, 
  description, 
  keywords,
  image = 'https://abaoa.cn/abaoa.jpg',
  type = 'website'
}) {
  const location = useLocation()
  const canonicalUrl = `https://abaoa.cn${location.pathname}`

  useEffect(() => {
    // 更新标题
    document.title = title ? `${title} | abaoa.cn` : '阿宝啊 | abaoa.cn'

    // 更新 meta 标签
    const updateMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    // 更新 property meta
    const updatePropertyMeta = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.content = content
    }

    // 更新 canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    // 更新描述
    if (description) {
      updateMeta('description', description)
      updatePropertyMeta('og:description', description)
      updatePropertyMeta('twitter:description', description)
    }

    // 更新关键词
    if (keywords) {
      updateMeta('keywords', keywords)
    }

    // 更新 Open Graph
    updatePropertyMeta('og:title', title || '阿宝啊 | abaoa.cn')
    updatePropertyMeta('og:url', canonicalUrl)
    updatePropertyMeta('og:type', type)
    updatePropertyMeta('og:image', image)

    // 更新 Twitter
    updatePropertyMeta('twitter:title', title || '阿宝啊 | abaoa.cn')
    updatePropertyMeta('twitter:url', canonicalUrl)
    updatePropertyMeta('twitter:image', image)

    // 清理函数
    return () => {
      // 可选：恢复默认 meta
    }
  }, [title, description, keywords, image, type, canonicalUrl])

  return null
}

export default SEO
