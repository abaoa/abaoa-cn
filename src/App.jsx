import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import MouseFollower from './components/MouseFollower'

// 懒加载页面
const Home = lazy(() => import('./pages/Home'))
const Works = lazy(() => import('./pages/Works'))
const WorkDetail = lazy(() => import('./pages/WorkDetail'))
const About = lazy(() => import('./pages/About'))
const NotFound = lazy(() => import('./pages/NotFound'))

function App() {
  return (
    <div className="min-h-screen relative">
      <MouseFollower />
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
            <Route path="*" element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            } />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App