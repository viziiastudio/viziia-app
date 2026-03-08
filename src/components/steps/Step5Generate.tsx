import type { ViziiaState } from "@/types"
import { TOTAL_CREDITS, QUALITY_MULTS, QUALITY_INFO } from "@/types"
import { BlurFade } from "@/components/ui/blur-fade"

interface Props { state: ViziiaState; update: (p: Partial<ViziiaState>) => void }

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 10 }}>{children}</div>
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

const INTENTS = [
  { label: "Quick Test",    emoji: "🧪", qty: 3,  desc: "Validate how this frame looks before a full shoot.", tags: ["First look","Internal"] },
  { label: "Social Media",  emoji: "📱", qty: 8,  desc: "Feed posts, stories, and a hero shot for launch week.", tags: ["Instagram","Stories"] },
  { label: "Website Page",  emoji: "🌐", qty: 12, desc: "Hero image, multiple angles, lifestyle context shot.", tags: ["E-commerce","Gallery"] },
  { label: "Full Campaign", emoji: "📣", qty: 20, desc: "Social, web, ads, newsletters & press kit in one shoot.", tags: ["Seasonal","Ads"] },
]

const FORMATS = [
  { ratio: "1:1",  name: "Square",     use: "Instagram · Grid",    w: 24, h: 24 },
  { ratio: "4:5",  name: "Portrait",   use: "Instagram portrait",  w: 20, h: 25 },
  { ratio: "9:16", name: "Story",      use: "Stories · Reels",     w: 14, h: 25 },
  { ratio: "3:2",  name: "Classic",    use: "Print · Editorial",   w: 26, h: 17 },
  { ratio: "16:9", name: "Widescreen", use: "Hero · YouTube",      w: 28, h: 16 },
  { ratio: "21:9", name: "Cinematic",  use: "Email · Billboard",   w: 30, h: 13 },
]

const QUALITIES = [
  { res: "1K", px: "1024 × 1280 px", label: "Draft",    mult: "×1", badge: "FAST", badgeColor: "var(--success)" },
  { res: "2K", px: "2048 × 2560 px", label: "Standard", mult: "×1", badge: null },
  { res: "4K", px: "4096 × 5120 px", label: "High Res", mult: "×2", badge: "PRO", badgeColor: "var(--gold)" },
  { res: "8K", px: "8192×10240 px",  label: "Max Print", mult: "×4", badge: "PRO", badgeColor: "var(--gold)" },
]

const QTY_BTNS = [3,5,8,10,12,15,20,30]

