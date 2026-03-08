import { motion } from "motion/react"
import { STEP_LABELS } from "@/types"

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
  const pct = ((step + 1) / 5 * 100).toFixed(0)

  return (
    <motion.div
        className="bottom-nav"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: hidden ? 80 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        style={{
          background: "#080a0e",
          backdropFilter: "blur(28px) saturate(1.6)",
          WebkitBackdropFilter: "blur(28px) saturate(1.6)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 12,
          pointerEvents: hidden ? "none" : "auto",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "block",
            padding: "10px 14px", background: "transparent",
            border: "1px solid var(--bdr)", borderRadius: "var(--r-sm)",
            color: "var(--steel)", fontFamily: "'Outfit',sans-serif", fontSize: 11,
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "all .18s",
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontSize: 9, color: "var(--steel2)", fontFamily: "'DM Mono',monospace", letterSpacing: ".06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Step {step + 1} of 5 — {STEP_LABELS[step]}
          </div>
          <div style={{ height: 2, background: "var(--bdr)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              style={{ height: "100%", background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {step === 4 ? (
            <>
              <button
                onClick={() => onGenerate(true)}
                className="nav-btn-preview"
                style={{
                  padding: "10px 14px", background: "transparent",
                  border: "1px solid var(--gold-bdr)", borderRadius: "var(--r-sm)",
                  color: "var(--gold)", fontFamily: "'Outfit',sans-serif", fontSize: 11,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all .18s",
                }}
              >
                ⚡ Preview first
              </button>
              <button
                onClick={() => onGenerate(false)}
                className="nav-btn-generate"
                style={{
                  padding: "11px 24px",
                  background: "linear-gradient(135deg,#28d468,var(--success),#18a048)",
                  border: "none", borderRadius: "var(--r-sm)", color: "#071a0e",
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
                  letterSpacing: ".04em", cursor: "pointer", whiteSpace: "nowrap",
                  textTransform: "uppercase",
                }}
              >
                Generate {qty} Visuals
              </button>
            </>
          ) : (
            <button
              onClick={onNext}
              className="nav-btn-next"
              style={{
                padding: "11px 20px",
                background: "linear-gradient(135deg,var(--gold-hi) 0%,var(--gold) 50%,#a07030 100%)",
                border: "none", borderRadius: "var(--r-sm)", color: "var(--ink)",
                fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                letterSpacing: ".05em", cursor: "pointer", whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              {NEXT_LABELS[step]}
            </button>
          )}
        </div>
    </motion.div>
  )
}
