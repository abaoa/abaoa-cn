import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

// 懒加载页面
const Home = lazy(() => import('./pages/Home'))
const Works = lazy(() => import('./pages/Works'))
const WorkDetail = lazy(() => import('./pages/WorkDetail'))
const About = lazy(() => import('./pages/About'))

function App() {
  return (
    <div className="min-h-screen relative">
      <div className="animated-bg fixed inset-0 -z-10">
        <div className="particle" style={{ width: '300px', height: '300px', top: '10%', left: '10%', animationDelay: '0s' }}></div>
        <div className="particle" style={{ width: '200px', height: '200px', top: '60%', left: '80%', animationDelay: '2s' }}></div>
        <div className="particle" style={{ width: '250px', height: '250px', top: '80%', left: '20%', animationDelay: '4s' }}></div>
        <div className="particle" style={{ width: '180px', height: '180px', top: '30%', left: '70%', animationDelay: '6s' }}></div>
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <Suspense fallback={<PageLoader />}>
                <Home />
              </Suspense>
            } />
            <Route path="works" element={
              <Suspense fallback={<PageLoader />}>
                <Works />
              </Suspense>
            } />
            <Route path="works/:id" element={
              <Suspense fallback={<PageLoader />}>
                <WorkDetail />
              </Suspense>
            } />
            <Route path="about" element={
              <Suspense fallback={<PageLoader />}>
                <About />
              </Suspense>
            } />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App