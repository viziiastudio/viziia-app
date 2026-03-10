import { useState, useRef, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { TOTAL_CREDITS } from "@/types"
import type { AppPage } from "@/types"
import logoSrc from "@/assets/logo.png"
import {
  Sparkles, Image, CreditCard, HelpCircle, Gift, Zap,
} from "lucide-react"

interface Props {
  totalCredits: number
  step: number
  onReset: () => void
  page: AppPage
  onNavigate: (page: AppPage) => void
}

const NAV_ITEMS: { id: AppPage; label: string; icon: typeof Sparkles }[] = [
  { id: "studio", label: "Studio", icon: Sparkles },
  { id: "visuals", label: "My Visuals", icon: Image },
  { id: "plan", label: "My Plan", icon: CreditCard },
  { id: "help", label: "Help", icon: HelpCircle },
  { id: "affiliate", label: "Affiliate", icon: Gift },
]

const MOBILE_BREAKPOINT = 768

export default function Header({ step, onReset, page, onNavigate }: Props) {
  const reducedMotion = useReducedMotion()
  const isStudio = page === "studio"
  const [confirmReset, setConfirmReset] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const handleOutsideTap = (e: PointerEvent | TouchEvent) => {
      const target = e.target as Node
      if (menuPanelRef.current?.contains(target)) return
      if (menuTriggerRef.current?.contains(target)) return
      closeMobileMenu()
    }

    document.addEventListener("pointerdown", handleOutsideTap, true)
    document.addEventListener("touchstart", handleOutsideTap, true)
    return () => {
      document.removeEventListener("pointerdown", handleOutsideTap, true)
      document.removeEventListener("touchstart", handleOutsideTap, true)
    }
  }, [mobileMenuOpen, closeMobileMenu])

  const [resetting, setResetting] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleStartOver = () => {
    if (resetting) return
    if (confirmReset) {
      setResetting(true)
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current)
      onReset()
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
      confirmTimeoutRef.current = setTimeout(() => setConfirmReset(false), 2400)
    }
  }

  useEffect(() => {
    return () => { if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current) }
  }, [])

  useEffect(() => {
    if (page === "studio" && step === 0) setResetting(false)
  }, [page, step])

  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState("")
  const [waitlistDone, setWaitlistDone] = useState(false)
  const handleWaitlistSubmit = () => {
    if (!waitlistEmail.trim()) return
    const existing: string[] = JSON.parse(localStorage.getItem("viziia_waitlist") || "[]")
    localStorage.setItem("viziia_waitlist", JSON.stringify([...existing, waitlistEmail.trim()]))
    setWaitlistDone(true)
  }

  const [pendingNav, setPendingNav] = useState<AppPage | null>(null)
  const navTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearNavTimeouts = useCallback(() => {
    navTimeoutsRef.current.forEach(clearTimeout)
    navTimeoutsRef.current = []
  }, [])

  const NAV_TRANSITION_MS = 180

  const handleNavClick = useCallback((targetPage: AppPage) => {
    if (targetPage === page) {
      setMobileMenuOpen(false)
      return
    }
    if (pendingNav) return

    clearNavTimeouts()
    setPendingNav(targetPage)

    const t1 = setTimeout(() => setMobileMenuOpen(false), 80)
    const t2 = setTimeout(() => {
      onNavigate(targetPage)
      setPendingNav(null)
    }, NAV_TRANSITION_MS)
    navTimeoutsRef.current = [t1, t2]
  }, [page, pendingNav, onNavigate, clearNavTimeouts])

  useEffect(() => {
    return clearNavTimeouts
  }, [clearNavTimeouts])

  const openWaitlist = () => {
    setMobileMenuOpen(false)
    setWaitlistOpen(true)
    setWaitlistDone(false)
    setWaitlistEmail("")
  }

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingLeft: "max(22px, env(safe-area-inset-left))",
        paddingRight: "max(22px, env(safe-area-inset-right))",
        background: "rgba(7,9,13,.98)",
        backdropFilter: "blur(28px) saturate(1.8)",
        WebkitBackdropFilter: "blur(28px) saturate(1.8)",
        borderBottom: "1px solid var(--bdr)",
      }}>
        {/* ─── Left: Logo + Start Over + Nav ─── */}
        <motion.div layout transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} style={{ display: "flex", alignItems: "center", minWidth: 0, overflow: "visible", position: "relative", zIndex: 1 }}>
          <button
            onClick={() => onNavigate("studio")}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              display: "flex", alignItems: "center", flexShrink: 0,
              transition: "opacity .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            aria-label="Go to Studio"
          >
            <img
              src={logoSrc}
              alt="VIZIIA"
              style={{ height: 46, width: "auto", display: "block", objectFit: "contain" }}
            />
          </button>

          {/* Start Over — animated entrance; exits smoothly when navigating away */}
          <AnimatePresence>
            {page === "studio" && step > 0 && !resetting && (!pendingNav || pendingNav === "studio") && (
              <motion.button
                key="start-over"
                type="button"
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={handleStartOver}
                className={`start-over-btn${confirmReset ? " start-over-btn--confirm" : ""}`}
                style={{
                  marginLeft: 14,
                  padding: "8px 14px",
                  minHeight: 36,
                  minWidth: 44,
                  background: confirmReset ? "rgba(201,168,76,.08)" : "transparent",
                  border: `1px solid ${confirmReset ? "var(--gold-bdr)" : "rgba(255,255,255,.06)"}`,
                  borderRadius: 10,
                  color: confirmReset ? "var(--gold)" : "var(--steel2)",
                  fontFamily: "'Inter_28pt-Regular',sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: ".03em",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  pointerEvents: "auto",
                }}
              >
                {confirmReset ? "Confirm?" : "Start over"}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Divider between logo area and nav */}
          <div className="header-nav-desktop" style={{
            width: 1, height: 18, background: "rgba(255,255,255,.05)",
            margin: "0 14px", flexShrink: 0,
          }} />

          {/* ─── Desktop Navigation ─── */}
          {(() => {
            const effectiveStudio = pendingNav ? pendingNav === "studio" : isStudio
            return (
          <nav className="header-nav-desktop" aria-label="Main navigation" style={{
            display: "flex", alignItems: "center", gap: 1,
            padding: 4,
            background: effectiveStudio ? "transparent" : "rgba(255,255,255,.018)",
            border: effectiveStudio ? "1px solid transparent" : "1px solid rgba(255,255,255,.035)",
            borderRadius: 14,
            transition: "background .28s ease, border-color .28s ease",
          }}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isCurrent = page === id
              const isPending = pendingNav === id
              const isActive = pendingNav ? isPending : isCurrent
              const isHovered = hoveredNav === id && !isActive
              return (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  onMouseEnter={() => setHoveredNav(id)}
                  onMouseLeave={() => setHoveredNav(null)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 6,
                    padding: effectiveStudio ? "6px 12px" : "7px 15px",
                    background: "transparent",
                    border: "none",
                    borderRadius: 12,
                    color: isActive
                      ? (effectiveStudio ? "var(--paper)" : "var(--gold)")
                      : isHovered ? "var(--paper2)" : "var(--steel2)",
                    fontFamily: "'Inter_28pt-Regular',sans-serif",
                    fontSize: effectiveStudio ? 10.5 : 11.5,
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: ".02em",
                    cursor: "pointer",
                    transition: "color .24s ease, font-size .24s ease",
                    whiteSpace: "nowrap",
                    zIndex: 1,
                    transform: "none",
                  }}
                >
                  <Icon size={effectiveStudio ? 12 : 13.5} strokeWidth={isActive ? 2 : 1.6} style={{
                    opacity: isActive ? (effectiveStudio ? 0.7 : 1) : isHovered ? 0.6 : 0.3,
                    transition: "opacity .22s ease",
                  }} />
                  <span>{label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      style={{
                        position: "absolute", inset: 0,
                        borderRadius: 12,
                        background: effectiveStudio ? "rgba(255,255,255,.04)" : "rgba(201,168,76,.07)",
                        border: effectiveStudio ? "1px solid rgba(255,255,255,.04)" : "1px solid rgba(201,168,76,.1)",
                        boxShadow: effectiveStudio ? "none" : "0 1px 6px rgba(201,168,76,.05)",
                        zIndex: -1,
                      }}
                      transition={{ type: "spring", stiffness: reducedMotion ? 1000 : 320, damping: reducedMotion ? 50 : 30, mass: 0.8 }}
                    />
                  )}
                  <AnimatePresence>
                    {isHovered && !isActive && (
                      <motion.div
                        key={`hover-${id}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: reducedMotion ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          position: "absolute", inset: 0,
                          borderRadius: 12,
                          background: "rgba(255,255,255,.03)",
                          zIndex: -1,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </nav>
            )
          })()}
        </motion.div>

        {/* ─── Right: Actions (desktop) ─── */}
        <div className="header-actions-desktop" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button onClick={openWaitlist} className="waitlist-btn" style={{
            minHeight: 36, padding: "8px 16px",
            background: "rgba(201,168,76,.04)",
            border: "1px solid rgba(201,168,76,.14)",
            borderRadius: 20,
            color: "var(--gold)",
            fontFamily: "'Inter_28pt-Regular',sans-serif",
            fontSize: 9.5,
            fontWeight: 500,
            letterSpacing: ".05em",
            cursor: "pointer",
            transition: "all .22s ease",
          }}>
            Join Waitlist
          </button>

          <div style={{
            display: "flex", alignItems: "center", gap: 0,
            background: "rgba(255,255,255,.018)",
            border: "1px solid rgba(255,255,255,.035)",
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "7px 11px",
              fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 9.5, letterSpacing: ".06em",
              color: "var(--paper3)", fontWeight: 400,
              borderRight: "1px solid rgba(255,255,255,.035)",
            }}>
              Brand
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px",
              fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 10.5,
              color: "var(--gold)", fontWeight: 500,
            }}>
              <Zap size={10} style={{ opacity: 0.6 }} />
              {TOTAL_CREDITS}
              <div style={{ width: 30, height: 3, background: "rgba(255,255,255,.045)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "68%", background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Mobile menu trigger ─── */}
        <div className="header-actions-mobile" style={{ display: "none", alignItems: "center" }}>
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-expanded={mobileMenuOpen}
            aria-haspopup="true"
            className="mobile-menu-trigger"
            style={{
              width: 44, height: 44, minWidth: 44, minHeight: 44,
              padding: 0,
              background: mobileMenuOpen ? "rgba(201,168,76,.06)" : "rgba(255,255,255,.025)",
              border: `1px solid ${mobileMenuOpen ? "rgba(201,168,76,.15)" : "rgba(255,255,255,.04)"}`,
              borderRadius: 14,
              color: mobileMenuOpen ? "var(--gold)" : "var(--paper2)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .25s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div style={{
              width: 16, height: 12,
              position: "relative",
              display: "flex", flexDirection: "column",
              justifyContent: "space-between",
            }}>
              <span style={{
                display: "block", width: "100%", height: 1.5, borderRadius: 1,
                background: "currentColor",
                transition: "transform .3s cubic-bezier(.25,.1,.25,1), opacity .22s ease",
                transformOrigin: "center center",
                transform: mobileMenuOpen ? "translateY(5.25px) rotate(45deg)" : "none",
              }} />
              <span style={{
                display: "block", width: "100%", height: 1.5, borderRadius: 1,
                background: "currentColor",
                transition: "opacity .2s ease",
                opacity: mobileMenuOpen ? 0 : 1,
              }} />
              <span style={{
                display: "block", width: "100%", height: 1.5, borderRadius: 1,
                background: "currentColor",
                transition: "transform .3s cubic-bezier(.25,.1,.25,1), opacity .22s ease",
                transformOrigin: "center center",
                transform: mobileMenuOpen ? "translateY(-5.25px) rotate(-45deg)" : "none",
              }} />
            </div>
          </button>

          {/* ─── Mobile dropdown ─── */}
          <AnimatePresence>
            {mobileMenuOpen && (
                <motion.div
                  ref={menuPanelRef}
                  key="mob-dd"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{
                    opacity: 1, y: 0, scale: 1,
                    transition: { duration: reducedMotion ? 0.01 : 0.25, ease: [0.22, 1, 0.36, 1] },
                  }}
                  exit={{
                    opacity: 0, y: -4, scale: 0.98,
                    transition: { duration: reducedMotion ? 0.01 : 0.18, ease: [0.22, 1, 0.36, 1] },
                  }}
                  style={{
                    position: "fixed", top: 64, right: "max(14px, env(safe-area-inset-right))", zIndex: 399,
                    background: "rgba(13,16,24,.94)",
                    backdropFilter: "blur(32px) saturate(1.5)",
                    WebkitBackdropFilter: "blur(32px) saturate(1.5)",
                    border: "1px solid rgba(255,255,255,.05)",
                    borderRadius: 18, padding: "8px 8px 10px", minWidth: 240,
                    boxShadow: "0 24px 80px rgba(0,0,0,.5), 0 6px 20px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.015) inset",
                    display: "flex", flexDirection: "column", gap: 2,
                    transformOrigin: "top right",
                  }}
                >
                  {NAV_ITEMS.map(({ id, label, icon: Icon }, i) => {
                    const isCurrent = page === id
                    const isPending = pendingNav === id
                    const isHighlighted = isPending || (isCurrent && !pendingNav)
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reducedMotion ? 0.01 : 0.22, delay: reducedMotion ? 0 : 0.03 * i, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => handleNavClick(id)}
                        style={{
                          minHeight: 44, padding: "14px 18px", textAlign: "left",
                          touchAction: "manipulation",
                          WebkitTapHighlightColor: "transparent",
                          background: isPending
                            ? "rgba(201,168,76,.11)"
                            : isHighlighted ? "rgba(201,168,76,.06)" : "transparent",
                          border: isHighlighted ? "1px solid rgba(201,168,76,.08)" : "1px solid transparent",
                          borderRadius: 14,
                          color: isHighlighted ? "var(--gold)" : "var(--paper3)",
                          fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 14, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 12,
                          fontWeight: isHighlighted ? 600 : 400,
                          letterSpacing: ".01em",
                          transition: "background .22s ease, color .22s ease, border-color .22s ease",
                        }}
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: 10,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isHighlighted ? "rgba(201,168,76,.08)" : "rgba(255,255,255,.025)",
                          transition: "background .15s ease",
                          flexShrink: 0,
                        }}>
                          <Icon size={15} strokeWidth={isHighlighted ? 2 : 1.7} style={{ opacity: isHighlighted ? 1 : 0.45, transition: "opacity .15s ease" }} />
                        </div>
                        {label}
                      </motion.button>
                    )
                  })}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12, duration: 0.25, ease: "easeOut" }}
                    style={{ height: 1, background: "rgba(255,255,255,.04)", margin: "4px 16px" }}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 16px",
                    }}
                  >
                    <button
                      onClick={openWaitlist}
                      style={{
                        flex: 1, padding: "9px 14px", textAlign: "center",
                        background: "rgba(201,168,76,.06)",
                        border: "1px solid rgba(201,168,76,.1)",
                        borderRadius: 12, color: "var(--gold)",
                        fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11, fontWeight: 500,
                        cursor: "pointer", letterSpacing: ".04em",
                        transition: "background .15s ease, border-color .15s ease",
                      }}
                    >
                      Join Waitlist
                    </button>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "9px 12px",
                      background: "rgba(255,255,255,.02)",
                      border: "1px solid rgba(255,255,255,.035)",
                      borderRadius: 12,
                      fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11,
                      color: "var(--gold)", whiteSpace: "nowrap",
                    }}>
                      <Zap size={11} style={{ opacity: 0.55 }} />
                      {TOTAL_CREDITS}
                    </div>
                  </motion.div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <style>{`
        @media (max-width: ${MOBILE_BREAKPOINT}px) {
          .header-actions-desktop { display: none !important; }
          .header-actions-mobile { display: flex !important; }
          .header-nav-desktop { display: none !important; }
        }
      `}</style>

      {/* ─── Waitlist modal ─── */}
      <AnimatePresence>
        {waitlistOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(0,0,0,.75)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
            onClick={() => setWaitlistOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: reducedMotion ? 1000 : 400, damping: reducedMotion ? 50 : 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--panel2)", border: "1px solid var(--bdr)",
                borderRadius: 22, padding: "28px 24px", width: "100%", maxWidth: 360,
                position: "relative",
                boxShadow: "0 24px 64px rgba(0,0,0,.6)",
              }}
            >
              <button onClick={() => setWaitlistOpen(false)} style={{
                position: "absolute", top: 12, right: 14,
                background: "none", border: "none", color: "var(--steel2)",
                fontSize: 18, cursor: "pointer", lineHeight: 1,
              }}>{"\u2715"}</button>
              <div style={{ marginBottom: 6, fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7 }}>Early Access</div>
              <div style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 24, fontWeight: 300, color: "var(--paper)", marginBottom: 6 }}>Join the waitlist</div>
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
                      borderRadius: 12, padding: "11px 14px", fontSize: 13,
                      color: "var(--paper)", fontFamily: "'Inter_28pt-Regular',sans-serif",
                      outline: "none",
                    }}
                  />
                  <button onClick={handleWaitlistSubmit} style={{
                    padding: "11px", background: "var(--gold)", border: "none",
                    borderRadius: 12, color: "var(--ink)", fontFamily: "'Inter_28pt-Regular',sans-serif",
                    fontSize: 13, fontWeight: 700, letterSpacing: ".06em",
                    cursor: "pointer",
                  }}>
                    Notify Me
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: "16px", background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.25)",
                  borderRadius: 12, textAlign: "center", color: "var(--success)",
                  fontSize: 14, fontWeight: 500,
                }}>
                  You're on the list {"\u2713"}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
