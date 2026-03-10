import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  MessageCircle, HelpCircle, ChevronDown, Mail,
  Search, Wrench, Lightbulb, Camera, Users, Palette,
  CreditCard, Upload, ExternalLink, ArrowRight, Headphones,
  FileText, Zap,
} from "lucide-react"

const FAQS = [
  {
    q: "How do credits work?",
    a: "Each visual generation costs credits based on the resolution you choose. Standard 2K costs 1 credit per image, 4K costs 2 credits, and 8K costs 4 credits. Your credit balance resets each billing cycle based on your plan.",
  },
  {
    q: "Can I edit visuals after generation?",
    a: "Generated visuals are final high-resolution images. However, you can regenerate with different settings at any time. We recommend using the Preview feature first (2 credits) to confirm your setup before generating the full batch.",
  },
  {
    q: "How accurate are the AI models?",
    a: "Our AI models are trained to maintain high facial consistency across different shots, poses, and lighting conditions. For best results, upload 3+ reference frames with clear, well-lit faces from different angles.",
  },
  {
    q: "What image formats are supported for upload?",
    a: "We support JPG, PNG, and WebP for reference frame uploads. Images should be at least 512×512 pixels for optimal results. Higher resolution reference images produce better AI model accuracy.",
  },
  {
    q: "Can I use generated visuals commercially?",
    a: "Yes. All visuals generated on paid plans are fully licensed for commercial use, including advertising, social media, e-commerce, print, and editorial purposes. No additional licensing fees apply.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel anytime from My Plan → Manage Subscription. Your access continues until the end of your current billing period. Unused credits do not carry over after cancellation.",
  },
]

const HELP_CATEGORIES = [
  { icon: Upload, label: "Uploading Frames", desc: "File formats, sizes, tips", color: "#00bcd4" },
  { icon: Users, label: "AI Model Setup", desc: "Creating & saving models", color: "#9c27b0" },
  { icon: Camera, label: "Camera Settings", desc: "Lenses, lighting, grain", color: "#f9a825" },
  { icon: Palette, label: "Scene & Mood", desc: "Backgrounds, moods, colors", color: "#4caf50" },
  { icon: Zap, label: "Generation", desc: "Quality, format, preview", color: "var(--gold)" },
  { icon: CreditCard, label: "Billing & Credits", desc: "Plans, payments, invoices", color: "#7080a0" },
]

const TROUBLESHOOTING = [
  { icon: Wrench, label: "Generation failed or stuck", tag: "Common" },
  { icon: Lightbulb, label: "Low quality or blurry results", tag: "Quality" },
  { icon: Upload, label: "Upload errors or rejected files", tag: "Upload" },
  { icon: Users, label: "Model doesn't match reference", tag: "Model" },
]

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
})

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null)

  const filteredFaqs = FAQS.filter(f =>
    !searchQuery || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 0 48px" }}>
      {/* Page header */}
      <motion.div {...stagger(0)}>
        <div style={{ fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7, marginBottom: 8 }}>
          Support
        </div>
        <h1 style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 34, fontWeight: 300, color: "var(--paper)", marginBottom: 4, letterSpacing: ".01em" }}>
          Help Center
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", lineHeight: 1.7, maxWidth: 500 }}>
          Find answers, troubleshoot issues, or reach out to our team. We're here to help.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div {...stagger(1)} style={{ marginTop: 24 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", background: "var(--panel)", border: "1px solid var(--bdr)",
          borderRadius: 14, transition: "border-color .2s",
        }}>
          <Search size={18} style={{ color: "var(--steel2)", flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for help..."
            style={{
              flex: 1, padding: "2px 0", background: "transparent", border: "none",
              color: "var(--paper)", fontSize: 14, fontFamily: "'Inter_28pt-Regular',sans-serif",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", fontSize: 11, fontFamily: "'Inter_28pt-Regular',sans-serif" }}
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Primary CTA — Chat with support */}
      <motion.div {...stagger(2)} style={{ marginTop: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(201,168,76,.06) 0%, rgba(201,168,76,.02) 100%)",
          border: "1px solid var(--gold-bdr)", borderRadius: 16,
          padding: "28px 26px", position: "relative", overflow: "hidden",
          cursor: "pointer", transition: "all .2s",
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold-bdr2)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--gold-bdr)"}
        >
          <div style={{
            position: "absolute", top: -20, right: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative", flexWrap: "wrap" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#a07030)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <MessageCircle size={24} style={{ color: "var(--ink)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--paper)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginBottom: 3 }}>
                Chat with Support
              </div>
              <div style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.6 }}>
                Get real-time help from our team. Average response time under 5 minutes during business hours.
              </div>
            </div>
            <button style={{
              padding: "11px 22px", background: "var(--gold)", border: "none",
              borderRadius: 10, color: "var(--ink)", fontSize: 12, fontWeight: 700,
              fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer", letterSpacing: ".05em",
              textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap", transition: "opacity .2s",
            }}>
              <Headphones size={14} /> Start Chat
            </button>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
              <span style={{ fontSize: 10, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>Online now</span>
            </div>
            <span style={{ fontSize: 10, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
              Mon–Fri 9AM–6PM CET
            </span>
          </div>
        </div>
      </motion.div>

      {/* Help docs categories */}
      <motion.div {...stagger(3)} style={{ marginTop: 28 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          Help Docs
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {HELP_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon
            const isHovered = hoveredCategory === i
            return (
              <motion.div
                key={cat.label}
                {...stagger(i + 4)}
                onMouseEnter={() => setHoveredCategory(i)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  padding: "18px 16px", background: "var(--panel)",
                  border: `1px solid ${isHovered ? `${cat.color}33` : "var(--bdr)"}`,
                  borderRadius: 12, cursor: "pointer",
                  transition: "all .2s",
                  transform: isHovered ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `${cat.color}12`,
                  border: `1px solid ${cat.color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}>
                  <Icon size={16} style={{ color: cat.color }} />
                </div>
                <div style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500, marginBottom: 3 }}>{cat.label}</div>
                <div style={{ fontSize: 10, color: "var(--steel2)" }}>{cat.desc}</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, marginTop: 10,
                  fontSize: 10, color: cat.color, opacity: isHovered ? 1 : 0,
                  transition: "opacity .15s", fontFamily: "'Inter_28pt-Regular',sans-serif",
                }}>
                  Browse articles <ArrowRight size={11} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* FAQ accordion */}
      <motion.div {...stagger(5)} style={{ marginTop: 32 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          Frequently Asked Questions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {filteredFaqs.map((faq, i) => {
            const isOpen = openFaq === i
            return (
              <div
                key={i}
                style={{
                  background: "var(--panel)", border: "1px solid var(--bdr)",
                  borderRadius: 12, overflow: "hidden", transition: "border-color .2s",
                  ...(isOpen ? { borderColor: "var(--gold-bdr)" } : {}),
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "16px 20px", background: "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                    <HelpCircle size={15} style={{ color: isOpen ? "var(--gold)" : "var(--steel2)", flexShrink: 0, transition: "color .2s" }} />
                    <span style={{ fontSize: 13, color: isOpen ? "var(--paper)" : "var(--paper2)", fontWeight: 500, fontFamily: "'Inter_28pt-Regular',sans-serif", transition: "color .2s" }}>
                      {faq.q}
                    </span>
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} style={{ color: isOpen ? "var(--gold)" : "var(--steel2)", flexShrink: 0 }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{
                        padding: "0 20px 18px 47px",
                        fontSize: 12, color: "var(--steel)", lineHeight: 1.8,
                      }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
        {filteredFaqs.length === 0 && searchQuery && (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--steel2)", fontSize: 12 }}>
            No matching questions found for "{searchQuery}"
          </div>
        )}
      </motion.div>

      {/* Troubleshooting */}
      <motion.div {...stagger(6)} style={{ marginTop: 28 }}>
        <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600, marginBottom: 14 }}>
          Troubleshooting
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TROUBLESHOOTING.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", background: "var(--panel)",
                  border: "1px solid var(--bdr)", borderRadius: 10,
                  cursor: "pointer", transition: "all .18s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)"; e.currentTarget.style.background = "rgba(201,168,76,.02)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.background = "var(--panel)" }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "rgba(255,255,255,.03)", border: "1px solid var(--bdr)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={15} style={{ color: "var(--steel)" }} />
                </div>
                <span style={{ flex: 1, fontSize: 12, color: "var(--paper2)", fontWeight: 500, fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)",
                  background: "rgba(255,255,255,.04)", padding: "3px 8px", borderRadius: 6,
                }}>
                  {item.tag}
                </span>
                <ArrowRight size={14} style={{ color: "var(--steel2)" }} />
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Contact fallback */}
      <motion.div {...stagger(7)} style={{ marginTop: 32 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12,
        }}>
          <div style={{
            padding: "22px 20px", background: "var(--panel)", border: "1px solid var(--bdr)",
            borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
            cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)" }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(201,168,76,.08)", border: "1px solid var(--gold-bdr)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Mail size={18} style={{ color: "var(--gold)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500 }}>Email Us</div>
              <div style={{ fontSize: 11, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginTop: 2 }}>support@viziia.com</div>
            </div>
            <ExternalLink size={14} style={{ color: "var(--steel2)" }} />
          </div>

          <div style={{
            padding: "22px 20px", background: "var(--panel)", border: "1px solid var(--bdr)",
            borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
            cursor: "pointer", transition: "all .2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)" }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(201,168,76,.08)", border: "1px solid var(--gold-bdr)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FileText size={18} style={{ color: "var(--gold)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--paper)", fontWeight: 500 }}>Documentation</div>
              <div style={{ fontSize: 11, color: "var(--steel)", marginTop: 2 }}>Full API & user guides</div>
            </div>
            <ExternalLink size={14} style={{ color: "var(--steel2)" }} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
