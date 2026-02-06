import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content - 无障碍支持 */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium"
      >
        跳转到主要内容
      </a>
      
      <Navbar />
      <main id="main-content" className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-grow" role="main" aria-label="主要内容">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout