import { useState, useCallback, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { ViziiaState } from "@/types"
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation"
import { SpecialText } from "@/components/ui/special-text"
import TrueFocus from "@/components/ui/TrueFocus"

interface Props {
  state: ViziiaState
  update: (p: Partial<ViziiaState>) => void
  onNext: () => void
}

const FRAME_SLOTS = [
  { badge: "FRONT", label: "Front view",    emoji: "🕶️", extracted: true },
  { badge: "SIDE",  label: "Side view",     emoji: "🕶️", extracted: true },
  { badge: "3/4",   label: "3/4 angle",     emoji: "🕶️", extracted: true },
]

const MOUSE_DEPTH = 2.5
const LERP_MOUSE = 0.12

export default function Step1Upload({ state, update, onNext }: Props) {
  const started = state.uploadStarted
  const parallax = useDeviceOrientation()
  const [reducedMotion, setReducedMotion] = useState(true)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const mouseTargetRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const el = titleRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / rect.width
    const dy = (e.clientY - cy) / rect.height
    mouseTargetRef.current = {
      x: Math.max(-1, Math.min(1, dx)) * MOUSE_DEPTH,
      y: Math.max(-1, Math.min(1, dy)) * MOUSE_DEPTH,
    }
  }, [reducedMotion])

  const handleMouseLeave = useCallback(() => {
    mouseTargetRef.current = { x: 0, y: 0 }
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const tick = () => {
      const { x: tx, y: ty } = mouseTargetRef.current
      setMouseOffset(prev => ({
        x: prev.x + (tx - prev.x) * LERP_MOUSE,
        y: prev.y + (ty - prev.y) * LERP_MOUSE,
      }))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [reducedMotion])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    setIsMobile(
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    )
  }, [])
  const depthX = isMobile ? parallax.x : mouseOffset.x
  const depthY = isMobile ? parallax.y : mouseOffset.y

  return (
    <div style={{ position: "relative" }}>
      {/* Ambient glow */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "var(--gold)", filter: "blur(120px)", opacity: .04, pointerEvents: "none", zIndex: 0, top: -60, left: "50%", transform: "translateX(-50%)" }} />

      <AnimatePresence mode="wait">
        {!started ? (
          /* ── HERO STATE ── */
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", minHeight: "68vh", textAlign: "center",
              padding: "40px 0 20px", position: "relative", zIndex: 1,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span style={{ fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", display: "block", marginBottom: 20 }}>
                Step — Upload Frames
              </span>
            </motion.div>

            <div
              ref={titleRef}
              style={{
                perspective: reducedMotion ? "none" : "1000px",
                transform: `translate3d(${depthX}px, ${depthY}px, 0)`,
                willChange: depthX !== 0 || depthY !== 0 ? "transform" : "auto",
              }}
            >
              <div
                style={{
                  transform: reducedMotion ? "none" : "translateZ(4px)",
                  transformStyle: "preserve-3d",
                  textShadow: reducedMotion
                    ? "none"
                    : "0 1px 0 rgba(255,255,255,.05), 0 2px 4px rgba(0,0,0,.05), 0 4px 8px rgba(0,0,0,.03)",
                }}
              >
                <TrueFocus
                  sentence="Upload your frames"
                  manualMode={false}
                  blurAmount={5}
                  borderColor="#3c11e8"
                  animationDuration={0.5}
                  pauseBetweenAnimations={1}
                  className="serif"
                  style={{ fontSize: 46, fontWeight: 300, lineHeight: 1.08, color: "var(--paper)", marginBottom: 14, letterSpacing: "-.01em" }}
                />
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              style={{ fontSize: 13, color: "var(--steel)", fontWeight: 300, lineHeight: 1.75, maxWidth: 270, marginBottom: 40 }}
            >
              3–4 photos of the physical frame. AI extracts a clean mask in ~12 seconds — no Photoshop needed.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={() => update({ uploadStarted: true })}
              style={{
                padding: "17px 48px",
                background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#9a7020)",
                border: "none", borderRadius: 14, color: "var(--ink)",
                fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 14, fontWeight: 700,
                letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
                position: "relative", overflow: "hidden",
                boxShadow: "0 10px 40px rgba(201,168,76,.28), 0 2px 8px rgba(0,0,0,.4)",
                marginBottom: 12,
              }}
            >
              <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)", animation: "shimmer 2.8s ease infinite" }} />
              Start Your Shoot →
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              onClick={() => {
                update({
                  modelAge: 28,
                  modelSkinTone: "#c8956c",
                  modelHairColor: "Dark Brown",
                  modelFaceShape: "Oval",
                  modelOutfit: "Casual streetwear",
                  uploadStarted: true,
                })
                onNext()
              }}
              style={{
                padding: "9px 28px",
                background: "transparent",
                border: "1px solid var(--gold-bdr2)",
                borderRadius: 12,
                color: "var(--gold)",
                fontFamily: "'Inter_28pt-Regular',sans-serif",
                fontSize: 12,
                letterSpacing: ".06em",
                cursor: "pointer",
                marginBottom: 28,
              }}
            >
              Try Demo →
            </motion.button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              style={{ display: "flex", gap: 6, alignItems: "center" }}
            >
              {["JPG", "PNG", "WEBP", "HEIC"].map(f => (
                <span key={f} style={{ padding: "3px 8px", background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: 12, fontSize: 8, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>{f}</span>
              ))}
              <span style={{ fontSize: 9, color: "var(--steel2)", marginLeft: 4 }}>accepted</span>
            </motion.div>
          </motion.div>

        ) : (
          /* ── UPLOAD STATE ── */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: "relative", zIndex: 1, paddingBottom: 20 }}
          >
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--bdr)" }}>
              <span style={{ fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 6, display: "block", opacity: .7 }}>Step 01 / 05</span>
              <h1 className="serif" style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, color: "var(--paper)" }}>
                <SpecialText inView={true} once={true}>Upload your frames</SpecialText>
              </h1>
              <p style={{ marginTop: 6, fontSize: 12, color: "var(--steel)", fontWeight: 300, lineHeight: 1.7 }}>
                Upload 3–4 photos of the physical frame. AI extracts a clean mask in ~12 seconds.
              </p>
            </div>

            {/* Upload zone */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                border: "1.5px dashed rgba(255,255,255,.1)", borderRadius: "var(--r-lg)",
                padding: "24px 18px", textAlign: "center", cursor: "pointer",
                background: "linear-gradient(135deg,var(--panel2),var(--panel))",
                position: "relative", overflow: "hidden", marginBottom: 12,
                transition: "border-color .3s",
              }}
              whileHover={{ borderColor: "rgba(201,168,76,.45)" } as any}
            >
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%,rgba(201,168,76,.05) 0%,transparent 70%)" }} />
              <div style={{ fontSize: 26, marginBottom: 6, opacity: .35 }}>📸</div>
              <div style={{ fontSize: 14, fontFamily: "'Inter_24pt-Medium',sans-serif", fontWeight: 300, color: "var(--paper)", marginBottom: 3 }}>
                Drop your frame photos here
              </div>
              <div style={{ fontSize: 11, color: "var(--steel)", lineHeight: 1.65 }}>Front · Side · 3/4 angle · Detail shot</div>
              <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                {["JPG", "PNG", "WEBP", "HEIC"].map(f => (
                  <span key={f} style={{ padding: "2px 7px", background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 12, fontSize: 8, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>{f}</span>
                ))}
              </div>
            </motion.div>

            {/* Frame slots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr) 1fr", gap: 7, marginBottom: 12 }}
            >
              {FRAME_SLOTS.map((f, i) => (
                <motion.div
                  key={f.badge}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 280, damping: 24 }}
                  style={{
                    borderRadius: 9,
                    border: "1.5px solid rgba(201,168,76,.45)",
                    aspectRatio: "4/3",
                    position: "relative",
                    background: "rgba(201,168,76,.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", overflow: "hidden",
                  }}
                >
                  <span style={{ fontSize: 20, opacity: .25 }}>{f.emoji}</span>
                  <div style={{ position: "absolute", top: 4, right: 4, background: "var(--gold)", color: "var(--ink)", fontSize: 7, fontWeight: 700, padding: "2px 4px", borderRadius: 4, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>{f.badge}</div>
                  {f.extracted && (
                    <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, fontSize: 8, color: "var(--success)", fontFamily: "'Inter_28pt-Regular',sans-serif", textAlign: "center" }}>✓ extracted</div>
                  )}
                </motion.div>
              ))}
              {/* Add more slot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.36, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 9, border: "1.5px dashed var(--bdr)", aspectRatio: "4/3",
                  background: "var(--panel2)", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", fontSize: 17, color: "var(--steel2)",
                }}
              >
                ➕
              </motion.div>
            </motion.div>

            {/* AI status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42 }}
              style={{ background: "rgba(20,40,70,.25)", border: "1px solid rgba(30,60,100,.4)", borderLeft: "2px solid var(--accent2)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65 }}
            >
              <strong style={{ color: "#6aacde" }}>AI extraction complete:</strong> 3 frames processed. Frame shape, bridge, temples and lens area identified.
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
