import type { ViziiaState } from "@/types"
import { BlurFade } from "@/components/ui/blur-fade"

interface Props { state: ViziiaState; update: (p: Partial<ViziiaState>) => void }

const SAVED_MODELS = [
  { name: "Sofia",  meta: "European F · 28y · Oval",   bg: "linear-gradient(135deg,#1a1a2e,#16213e)", emoji: "👩",   badge: "LAST USED", badgeClass: "used" },
  { name: "Marcus", meta: "East Asian M · 34y · Square", bg: "linear-gradient(135deg,#0d1b2a,#00bcd4)", emoji: "🧑",   badge: "RECENT",    badgeClass: "recent" },
  { name: "Amara",  meta: "African F · 25y · Heart",    bg: "linear-gradient(135deg,#3e2723,#c9a84c)", emoji: "👩🏾", badge: "RECENT",    badgeClass: "recent" },
]

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 10, ...style }}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, value }: { icon: string; title: string; value?: string }) {
  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--bdr2)", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(180deg,rgba(255,255,255,.025) 0%,transparent 100%)" }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--panel)", border: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--paper2)" }}>{title}</span>
      {value && <span style={{ marginLeft: "auto", fontSize: 9.5, fontFamily: "'DM Mono',monospace", color: "var(--gold)" }}>{value}</span>}
    </div>
  )
}

function ParamRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid var(--bdr2)" }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{children}</div>
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${active ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: active ? "var(--gold-dim2)" : "var(--panel)", fontSize: 10.5, color: active ? "var(--gold)" : "var(--steel)", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
      {label}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--bdr2)", cursor: "pointer" }}>
      <span style={{ fontSize: 11, color: value ? "var(--paper)" : "var(--steel)", transition: "color .15s" }}>{label}</span>
      <div style={{ width: 34, height: 18, borderRadius: 9, background: value ? "var(--gold)" : "var(--panel3)", border: `1px solid ${value ? "var(--gold)" : "var(--bdr)"}`, position: "relative", transition: "all .2s", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: value ? 17 : 2, width: 12, height: 12, borderRadius: "50%", background: value ? "var(--ink)" : "var(--steel2)", transition: "left .18s" }} />
      </div>
    </div>
  )
}

const AGE_STEPS = [20, 25, 30, 35, 40, 45, 50, 55, 60]

function AgeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const idx = AGE_STEPS.indexOf(value) !== -1 ? AGE_STEPS.indexOf(value) : AGE_STEPS.findIndex(s => s >= value)
  const safeIdx = Math.max(0, Math.min(idx === -1 ? AGE_STEPS.length - 1 : idx, AGE_STEPS.length - 1))
  const pct = (safeIdx / (AGE_STEPS.length - 1)) * 100

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const raw = (touch.clientX - rect.left) / rect.width * (AGE_STEPS.length - 1)
    const newIdx = Math.max(0, Math.min(Math.round(raw), AGE_STEPS.length - 1))
    onChange(AGE_STEPS[newIdx])
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>Age</span>
        <span style={{ fontSize: 20, fontWeight: 300, color: "var(--gold)", fontFamily: "'Cormorant Garamond',serif", letterSpacing: "-.01em" }}>{AGE_STEPS[safeIdx]}<span style={{ fontSize: 11, marginLeft: 2, opacity: .6 }}>y</span></span>
      </div>
      <div
        style={{ position: "relative", height: 32, touchAction: "none" }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      >
        <div style={{ position: "absolute", top: 13, left: 0, right: 0, height: 6, background: "var(--panel3)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 3, transition: "width .05s" }} />
        </div>
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold-hi),var(--gold))", border: "3px solid var(--ink)", boxShadow: "0 2px 8px rgba(0,0,0,.6), 0 0 0 1px var(--gold-bdr2)", pointerEvents: "none", transition: "left .05s" }} />
        <input type="range" min={0} max={AGE_STEPS.length - 1} step={1} value={safeIdx}
          onChange={e => onChange(AGE_STEPS[parseInt(e.target.value)])}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {AGE_STEPS.map((a, i) => (
          <span key={a} style={{ fontSize: 7.5, color: i === safeIdx ? "var(--gold)" : "var(--steel2)", fontFamily: "'DM Mono',monospace", transition: "color .15s", lineHeight: 1 }}>{a}</span>
        ))}
      </div>
    </div>
  )
}

