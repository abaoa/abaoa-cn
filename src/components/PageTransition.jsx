import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

function PageTransition({ children }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location.pathname !== displayChildren.props.children.props.location.pathname) {
      setTransitionStage('fadeOut')
      
      const timeout = setTimeout(() => {
        setDisplayChildren(children)
        setTransitionStage('fadeIn')
      }, 200) // 过渡时间

      return () => clearTimeout(timeout)
    }
  }, [location, children, displayChildren])

  return (
    <div
      className={`transition-all duration-200 ${
        transitionStage === 'fadeIn' 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}
    >
      {displayChildren}
    </div>
  )
}

export default PageTransition
