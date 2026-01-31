import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function triggerConfetti(options = {}) {
  const defaults = {
    spread: 60,
    ticks: 100,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
  }

  confetti({
    ...defaults,
    ...options,
    particleCount: 80,
    origin: { x: 0.5, y: 0.6 }
  })
}

export function triggerFireworks() {
  const duration = 2000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#0ea5e9', '#10b981', '#8b5cf6']
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#0ea5e9', '#10b981', '#8b5cf6']
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

export default function Celebration({ type = 'confetti' }) {
  useEffect(() => {
    if (type === 'fireworks') {
      triggerFireworks()
    } else {
      triggerConfetti()
    }
  }, [type])

  return null
}
