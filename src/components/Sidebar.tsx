import type { ViziiaState } from "@/types"
import { TOTAL_CREDITS } from "@/types"
import { motion, AnimatePresence } from "motion/react"

interface Props {
  state: ViziiaState
  modelBg: string
  totalCredits: number
  totalCost: number
  remaining: number
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 8.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase",
      color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif",
      paddingBottom: 6,
    }}>
      {children}
    </div>
  )
}

function Row({ label, value, gold, unset, last }: { label: string; value: string; gold?: boolean; unset?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,.03)",
    }}>
      <span style={{ fontSize: 11, color: "var(--steel)", fontWeight: 400, letterSpacing: ".01em" }}>{label}</span>
      <span style={{
        fontSize: 11, letterSpacing: ".01em",
        color: unset ? "var(--steel2)" : gold ? "var(--gold)" : "var(--paper2)",
        fontWeight: unset ? 400 : 500,
        opacity: unset ? .35 : 1,
      }}>
        {unset ? "—" : value}
      </span>
    </div>
  )
}

export default function Sidebar({ state, modelBg, totalCost, remaining }: Props) {
  const barWidth = Math.max(5, (remaining / TOTAL_CREDITS * 100))
  const modelConfigured = state.maxStep >= 1
  const cameraConfigured = state.maxStep >= 2
  const sceneConfigured = state.maxStep >= 3
  const framesUploaded = state.uploadStarted

  const modelLabel = state.modelMode === "saved"
    ? (state.selectedModel === "Sofia" ? "Female · European · 30y" : state.selectedModel === "Marcus" ? "Male · East Asian · 34y" : "Female · African · 25y")
    : `${state.modelGender} · ${state.modelEthnicity} · ${state.modelAge}y`

  const modelDetail = state.modelMode === "saved"
    ? (state.selectedModel === "Sofia" ? "Oval face · Dark hair · Neutral" : state.selectedModel === "Marcus" ? "Square face · Black hair · Neutral" : "Heart face · Black hair · Deep")
    : `${state.modelFaceShape} face · ${state.modelHairColor} hair · ${["#f7e8d8","#f0d0b0"].includes(state.modelSkinTone) ? "Fair" : ["#c8956c","#a07850"].includes(state.modelSkinTone) ? "Medium" : "Deep"}`

  return (
    <aside
      style={{
        display: "flex",
        background: "var(--ink2)",
        borderLeft: "1px solid rgba(255,255,255,.04)",
        padding: "20px 22px 100px",
        flexDirection: "column",
        position: "fixed", top: 140, right: 0, width: 460,
        height: "calc(100vh - 140px)",
        overflow: "hidden",
        zIndex: 100,
      }}
      className="sidebar-desktop"
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 18, flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Inter_24pt-Medium',sans-serif",
          fontSize: 12.5, fontWeight: 700, color: "var(--paper)",
          letterSpacing: ".04em",
        }}>
          Configuration
        </span>
        <span style={{
          fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase",
          color: "var(--steel2)", opacity: .5,
        }}>
          {state.step + 1} / 5
        </span>
      </div>

      {/* Model card */}
      <div style={{ flexShrink: 0, marginBottom: 20 }}>
        {modelConfigured ? (
          <div style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.04)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              height: 56, display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden", background: modelBg, transition: "background .5s",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 20%,rgba(0,0,0,.5))" }} />
              <span style={{ fontSize: 30, opacity: .4, position: "relative", zIndex: 1 }}>👩</span>
            </div>
            <div style={{ padding: "9px 12px 10px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={modelLabel}
                  initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -3, filter: "blur(1px)" }}
                  transition={{ duration: .32, ease: [.22, 1, .36, 1] }}
                >
                  <div style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "2px 8px", background: "var(--gold-dim)",
                    border: "1px solid var(--gold-bdr)", borderRadius: 8,
                    fontSize: 9.5, color: "var(--gold)",
                    marginBottom: 3, letterSpacing: ".02em",
                  }}>
                    {modelLabel}
                  </div>
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div
                  key={modelDetail}
                  initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -2, filter: "blur(1px)" }}
                  transition={{ duration: .3, delay: .06, ease: [.22, 1, .36, 1] }}
                  style={{ fontSize: 10, color: "var(--steel)", letterSpacing: ".01em" }}
                >
                  {modelDetail}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div style={{
            border: "1px dashed rgba(255,255,255,.06)", borderRadius: 10,
            padding: "16px 14px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 5, textAlign: "center",
            background: "rgba(255,255,255,.01)",
          }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" style={{ opacity: .12 }}>
              <circle cx="16" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            <div style={{ fontSize: 11, color: "var(--steel2)", fontWeight: 400 }}>No model selected yet</div>
            <div style={{ fontSize: 9, color: "var(--steel2)", opacity: .4, letterSpacing: ".03em" }}>Configure in Step 2 →</div>
          </div>
        )}
      </div>

      {/* Config sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, flexShrink: 0 }}>
        <section>
          <SectionLabel>Frames</SectionLabel>
          <Row label="Uploaded" value="3 frames ✓" gold={framesUploaded} unset={!framesUploaded} last />
        </section>

        <section>
          <SectionLabel>Camera</SectionLabel>
          <Row label="Shot style"  value={state.shotStyle}            gold   unset={!cameraConfigured} />
          <Row label="Lens"        value={`${state.lens}mm Portrait`} gold   unset={!cameraConfigured} />
          <Row label="Lighting"    value={state.lighting}                     unset={!cameraConfigured} />
          <Row label="Film grain"  value={state.grainLabel}                   unset={!cameraConfigured} last />
        </section>

        <section>
          <SectionLabel>Scene</SectionLabel>
          <Row label="Mood"        value={state.mood}                                       gold unset={!sceneConfigured} />
          <Row label="Background"  value={state.useCustomBg ? "Custom" : state.background}      unset={!sceneConfigured} last />
        </section>
      </div>

      {/* Credits — anchored to bottom */}
      <section style={{ marginTop: "auto", flexShrink: 0 }}>
        <div style={{
          height: 1, background: "rgba(255,255,255,.05)",
          marginBottom: 14,
        }} />
        <SectionLabel>Credits</SectionLabel>
        <Row label="This shoot"     value={`${totalCost} credits`} gold />
        <Row label="Remaining after" value={String(remaining)} last />
        <div style={{
          height: 2, background: "rgba(255,255,255,.04)", borderRadius: 1,
          marginTop: 12, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${barWidth}%`,
            background: "linear-gradient(90deg,var(--accent2),var(--gold))",
            borderRadius: 1, transition: "width .4s ease",
          }} />
        </div>
      </section>
    </aside>
  )
}
