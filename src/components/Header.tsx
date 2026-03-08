import { TOTAL_CREDITS } from "@/types"
import logoSrc from "@/assets/logo.png"

interface Props {
  totalCredits: number
}

export default function Header(_: Props) {
  return (
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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
  )
}