export default function Step5Generate({ state, update }: Props) {
  const qualityMult = QUALITY_MULTS[state.quality] ?? 1
  const totalCost = state.qty * qualityMult
  const remaining = TOTAL_CREDITS - totalCost

  return (
    <div>
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--bdr)" }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".18em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 6, display: "block", opacity: .7 }}>Step 05 / 05</span>
        <h1 className="serif" style={{ fontSize: 30, fontWeight: 300, lineHeight: 1.15, color: "var(--paper)" }}>
          Review &amp; <em style={{ color: "var(--gold)", fontStyle: "italic" }}>generate</em>
        </h1>
        <p style={{ marginTop: 6, fontSize: 12, color: "var(--steel)", fontWeight: 300, lineHeight: 1.7 }}>
          Preview 2 images first at no extra cost — approve before committing credits.
        </p>
      </div>

      <BlurFade delay={0}>
        <Card>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--bdr2)", display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(180deg,rgba(255,255,255,.025) 0%,transparent 100%)" }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--panel)", border: "1px solid var(--bdr)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✨</div>
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--paper2)" }}>What to expect</span>
            <span style={{ marginLeft: "auto", fontSize: 9.5, fontFamily: "'DM Mono',monospace", color: "var(--steel2)" }}>⏱ ~45 seconds</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { caption: "Portrait · Editorial" },
                { caption: "Detail · Product" },
                { caption: "Lifestyle · Context" },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{
                    width: "100%",
                    aspectRatio: state.format.replace(":", " / "),
                    background: `linear-gradient(${135 + i * 20}deg, var(--panel3), var(--panel))`,
                    border: "1px solid var(--bdr)",
                    borderRadius: 8,
                    overflow: "hidden",
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
                      background: "linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)",
                      animation: "shimmer 3s ease infinite",
                      animationDelay: `${i * 0.4}s`,
                    }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: .08, fontSize: 24 }}>🕶️</div>
                  </div>
                  <span style={{ fontSize: 8.5, color: "var(--steel2)", fontFamily: "'DM Mono',monospace", textAlign: "center", letterSpacing: ".04em" }}>{item.caption}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.05}>
        <Card>
          <CardHeader icon="🎯" title="What are these visuals for?" value={state.intent} />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 10 }}>
              {INTENTS.map(intent => (
                <div key={intent.label}
                  onClick={() => update({ intent: intent.label, qty: intent.qty })}
                  style={{ border: `1.5px solid ${state.intent === intent.label ? "var(--gold)" : "var(--bdr)"}`, borderRadius: "var(--r-lg)", background: state.intent === intent.label ? "rgba(201,168,76,.055)" : "var(--panel)", cursor: "pointer", padding: "12px", transition: "all .2s", position: "relative", overflow: "hidden" }}>
                  {state.intent === intent.label && <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "var(--gold)" }} />}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 7 }}>
                    <span style={{ fontSize: 17, lineHeight: 1 }}>{intent.emoji}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 600, color: state.intent === intent.label ? "var(--gold)" : "var(--steel)", background: state.intent === intent.label ? "var(--gold-dim2)" : "var(--panel2)", border: `1px solid ${state.intent === intent.label ? "var(--gold-bdr)" : "var(--bdr)"}`, borderRadius: 5, padding: "2px 7px" }}>{intent.qty} visuals</span>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: state.intent === intent.label ? "var(--gold)" : "var(--paper2)", marginBottom: 3 }}>{intent.label}</div>
                  <div style={{ fontSize: 9.5, color: "var(--steel)", lineHeight: 1.5, marginBottom: 7 }}>{intent.desc}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {intent.tags.map(t => <span key={t} style={{ fontSize: 8, padding: "2px 6px", background: state.intent === intent.label ? "rgba(201,168,76,.05)" : "var(--panel2)", border: `1px solid ${state.intent === intent.label ? "var(--gold-bdr)" : "var(--bdr)"}`, borderRadius: 8, color: state.intent === intent.label ? "var(--gold)" : "var(--steel2)", opacity: state.intent === intent.label ? .7 : 1 }}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom qty row */}
            <div style={{ border: "1.5px dashed var(--bdr)", borderRadius: "var(--r-lg)", padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--panel)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>✏️</span>
                <span style={{ fontSize: 11, color: "var(--steel)" }}>Custom quantity</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="number" min={1} max={150} value={state.qty}
                  onChange={e => update({ qty: parseInt(e.target.value) || 1, intent: "Custom" })}
                  style={{ width: 48, background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: 6, color: "var(--paper)", fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 600, outline: "none", textAlign: "center", padding: "4px 5px" }} />
                <span style={{ fontSize: 10, color: "var(--steel)" }}>visuals</span>
              </div>
            </div>

            {/* Fine-tune qty */}
            <div style={{ marginTop: 0 }}>
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 9, display: "block" }}>
                Fine-tune — <span style={{ color: "var(--gold)" }}>{state.qty} visuals</span>
              </span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {QTY_BTNS.map(n => (
                  <div key={n} onClick={() => update({ qty: n, intent: INTENTS.find(i => i.qty === n)?.label ?? state.intent })}
                    style={{ flex: 1, minWidth: 36, padding: "8px 4px", borderRadius: 7, border: `1px solid ${state.qty === n ? "var(--gold-bdr2)" : "var(--bdr)"}`, background: state.qty === n ? "var(--gold-dim2)" : "var(--panel)", color: state.qty === n ? "var(--gold)" : "var(--steel2)", fontSize: 11, fontFamily: "'DM Mono',monospace", cursor: "pointer", textAlign: "center", transition: "all .17s" }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.1}>
        <Card>
          <CardHeader icon="📐" title="Output Format" value={`${state.format} ${state.formatLabel}`} />
          <div style={{ padding: 14 }}>
            <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 10, display: "block" }}>Aspect Ratio</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {FORMATS.map(f => (
                <div key={f.ratio} onClick={() => update({ format: f.ratio, formatLabel: f.name })}
                  style={{ border: `1.5px solid ${state.format === f.ratio ? "var(--gold)" : "var(--bdr)"}`, borderRadius: 10, background: state.format === f.ratio ? "rgba(201,168,76,.07)" : "var(--panel)", cursor: "pointer", padding: "11px 8px", transition: "all .18s", position: "relative", textAlign: "center", overflow: "hidden", boxShadow: state.format === f.ratio ? "0 0 0 1px var(--gold)" : "none" }}>
                  {state.format === f.ratio && <div style={{ position: "absolute", top: 5, right: 5, width: 14, height: 14, background: "var(--gold)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, color: "var(--ink)", fontWeight: 800 }}>✓</div>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7, height: 28 }}>
                    <div style={{ width: f.w, height: f.h, background: state.format === f.ratio ? "rgba(201,168,76,.28)" : "rgba(201,168,76,.15)", border: `1.5px solid ${state.format === f.ratio ? "var(--gold)" : "var(--gold-bdr)"}`, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 600, color: state.format === f.ratio ? "var(--gold)" : "var(--paper)", display: "block", lineHeight: 1, marginBottom: 4 }}>{f.ratio}</span>
                  <span style={{ fontSize: 8.5, color: state.format === f.ratio ? "var(--gold)" : "var(--steel2)", display: "block", marginBottom: 2, opacity: state.format === f.ratio ? .8 : 1 }}>{f.name}</span>
                  <span style={{ fontSize: 8, color: "var(--steel2)", display: "block", lineHeight: 1.3 }}>{f.use}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.15}>
        <Card>
          <CardHeader icon="🔬" title="Output Quality" value={`${state.quality} · ${state.qualityLabel}`} />
          <div style={{ padding: 14 }}>
            <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 10, display: "block" }}>Resolution</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
              {QUALITIES.map(q => (
                <div key={q.res} onClick={() => update({ quality: q.res, qualityLabel: q.label, qualityMult: QUALITY_MULTS[q.res] })}
                  style={{ border: `1.5px solid ${state.quality === q.res ? "var(--gold)" : "var(--bdr)"}`, borderRadius: 10, background: state.quality === q.res ? "rgba(201,168,76,.07)" : "var(--panel)", cursor: "pointer", paddingTop: q.badge ? 22 : 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8, transition: "all .18s", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  {q.badge && <div style={{ position: "absolute", top: 5, right: 5, fontSize: 7, fontFamily: "'DM Mono',monospace", padding: "1px 5px", borderRadius: 8, fontWeight: 600, letterSpacing: ".06em", background: "rgba(201,168,76,.15)", color: q.badgeColor, border: `1px solid ${q.badgeColor}40` }}>{q.badge}</div>}
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: state.quality === q.res ? "var(--gold)" : "var(--paper)", display: "block", lineHeight: 1, marginBottom: 3 }}>{q.res}</span>
                  <span style={{ fontSize: 8, color: "var(--steel2)", display: "block", marginBottom: 2, fontFamily: "'DM Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.px}</span>
                  <span style={{ fontSize: 9, color: "var(--steel2)", display: "block" }}>{q.label}</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 5, fontSize: 9, fontFamily: "'DM Mono',monospace", color: state.quality === q.res ? "var(--gold)" : "var(--steel2)", opacity: state.quality === q.res ? .8 : 1 }}>
                    {q.mult} credit
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(20,40,70,.25)", border: "1px solid rgba(30,60,100,.4)", borderLeft: "2px solid var(--accent2)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65 }}>
              {QUALITY_INFO[state.quality]}
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.2}>
        <Card>
          <CardHeader icon="📋" title="Configuration Summary" />
          <div style={{ padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", marginBottom: 0 }}>
              {[
                { k: "Frames uploaded", v: "3 frames ✓", gold: true },
                { k: "Model", v: "Female · European · 28y" },
                { k: "Shot style", v: state.shotStyle },
                { k: "Camera lens", v: `${state.lens}mm Portrait` },
                { k: "Lighting", v: state.lighting },
                { k: "Mood", v: state.mood },
                { k: "Background", v: state.useCustomBg ? "Custom" : state.background },
                { k: "Format", v: `${state.format} ${state.formatLabel}`, gold: true },
                { k: "Quality", v: `${state.quality} ${state.qualityLabel}`, gold: true },
              ].map(row => (
                <div key={row.k}>
                  <div style={{ fontSize: 9.5, color: "var(--steel2)" }}>{row.k}</div>
                  <div style={{ fontSize: 10.5, color: row.gold ? "var(--gold)" : "var(--paper2)", fontWeight: 500, marginTop: 1 }}>{row.v}</div>
                </div>
              ))}
            </div>

            {/* Credit calc */}
            <div style={{ background: "var(--ink2)", border: "1px solid var(--bdr)", borderRadius: 9, padding: "12px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontFamily: "'DM Mono',monospace", marginBottom: 9 }}>Credit Calculation</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--steel)", padding: "2.5px 0" }}>
                <span>Visuals requested</span><span>× {state.qty}{qualityMult > 1 ? ` × ${qualityMult} (quality)` : ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--steel)", padding: "2.5px 0" }}>
                <span>Models · Backgrounds</span><span>× 1 · × 1</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--paper)", fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--bdr)", fontFamily: "'DM Mono',monospace" }}>
                <span>Total credits</span><span style={{ color: "var(--gold)" }}>{totalCost}</span>
              </div>
              <div style={{ fontSize: 9.5, color: "var(--steel2)", marginTop: 5, textAlign: "right", fontFamily: "'DM Mono',monospace" }}>{remaining} remaining after this shoot</div>
              <div style={{ height: 3, background: "var(--panel)", borderRadius: 2, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(5, remaining / TOTAL_CREDITS * 100)}%`, background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2, transition: "width .4s" }} />
              </div>
            </div>
          </div>
        </Card>
      </BlurFade>

      <BlurFade delay={0.25}>
        <div style={{ background: "rgba(201,168,76,.07)", border: "1px solid var(--gold-bdr)", borderLeft: "2px solid var(--gold)", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "var(--paper2)", lineHeight: 1.65 }}>
          <strong style={{ color: "var(--gold)" }}>Preview guarantee:</strong> 2 preview images first at no extra cost. Approve before the full run — credits are never burned on bad output.
        </div>
      </BlurFade>
    </div>
  )
}
