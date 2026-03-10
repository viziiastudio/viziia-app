import { useState } from "react"
import { motion } from "motion/react"
import {
  Link2, Copy, Share2, Gift, Users, TrendingUp,
  Award, ArrowRight, Check, Twitter, Linkedin, Mail,
  ChevronRight, Zap, Star,
} from "lucide-react"

const REFERRAL_LINK = "https://viziia.com/ref/adrienjarz"

const STATS = [
  { label: "Total Referrals", value: "12", icon: Users, color: "#00bcd4", change: "+3 this month" },
  { label: "Credits Earned", value: "340", icon: Zap, color: "var(--gold)", change: "+80 this month" },
  { label: "Conversion Rate", value: "23%", icon: TrendingUp, color: "var(--success)", change: "+2% vs last" },
  { label: "Pending Rewards", value: "$85", icon: Gift, color: "#9c27b0", change: "Paid monthly" },
]

const HOW_IT_WORKS = [
  { step: 1, title: "Share Your Link", desc: "Send your unique referral link to friends, colleagues, or your audience.", icon: Share2 },
  { step: 2, title: "They Sign Up", desc: "When someone joins VIZIIA through your link, they get 10 bonus credits.", icon: Users },
  { step: 3, title: "You Earn Rewards", desc: "Get 20 credits + 15% revenue share for every paid referral. Recurring.", icon: Award },
]

const REFERRAL_HISTORY = [
  { id: 1, name: "Marie D.", date: "Mar 5, 2026", plan: "Brand", credits: 20, status: "Active" },
  { id: 2, name: "Thomas K.", date: "Feb 28, 2026", plan: "Starter", credits: 20, status: "Active" },
  { id: 3, name: "Sofia R.", date: "Feb 14, 2026", plan: "Studio", credits: 20, status: "Active" },
  { id: 4, name: "James L.", date: "Feb 2, 2026", plan: "Brand", credits: 20, status: "Active" },
  { id: 5, name: "Anika P.", date: "Jan 18, 2026", plan: "Starter", credits: 20, status: "Churned" },
]

const REWARD_TIERS = [
  { tier: "Bronze", referrals: "1–5", bonus: "20 credits each", active: true },
  { tier: "Silver", referrals: "6–15", bonus: "25 credits each", active: true },
  { tier: "Gold", referrals: "16–30", bonus: "30 credits + 20% rev share", active: false },
  { tier: "Platinum", referrals: "31+", bonus: "40 credits + 25% rev share", active: false },
]

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
})

export default function AffiliatePage() {
  const [copied, setCopied] = useState(false)
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 0 48px" }}>
      {/* Page header */}
      <motion.div {...stagger(0)}>
        <div style={{ fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7, marginBottom: 8 }}>
          Referral Program
        </div>
        <h1 style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 34, fontWeight: 300, color: "var(--paper)", marginBottom: 4, letterSpacing: ".01em" }}>
          Affiliate Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", lineHeight: 1.7, maxWidth: 500 }}>
          Share VIZIIA, earn credits and revenue. Track your referrals and rewards.
        </p>
      </motion.div>

      {/* Referral link hero */}
      <motion.div {...stagger(1)} style={{ marginTop: 28 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(201,168,76,.05) 0%, rgba(201,168,76,.01) 100%)",
          border: "1px solid var(--gold-bdr)", borderRadius: 18,
          padding: "30px 28px", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative elements */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 140, height: 140, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: 40,
            width: 100, height: 100, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#a07030)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Link2 size={22} style={{ color: "var(--ink)" }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--paper)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>Your Referral Link</div>
                <div style={{ fontSize: 11, color: "var(--steel)", marginTop: 1 }}>Share this link to earn rewards on every signup</div>
              </div>
            </div>

            {/* Link display */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 4px 4px 18px",
              background: "var(--panel)", border: "1px solid var(--bdr)",
              borderRadius: 12, marginBottom: 16,
            }}>
              <div style={{
                flex: 1, fontSize: 13, color: "var(--paper2)",
                fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".02em",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {REFERRAL_LINK}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px",
                  background: copied ? "var(--success-d)" : "var(--gold)",
                  border: copied ? "1px solid rgba(34,197,94,.3)" : "none",
                  borderRadius: 9,
                  color: copied ? "var(--success)" : "var(--ink)",
                  fontSize: 11, fontWeight: 700, fontFamily: "'Inter_28pt-Regular',sans-serif",
                  cursor: "pointer", letterSpacing: ".04em",
                  transition: "all .25s ease", whiteSpace: "nowrap",
                  textTransform: "uppercase",
                  boxShadow: copied
                    ? "0 0 10px 1px rgba(34,197,94,.1)"
                    : "0 0 10px 1px rgba(201,168,76,.12)",
                }}
                onMouseEnter={e => {
                  if (!copied) e.currentTarget.style.boxShadow = "0 0 16px 2px rgba(201,168,76,.18)"
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = copied
                    ? "0 0 10px 1px rgba(34,197,94,.1)"
                    : "0 0 10px 1px rgba(201,168,76,.12)"
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy Link</>}
              </button>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { icon: Twitter, label: "Twitter", color: "#1da1f2" },
                { icon: Linkedin, label: "LinkedIn", color: "#0077b5" },
                { icon: Mail, label: "Email", color: "var(--steel)" },
              ].map(({ icon: Icon, label, color }) => (
                <button
                  key={label}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", background: "rgba(255,255,255,.04)",
                    border: "1px solid var(--bdr)", borderRadius: 8,
                    color: "var(--paper2)", fontSize: 11, cursor: "pointer",
                    fontFamily: "'Inter_28pt-Regular',sans-serif", transition: "all .2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.color = color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.color = "var(--paper2)" }}
                >
                  <Icon size={13} /> Share on {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div {...stagger(2)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 20 }}>
        {STATS.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              {...stagger(i + 3)}
              style={{
                padding: "20px 18px", background: "var(--panel)",
                border: "1px solid var(--bdr)", borderRadius: 14,
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: -10, right: -10,
                width: 60, height: 60, borderRadius: "50%",
                background: `radial-gradient(circle, ${stat.color}08 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${stat.color}12`, border: `1px solid ${stat.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 300, color: "var(--paper)", fontFamily: "'Inter_24pt-Medium',sans-serif", lineHeight: 1, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--steel2)", fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)", marginTop: 6, opacity: .7 }}>{stat.change}</div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* How it works */}
      <motion.div {...stagger(4)} style={{ marginTop: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          How It Works
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {HOW_IT_WORKS.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={item.step} style={{
                padding: "24px 20px", background: "var(--panel)",
                border: "1px solid var(--bdr)", borderRadius: 14, position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 16, right: 18,
                  fontSize: 48, fontFamily: "'Inter_24pt-Medium',sans-serif", fontWeight: 300,
                  color: "rgba(255,255,255,.03)", lineHeight: 1,
                }}>
                  {item.step}
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>
                  <Icon size={17} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--paper)", marginBottom: 6, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.7 }}>
                  {item.desc}
                </div>
                {i < 2 && (
                  <div style={{
                    position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)",
                    color: "var(--steel2)", opacity: .3, display: "none",
                  }}
                    className="how-arrow"
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Reward tiers */}
      <motion.div {...stagger(5)} style={{ marginTop: 28 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          Reward Tiers
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {REWARD_TIERS.map((tier, i) => (
            <div
              key={tier.tier}
              onMouseEnter={() => setHoveredTier(i)}
              onMouseLeave={() => setHoveredTier(null)}
              style={{
                padding: "18px 16px", background: "var(--panel)",
                border: `1px solid ${tier.active ? "var(--gold-bdr)" : "var(--bdr)"}`,
                borderRadius: 12, position: "relative", overflow: "hidden",
                transition: "all .2s",
                transform: hoveredTier === i ? "translateY(-2px)" : "none",
                opacity: tier.active ? 1 : 0.6,
              }}
            >
              {tier.active && i === 1 && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: "linear-gradient(90deg,var(--gold-hi),var(--gold),#a07030)",
                }} />
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Star size={14} style={{ color: tier.active ? "var(--gold)" : "var(--steel2)", fill: tier.active ? "var(--gold)" : "none" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: tier.active ? "var(--paper)" : "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                  {tier.tier}
                </span>
                {tier.active && i === 1 && (
                  <span style={{
                    fontSize: 8, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".08em",
                    padding: "2px 7px", borderRadius: 6,
                    background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
                    color: "var(--gold)", textTransform: "uppercase",
                  }}>
                    Current
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginBottom: 4 }}>
                {tier.referrals} referrals
              </div>
              <div style={{ fontSize: 12, color: tier.active ? "var(--paper2)" : "var(--steel2)", fontWeight: 500 }}>
                {tier.bonus}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral history */}
      <motion.div {...stagger(6)} style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600 }}>
            Recent Referrals
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, color: "var(--gold)", background: "none", border: "none",
            cursor: "pointer", fontFamily: "'Inter_28pt-Regular',sans-serif",
          }}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div style={{
          background: "var(--panel)", border: "1px solid var(--bdr)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {REFERRAL_HISTORY.map((ref, i) => (
            <div
              key={ref.id}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 20px",
                borderBottom: i < REFERRAL_HISTORY.length - 1 ? "1px solid var(--bdr2)" : "none",
                transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.015)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "linear-gradient(135deg,var(--panel3),var(--panel2))",
                border: "1px solid var(--bdr)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 13, color: "var(--steel2)", fontWeight: 500, flexShrink: 0,
              }}>
                {ref.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--paper2)", fontWeight: 500 }}>{ref.name}</div>
                <div style={{ fontSize: 10, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginTop: 1 }}>{ref.date}</div>
              </div>
              <div style={{ fontSize: 10, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel)", background: "rgba(255,255,255,.03)", padding: "3px 8px", borderRadius: 6 }}>
                {ref.plan}
              </div>
              <div style={{ fontSize: 11, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--gold)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <Zap size={11} /> +{ref.credits}
              </div>
              <div style={{
                padding: "3px 8px", borderRadius: 6,
                background: ref.status === "Active" ? "var(--success-d)" : "rgba(239,68,68,.08)",
                border: `1px solid ${ref.status === "Active" ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)"}`,
                fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif",
                color: ref.status === "Active" ? "var(--success)" : "#ef4444",
                fontWeight: 600,
              }}>
                {ref.status}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Earnings summary */}
      <motion.div {...stagger(7)} style={{ marginTop: 20 }}>
        <div style={{
          padding: "22px 24px", background: "var(--panel)",
          border: "1px solid var(--gold-bdr)", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 6 }}>
              Total Earnings
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 30, fontWeight: 300, color: "var(--paper)", fontFamily: "'Inter_24pt-Medium',sans-serif" }}>$340</span>
              <span style={{ fontSize: 11, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>lifetime</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--steel2)", marginTop: 4 }}>Next payout: <span style={{ color: "var(--paper2)" }}>$85.00</span> on Apr 1, 2026</div>
          </div>
          <button style={{
            padding: "10px 20px",
            background: "transparent", border: "1px solid var(--gold-bdr)",
            borderRadius: 10, color: "var(--gold)", fontSize: 11, fontWeight: 600,
            fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--gold-dim)" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
          >
            <Award size={14} /> View Payout Details
          </button>
        </div>
      </motion.div>
    </div>
  )
}
