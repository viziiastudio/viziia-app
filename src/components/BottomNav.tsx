import { motion, AnimatePresence } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface Props {
  step: number
  qty: number
  qualityMult: number
  onBack: () => void
  onNext: () => void
  onGenerate: (preview: boolean) => void
  totalCredits: number
  totalCost: number
  hidden?: boolean
}

const NEXT_LABELS = ["Continue to Model →", "Camera →", "Scene →", "Review →"]

export default function BottomNav({ step, qty, onBack, onNext, onGenerate, hidden }: Props) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
        className="bottom-nav"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: hidden ? 80 : 0, opacity: hidden ? 0 : 1 }}
        transition={reducedMotion ? { duration: 0.01 } : { type: "spring", stiffness: 340, damping: 32 }}
        style={{
          background: "#080a0e",
          backdropFilter: "blur(28px) saturate(1.6)",
          WebkitBackdropFilter: "blur(28px) saturate(1.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          pointerEvents: hidden ? "none" : "auto",
          paddingLeft: "max(28px, env(safe-area-inset-left))",
          paddingRight: "max(28px, env(safe-area-inset-right))",
          paddingBottom: "max(14px, env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={onBack}
          className="nav-btn-back"
          style={{
            display: "block",
            minHeight: 44, minWidth: 44,
            padding: "10px 14px", background: "transparent",
            border: "1px solid var(--bdr)", borderRadius: "var(--r-sm)",
            color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
          aria-label="Go back"
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: 7, alignItems: "center", position: "relative", overflow: "hidden" }}>
          <AnimatePresence mode="wait" initial={false}>
            {step === 4 ? (
              <motion.div
                key="generate-pair"
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "flex", gap: 7, alignItems: "center" }}
              >
                <button
                  onClick={() => onGenerate(true)}
                  className="nav-btn-preview"
                  style={{
                    minHeight: 44, padding: "10px 14px", background: "transparent",
                    border: "1px solid var(--gold-bdr)", borderRadius: "var(--r-sm)",
                    color: "var(--gold)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                  aria-label="Preview first 2 images"
                >
                  ⚡ Preview first
                </button>
                <button
                  onClick={() => onGenerate(false)}
                  className="nav-btn-generate"
                  style={{
                    minHeight: 44, padding: "11px 24px",
                    background: "linear-gradient(135deg,#28d468,var(--success),#18a048)",
                    border: "none", borderRadius: "var(--r-sm)", color: "#071a0e",
                    fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 13, fontWeight: 700,
                    letterSpacing: ".04em", cursor: "pointer", whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                  aria-label={`Generate ${qty} visuals`}
                >
                  Generate {qty} Visuals
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`next-${step}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={onNext}
                  className="nav-btn-next"
                  style={{
                    minHeight: 44, padding: "11px 20px",
                    background: "linear-gradient(135deg,var(--gold-hi) 0%,var(--gold) 50%,#a07030 100%)",
                    border: "none", borderRadius: "var(--r-sm)", color: "var(--ink)",
                    fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 12, fontWeight: 700,
                    letterSpacing: ".05em", cursor: "pointer", whiteSpace: "nowrap",
                    textTransform: "uppercase",
                  }}
                  aria-label={NEXT_LABELS[step]}
                >
                  {NEXT_LABELS[step]}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </motion.div>
  )
}
