import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CreditCard, Zap, Check, Shield, Receipt, Crown,
  ChevronRight, ArrowUpRight, Sparkles, Clock, Download,
} from "lucide-react"
import { TOTAL_CREDITS } from "@/types"

const PLAN = {
  name: "Brand",
  price: 49,
  period: "month",
  renewal: "Apr 8, 2026",
  status: "Active",
  creditsTotal: TOTAL_CREDITS,
  creditsUsed: 24,
}

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    credits: 20,
    features: ["20 credits / month", "2K resolution max", "1 saved model", "Standard support"],
  },
  {
    id: "brand",
    name: "Brand",
    price: 49,
    credits: 68,
    current: true,
    features: ["68 credits / month", "Up to 4K resolution", "5 saved models", "Priority support", "Custom backgrounds"],
  },
  {
    id: "studio",
    name: "Studio",
    price: 129,
    credits: 200,
    popular: true,
    features: ["200 credits / month", "Up to 8K resolution", "Unlimited models", "Dedicated support", "Custom backgrounds", "API access", "Team collaboration"],
  },
]

const BILLING_HISTORY = [
  { id: 1, date: "Mar 8, 2026", description: "Brand Plan — Monthly", amount: "$49.00", status: "Paid" },
  { id: 2, date: "Feb 8, 2026", description: "Brand Plan — Monthly", amount: "$49.00", status: "Paid" },
  { id: 3, date: "Jan 8, 2026", description: "Brand Plan — Monthly", amount: "$49.00", status: "Paid" },
  { id: 4, date: "Jan 3, 2026", description: "Credit top-up — 20 credits", amount: "$12.00", status: "Paid" },
  { id: 5, date: "Dec 8, 2025", description: "Brand Plan — Monthly", amount: "$49.00", status: "Paid" },
]

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
})

export default function MyPlan() {
  const [showBillingHistory, setShowBillingHistory] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  const creditsPercent = Math.round((PLAN.creditsUsed / PLAN.creditsTotal) * 100)
  const creditsRemaining = PLAN.creditsTotal - PLAN.creditsUsed

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 0 48px" }}>
      {/* Page header */}
      <motion.div {...stagger(0)}>
        <div style={{ fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7, marginBottom: 8 }}>
          Subscription
        </div>
        <h1 style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 34, fontWeight: 300, color: "var(--paper)", marginBottom: 4, letterSpacing: ".01em" }}>
          My Plan
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", lineHeight: 1.7, maxWidth: 500 }}>
          Manage your subscription, track credit usage, and view billing history.
        </p>
      </motion.div>

      {/* Current plan hero */}
      <motion.div {...stagger(1)} style={{ marginTop: 28 }}>
        <div style={{
          background: "var(--panel)", border: "1px solid var(--bdr)",
          borderRadius: 16, padding: "28px 26px", position: "relative",
        }}>
          {/* Decorative gradient orb — clipped to card via its own overflow wrapper */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16, pointerEvents: "none" }}>
            <div style={{
              position: "absolute", top: -40, right: -40,
              width: 180, height: 180, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(201,168,76,.08) 0%, transparent 70%)",
            }} />
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20, position: "relative" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#a07030)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Crown size={20} style={{ color: "var(--ink)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--steel2)" }}>Current Plan</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--paper)", fontFamily: "'Inter_28pt-Regular',sans-serif", lineHeight: 1.2 }}>
                    {PLAN.name}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 300, color: "var(--paper)", fontFamily: "'Inter_24pt-Medium',sans-serif" }}>${PLAN.price}</span>
                <span style={{ fontSize: 12, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>/{PLAN.period}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  padding: "3px 10px", borderRadius: 20,
                  background: "var(--success-d)", border: "1px solid rgba(34,197,94,.25)",
                  fontSize: 10, color: "var(--success)", fontWeight: 600, fontFamily: "'Inter_28pt-Regular',sans-serif",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--success)" }} />
                  {PLAN.status}
                </div>
                <span style={{ fontSize: 10, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                  Renews {PLAN.renewal}
                </span>
              </div>
            </div>
            <button style={{
              padding: "10px 18px",
              background: "transparent", border: "1px solid var(--gold-bdr)",
              borderRadius: 10, color: "var(--gold)", fontSize: 11, fontWeight: 600,
              fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6,
              transition: "all .25s ease",
              boxShadow: "0 0 0 0 transparent",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(201,168,76,.05)"
                e.currentTarget.style.borderColor = "var(--gold-bdr2)"
                e.currentTarget.style.boxShadow = "0 0 8px 0px rgba(201,168,76,.08)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.borderColor = "var(--gold-bdr)"
                e.currentTarget.style.boxShadow = "0 0 0 0 transparent"
              }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Manage Subscription <ChevronRight size={14} />
            </button>
          </div>

          {/* Credit usage */}
          <div style={{ marginTop: 24, padding: "18px 0 0", borderTop: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={14} style={{ color: "var(--gold)" }} />
                <span style={{ fontSize: 12, color: "var(--paper2)", fontWeight: 500 }}>Credit Balance</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>{creditsRemaining}</span>
                <span style={{ color: "var(--steel2)" }}> / {PLAN.creditsTotal} remaining</span>
              </div>
            </div>
            <div style={{ height: 6, background: "var(--panel3)", borderRadius: 4, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - creditsPercent}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                style={{ height: "100%", background: "linear-gradient(90deg,var(--accent2),var(--gold))", borderRadius: 4 }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)" }}>{PLAN.creditsUsed} used this cycle</span>
              <span style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)" }}>Resets {PLAN.renewal}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...stagger(2)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 14, padding: "18px 20px",
          background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 14,
          cursor: "pointer", transition: "all .2s", textAlign: "left",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)"; e.currentTarget.style.background = "rgba(201,168,76,.03)" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.background = "var(--panel)" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(201,168,76,.08)", border: "1px solid var(--gold-bdr)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Sparkles size={18} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>Buy Extra Credits</div>
            <div style={{ fontSize: 10, color: "var(--steel)", marginTop: 2 }}>Top up without upgrading</div>
          </div>
          <ArrowUpRight size={16} style={{ color: "var(--steel2)", marginLeft: "auto" }} />
        </button>

        <button style={{
          display: "flex", alignItems: "center", gap: 14, padding: "18px 20px",
          background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 14,
          cursor: "pointer", transition: "all .2s", textAlign: "left",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,.25)"; e.currentTarget.style.background = "rgba(34,197,94,.03)" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.background = "var(--panel)" }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--success-d)", border: "1px solid rgba(34,197,94,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowUpRight size={18} style={{ color: "var(--success)" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>Upgrade Plan</div>
            <div style={{ fontSize: 10, color: "var(--steel)", marginTop: 2 }}>Unlock more credits & features</div>
          </div>
          <ArrowUpRight size={16} style={{ color: "var(--steel2)", marginLeft: "auto" }} />
        </button>
      </motion.div>

      {/* Plan comparison */}
      <motion.div {...stagger(3)} style={{ marginTop: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          Available Plans
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{
                background: "var(--panel)", border: `1px solid ${plan.current ? "var(--gold-bdr)" : "var(--bdr)"}`,
                borderRadius: 16, padding: "24px 22px", position: "relative", overflow: "hidden",
                transition: "border-color .2s, transform .2s",
                transform: hoveredPlan === plan.id ? "translateY(-2px)" : "none",
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  padding: "3px 10px", borderRadius: 20,
                  background: "linear-gradient(135deg,var(--gold-hi),var(--gold))",
                  fontSize: 8.5, fontWeight: 700, color: "var(--ink)", letterSpacing: ".08em", textTransform: "uppercase",
                }}>
                  Popular
                </div>
              )}
              {plan.current && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  padding: "3px 10px", borderRadius: 20,
                  background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
                  fontSize: 8.5, fontWeight: 600, color: "var(--gold)", letterSpacing: ".06em",
                  fontFamily: "'Inter_28pt-Regular',sans-serif",
                }}>
                  Current
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--paper)", marginBottom: 4, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>{plan.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 300, color: "var(--paper)", fontFamily: "'Inter_24pt-Medium',sans-serif" }}>${plan.price}</span>
                <span style={{ fontSize: 11, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>/mo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Check size={12} style={{ color: plan.current ? "var(--gold)" : "var(--success)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--paper2)" }}>{f}</span>
                  </div>
                ))}
              </div>
              {!plan.current && (
                <button style={{
                  width: "100%", marginTop: 18, padding: "10px",
                  background: plan.popular ? "linear-gradient(135deg,var(--gold-hi),var(--gold),#a07030)" : "transparent",
                  border: plan.popular ? "none" : "1px solid var(--bdr)",
                  borderRadius: 10, color: plan.popular ? "var(--ink)" : "var(--paper2)",
                  fontSize: 12, fontWeight: plan.popular ? 700 : 500,
                  fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer",
                  letterSpacing: ".04em", transition: "all .2s",
                }}>
                  {plan.price > PLAN.price ? "Upgrade" : "Downgrade"}
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment & Billing */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 28 }}>
        {/* Payment method */}
        <motion.div {...stagger(4)} style={{
          background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 14, padding: "22px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CreditCard size={16} style={{ color: "var(--steel)" }} />
            <span style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600 }}>Payment Method</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
            background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: 10,
          }}>
            <div style={{
              width: 44, height: 30, borderRadius: 5,
              background: "linear-gradient(135deg,#1a1a4e,#2a2a7e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, color: "rgba(255,255,255,.6)", fontWeight: 700, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".1em",
            }}>
              VISA
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--paper)", fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".06em" }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: 10, color: "var(--steel2)", marginTop: 1 }}>Expires 08/27</div>
            </div>
          </div>
          <button style={{
            width: "100%", marginTop: 12, padding: "9px",
            background: "transparent", border: "1px solid var(--bdr)",
            borderRadius: 8, color: "var(--steel)", fontSize: 11,
            fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)"; e.currentTarget.style.color = "var(--gold)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.color = "var(--steel)" }}
          >
            Update Payment Method
          </button>
        </motion.div>

        {/* Billing info */}
        <motion.div {...stagger(5)} style={{
          background: "var(--panel)", border: "1px solid var(--bdr)", borderRadius: 14, padding: "22px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Shield size={16} style={{ color: "var(--steel)" }} />
            <span style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600 }}>Billing Details</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Name", "Adrien Jarz"],
              ["Email", "adrien@viziia.com"],
              ["Company", "VIZIIA Studio"],
              ["Address", "Paris, France"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--bdr2)" }}>
                <span style={{ fontSize: 11, color: "var(--steel2)" }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--paper2)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
          <button style={{
            width: "100%", marginTop: 12, padding: "9px",
            background: "transparent", border: "1px solid var(--bdr)",
            borderRadius: 8, color: "var(--steel)", fontSize: 11,
            fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)"; e.currentTarget.style.color = "var(--gold)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.color = "var(--steel)" }}
          >
            Edit Billing Details
          </button>
        </motion.div>
      </div>

      {/* Billing History */}
      <motion.div {...stagger(6)} style={{ marginTop: 28 }}>
        <button
          onClick={() => setShowBillingHistory(!showBillingHistory)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
            padding: "16px 20px", background: "var(--panel)", border: "1px solid var(--bdr)",
            borderRadius: showBillingHistory ? "14px 14px 0 0" : 14,
            cursor: "pointer", transition: "all .2s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Receipt size={16} style={{ color: "var(--steel)" }} />
            <span style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>Billing History</span>
            <span style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)", background: "rgba(255,255,255,.04)", padding: "2px 8px", borderRadius: 20 }}>
              {BILLING_HISTORY.length} invoices
            </span>
          </div>
          <motion.div animate={{ rotate: showBillingHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={16} style={{ color: "var(--steel2)", transform: "rotate(90deg)" }} />
          </motion.div>
        </button>
        <AnimatePresence>
          {showBillingHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                background: "var(--panel)", border: "1px solid var(--bdr)", borderTop: "none",
                borderRadius: "0 0 14px 14px", padding: "4px 0",
              }}>
                {BILLING_HISTORY.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 20px",
                      borderBottom: i < BILLING_HISTORY.length - 1 ? "1px solid var(--bdr2)" : "none",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.015)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: "rgba(255,255,255,.03)", border: "1px solid var(--bdr)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Clock size={14} style={{ color: "var(--steel2)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--paper2)", fontWeight: 500 }}>{item.description}</div>
                      <div style={{ fontSize: 10, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginTop: 1 }}>{item.date}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--paper)", fontWeight: 600, fontFamily: "'Inter_28pt-Regular',sans-serif", marginRight: 8 }}>{item.amount}</div>
                    <div style={{
                      padding: "3px 8px", borderRadius: 6,
                      background: "var(--success-d)", border: "1px solid rgba(34,197,94,.15)",
                      fontSize: 9, color: "var(--success)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontWeight: 600,
                    }}>
                      {item.status}
                    </div>
                    <button style={{
                      padding: 5, background: "none", border: "none",
                      color: "var(--steel2)", cursor: "pointer",
                    }}>
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
