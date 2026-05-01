import { useEffect, useRef } from 'react'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const mouseXRef = useRef(0)
  const mouseYRef = useRef(0)
  const cursorXRef = useRef(0)
  const cursorYRef = useRef(0)
  const easing = 0.15

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX
      mouseYRef.current = e.clientY
    }

    const animateCursor = () => {
      cursorXRef.current += (mouseXRef.current - cursorXRef.current) * easing
      cursorYRef.current += (mouseYRef.current - cursorYRef.current) * easing

      cursor.style.left = cursorXRef.current + 'px'
      cursor.style.top = cursorYRef.current + 'px'

      requestAnimationFrame(animateCursor)
    }

    const handleMouseEnter = () => {
      cursor.classList.add('cursor-hover')
    }

    const handleMouseLeave = () => {
      cursor.classList.remove('cursor-hover')
    }

    document.addEventListener('mousemove', handleMouseMove)
    animateCursor()

    const interactiveElements = document.querySelectorAll('a, button, input, select, [role="button"]')
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  return <div id="custom-cursor" ref={cursorRef} />
}