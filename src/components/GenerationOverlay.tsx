import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"

interface Props {
  qty: number
  onComplete: () => void
}

const GEN_STAGES = [
  { headline: "Extracting", accent: "frame mask", mono: "ANALYSING FRAME GEOMETRY", emoji: "🔍", pct: 15, eta: "~40 sec remaining" },
  { headline: "Building your", accent: "model", mono: "CONFIGURING MODEL PARAMETERS", emoji: "🎨", pct: 32, eta: "~32 sec remaining" },
  { headline: "AI", accent: "rendering", mono: "DIFFUSION MODEL RUNNING", emoji: "✨", pct: 58, eta: "~20 sec remaining" },
  { headline: "Compositing", accent: "frames", mono: "PLACING FRAMES ON MODEL", emoji: "🕶️", pct: 78, eta: "~12 sec remaining" },
  { headline: "Quality", accent: "checks", mono: "VALIDATING OUTPUT", emoji: "✅", pct: 94, eta: "~4 sec remaining" },
]

const CIRC = 2 * Math.PI * 35

export default function GenerationOverlay({ onComplete }: Props) {
  const [stageIndex, setStageIndex] = useState(0)
  const [doneStages, setDoneStages] = useState<number[]>([])
  const [finished, setFinished] = useState(false)
  const [pct, setPct] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let i = 0
    const tick = () => {
      if (i < GEN_STAGES.length) {
        setStageIndex(i)
        setPct(GEN_STAGES[i].pct)
        if (i > 0) setDoneStages(prev => [...prev, i - 1])
        i++
        timerRef.current = setTimeout(tick, 800 + Math.random() * 300)
      } else {
        setDoneStages([0, 1, 2, 3, 4])
        setPct(100)
        setFinished(true)
        timerRef.current = setTimeout(onComplete, 600)
      }
    }
    timerRef.current = setTimeout(tick, 200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [onComplete])

  const stage = GEN_STAGES[Math.min(stageIndex, GEN_STAGES.length - 1)]
  const offset = finished ? 0 : CIRC - (CIRC * pct / 100)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "var(--ink)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "var(--gold)", top: -80, left: -60, filter: "blur(90px)", opacity: .09, animation: "orbDrift 9s ease-in-out infinite alternate", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "#1e4a8a", bottom: -40, right: -40, filter: "blur(90px)", opacity: .09, animation: "orbDrift 9s ease-in-out infinite alternate", animationDelay: "-4s", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 320, padding: "0 24px" }}>
        {/* SVG Ring */}
        <div style={{ position: "relative", width: 78, height: 78, marginBottom: 26 }}>
          <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: "1px solid rgba(201,168,76,.12)", animation: "pulseRing 2.2s ease-out infinite" }} />
          <svg width="78" height="78" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 78 78">
            <circle fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="2" cx="39" cy="39" r="35" />
            <motion.circle
              fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"
              cx="39" cy="39" r="35"
              strokeDasharray={CIRC}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            />
          </svg>
          <AnimatePresence mode="wait">
            <motion.div
              key={stage.emoji}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.2 }}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}
            >
              {finished ? "✅" : stage.emoji}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Headline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={finished ? "done" : stage.headline}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, color: "var(--paper)", textAlign: "center", lineHeight: 1.2, marginBottom: 4 }}
          >
            {finished ? <>Visuals <em style={{ color: "var(--gold)", fontStyle: "italic" }}>ready</em></> : <>{stage.headline} <em style={{ color: "var(--gold)", fontStyle: "italic" }}>{stage.accent}</em></>}
          </motion.div>
        </AnimatePresence>

        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: ".14em", color: "var(--steel2)", textAlign: "center", marginBottom: 22, textTransform: "uppercase" }}>
          {finished ? "GENERATION COMPLETE" : stage.mono}
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", marginBottom: 22 }}>
          <div style={{ width: "100%", height: 1.5, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
            <motion.div
              style={{ height: "100%", background: "linear-gradient(90deg,#1e4a8a,var(--gold))", borderRadius: 2 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--gold)", letterSpacing: ".1em" }}>{pct}%</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--steel2)", letterSpacing: ".06em" }}>{finished ? "Complete" : stage.eta}</span>
          </div>
        </div>

        {/* Stage list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
          {GEN_STAGES.map((s, i) => {
            const isDone = doneStages.includes(i)
            const isCurrent = i === stageIndex && !finished
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 11px",
                  borderRadius: 8, border: `1px solid ${isDone ? "rgba(34,197,94,.14)" : isCurrent ? "var(--gold-bdr)" : "transparent"}`,
                  background: isDone ? "rgba(34,197,94,.04)" : isCurrent ? "rgba(201,168,76,.07)" : "rgba(255,255,255,.02)",
                  transition: "all .35s ease",
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: isDone ? "var(--success)" : isCurrent ? "var(--gold)" : "rgba(255,255,255,.1)",
                  boxShadow: isDone ? "0 0 5px rgba(34,197,94,.6)" : isCurrent ? "0 0 8px rgba(201,168,76,.8)" : "none",
                  animation: isCurrent ? "dotPulse .9s ease infinite" : "none",
                  transition: "all .3s",
                }} />
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, letterSpacing: ".05em", flex: 1, color: isDone ? "var(--success)" : isCurrent ? "var(--gold)" : "rgba(255,255,255,.2)", transition: "color .3s" }}>
                  {s.mono.toLowerCase()}
                </span>
                {isDone && <span style={{ fontSize: 11, color: "var(--success)" }}>✓</span>}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