const FACE_SHAPES = [
  { name: "Oval",    path: "M16,4 Q28,4 28,16 Q28,30 16,32 Q4,30 4,16 Q4,4 16,4 Z" },
  { name: "Round",   path: "M16,4 Q29,4 29,16 Q29,28 16,28 Q3,28 3,16 Q3,4 16,4 Z" },
  { name: "Square",  path: "M5,4 H27 Q29,4 29,6 V26 Q29,28 27,28 H5 Q3,28 3,26 V6 Q3,4 5,4 Z" },
  { name: "Heart",   path: "M16,28 Q2,18 2,11 Q2,4 9,4 Q13,4 16,9 Q19,4 23,4 Q30,4 30,11 Q30,18 16,28 Z" },
  { name: "Long",    path: "M16,3 Q23,3 23,14 Q23,29 16,33 Q9,29 9,14 Q9,3 16,3 Z" },
  { name: "Diamond", path: "M16,3 L28,16 L16,29 L4,16 Z" },
]

const BODY_TYPES = ["Slim","Athletic","Average","Curvy","Plus"]

const HAIRCUT_OPTIONS: Record<string, string[]> = {
  Female:       ["Bob", "Pixie", "Long straight", "Wavy", "Braids", "Updo", "Curly"],
  "Non-binary": ["Bob", "Pixie", "Long straight", "Wavy", "Braids", "Updo", "Curly"],
  Male:         ["Buzz cut", "Crew cut", "Undercut", "Pompadour", "Curly", "Afro"],
}

const OUTFIT_TEMPLATES = ["Casual streetwear", "Business formal", "Summer dress", "Athleisure", "Evening gown", "Denim jacket"]

const MAKEUP_LEVELS = ["Natural", "Subtle", "Defined", "Bold", "Dramatic"]

function SkinSwatch({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, background: color, cursor: "pointer",
        border: "none", outline: "none",
        boxShadow: active ? "0 0 0 2px #c9a84c" : "none",
        transition: "box-shadow .15s",
      }} />
      <span style={{ fontSize: 7.5, color: active ? "var(--gold)" : "var(--steel2)", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap", transition: "color .15s" }}>{label}</span>
    </div>
  )
}

function HairSwatch({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} title={label} style={{
      width: 28, height: 28, borderRadius: 8, background: color, cursor: "pointer",
      border: "none", outline: "none", WebkitTapHighlightColor: "transparent",
      boxShadow: active ? "0 0 0 2px #c9a84c" : "none",
      transition: "box-shadow .15s",
    }} />
  )
}

function BodyTypeSlider({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const idx = BODY_TYPES.indexOf(value)
  const pct = (idx / (BODY_TYPES.length - 1)) * 100

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const touch = e.touches[0] || e.changedTouches[0]
    const raw = (touch.clientX - rect.left) / rect.width * (BODY_TYPES.length - 1)
    const newIdx = Math.max(0, Math.min(Math.round(raw), BODY_TYPES.length - 1))
    onChange(BODY_TYPES[newIdx])
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>Body Type</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--gold)", fontFamily: "'Outfit',sans-serif" }}>{value}</span>
      </div>
      <div
        style={{ position: "relative", height: 32, touchAction: "none" }}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
      >
        <div style={{ position: "absolute", top: 13, left: 0, right: 0, height: 6, background: "var(--panel3)", borderRadius: 3 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 3, transition: "width .15s" }} />
        </div>
        {BODY_TYPES.map((_, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: `${(i / (BODY_TYPES.length - 1)) * 100}%`, transform: "translate(-50%,-50%)", width: i === idx ? 22 : 10, height: i === idx ? 22 : 10, borderRadius: "50%", background: i <= idx ? (i === idx ? "linear-gradient(135deg,var(--gold-hi),var(--gold))" : "var(--gold)") : "var(--panel3)", border: i === idx ? "3px solid var(--ink)" : "1.5px solid var(--bdr)", boxShadow: i === idx ? "0 2px 8px rgba(0,0,0,.6), 0 0 0 1px var(--gold-bdr2)" : "none", transition: "all .15s", cursor: "pointer", zIndex: 2 }} onClick={() => onChange(BODY_TYPES[i])} />
        ))}
        <input type="range" min={0} max={BODY_TYPES.length - 1} value={idx} onChange={e => onChange(BODY_TYPES[parseInt(e.target.value)])}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {BODY_TYPES.map((t, i) => (
          <span key={t} style={{ fontSize: 7.5, color: i === idx ? "var(--gold)" : "var(--steel2)", fontFamily: "'DM Mono',monospace", transition: "color .15s", cursor: "pointer" }} onClick={() => onChange(t)}>{t}</span>
        ))}
      </div>
    </div>
  )
}

function FaceShapeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, padding: "2px 0 6px" }}>
      {FACE_SHAPES.map(f => {
        const active = value === f.name
        return (
          <div key={f.name} onClick={() => onChange(f.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
            <div style={{
              width: 40, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(201,168,76,.12)" : "var(--panel3)",
              border: `1.5px solid ${active ? "var(--gold)" : "var(--bdr)"}`,
              boxShadow: active ? "0 0 0 1px var(--gold-bdr)" : "none",
              transition: "all .18s", overflow: "visible",
            }}>
              <svg viewBox="0 0 32 36" width={22} height={24} overflow="visible">
                <path d={f.path} fill={active ? "rgba(201,168,76,.35)" : "rgba(255,255,255,.08)"} stroke={active ? "var(--gold)" : "rgba(255,255,255,.2)"} strokeWidth={1.5} />
              </svg>
            </div>
            <span style={{ fontSize: 7.5, color: active ? "var(--gold)" : "var(--steel2)", fontFamily: "'DM Mono',monospace", transition: "color .15s" }}>{f.name}</span>
          </div>
        )
      })}
    </div>
  )
}

function ModelBuilder({ state, update }: Props) {
  const haircutOptions = HAIRCUT_OPTIONS[state.modelGender] ?? HAIRCUT_OPTIONS["Female"]

  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 11, overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--bdr2)", background: "linear-gradient(180deg,rgba(255,255,255,.025) 0%,transparent 100%)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>🎨</span>
        <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--paper2)" }}>Configure New Model</span>
      </div>
      <div style={{ padding: "4px 14px 14px" }}>

        {/* — IDENTITY — */}
        <ParamRow label="Gender">
          {["Female","Male","Non-binary"].map(v => <Chip key={v} label={v} active={state.modelGender === v} onClick={() => update({ modelGender: v, modelHaircutType: "" })} />)}
        </ParamRow>
        <ParamRow label="Ethnicity">
          {["European","East Asian","South Asian","African","Latino","Middle Eastern","Mixed"].map(v => <Chip key={v} label={v} active={state.modelEthnicity === v} onClick={() => update({ modelEthnicity: v })} />)}
        </ParamRow>

        {/* Age slider — snapped values */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <AgeSlider value={state.modelAge} onChange={v => update({ modelAge: v })} />
        </div>

        {/* Face shape */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Face Shape</div>
          <FaceShapeSelector value={state.modelFaceShape} onChange={v => update({ modelFaceShape: v })} />
        </div>

        {/* Skin tone */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>Skin Tone</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Very Fair", color: "#f7e8d8" },
              { label: "Fair",      color: "#f0d0b0" },
              { label: "Medium",    color: "#c8956c" },
              { label: "Olive",     color: "#a07850" },
              { label: "Brown",     color: "#7a5230" },
              { label: "Deep",      color: "#3a2010" },
            ].map(c => <SkinSwatch key={c.label} color={c.color} label={c.label} active={state.modelSkinTone === c.color} onClick={() => update({ modelSkinTone: c.color })} />)}
          </div>
        </div>

        {/* Hair color */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>Hair Color</span>
            <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'DM Mono',monospace" }}>{state.modelHairColor}</span>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {[
              { label: "Black",      color: "#1a1a1a" },
              { label: "Dark Brown", color: "#3b2314" },
              { label: "Brown",      color: "#7b4f2e" },
              { label: "Auburn",     color: "#8b3a2a" },
              { label: "Blonde",     color: "#d4aa5a" },
              { label: "Red",        color: "#c0392b" },
              { label: "Grey",       color: "#9e9e9e" },
              { label: "White",      color: "#f0f0f0" },
            ].map(c => <HairSwatch key={c.label} color={c.color} label={c.label} active={state.modelHairColor === c.label} onClick={() => update({ modelHairColor: c.label })} />)}
          </div>
        </div>

        <ParamRow label="Hair Length">
          {["Buzz","Short","Bob","Medium","Long","Bun/Up"].map(v => <Chip key={v} label={v} active={state.modelHairLength === v} onClick={() => update({ modelHairLength: v })} />)}
        </ParamRow>

        {/* Haircut type — gender-aware */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Haircut Style</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {haircutOptions.map(v => (
              <Chip key={v} label={v} active={state.modelHaircutType === v} onClick={() => update({ modelHaircutType: v })} />
            ))}
          </div>
        </div>

        {/* Eye color */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace" }}>Eye Color</span>
            <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'DM Mono',monospace" }}>{state.modelEyeColor}</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {[
              { label: "Brown", color: "#5c3a1e" },
              { label: "Dark",  color: "#1a1a1a" },
              { label: "Hazel", color: "#7b6232" },
              { label: "Green", color: "#3a7d44" },
              { label: "Blue",  color: "#3a6bab" },
              { label: "Grey",  color: "#7a8a9a" },
            ].map(c => <HairSwatch key={c.label} color={c.color} label={c.label} active={state.modelEyeColor === c.label} onClick={() => update({ modelEyeColor: c.label })} />)}
          </div>
        </div>

        {/* Body type */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <BodyTypeSlider value={state.modelBodyType} onChange={v => update({ modelBodyType: v })} />
        </div>

        {/* — OUTFIT — */}
        <div style={{ padding: "10px 0", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Outfit</div>
          <input
            type="text"
            placeholder="Describe the outfit…"
            value={state.modelOutfit}
            onChange={e => update({ modelOutfit: e.target.value })}
            style={{
              width: "100%", background: "var(--panel3)", border: "1px solid var(--bdr)",
              borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper)",
              fontFamily: "'Outfit',sans-serif", outline: "none", marginBottom: 8,
              transition: "border-color .15s",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--gold-bdr2)")}
            onBlur={e => (e.target.style.borderColor = "var(--bdr)")}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {OUTFIT_TEMPLATES.map(t => (
              <div key={t} onClick={() => update({ modelOutfit: t })}
                style={{ padding: "3px 9px", borderRadius: 20, border: `1px solid ${state.modelOutfit === t ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: state.modelOutfit === t ? "var(--gold-dim2)" : "var(--panel3)", fontSize: 10, color: state.modelOutfit === t ? "var(--gold)" : "var(--steel)", cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* — STYLING — */}
        <div style={{ padding: "10px 0 4px", borderBottom: "1px solid var(--bdr2)" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Styling</div>

          {/* Makeup level */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "var(--paper2)" }}>Makeup</span>
              <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'DM Mono',monospace" }}>{MAKEUP_LEVELS[state.modelMakeup - 1]}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {MAKEUP_LEVELS.map((l, i) => (
                <div key={l} onClick={() => update({ modelMakeup: i + 1 })}
                  style={{ flex: 1, height: 28, borderRadius: 6, border: `1px solid ${state.modelMakeup === i + 1 ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: state.modelMakeup === i + 1 ? "var(--gold-dim2)" : "var(--panel3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}>
                  <span style={{ fontSize: 7.5, fontFamily: "'DM Mono',monospace", color: state.modelMakeup === i + 1 ? "var(--gold)" : "var(--steel2)", letterSpacing: ".03em" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <Toggle label="Earrings" value={state.modelEarrings} onChange={v => update({ modelEarrings: v })} />
          <Toggle label="Freckles" value={state.modelFreckles} onChange={v => update({ modelFreckles: v })} />
          <Toggle label="Natural skin texture" value={state.modelNaturalSkin} onChange={v => update({ modelNaturalSkin: v })} />
          <Toggle label="Visible neck & collarbones" value={state.modelNeckCollarbone} onChange={v => update({ modelNeckCollarbone: v })} />
          <div style={{ paddingTop: 2 }}>
            <Toggle label="Upper body crop" value={state.modelUpperBodyCrop} onChange={v => update({ modelUpperBodyCrop: v })} />
          </div>
        </div>

        {/* — EXPRESSION & POSE — */}
        <div style={{ padding: "10px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>Expression & Pose</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "var(--steel2)", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Expression</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["Neutral","Soft smile","Confident","Joyful","Serene"].map(v => (
                <Chip key={v} label={v} active={state.modelExpression === v} onClick={() => update({ modelExpression: v })} />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9, color: "var(--steel2)", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>Pose Angle</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {["Front","3/4 left","3/4 right","Profile"].map(v => (
                <Chip key={v} label={v} active={state.modelPoseAngle === v} onClick={() => update({ modelPoseAngle: v })} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button onClick={() => update({ modelMode: "saved" })} style={{ flex: 1, padding: "9px", background: "transparent", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--steel)", fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
          <button style={{ flex: 2, padding: "9px", background: "var(--gold)", border: "none", borderRadius: 8, color: "var(--ink)", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Save Model</button>
        </div>
      </div>
    </div>
  )
}

export default function Step2Model({ state, update }: Props) {
  const isNew = state.modelMode === "new"

  return (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--bdr)" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 6, display: "block", opacity: .7 }}>Step 02 / 05</span>
        <h1 className="serif" style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, color: "var(--paper)" }}>
          Choose or build a <em style={{ color: "var(--gold)", fontStyle: "italic" }}>model</em>
        </h1>
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--steel)", fontWeight: 300, lineHeight: 1.7 }}>
          Select a saved model for instant reuse — or configure a new one from scratch.
        </p>
      </div>

      <BlurFade delay={0.05}>
        <Card>
          <CardHeader icon="🗂️" title="Model Library" value="3 / 5 slots" />
          <div style={{ padding: 14 }}>
            {/* Plan notice */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", background: "rgba(201,168,76,.055)", border: "1px solid var(--gold-bdr)", borderRadius: 9, padding: "10px 12px", marginBottom: 14, gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: "var(--paper2)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--gold)" }}>Brand Plan</strong> — 5 saved models included
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[true,true,true,false,false].map((filled, i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: filled ? "var(--gold)" : "var(--bdr)", border: filled ? "none" : "1px solid rgba(255,255,255,.08)" }} />
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: "var(--steel)" }}>3 used</div>
                <span style={{ fontSize: 10, color: "#6aacde", cursor: "pointer" }}>Upgrade →</span>
              </div>
            </div>

            {/* Mode choice */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { mode: "saved" as const, icon: "🗂️", title: "Use saved model", desc: "Pick from your library. One click, done.", tag: "⚡ Instant" },
                { mode: "new"   as const, icon: "🎨", title: "Build new model",  desc: "Configure parameters from scratch.", tag: "Saveable" },
              ].map(c => (
                <div
                  key={c.mode}
                  onClick={() => update({ modelMode: c.mode })}
                  style={{
                    border: `1.5px solid ${state.modelMode === c.mode ? "var(--gold)" : "var(--bdr)"}`,
                    borderRadius: "var(--r-lg)",
                    background: state.modelMode === c.mode ? "rgba(201,168,76,.055)" : "var(--panel)",
                    cursor: "pointer", padding: "14px 12px", position: "relative", overflow: "hidden",
                    transition: "all .22s",
                    boxShadow: state.modelMode === c.mode ? "0 0 0 1px var(--gold)" : "none",
                  }}
                >
                  <div style={{ position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: "50%", background: state.modelMode === c.mode ? "var(--gold)" : "transparent", border: state.modelMode === c.mode ? "1.5px solid var(--gold)" : "1.5px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--ink)", fontWeight: 800 }}>
                    {state.modelMode === c.mode ? "✓" : ""}
                  </div>
                  <span style={{ fontSize: 22, marginBottom: 8, display: "block" }}>{c.icon}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: state.modelMode === c.mode ? "var(--gold)" : "var(--paper2)", marginBottom: 3 }}>{c.title}</div>
                  <div style={{ fontSize: 10, color: "var(--steel)", lineHeight: 1.55 }}>{c.desc}</div>
                  <div style={{ display: "inline-block", marginTop: 8, fontSize: 8, fontFamily: "'DM Mono',monospace", letterSpacing: ".07em", padding: "2px 7px", borderRadius: 10, border: `1px solid ${state.modelMode === c.mode ? "var(--gold-bdr)" : "var(--bdr)"}`, color: state.modelMode === c.mode ? "var(--gold)" : "var(--steel2)", background: state.modelMode === c.mode ? "rgba(201,168,76,.07)" : "transparent" }}>{c.tag}</div>
                </div>
              ))}
            </div>

            {/* Saved grid or new form */}
            {!isNew ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                  {SAVED_MODELS.map(m => (
                    <div
                      key={m.name}
                      onClick={() => update({ selectedModel: m.name, modelBg: m.bg })}
                      style={{
                        borderRadius: 10, border: `1.5px solid ${state.selectedModel === m.name ? "var(--gold)" : "var(--bdr)"}`,
                        background: state.selectedModel === m.name ? "rgba(201,168,76,.04)" : "var(--panel)",
                        cursor: "pointer", overflow: "hidden", position: "relative",
                        boxShadow: state.selectedModel === m.name ? "0 0 0 1px var(--gold)" : "none",
                        transition: "all .2s",
                      }}
                    >
                      {state.selectedModel === m.name && (
                        <div style={{ position: "absolute", top: 4, left: 4, width: 16, height: 16, background: "var(--gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "var(--ink)", fontWeight: 800, zIndex: 2 }}>✓</div>
                      )}
                      <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: m.bg, position: "relative" }}>
                        {m.emoji}
                      </div>
                      <div style={{ position: "absolute", top: 4, right: 4, fontSize: 7, fontFamily: "'DM Mono',monospace", padding: "2px 5px", borderRadius: 8, fontWeight: 600, background: m.badgeClass === "recent" ? "var(--success-d)" : "var(--gold-dim2)", color: m.badgeClass === "recent" ? "var(--success)" : "var(--gold)", border: `1px solid ${m.badgeClass === "recent" ? "rgba(34,197,94,.28)" : "var(--gold-bdr)"}` }}>
                          {m.badge}
                        </div>
                      <div style={{ padding: "7px 9px", borderTop: "1px solid var(--bdr2)" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--paper2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                        <div style={{ fontSize: 8.5, color: "var(--steel2)", marginTop: 2 }}>{m.meta}</div>
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => update({ modelMode: "new" })}
                    style={{ borderRadius: 10, border: "1.5px dashed var(--bdr)", background: "var(--panel)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px", gap: 4, minHeight: 90, transition: "all .2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold-bdr)"; (e.currentTarget as HTMLElement).style.background = "var(--gold-dim)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--bdr)"; (e.currentTarget as HTMLElement).style.background = "var(--panel)" }}
                  >
                    <div style={{ fontSize: 20, opacity: .35 }}>＋</div>
                    <div style={{ fontSize: 9, color: "var(--steel2)", textAlign: "center" }}>New<br /><span style={{ fontSize: 8.5, opacity: .6 }}>2 slots left</span></div>
                  </div>
                </div>
                <div style={{ background: "rgba(20,40,70,.25)", border: "1px solid rgba(30,60,100,.4)", borderLeft: "2px solid var(--accent2)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65, marginTop: 10 }}>
                  <strong style={{ color: "#6aacde" }}>Tip:</strong> Saved models keep shoots consistent — same face, new frames.
                </div>
              </div>
            ) : (
              <ModelBuilder state={state} update={update} />
            )}
          </div>
        </Card>
      </BlurFade>
    </div>
  )
}
