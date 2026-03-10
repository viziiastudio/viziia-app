import { motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface Props {
  currentStep: number
  maxStep: number
  goStep: (n: number) => void
}

const LABELS = ["Upload", "Model", "Camera", "Scene", "Generate"]

/* Circle: 24px, wrapper padding: 10 → center = 10 + 12 = 22px from top of step item */
const CIRCLE_CENTER_Y = 22
const TRACK_HEIGHT = 2
const TRACK_TOP = CIRCLE_CENTER_Y - TRACK_HEIGHT / 2 /* center line through circles */

export default function StepRail({ currentStep, maxStep, goStep }: Props) {
  const reducedMotion = useReducedMotion()
  const progressPct = currentStep / (LABELS.length - 1) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1], delay: reducedMotion ? 0 : 0.05 }}
      style={{
        position: "fixed", top: 56, left: 0, right: 0, zIndex: 200,
        minHeight: 84, paddingTop: 10, paddingBottom: 14,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingLeft: "max(24px, env(safe-area-inset-left))",
        paddingRight: "max(24px, env(safe-area-inset-right))",
        background: "rgba(7,9,13,.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,.03)",
        overflow: "visible",
      }}
    >
      <div style={{
        position: "relative",
        display: "flex", alignItems: "flex-start",
        width: "100%", maxWidth: 500,
      }}>
        {/* Track background — centered through circle midpoints */}
        <div style={{
          position: "absolute",
          top: TRACK_TOP, left: 20, right: 20,
          height: TRACK_HEIGHT, borderRadius: 1,
          background: "rgba(255,255,255,.04)",
        }} />

        {/* Track fill — width matches track (between circles) */}
        <motion.div
          initial={false}
          animate={{ width: `calc((100% - 40px) * ${progressPct} / 100)` }}
          transition={{ duration: reducedMotion ? 0.01 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            top: TRACK_TOP, left: 20,
            height: TRACK_HEIGHT, borderRadius: 1,
            background: "linear-gradient(90deg, var(--success) 0%, rgba(34,197,94,.35) 100%)",
            zIndex: 1,
          }}
        />

        {/* Step markers */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          width: "100%", position: "relative", zIndex: 2,
        }}>
          {LABELS.map((label, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            const isClickable = i <= maxStep
            const isFuture = i > currentStep

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.3, delay: reducedMotion ? 0 : 0.06 + 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => isClickable && goStep(i)}
                className="step-item"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4,
                  cursor: isClickable ? "pointer" : "default",
                  userSelect: "none",
                  minWidth: 0,
                  overflow: "visible",
                }}
              >
                {/* Circle — padding for 44px min touch target (WCAG) */}
                <div style={{ position: "relative", padding: 10 }}>
                  {isActive && (
                    <motion.div
                      layoutId="step-halo"
                      style={{
                        position: "absolute", inset: -3,
                        borderRadius: "50%",
                        background: "rgba(201,168,76,.06)",
                        border: "1px solid rgba(201,168,76,.05)",
                      }}
                      transition={{ type: "spring", stiffness: reducedMotion ? 1000 : 300, damping: reducedMotion ? 50 : 25 }}
                    />
                  )}
                  <div style={{
                    width: 24, height: 24,
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9,
                    fontFamily: "'Inter_24pt-Medium',sans-serif",
                    fontWeight: 600,
                    background: isDone
                      ? "var(--success)"
                      : isActive
                        ? "var(--gold)"
                        : "rgba(255,255,255,.03)",
                    color: isDone || isActive ? "var(--ink)" : "var(--steel2)",
                    border: isFuture ? "1.5px solid rgba(255,255,255,.06)" : "none",
                    transition: "all .3s cubic-bezier(.22,1,.36,1)",
                    position: "relative",
                    boxShadow: isActive
                      ? "0 0 10px rgba(201,168,76,.18)"
                      : isDone
                        ? "0 0 6px rgba(34,197,94,.12)"
                        : "none",
                  }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                </div>

                {/* Label — lineHeight 1.2 and padding prevent clipping */}
                <span className="step-label" style={{
                  fontSize: isActive ? 9 : 8,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                  fontFamily: "'Inter_24pt-Medium',sans-serif",
                  fontStyle: "normal",
                  fontWeight: isActive ? 600 : 500,
                  color: isDone ? "var(--success)" : isActive ? "var(--gold)" : "var(--steel2)",
                  opacity: isFuture ? 0.35 : 1,
                  whiteSpace: "nowrap",
                  transition: "all .25s ease",
                  textAlign: "center",
                  lineHeight: 1.2,
                  paddingTop: 2,
                  overflow: "visible",
                }}>
                  {label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
