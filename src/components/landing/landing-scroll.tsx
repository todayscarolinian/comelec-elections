'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const wheelQuietPeriod = 150

function bindSectionScroll() {
  const motion = window.matchMedia(
    '(prefers-reduced-motion: no-preference) and (min-height: 36rem)',
  )
  let wheelGesture: { direction: number; time: number } | undefined
  let touchGesture: { x: number; y: number; from: number; moved: boolean } | undefined
  let lastScroll = window.scrollY
  let scrollingDown = true

  const candidatesBounds = () => {
    const candidates = document.getElementById('candidates')
    if (!candidates) return null
    const { top, bottom } = candidates.getBoundingClientRect()
    return { top: top + window.scrollY, bottom: bottom + window.scrollY }
  }

  const targetFor = (from: number, delta: number) => {
    const bounds = candidatesBounds()
    if (!bounds) return null
    const { top, bottom } = bounds
    if (delta > 0 && from <= 4) return top
    if (delta < 0 && from >= top - 4 && from < bottom && from + delta <= top) return 0
    return null
  }

  const onWheel = (event: WheelEvent) => {
    const { deltaX, deltaY, deltaMode, timeStamp } = event
    if (
      !motion.matches ||
      !event.cancelable ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.shiftKey ||
      Math.abs(deltaY) <= Math.abs(deltaX)
    )
      return

    const direction = Math.sign(deltaY)
    if (wheelGesture?.direction === direction && timeStamp - wheelGesture.time < wheelQuietPeriod) {
      wheelGesture.time = timeStamp
      event.preventDefault()
      return
    }

    wheelGesture = undefined
    const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? window.innerHeight : 1
    const target = targetFor(window.scrollY, deltaY * unit)
    if (target === null) return

    event.preventDefault()
    wheelGesture = { direction, time: timeStamp }
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const onTouchStart = (event: TouchEvent) => {
    const point = event.touches[0]
    touchGesture =
      point && event.touches.length === 1
        ? { x: point.clientX, y: point.clientY, from: window.scrollY, moved: false }
        : undefined
  }

  const onTouchMove = (event: TouchEvent) => {
    const point = event.touches[0]
    if (
      !motion.matches ||
      !event.cancelable ||
      event.defaultPrevented ||
      !touchGesture ||
      !point ||
      event.touches.length !== 1
    )
      return

    if (touchGesture.moved) {
      event.preventDefault()
      return
    }

    const delta = touchGesture.y - point.clientY
    if (Math.abs(delta) < 8 || Math.abs(delta) <= Math.abs(touchGesture.x - point.clientX)) return

    const target = targetFor(touchGesture.from, delta)
    if (target === null) return

    event.preventDefault()
    touchGesture.moved = true
    window.scrollTo({ top: target, behavior: 'smooth' })
  }

  const onTouchEnd = () => {
    touchGesture = undefined
  }

  const trackScroll = () => {
    const current = window.scrollY
    if (current !== lastScroll) scrollingDown = current > lastScroll
    lastScroll = current
  }

  const finishScroll = () => {
    const current = window.scrollY
    const bounds = candidatesBounds()
    if (motion.matches && bounds && current > 1 && current < bounds.top - 1) {
      window.scrollTo({ top: scrollingDown ? bounds.top : 0, behavior: 'smooth' })
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
  window.addEventListener('touchcancel', onTouchEnd)
  window.addEventListener('scroll', trackScroll, { passive: true })
  document.addEventListener('scrollend', finishScroll)

  return () => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    window.removeEventListener('scroll', trackScroll)
    document.removeEventListener('scrollend', finishScroll)
  }
}

export function LandingScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== '/') return

    const root = document.documentElement
    root.dataset.landingScroll = 'true'
    const stop = bindSectionScroll()

    return () => {
      stop()
      delete root.dataset.landingScroll
    }
  }, [pathname])

  return null
}
