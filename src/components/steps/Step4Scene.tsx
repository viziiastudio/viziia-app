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

const MOODS = [
  { name: "Editorial",  emoji: "🎬", cls: "mood-ed" },
  { name: "Lifestyle",  emoji: "🌅", cls: "mood-li" },
  { name: "Luxury",     emoji: "✨", cls: "mood-lu" },
  { name: "Fashion",    emoji: "💜", cls: "mood-fa" },
  { name: "Minimal",    emoji: "◻️", cls: "mood-mi" },
  { name: "Sport",      emoji: "🏃", cls: "mood-sp" },
  { name: "Vintage",    emoji: "🎞️", cls: "mood-vi" },
  { name: "Clinical",   emoji: "🏥", cls: "mood-cl" },
  { name: "Futuristic", emoji: "🚀", cls: "mood-fu" },
  { name: "Natural",    emoji: "🌿", cls: "mood-na" },
]

const BG_SECTIONS: { label: string; items: { name: string; cls: string; textColor?: string }[] }[] = [
  { label: "Studio", items: [
    { name: "White seamless", cls: "bg-white-scene" },
    { name: "Grey backdrop",  cls: "bg-gray-scene" },
    { name: "Black cyclorama",cls: "bg-black-scene", textColor: "rgba(255,255,255,.45)" },
    { name: "Warm gradient",  cls: "bg-warm-scene" },
  ]},
  { label: "Outdoors", items: [
    { name: "Golden hour", cls: "bg-golden-scene" },
    { name: "Blue hour",   cls: "bg-blue-scene" },
    { name: "Coastal",     cls: "bg-coastal-scene" },
    { name: "Forest",      cls: "bg-forest-scene" },
  ]},
  { label: "Urban", items: [
    { name: "Street",      cls: "bg-street-scene" },
    { name: "Neon night",  cls: "bg-neon-scene" },
    { name: "Desert road", cls: "bg-desert-scene" },
    { name: "Architecture",cls: "bg-geo-scene" },
  ]},
  { label: "Abstract", items: [
    { name: "Mineral",    cls: "bg-mineral-scene" },
    { name: "Fog",        cls: "bg-fog-scene", textColor: "#555" },
    { name: "Bold color", cls: "bg-bold-scene", textColor: "rgba(180,210,255,.8)" },
    { name: "Cyclorama",  cls: "bg-cyc-scene", textColor: "#555" },
  ]},
]

const PROMPT_EXAMPLES = [
  { label: "🌆 Dubai rooftop",  text: "Rooftop terrace in Dubai at golden hour, city skyline in the background" },
  { label: "🪨 Zen garden",      text: "Minimalist Japanese zen garden, raked white gravel, soft diffused light" },
  { label: "☕ Parisian café",   text: "Parisian café interior, warm golden light, blurred background" },
  { label: "🏛️ Hotel lobby",     text: "Luxury hotel lobby, marble floors, dramatic chandeliers" },
  { label: "🏔️ Mountains",       text: "Snowy mountain peak, crisp blue sky, natural cold light" },
  { label: "🌊 Underwater",      text: "Underwater scene, light rays through turquoise water" },
  { label: "🖼️ Art gallery",     text: "Modernist art gallery, white walls, spot lighting" },
  { label: "🎌 Tokyo night",     text: "Night market in Tokyo, neon signs reflecting on wet pavement" },
]

