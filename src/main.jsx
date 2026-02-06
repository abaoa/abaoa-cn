import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext'

// 忽略 Iconify 相关的非关键错误
window.addEventListener('error', (e) => {
  if (e.message && (
    e.message.includes('getBoundingClientRect') || 
    e.message.includes('Cannot read properties of null')
  )) {
    e.preventDefault()
    console.warn('Ignored iconify error:', e.message)
  }
})

// 捕获未处理的 Promise 错误
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (
    e.reason.message.includes('getBoundingClientRect') ||
    e.reason.message.includes('Cannot read properties of null')
  )) {
    e.preventDefault()
    console.warn('Ignored unhandled rejection:', e.reason.message)
  }
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)