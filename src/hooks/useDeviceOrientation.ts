import { useState, useEffect, useRef } from "react"

const LERP = 0.08
const MAX_X = 8
const MAX_Y = 6
const GAMMA_RANGE = 45
const BETA_RANGE = 30

function isMobile(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  )
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useDeviceOrientation() {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const permissionRequestedRef = useRef(false)

  useEffect(() => {
    if (!isMobile() || prefersReducedMotion()) return

    const hasOrientation =
      typeof DeviceOrientationEvent !== "undefined" &&
      "requestPermission" in DeviceOrientationEvent

    const requestPermission = async () => {
      if (!hasOrientation || permissionRequestedRef.current) return
      permissionRequestedRef.current = true
      try {
        const perm = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
        if (perm === "granted") startListening()
      } catch {
        // Permission denied or unsupported
      }
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0
      const beta = e.beta ?? 0
      const x = Math.max(-MAX_X, Math.min(MAX_X, (gamma / GAMMA_RANGE) * MAX_X))
      const y = Math.max(-MAX_Y, Math.min(MAX_Y, ((beta - 45) / BETA_RANGE) * MAX_Y))
      targetRef.current = { x, y }
    }

    const startListening = () => {
      window.addEventListener("deviceorientation", handleOrientation)
    }

    if (hasOrientation) {
      const onFirstInteraction = () => {
        requestPermission()
        document.removeEventListener("touchstart", onFirstInteraction)
        document.removeEventListener("click", onFirstInteraction)
      }
      document.addEventListener("touchstart", onFirstInteraction, { once: true, passive: true })
      document.addEventListener("click", onFirstInteraction, { once: true })
    } else {
      startListening()
    }

    const THRESHOLD = 0.03
    const rafLoop = () => {
      const { x: tx, y: ty } = targetRef.current
      const { x: cx, y: cy } = currentRef.current
      const nx = cx + (tx - cx) * LERP
      const ny = cy + (ty - cy) * LERP
      currentRef.current = { x: nx, y: ny }
      if (Math.abs(nx - cx) > THRESHOLD || Math.abs(ny - cy) > THRESHOLD) {
        setOffset({ x: nx, y: ny })
      }
      rafRef.current = requestAnimationFrame(rafLoop)
    }
    rafRef.current = requestAnimationFrame(rafLoop)

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return offset
}