export default function Step4Scene({ state, update }: Props) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--bdr)" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 6, display: "block", opacity: .7 }}>Step 04 / 05</span>
        <h1 className="serif" style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, color: "var(--paper)" }}>
          Set the <em style={{ color: "var(--gold)", fontStyle: "italic" }}>scene</em>
        </h1>
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--steel)", fontWeight: 300, lineHeight: 1.7 }}>
          Select a campaign mood and background. Pre-engineered lighting — no prompt writing needed.
        </p>
      </div>

      <BlurFade delay={0.05}>
        <Card>
          <CardHeader icon="🎭" title="Campaign Mood" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
              {MOODS.map(m => (
                <div key={m.name} onClick={() => update({ mood: m.name })}
                  style={{ borderRadius: 9, overflow: "hidden", cursor: "pointer", border: `2px solid ${state.mood === m.name ? "var(--gold)" : "transparent"}`, boxShadow: state.mood === m.name ? "0 0 0 1px var(--gold)" : "none", transition: "all .2s" }}>
                  <div className={m.cls} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{m.emoji}</div>
                  <div style={{ padding: "4px 3px", fontSize: 8.5, textAlign: "center", background: "var(--panel)", color: state.mood === m.name ? "var(--gold)" : "var(--paper2)", fontWeight: 500 }}>{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.1}>
        <Card>
          <CardHeader icon="🖼️" title="Background Environment" />
          <div style={{ padding: 14 }}>
            {BG_SECTIONS.map(sec => (
              <div key={sec.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
                  {sec.label}
                  <div style={{ flex: 1, height: 1, background: "var(--bdr2)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
                  {sec.items.map(bg => (
                    <div key={bg.name} onClick={() => update({ background: bg.name, useCustomBg: false })}
                      style={{ borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${state.background === bg.name && !state.useCustomBg ? "var(--gold)" : "transparent"}`, boxShadow: state.background === bg.name && !state.useCustomBg ? "0 0 0 1px var(--gold)" : "none", aspectRatio: "4/3", position: "relative", transition: "all .2s" }}>
                      <div className={bg.cls} style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", padding: 4, position: "relative" }}>
                        {state.background === bg.name && !state.useCustomBg && (
                          <div style={{ position: "absolute", top: 3, right: 3, width: 14, height: 14, background: "var(--gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, color: "var(--ink)", fontWeight: 800, lineHeight: "14px", textAlign: "center" }}>✓</div>
                        )}
                        <span style={{ fontSize: 7.5, color: bg.textColor ?? "rgba(255,255,255,.88)", fontWeight: 500, textShadow: "0 1px 3px rgba(0,0,0,.95)" }}>{bg.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Custom BG */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 8.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
                Your Own
                <div style={{ flex: 1, height: 1, background: "var(--bdr2)" }} />
              </div>
              <div style={{ borderRadius: 11, border: `1.5px ${customOpen ? "solid" : "dashed"} ${customOpen ? "var(--gold-bdr)" : "var(--bdr)"}`, background: "var(--panel)", overflow: "hidden", transition: "border-color .2s" }}>
                <div onClick={() => setCustomOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", cursor: "pointer" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>✍️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: customOpen ? "var(--gold)" : "var(--paper2)", marginBottom: 2 }}>Describe your own background</div>
                    <div style={{ fontSize: 9.5, color: "var(--steel2)" }}>Type any scene — the AI will build it for you</div>
                  </div>
                  <span style={{ fontSize: 12, color: customOpen ? "var(--gold)" : "var(--steel2)", transform: customOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
                </div>
                {customOpen && (
                  <div style={{ padding: "0 13px 14px", borderTop: "1px solid var(--bdr2)" }} onClick={e => e.stopPropagation()}>
                    <textarea
                      value={state.customBg}
                      onChange={e => update({ customBg: e.target.value, useCustomBg: true })}
                      placeholder="e.g. A warm Parisian café at sunset, wooden tables, soft golden light coming through the windows…"
                      rows={3}
                      style={{ width: "100%", marginTop: 11, background: "var(--ink2)", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--paper)", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 300, outline: "none", padding: "11px 13px", resize: "none", lineHeight: 1.65, minHeight: 80, transition: "border-color .2s" }}
                      onFocus={e => (e.target.style.borderColor = "var(--gold-bdr2)")}
                      onBlur={e => (e.target.style.borderColor = "var(--bdr)")}
                    />
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 8.5, fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", color: "var(--steel2)", textTransform: "uppercase", marginBottom: 7 }}>Quick examples — tap to use</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {PROMPT_EXAMPLES.map(p => (
                          <div key={p.label} onClick={() => update({ customBg: p.text, useCustomBg: true })}
                            style={{ fontSize: 9.5, padding: "5px 10px", borderRadius: 20, border: "1px solid var(--bdr)", background: "var(--panel2)", color: "var(--steel)", cursor: "pointer", lineHeight: 1.3, transition: "all .18s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-bdr)"; (e.currentTarget as HTMLElement).style.color = "var(--gold)" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--bdr)"; (e.currentTarget as HTMLElement).style.color = "var(--steel)" }}
                          >
                            {p.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.15}>
        <Card>
          <CardHeader icon="🎨" title="Color Palette Override" />
          <div style={{ padding: 14 }}>
            <div style={{ background: "rgba(20,40,70,.25)", border: "1px solid rgba(30,60,100,.4)", borderLeft: "2px solid var(--accent2)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65, marginBottom: 12 }}>
              Override scene colors with your brand palette — applied to background tones and atmosphere.
            </div>
            {[
              { label: "Background", colors: ["#f5f5f5","#e8d5b7","#c4956a","#2a4a6b","#1a0530","#000"], key: "bgColor" as const },
              { label: "Light Color", colors: ["#fff","#fff5e0","#e0f0ff","#c9a84c","#7a3a8a"], key: "lightColor" as const },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: "var(--steel2)", fontFamily: "'DM Mono',monospace", width: 66, flexShrink: 0 }}>{row.label}</span>
                <div style={{ display: "flex", gap: 5 }}>
                  {row.colors.map(c => (
                    <div key={c} onClick={() => update({ [row.key]: c })}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: `2px solid ${state[row.key] === c ? "rgba(255,255,255,.75)" : "transparent"}`, boxShadow: state[row.key] === c ? `0 0 0 2px var(--ink), 0 0 0 3.5px rgba(255,255,255,.55)` : "none", transition: "all .18s" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </BlurFade>
    </div>
  )
}
