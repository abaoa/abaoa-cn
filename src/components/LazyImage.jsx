import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'

function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = ''
}) {
  const { theme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${placeholderClassName}`}
    >
      {/* 占位骨架 */}
      {!isLoaded && (
        <div className={`absolute inset-0 animate-pulse ${
          theme === 'light' ? 'bg-gray-200/50' : 'bg-gray-700/50'
        }`} />
      )}
      
      {/* 实际图片 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      )}
    </div>
  )
}

export default LazyImage
