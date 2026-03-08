import { useState } from "react"
import type { ViziiaState } from "@/types"
import { BlurFade } from "@/components/ui/blur-fade"

interface Props { state: ViziiaState; update: (p: Partial<ViziiaState>) => void }

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 10 }}>{children}</div>
}
function CardHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--bdr2)", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(180deg,rgba(255,255,255,.025) 0%,transparent 100%)" }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--panel)", border: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--paper2)" }}>{title}</span>
    </div>
  )
}
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: active ? "var(--gold-dim2)" : "var(--panel)", fontSize: 11, color: active ? "var(--gold)" : "var(--steel)", cursor: "pointer", transition: "all .16s", whiteSpace: "nowrap" }}>
      {label}
    </div>
  )
}
function CustomSlider({ label, value, min, max, step, displayVal, onChange }: { label: string; value: number; min: number; max: number; step?: number; displayVal: string; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min) * 100)

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const raw = (touch.clientX - rect.left) / rect.width * (max - min) + min
    const s = step ?? 1
    const snapped = Math.round(raw / s) * s
    onChange(Math.max(min, Math.min(max, snapped)))
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>{label}</span>
        <span style={{ fontSize: 11, color: "var(--gold)", fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{displayVal}</span>
      </div>
      <div
        style={{ position: "relative", height: 28, touchAction: "none" }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      >
        <div style={{ position: "absolute", top: 12, left: 0, right: 0, height: 4, background: "var(--panel)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2 }} />
        </div>
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: 18, height: 18, borderRadius: "50%", background: "var(--gold)", border: "2px solid var(--ink)", boxShadow: "0 1px 6px rgba(0,0,0,.5)", pointerEvents: "none" }} />
        <input type="range" min={min} max={max} step={step ?? 1} value={value} onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      </div>
    </div>
  )
}

const GRAIN_LABELS = [[0,"Clean"],[20,"Light"],[40,"Medium"],[70,"Heavy"],[90,"Cinematic"]] as [number,string][]
const DOF_STEPS = [[0,"f/1.4 — Bokeh"],[20,"f/2.0 — Shallow"],[45,"f/4 — Medium"],[65,"f/8 — Deep"],[82,"f/16 — Sharp"]] as [number,string][]

function grainLabel(v: number) { let l="Clean"; GRAIN_LABELS.forEach(([t,n])=>{ if(v>=t) l=n }); return l }
function dofLabel(v: number) { let l="f/1.4 — Bokeh"; DOF_STEPS.forEach(([t,n])=>{ if(v>=t) l=n }); return l }
function tempLabel(v: number) { if(v<30) return "Cool"; if(v<45) return "Slightly cool"; if(v<=55) return "Neutral"; if(v<70) return "Slightly warm"; return "Warm" }

const SHOT_CARDS = [
  { name: "Close-Up",   emoji: "🔍", desc: "Face & neck only. Maximum eyewear detail.", style: { bottom: 0, fontSize: 22 } },
  { name: "Upper Body", emoji: "🧍", desc: "Chest to head. Perfect for eyewear close-ups.", style: { bottom: 0 } },
  { name: "3/4 Shot",   emoji: "🧍", desc: "Mid-thigh to head. Shows frame proportions naturally.", style: { bottom: 0, fontSize: 28 } },
  { name: "Full Body",  emoji: "🧍", desc: "Head to toe. Lifestyle & fashion campaigns.", style: { bottom: "-6px", fontSize: 40 } },
  { name: "Seated",     emoji: "🪑", desc: "Sitting pose. Relaxed, editorial feel.", style: { bottom: 0, fontSize: 22 } },
  { name: "Low Angle",  emoji: "🧍", desc: "Camera below eye level. Powerful & dominant.", style: { bottom: "-6px", fontSize: 40, transform: "perspective(60px) rotateX(8deg)" } },
]

export default function Step3Camera({ state, update }: Props) {
  const [flashMode, setFlashMode] = useState(state.flashMode)
  const [lensEffect, setLensEffect] = useState(state.lensEffect)

  return (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--bdr)" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 6, display: "block", opacity: .7 }}>Step 03 / 05</span>
        <h1 className="serif" style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, color: "var(--paper)" }}>
          Configure the <em style={{ color: "var(--gold)", fontStyle: "italic" }}>camera</em>
        </h1>
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--steel)", fontWeight: 300, lineHeight: 1.7 }}>
          Set shot style, lens, lighting, and film parameters. Every setting is pre-engineered for eyewear.
        </p>
      </div>

      <BlurFade delay={0.05}>
        <Card>
          <CardHeader icon="📸" title="Shot Style" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
              {SHOT_CARDS.map(s => (
                <div key={s.name} onClick={() => update({ shotStyle: s.name })}
                  style={{ border: `1.5px solid ${state.shotStyle === s.name ? "var(--gold)" : "var(--bdr)"}`, borderRadius: 11, background: state.shotStyle === s.name ? "rgba(201,168,76,.07)" : "var(--panel)", cursor: "pointer", padding: "12px 11px 11px", transition: "all .2s", position: "relative", overflow: "hidden", boxShadow: state.shotStyle === s.name ? "0 0 0 1px var(--gold)" : "none" }}>
                  <div style={{ height: 46, borderRadius: 7, marginBottom: 9, overflow: "hidden", display: "flex", alignItems: "flex-end", justifyContent: "center", position: "relative", background: "linear-gradient(180deg,var(--panel2) 0%,var(--ink2) 100%)", border: "1px solid var(--bdr2)" }}>
                    <span style={{ fontSize: 26, lineHeight: 1, position: "absolute", ...s.style }}>{s.emoji}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: state.shotStyle === s.name ? "var(--gold)" : "var(--paper2)", marginBottom: 3 }}>{s.name}</div>
                  <div style={{ fontSize: 9.5, color: "var(--steel2)", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.1}>
        <Card>
          <CardHeader icon="📷" title="Focal Length" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, marginBottom: 10 }}>
              {[["35mm","Wide"],["50mm","Standard"],["85mm","Portrait"],["105mm","Telephoto"]].map(([mm,ln]) => (
                <div key={mm} onClick={() => update({ lens: mm.replace("mm","") })}
                  style={{ padding: "9px 4px", borderRadius: 8, border: `1px solid ${state.lens === mm.replace("mm","") ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: state.lens === mm.replace("mm","") ? "var(--gold-dim2)" : "var(--panel)", textAlign: "center", cursor: "pointer", transition: "all .17s" }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: state.lens === mm.replace("mm","") ? "var(--gold)" : "var(--paper)", display: "block" }}>{mm}</span>
                  <span style={{ fontSize: 8, color: state.lens === mm.replace("mm","") ? "var(--gold)" : "var(--steel2)", display: "block", marginTop: 2, opacity: state.lens === mm.replace("mm","") ? .7 : 1 }}>{ln}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(20,40,70,.25)", border: "1px solid rgba(30,60,100,.4)", borderLeft: "2px solid var(--accent2)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65 }}>
              <strong style={{ color: "#6aacde" }}>{state.lens}mm</strong> — flattering compression, soft bokeh, ideal for eyewear close-ups.
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.15}>
        <Card>
          <CardHeader icon="💡" title="Lighting Setup" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[["☀️","Natural"],["🎭","Soft Box"],["⬛","Dramatic"],["🌙","Backlit"],["⭕","Rim Light"]].map(([e,n]) => (
                <div key={n} onClick={() => update({ lighting: n })}
                  style={{ flex: 1, minWidth: 52, padding: "10px 4px", borderRadius: 8, border: `1px solid ${state.lighting === n ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: state.lighting === n ? "var(--gold-dim2)" : "var(--panel)", textAlign: "center", cursor: "pointer", transition: "all .17s" }}>
                  <span style={{ fontSize: 16, display: "block", marginBottom: 3 }}>{e}</span>
                  <span style={{ fontSize: 8.5, color: state.lighting === n ? "var(--gold)" : "var(--steel2)", letterSpacing: ".03em" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.2}>
        <Card>
          <CardHeader icon="🎞️" title="Film & Exposure" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 20 }}>
            <CustomSlider label="Film Grain" value={state.grain} min={0} max={100} displayVal={state.grainLabel}
              onChange={v => update({ grain: v, grainLabel: grainLabel(v) })} />
            <CustomSlider label="Exposure" value={state.exposure} min={-2} max={2} step={0.25} displayVal={`${state.exposure === 0 ? "0" : state.exposure > 0 ? "+" + state.exposure : state.exposure} EV`}
              onChange={v => update({ exposure: v })} />
            <CustomSlider label="Color Temperature" value={state.temperature} min={0} max={100} displayVal={tempLabel(state.temperature)}
              onChange={v => update({ temperature: v, temperatureLabel: tempLabel(v) })} />
            <CustomSlider label="Depth of Field" value={state.dof} min={0} max={100} displayVal={state.dofLabel}
              onChange={v => update({ dof: v, dofLabel: dofLabel(v) })} />
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.25}>
        <Card>
          <CardHeader icon="⚡" title="Flash & Effects" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8, display: "block" }}>Flash Mode</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {["No flash","Fill flash","Hard flash","Ring flash"].map(f => (
                    <Chip key={f} label={f} active={flashMode === f} onClick={() => { setFlashMode(f); update({ flashMode: f }) }} />
                  ))}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8, display: "block" }}>Lens Effect</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {["None","Lens flare","Chromatic","Vignette"].map(f => (
                    <Chip key={f} label={f} active={lensEffect === f} onClick={() => { setLensEffect(f); update({ lensEffect: f }) }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>
    </div>
  )
}
