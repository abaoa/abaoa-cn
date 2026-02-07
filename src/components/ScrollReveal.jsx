import { useScrollAnimation, animationVariants } from '../hooks/useScrollAnimation'

function ScrollReveal({ 
  children, 
  variant = 'fadeInUp', 
  delay = 0, 
  duration = 0.6,
  className = '',
  as: Component = 'div'
}) {
  const { ref, isVisible } = useScrollAnimation()
  const selectedVariant = animationVariants[variant] || animationVariants.fadeInUp

  const style = {
    transition: `opacity ${duration}s ease-out, transform ${duration}s ease-out`,
    transitionDelay: `${delay}s`,
    ...(isVisible ? selectedVariant.visible : selectedVariant.hidden)
  }

  return (
    <Component
      ref={ref}
      className={className}
      style={style}
    >
      {children}
    </Component>
  )
}

export default ScrollReveal
