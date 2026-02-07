import { useClipboard } from '../hooks/useClipboard'
import { useTheme } from '../contexts/ThemeContext'

function CopyButton({ text, label = '复制', successLabel = '已复制!' }) {
  const { theme } = useTheme()
  const { copied, copy } = useClipboard()

  const handleCopy = async () => {
    await copy(text)
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        copied
          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
          : theme === 'light'
            ? 'bg-white/50 hover:bg-white/70 text-gray-700 border border-white/50'
            : 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/10'
      }`}
      title={label}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

export default CopyButton
