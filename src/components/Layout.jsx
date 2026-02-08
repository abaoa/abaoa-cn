import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import MobileNav from './MobileNav'
import ScrollToTop from './ScrollToTop'

function Layout() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
      
      const timeout = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('fadeIn')
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [location, displayLocation])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content - 无障碍支持 */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium"
      >
        跳转到主要内容
      </a>
      
      <ScrollToTop />
      <Navbar />
      <main 
        id="main-content" 
        className={`container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-grow transition-all duration-300 pb-24 sm:pb-6 ${
          transitionStage === 'fadeIn' 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`} 
        role="main" 
        aria-label="主要内容"
      >
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}

export default Layout