import { useTheme } from '../contexts/ThemeContext'

function SkeletonCard() {
  const { theme } = useTheme()
  
  return (
    <div className={`${theme === 'light' ? 'glass-light' : 'glass-dark'} glass-card rounded-2xl overflow-hidden animate-pulse`}>
      {/* 封面图占位 */}
      <div className="relative h-40 bg-gray-200/50 dark:bg-gray-700/50" />
      
      <div className="p-5 space-y-3">
        {/* 描述占位 */}
        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded w-3/4" />
        <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded w-1/2" />
        
        {/* 标签占位 */}
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
          <div className="h-6 w-12 bg-gray-200/50 dark:bg-gray-700/50 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard
