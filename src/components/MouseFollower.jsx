import { useMousePosition } from '../hooks/useMousePosition'

function MouseFollower() {
  const { normalizedPosition } = useMousePosition()
  
  // 计算移动强度
  const moveX = normalizedPosition.x * 30
  const moveY = normalizedPosition.y * 30

  return (
    <div className="animated-bg fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 粒子1 - 左上 */}
      <div 
        className="particle absolute rounded-full opacity-30"
        style={{ 
          width: '300px', 
          height: '300px', 
          top: '10%', 
          left: '10%',
          transform: `translate(${moveX * 0.5}px, ${moveY * 0.5}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* 粒子2 - 右下 */}
      <div 
        className="particle absolute rounded-full opacity-30"
        style={{ 
          width: '200px', 
          height: '200px', 
          top: '60%', 
          left: '80%',
          animationDelay: '2s',
          transform: `translate(${-moveX * 0.3}px, ${-moveY * 0.3}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* 粒子3 - 左下 */}
      <div 
        className="particle absolute rounded-full opacity-30"
        style={{ 
          width: '250px', 
          height: '250px', 
          top: '80%', 
          left: '20%',
          animationDelay: '4s',
          transform: `translate(${moveX * 0.4}px, ${-moveY * 0.4}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* 粒子4 - 右上 */}
      <div 
        className="particle absolute rounded-full opacity-30"
        style={{ 
          width: '180px', 
          height: '180px', 
          top: '30%', 
          left: '70%',
          animationDelay: '6s',
          transform: `translate(${-moveX * 0.6}px, ${moveY * 0.6}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* 鼠标光晕 */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${moveX * 2}px), calc(-50% + ${moveY * 2}px))`,
          transition: 'transform 0.5s ease-out'
        }}
      />
    </div>
  )
}

export default MouseFollower
