import React, { createContext, useState, useEffect, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [isSystemTheme, setIsSystemTheme] = useState(true)

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
      setIsSystemTheme(false)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  // 应用主题到 body
  useEffect(() => {
    if (theme) {
      document.body.classList.remove('light', 'dark')
      document.body.classList.add(theme)
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // 只有当用户没有手动设置主题时，才跟随系统
      if (isSystemTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isSystemTheme])

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', newTheme)
      setIsSystemTheme(false)
      return newTheme
    })
  }
  
  // 重置为系统主题
  const resetToSystemTheme = () => {
    localStorage.removeItem('theme')
    setIsSystemTheme(true)
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToSystemTheme, isSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext