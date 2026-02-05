import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Works from './pages/Works'
import About from './pages/About'

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
            <Route index element={<Home />} />
            <Route path="works" element={<Works />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App