import { useState, useCallback } from 'react'

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    if (!text) return false
    
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      
      setTimeout(() => {
        setCopied(false)
      }, timeout)
      
      return true
    } catch (err) {
      console.error('复制失败:', err)
      
      // 降级方案
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        
        if (success) {
          setCopied(true)
          setTimeout(() => setCopied(false), timeout)
          return true
        }
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr)
      }
      
      return false
    }
  }, [timeout])

  return { copied, copy }
}
