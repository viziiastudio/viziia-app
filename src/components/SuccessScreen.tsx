import { motion } from "motion/react"

interface Props {
  qty: number
  previewMode: boolean
  onReset: () => void
  onApprove: () => void
}

export default function SuccessScreen({ qty, previewMode, onReset, onApprove }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", background: "var(--ink)",
        padding: "20px 24px 80px",
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "var(--gold)", top: -80, left: -60, filter: "blur(100px)", opacity: .08, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "#22c55e", bottom: -40, right: -40, filter: "blur(100px)", opacity: .08, zIndex: 0, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: .8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: .1 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: ".18em",
            color: "var(--success)", textTransform: "uppercase",
            border: "1px solid rgba(34,197,94,.28)", background: "rgba(34,197,94,.06)",
            padding: "5px 14px", borderRadius: 20, marginBottom: 18,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)", animation: "dotPulse 1.5s ease infinite" }} />
          Generation complete
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .15 }}
          style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, fontWeight: 300, color: "var(--paper)", letterSpacing: "-.01em", lineHeight: 1.1, marginBottom: 8 }}
        >
          {previewMode ? <>Previews <em style={{ color: "var(--gold)", fontStyle: "italic" }}>ready</em></> : <>Visuals <em style={{ color: "var(--gold)", fontStyle: "italic" }}>ready</em></>}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .2 }}
          style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.8, maxWidth: 290, marginBottom: 24 }}
        >
          {previewMode
            ? "2 preview images are ready. Review below then generate the full shoot."
            : `Your ${qty} visuals have been generated and are ready to download. Stored for 30 days.`}
        </motion.p>

        {/* Thumbnails */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .25 }}
          style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center", marginBottom: 28, width: "100%", maxWidth: 820 }}
        >
          {[
            { flex: "0 0 22%", cls: "thumb-side", delay: .1 },
            { flex: "0 0 46%", cls: "thumb-featured", delay: .2, featured: true },
            { flex: "0 0 22%", cls: "thumb-side", delay: .3 },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18, scale: .93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: t.delay, type: "spring", stiffness: 260, damping: 24 }}
              className={t.cls}
              style={{
                flex: t.flex, borderRadius: 18, minWidth: 0,
                border: `1px solid ${t.featured ? "var(--gold-bdr)" : "var(--bdr)"}`,
                background: "linear-gradient(160deg,var(--panel3) 0%,var(--panel) 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden",
                boxShadow: t.featured
                  ? "0 24px 80px rgba(0,0,0,.8), 0 0 0 1px var(--gold-bdr)"
                  : "0 8px 32px rgba(0,0,0,.5)",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,transparent 40%,rgba(0,0,0,.6))", zIndex: 1 }} />
              <span style={{ fontSize: t.featured ? 64 : 40, opacity: .18 }}>🕶️</span>
              {t.featured && (
                <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
                  <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", letterSpacing: ".16em", color: "var(--gold)", textTransform: "uppercase", opacity: .8 }}>Featured Preview</span>
                </div>
              )}
              {!t.featured && (
                <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
                  <span style={{ fontSize: 7.5, fontFamily: "'DM Mono',monospace", letterSpacing: ".1em", color: "var(--steel2)", textTransform: "uppercase" }}>Preview {i === 0 ? "1" : "3"}</span>
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
            transition={{ delay: .3 }}
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
            transition={{ delay: .35 }}
            onClick={previewMode ? onApprove : onReset}
            style={{
              padding: "14px 24px", border: "none", borderRadius: 11,
              background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#9a7020)",
              color: "var(--ink)", fontFamily: "'Outfit',sans-serif", fontSize: 13,
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
            transition={{ delay: .4 }}
            onClick={onReset}
            style={{
              padding: "12px 24px", background: "transparent",
              border: "1px solid var(--bdr)", borderRadius: 11,
              color: "var(--steel)", fontFamily: "'Outfit',sans-serif", fontSize: 12,
              cursor: "pointer", letterSpacing: ".04em", transition: "all .2s",
            }}
          >
            Start a new shoot
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
