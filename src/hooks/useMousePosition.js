import { useState, useEffect } from 'react'

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [normalizedPosition, setNormalizedPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX
      const y = e.clientY
      
      // 归一化到 -1 到 1
      const normalizedX = (x / window.innerWidth - 0.5) * 2
      const normalizedY = (y / window.innerHeight - 0.5) * 2
      
      setMousePosition({ x, y })
      setNormalizedPosition({ x: normalizedX, y: normalizedY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return { mousePosition, normalizedPosition }
}
