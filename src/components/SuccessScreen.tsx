import { useState } from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface Props {
  qty: number
  previewMode: boolean
  onReset: () => void
  onApprove: () => void
}

export default function SuccessScreen({ qty, previewMode, onReset, onApprove }: Props) {
  const reducedMotion = useReducedMotion()
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "VIZIIA Studio — AI Eyewear Photography", url: window.location.href })
        setShareStatus("Shared!")
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setShareStatus("Link copied!")
      }
    } catch (_e) {
      setShareStatus("Link copied!")
    }
    setTimeout(() => setShareStatus(null), 2000)
  }

  const handleDownloadAll = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const t = (d: number, delay = 0) => ({ duration: reducedMotion ? 0.01 : d, delay: reducedMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={t(0.2)}
      className="success-screen"
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        minHeight: "100dvh",
        /* Remove justifyContent:center — replaced by margin:auto on inner so
           overflow content scrolls from the top instead of being clipped above fold */
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", background: "var(--ink)",
        padding: "max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(32px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))",
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "var(--gold)", top: -80, left: -60, filter: "blur(100px)", opacity: .08, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "#22c55e", bottom: -40, right: -40, filter: "blur(100px)", opacity: .08, zIndex: 0, pointerEvents: "none" }} />

      {/* Content: margin:auto centers when short, collapses when tall so scroll works top-down */}
      <div className="success-screen-content" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flexShrink: 0, marginTop: "auto", marginBottom: "auto" }}>
        {/* Badge — enough top spacing on desktop so it's never cropped */}
        <motion.div
          initial={{ opacity: 0, scale: .8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={t(0.25, 0.1)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 9, letterSpacing: ".18em",
            color: "var(--success)", textTransform: "uppercase",
            border: "1px solid rgba(34,197,94,.28)", background: "rgba(34,197,94,.06)",
            padding: "5px 14px", borderRadius: 20, marginBottom: 12,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", animation: "dotPulse 1.5s ease infinite" }} />
          Generation complete
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.25, 0.15)}
          style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 34, fontWeight: 300, color: "var(--paper)", letterSpacing: "-.01em", lineHeight: 1.1, marginBottom: 6 }}
        >
          {previewMode ? <>Previews <span style={{ color: "var(--gold)", fontWeight: 700, fontFamily: "'Inter_24pt-Medium',sans-serif" }}>ready</span></> : <>Visuals <span style={{ color: "var(--gold)", fontWeight: 700, fontFamily: "'Inter_24pt-Medium',sans-serif" }}>ready</span></>}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.25, 0.2)}
          style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.7, maxWidth: 290, marginBottom: 16 }}
        >
          {previewMode
            ? "2 preview images are ready. Review below then generate the full shoot."
            : `Your ${qty} visuals have been generated and are ready to download. Stored for 30 days.`}
        </motion.p>

        {/* Thumbnails — fixed aspect ratio to avoid stretch */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t(0.3, 0.25)}
          style={{ display: "flex", alignItems: "flex-end", gap: 10, justifyContent: "center", marginBottom: 18, width: "100%", maxWidth: 680 }}
        >
          {[
            { flex: "0 0 22%", cls: "thumb-side", delay: .1 },
            { flex: "0 0 46%", cls: "thumb-featured", delay: .2, featured: true },
            { flex: "0 0 22%", cls: "thumb-side", delay: .3 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18, scale: .93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: reducedMotion ? 0 : item.delay, duration: reducedMotion ? 0.01 : 0.3, type: "spring", stiffness: reducedMotion ? 1000 : 260, damping: reducedMotion ? 50 : 24 }}
              className={item.cls}
              style={{
                flex: item.flex, borderRadius: 18, minWidth: 0,
                aspectRatio: "4/5",
                border: `1px solid ${item.featured ? "var(--gold-bdr)" : "var(--bdr)"}`,
                background: "linear-gradient(160deg,var(--panel3) 0%,var(--panel) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                boxShadow: item.featured
                  ? "0 24px 80px rgba(0,0,0,.8), 0 0 0 1px var(--gold-bdr)"
                  : "0 8px 32px rgba(0,0,0,.5)",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.6))", zIndex: 1 }} />
                  <span style={{ fontSize: item.featured ? 64 : 40, opacity: .18 }}>🕶️</span>
              {item.featured && (
                <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
                  <span style={{ fontSize: 8, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", color: "var(--gold)", textTransform: "uppercase", opacity: .8 }}>Featured Preview</span>
                </div>
              )}
              {!item.featured && (
                <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
                  <span style={{ fontSize: 7.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".1em", color: "var(--steel2)", textTransform: "uppercase" }}>Preview {i === 0 ? "1" : "2"}</span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Approve box for preview mode */}
        {previewMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.25, 0.3)}
            style={{ background: "rgba(201,168,76,.06)", border: "1px solid var(--gold-bdr)", borderRadius: 11, padding: "12px 14px", marginBottom: 20, width: "100%", maxWidth: 300, fontSize: 11, color: "var(--paper2)", lineHeight: 1.7, textAlign: "left" }}
          >
            <strong style={{ color: "var(--gold)" }}>Preview mode:</strong> These 2 images are free. Approve to generate all {qty} visuals.
          </motion.div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 300 }}>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={t(0.25, 0.35)}
            onClick={previewMode ? onApprove : onReset}
            style={{
              padding: "14px 24px", border: "none", borderRadius: 11,
              background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#9a7020)",
              color: "var(--ink)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 13,
              fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase",
              cursor: "pointer", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)", animation: "shimmer 2.8s ease infinite" }} />
            {previewMode ? `✓  Approve & Generate Full Shoot` : `⬇  Download All ${qty} Visuals`}
          </motion.button>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.25, 0.4)}
            onClick={onReset}
            style={{
              padding: "12px 24px", background: "transparent",
              border: "1px solid var(--bdr)", borderRadius: 11,
              color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 12,
              cursor: "pointer", letterSpacing: ".04em", transition: "all .2s",
            }}
          >
            Start a new shoot
          </motion.button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={t(0.25, 0.45)}
            style={{ display: "flex", gap: 8, width: "100%", maxWidth: 300, marginTop: 4 }}
          >
            <button onClick={handleShare} style={{
              flex: 1, padding: "10px 8px", background: "transparent",
              border: "1px solid var(--bdr)", borderRadius: 9,
              color: shareStatus ? "var(--gold)" : "var(--steel)",
              fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11,
              cursor: "pointer", transition: "color .2s",
            }}>
              {shareStatus ?? "↗ Share"}
            </button>
            <button onClick={handleDownloadAll} style={{
              flex: 1, padding: "10px 8px", background: "transparent",
              border: "1px solid var(--bdr)", borderRadius: 9,
              color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif",
              fontSize: 11, cursor: "pointer",
            }}>
              ↓ Download All
            </button>
          </motion.div>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 10, padding: "8px 16px", background: "rgba(34,197,94,.1)",
                border: "1px solid rgba(34,197,94,.3)", borderRadius: 8,
                color: "var(--success)", fontSize: 11,
              }}
            >
              Coming soon ✓
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
