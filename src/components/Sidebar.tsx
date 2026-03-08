import type { ViziiaState } from "@/types"
import { TOTAL_CREDITS } from "@/types"

interface Props {
  state: ViziiaState
  modelBg: string
  totalCredits: number
  totalCost: number
  remaining: number
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 7 }}>
      {children}
    </div>
  )
}

function Row({ label, value, gold, unset }: { label: string; value: string; gold?: boolean; unset?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--bdr2)" }}>
      <span style={{ fontSize: 11, color: "var(--steel2)" }}>{label}</span>
      <span style={{ fontSize: 11, color: unset ? "var(--steel2)" : gold ? "var(--gold)" : "var(--paper2)", fontWeight: unset ? 400 : 500, opacity: unset ? .4 : 1 }}>
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
        background: "var(--ink2)", borderLeft: "1px solid var(--bdr)",
        padding: "20px 18px 88px", flexDirection: "column", gap: 16,
        position: "fixed", top: 104, right: 0, width: 460,
        height: "calc(100vh - 104px)", overflowY: "auto",
        zIndex: 100,
      }}
      className="sidebar-desktop"
    >
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 300, color: "var(--paper)", letterSpacing: ".03em" }}>
        Configuration
      </div>

      {/* Model card — placeholder until step 2 reached */}
      {modelConfigured ? (
        <div style={{ background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: modelBg, transition: "background .5s" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.55))" }} />
            <span style={{ fontSize: 58, opacity: .5, position: "relative", zIndex: 1 }}>👩</span>
          </div>
          <div style={{ padding: "11px 14px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px", background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)", borderRadius: 12, fontSize: 10, color: "var(--gold)", fontFamily: "'DM Mono',monospace", marginBottom: 5 }}>
              {modelLabel}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--steel2)" }}>{modelDetail}</div>
          </div>
        </div>
      ) : (
        <div style={{
          border: "1.5px dashed rgba(255,255,255,.08)", borderRadius: "var(--r-lg)",
          padding: "22px 16px 18px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6, textAlign: "center",
          background: "rgba(255,255,255,.015)",
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: .2 }}>
            <circle cx="16" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ fontSize: 12, color: "var(--steel2)", fontWeight: 400 }}>No model selected yet</div>
          <div style={{ fontSize: 10, color: "var(--steel2)", opacity: .45, fontFamily: "'DM Mono',monospace", letterSpacing: ".04em" }}>Configure in Step 2 →</div>
        </div>
      )}

      {/* Frames */}
      <section style={{ display: "flex", flexDirection: "column" }}>
        <SectionLabel>Frames</SectionLabel>
        <Row label="Uploaded" value="3 frames ✓" gold={framesUploaded} unset={!framesUploaded} />
      </section>

      {/* Camera */}
      <section style={{ display: "flex", flexDirection: "column" }}>
        <SectionLabel>Camera</SectionLabel>
        <Row label="Shot style"  value={state.shotStyle}            gold   unset={!cameraConfigured} />
        <Row label="Lens"        value={`${state.lens}mm Portrait`} gold   unset={!cameraConfigured} />
        <Row label="Lighting"    value={state.lighting}                     unset={!cameraConfigured} />
        <Row label="Film grain"  value={state.grainLabel}                   unset={!cameraConfigured} />
      </section>

      {/* Scene */}
      <section style={{ display: "flex", flexDirection: "column" }}>
        <SectionLabel>Scene</SectionLabel>
        <Row label="Mood"        value={state.mood}                                       gold unset={!sceneConfigured} />
        <Row label="Background"  value={state.useCustomBg ? "Custom" : state.background}      unset={!sceneConfigured} />
      </section>

      {/* Credits */}
      <section style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        <SectionLabel>Credits</SectionLabel>
        <Row label="This shoot"     value={`${totalCost} credits`} gold />
        <Row label="Remaining after" value={String(remaining)} />
        <div style={{ height: 3, background: "var(--panel)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${barWidth}%`, background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2, transition: "width .4s" }} />
        </div>
      </section>
    </aside>
  )
}
