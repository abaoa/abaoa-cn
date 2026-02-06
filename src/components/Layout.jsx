import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-4 flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout