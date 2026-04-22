import { useMousePosition } from '../hooks/useMousePosition'

function MouseFollower() {
  const { normalizedPosition } = useMousePosition()

  // 计算移动强度 - 更柔和的跟随
  const moveX = normalizedPosition.x * 20
  const moveY = normalizedPosition.y * 20

  return (
    <div className="animated-bg fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 柔和光晕1 - 左上 */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '500px',
          height: '500px',
          top: '5%',
          left: '5%',
          background: 'radial-gradient(circle, rgba(100, 108, 255, 0.12) 0%, transparent 70%)',
          transform: `translate(${moveX * 0.3}px, ${moveY * 0.3}px)`,
          transition: 'transform 0.8s ease-out',
          willChange: 'transform'
        }}
      />

      {/* 柔和光晕2 - 右下 */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '400px',
          height: '400px',
          top: '65%',
          left: '75%',
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.1) 0%, transparent 70%)',
          transform: `translate(${-moveX * 0.2}px, ${-moveY * 0.2}px)`,
          transition: 'transform 0.8s ease-out',
          willChange: 'transform'
        }}
      />

      {/* 柔和光晕3 - 中央偏下 */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '600px',
          height: '600px',
          top: '50%',
          left: '50%',
          background: 'radial-gradient(circle, rgba(83, 91, 242, 0.08) 0%, transparent 70%)',
          transform: `translate(calc(-50% + ${moveX * 0.15}px), calc(-50% + ${moveY * 0.15}px))`,
          transition: 'transform 1s ease-out',
          willChange: 'transform'
        }}
      />

      {/* 鼠标跟随光晕 - 更大的柔和光斑 */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full pointer-events-none blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(138, 43, 226, 0.04) 40%, transparent 70%)',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${moveX * 3}px), calc(-50% + ${moveY * 3}px))`,
          transition: 'transform 0.6s ease-out',
          willChange: 'transform'
        }}
      />
    </div>
  )
}

export default MouseFollower
