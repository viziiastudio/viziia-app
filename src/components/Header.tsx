import { useState } from "react"
import { TOTAL_CREDITS } from "@/types"
import logoSrc from "@/assets/logo.png"

interface Props {
  totalCredits: number
  step: number
  onReset: () => void
}

export default function Header({ step, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false)
  const handleStartOver = () => {
    if (confirmReset) {
      onReset()
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 2000)
    }
  }

  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistDone, setWaitlistDone] = useState(false)
  const handleWaitlistSubmit = () => {
    if (!waitlistEmail.trim()) return
    const existing: string[] = JSON.parse(localStorage.getItem("viziia_waitlist") || "[]")
    localStorage.setItem("viziia_waitlist", JSON.stringify([...existing, waitlistEmail.trim()]))
    setWaitlistDone(true)
  }

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
        background: "rgba(7,9,13,.99)",
        backdropFilter: "blur(24px) saturate(1.6)",
        WebkitBackdropFilter: "blur(24px) saturate(1.6)",
        borderBottom: "1px solid var(--bdr)",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img
            src={logoSrc}
            alt="VIZIIA"
            style={{ height: 48, width: "auto", display: "block", objectFit: "contain" }}
          />
          {step > 0 && (
            <button onClick={handleStartOver} style={{
              marginLeft: 16, padding: "3px 10px", background: "transparent",
              border: "none", color: confirmReset ? "var(--gold)" : "var(--steel2)",
              fontFamily: "'Outfit',sans-serif", fontSize: 10, cursor: "pointer",
              letterSpacing: ".04em", transition: "color .2s",
            }}>
              {confirmReset ? "Sure?" : "Start over"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <button onClick={() => { setWaitlistOpen(true); setWaitlistDone(false); setWaitlistEmail("") }} style={{
            padding: "4px 12px", background: "transparent",
            border: "1px solid var(--gold-bdr)", borderRadius: 20,
            color: "var(--gold)", fontFamily: "'DM Mono',monospace",
            fontSize: 8.5, letterSpacing: ".08em", cursor: "pointer",
            transition: "all .2s",
          }}>
            Join Waitlist
          </button>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 8.5, letterSpacing: ".12em",
            color: "var(--paper3)", border: "1px solid var(--bdr)", padding: "3px 8px",
            borderRadius: 20, background: "var(--panel)"
          }}>Brand Plan</div>
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 10,
            background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
            color: "var(--gold)", padding: "4px 10px", borderRadius: 20,
            display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
          }}>
            {TOTAL_CREDITS} credits
            <div style={{ width: 36, height: 2, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "68%", background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </header>
      {waitlistOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 400,
          background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }} onClick={() => setWaitlistOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--panel2)", border: "1px solid var(--bdr)",
            borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 360,
            position: "relative",
          }}>
            <button onClick={() => setWaitlistOpen(false)} style={{
              position: "absolute", top: 12, right: 14,
              background: "none", border: "none", color: "var(--steel2)",
              fontSize: 18, cursor: "pointer", lineHeight: 1,
            }}>✕</button>
            <div style={{ marginBottom: 6, fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7 }}>Early Access</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, color: "var(--paper)", marginBottom: 6 }}>Join the waitlist</div>
            <div style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.7, marginBottom: 20 }}>Be first to know when VIZIIA Studio launches. No spam.</div>
            {!waitlistDone ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={e => setWaitlistEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleWaitlistSubmit()}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--panel3)", border: "1px solid var(--bdr)",
                    borderRadius: 8, padding: "10px 14px", fontSize: 13,
                    color: "var(--paper)", fontFamily: "'Outfit',sans-serif",
                    outline: "none",
                  }}
                />
                <button onClick={handleWaitlistSubmit} style={{
                  padding: "11px", background: "var(--gold)", border: "none",
                  borderRadius: 9, color: "var(--ink)", fontFamily: "'Outfit',sans-serif",
                  fontSize: 13, fontWeight: 700, letterSpacing: ".06em",
                  cursor: "pointer",
                }}>
                  Notify Me
                </button>
              </div>
            ) : (
              <div style={{
                padding: "16px", background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.25)",
                borderRadius: 9, textAlign: "center", color: "var(--success)",
                fontSize: 14, fontWeight: 500,
              }}>
                You're on the list ✓
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
