import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, SlidersHorizontal, FolderPlus, Grid3X3, List, Download,
  Trash2, FolderInput, Eye, Image, Folder, Star, MoreHorizontal,
  ChevronDown, Check, X,
} from "lucide-react"
import { MOOD_GRADIENTS } from "@/types"

type ViewMode = "grid" | "list"
type SortBy = "date" | "name" | "size"

const FOLDERS = [
  { id: "all", name: "All Visuals", count: 24, color: "var(--gold)" },
  { id: "summer", name: "Summer Campaign", count: 8, color: "#f9a825" },
  { id: "product", name: "Product Shots", count: 12, color: "#00bcd4" },
  { id: "social", name: "Social Media", count: 4, color: "#7b1fa2" },
  { id: "headshots", name: "Headshots", count: 6, color: "#4caf50" },
]

const VISUALS = [
  { id: 1, name: "Summer_Editorial_001", date: "2 days ago", resolution: "4K", mood: "Editorial", folder: "summer", starred: true },
  { id: 2, name: "Summer_Editorial_002", date: "2 days ago", resolution: "4K", mood: "Editorial", folder: "summer", starred: false },
  { id: 3, name: "Lifestyle_Beach_001", date: "2 days ago", resolution: "2K", mood: "Lifestyle", folder: "summer", starred: true },
  { id: 4, name: "Product_White_001", date: "5 days ago", resolution: "4K", mood: "Minimal", folder: "product", starred: false },
  { id: 5, name: "Product_White_002", date: "5 days ago", resolution: "4K", mood: "Minimal", folder: "product", starred: false },
  { id: 6, name: "Product_Luxury_001", date: "5 days ago", resolution: "8K", mood: "Luxury", folder: "product", starred: true },
  { id: 7, name: "Social_Portrait_001", date: "1 week ago", resolution: "2K", mood: "Fashion", folder: "social", starred: false },
  { id: 8, name: "Social_Portrait_002", date: "1 week ago", resolution: "2K", mood: "Fashion", folder: "social", starred: false },
  { id: 9, name: "Headshot_Corp_001", date: "2 weeks ago", resolution: "4K", mood: "Clinical", folder: "headshots", starred: false },
  { id: 10, name: "Headshot_Corp_002", date: "2 weeks ago", resolution: "4K", mood: "Clinical", folder: "headshots", starred: false },
  { id: 11, name: "Summer_Vintage_001", date: "3 weeks ago", resolution: "2K", mood: "Vintage", folder: "summer", starred: false },
  { id: 12, name: "Product_Nature_001", date: "3 weeks ago", resolution: "4K", mood: "Natural", folder: "product", starred: true },
]

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
})

export default function MyVisuals() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolder, setActiveFolder] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  const filteredVisuals = VISUALS.filter(v => {
    const matchFolder = activeFolder === "all" || v.folder === activeFolder
    const matchSearch = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchFolder && matchSearch
  })

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedItems.size === filteredVisuals.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredVisuals.map(v => v.id)))
    }
  }

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 0 48px" }}>
      {/* Page header */}
      <motion.div {...stagger(0)}>
        <div style={{ fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", opacity: .7, marginBottom: 8 }}>
          Library
        </div>
        <h1 style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 34, fontWeight: 300, color: "var(--paper)", marginBottom: 4, letterSpacing: ".01em" }}>
          My Visuals
        </h1>
        <p style={{ fontSize: 13, color: "var(--steel)", lineHeight: 1.7, maxWidth: 500 }}>
          All your generated visuals in one place. Organize, download, and manage your creative assets.
        </p>
      </motion.div>

      {/* Folders */}
      <motion.div {...stagger(1)} style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--steel2)", fontWeight: 600 }}>
            Folders
          </div>
          <button
            onClick={() => setShowNewFolder(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", background: "transparent",
              border: "1px solid var(--bdr)", borderRadius: 8,
              color: "var(--steel)", fontSize: 10, cursor: "pointer",
              fontFamily: "'Inter_28pt-Regular',sans-serif", transition: "all .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold-bdr)"; e.currentTarget.style.color = "var(--gold)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bdr)"; e.currentTarget.style.color = "var(--steel)" }}
          >
            <FolderPlus size={12} /> New Folder
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="folder-scroll">
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px", flexShrink: 0,
                background: activeFolder === f.id ? "var(--gold-dim)" : "var(--panel)",
                border: `1px solid ${activeFolder === f.id ? "var(--gold-bdr)" : "var(--bdr)"}`,
                borderRadius: 10, cursor: "pointer",
                transition: "all .2s",
              }}
            >
              <Folder size={14} style={{ color: activeFolder === f.id ? "var(--gold)" : "var(--steel2)" }} />
              <span style={{
                fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
                color: activeFolder === f.id ? "var(--gold)" : "var(--paper2)",
                fontFamily: "'Inter_28pt-Regular',sans-serif",
              }}>
                {f.name}
              </span>
              <span style={{
                fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif",
                color: activeFolder === f.id ? "var(--gold)" : "var(--steel2)",
                background: activeFolder === f.id ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.04)",
                padding: "2px 7px", borderRadius: 20,
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setShowNewFolder(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: .96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .96, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: 16, padding: "24px 22px", width: "100%", maxWidth: 340 }}
            >
              <div style={{ fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gold)", opacity: .7, marginBottom: 6 }}>New Folder</div>
              <div style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 20, color: "var(--paper)", marginBottom: 16 }}>Create a folder</div>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 14px",
                  background: "var(--panel3)", border: "1px solid var(--bdr)", borderRadius: 8,
                  color: "var(--paper)", fontSize: 13, fontFamily: "'Inter_28pt-Regular',sans-serif",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => setShowNewFolder(false)}
                  style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--steel)", fontSize: 12, fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowNewFolder(false); setNewFolderName("") }}
                  style={{ flex: 1, padding: "10px", background: "var(--gold)", border: "none", borderRadius: 8, color: "var(--ink)", fontSize: 12, fontWeight: 700, fontFamily: "'Inter_28pt-Regular',sans-serif", cursor: "pointer" }}
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Actions bar */}
      <motion.div {...stagger(2)} style={{ marginTop: 24, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          flex: "1 1 240px", display: "flex", alignItems: "center", gap: 8,
          padding: "0 14px", background: "var(--panel)", border: "1px solid var(--bdr)",
          borderRadius: 10, transition: "border-color .2s",
        }}
          onFocus={() => {}}
        >
          <Search size={14} style={{ color: "var(--steel2)", flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search visuals..."
            style={{
              flex: 1, padding: "10px 0", background: "transparent", border: "none",
              color: "var(--paper)", fontSize: 12, fontFamily: "'Inter_28pt-Regular',sans-serif",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "var(--steel2)", cursor: "pointer", padding: 2 }}>
              <X size={13} />
            </button>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 12px", background: "var(--panel)", border: "1px solid var(--bdr)",
              borderRadius: 10, color: "var(--steel)", fontSize: 11, cursor: "pointer",
              fontFamily: "'Inter_28pt-Regular',sans-serif", transition: "all .2s",
            }}
          >
            <SlidersHorizontal size={13} />
            {sortBy === "date" ? "Recent" : sortBy === "name" ? "Name" : "Size"}
            <ChevronDown size={11} />
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                  background: "var(--panel2)", border: "1px solid var(--bdr)", borderRadius: 10,
                  padding: 4, minWidth: 140, boxShadow: "0 8px 32px rgba(0,0,0,.5)",
                }}
              >
                {(["date", "name", "size"] as SortBy[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSortBy(s); setShowSortMenu(false) }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "8px 12px", background: "transparent", border: "none",
                      borderRadius: 7, color: sortBy === s ? "var(--gold)" : "var(--paper2)",
                      fontSize: 11, cursor: "pointer", fontFamily: "'Inter_28pt-Regular',sans-serif",
                      transition: "background .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {s === "date" ? "Most Recent" : s === "name" ? "Name A–Z" : "Resolution"}
                    {sortBy === s && <Check size={12} style={{ color: "var(--gold)" }} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: "flex", border: "1px solid var(--bdr)", borderRadius: 10, overflow: "hidden" }}>
          {([["grid", Grid3X3], ["list", List]] as const).map(([mode, Icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as ViewMode)}
              style={{
                padding: "9px 11px", background: viewMode === mode ? "var(--gold-dim)" : "var(--panel)",
                border: "none", color: viewMode === mode ? "var(--gold)" : "var(--steel2)",
                cursor: "pointer", transition: "all .2s", display: "flex",
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginTop: 14,
              padding: "10px 16px", background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
              borderRadius: 10,
            }}>
              <button onClick={selectAll} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                background: "rgba(201,168,76,.15)", border: "1px solid var(--gold-bdr)",
                borderRadius: 6, color: "var(--gold)", fontSize: 10, cursor: "pointer",
                fontFamily: "'Inter_28pt-Regular',sans-serif",
              }}>
                <Check size={11} /> {selectedItems.size} selected
              </button>
              <div style={{ flex: 1 }} />
              <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--paper2)", fontSize: 10, cursor: "pointer", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                <Download size={12} /> Download
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--paper2)", fontSize: 10, cursor: "pointer", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                <FolderInput size={12} /> Move
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>
                <Trash2 size={12} /> Delete
              </button>
              <button onClick={() => setSelectedItems(new Set())} style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: 2 }}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid / List view */}
      {filteredVisuals.length > 0 ? (
        <div
          className="visuals-grid"
          style={{
            display: viewMode === "grid" ? "grid" : "flex",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            flexDirection: viewMode === "list" ? "column" : undefined,
            gap: viewMode === "grid" ? 12 : 4,
            marginTop: 20,
          }}
        >
          {filteredVisuals.map((visual, i) => {
            const isSelected = selectedItems.has(visual.id)
            const isHovered = hoveredItem === visual.id
            const bg = MOOD_GRADIENTS[visual.mood] || "linear-gradient(135deg,var(--panel3),var(--panel2))"

            if (viewMode === "list") {
              return (
                <motion.div
                  key={visual.id}
                  {...stagger(i + 3)}
                  onMouseEnter={() => setHoveredItem(visual.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => toggleSelect(visual.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "10px 14px",
                    background: isSelected ? "var(--gold-dim)" : isHovered ? "rgba(255,255,255,.02)" : "transparent",
                    border: `1px solid ${isSelected ? "var(--gold-bdr)" : "var(--bdr)"}`,
                    borderRadius: 10, cursor: "pointer", transition: "all .18s",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 7, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    <Image size={16} style={{ color: "rgba(255,255,255,.2)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--paper)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{visual.name}</div>
                    <div style={{ fontSize: 10, color: "var(--steel2)", fontFamily: "'Inter_28pt-Regular',sans-serif" }}>{visual.date} · {visual.resolution}</div>
                  </div>
                  {visual.starred && <Star size={13} style={{ color: "var(--gold)", fill: "var(--gold)" }} />}
                  <div style={{ fontSize: 9, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "var(--steel2)", padding: "3px 8px", background: "rgba(255,255,255,.03)", borderRadius: 6 }}>{visual.mood}</div>
                  <div style={{ display: "flex", gap: 2, opacity: isHovered ? 1 : 0, transition: "opacity .15s" }}>
                    <button onClick={e => e.stopPropagation()} style={{ padding: 6, background: "none", border: "none", color: "var(--steel)", cursor: "pointer" }}><Eye size={13} /></button>
                    <button onClick={e => e.stopPropagation()} style={{ padding: 6, background: "none", border: "none", color: "var(--steel)", cursor: "pointer" }}><Download size={13} /></button>
                    <button onClick={e => e.stopPropagation()} style={{ padding: 6, background: "none", border: "none", color: "var(--steel)", cursor: "pointer" }}><MoreHorizontal size={13} /></button>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={visual.id}
                {...stagger(i + 3)}
                onMouseEnter={() => setHoveredItem(visual.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  position: "relative", borderRadius: 12, overflow: "hidden",
                  border: `1.5px solid ${isSelected ? "var(--gold)" : "var(--bdr)"}`,
                  cursor: "pointer", transition: "border-color .2s, transform .2s",
                  transform: isHovered ? "translateY(-2px)" : "none",
                }}
              >
                {/* Thumbnail */}
                <div style={{ aspectRatio: "4/5", background: bg, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Image size={32} style={{ color: "rgba(255,255,255,.08)" }} />
                  </div>

                  {/* Shimmer */}
                  <div style={{
                    position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%",
                    background: "linear-gradient(90deg,transparent,rgba(255,255,255,.04),transparent)",
                    animation: "shimmer 3.5s ease infinite",
                    animationDelay: `${i * 0.3}s`,
                  }} />

                  {/* Resolution badge */}
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    padding: "3px 7px", borderRadius: 5,
                    background: "rgba(0,0,0,.55)", backdropFilter: "blur(8px)",
                    fontSize: 8.5, fontFamily: "'Inter_28pt-Regular',sans-serif", color: "rgba(255,255,255,.7)",
                    letterSpacing: ".06em",
                  }}>
                    {visual.resolution}
                  </div>

                  {/* Star */}
                  {visual.starred && (
                    <div style={{ position: "absolute", top: 8, left: 8 }}>
                      <Star size={12} style={{ color: "var(--gold)", fill: "var(--gold)" }} />
                    </div>
                  )}

                  {/* Select checkbox */}
                  <div
                    onClick={e => { e.stopPropagation(); toggleSelect(visual.id) }}
                    style={{
                      position: "absolute", top: 8, left: 8,
                      width: 20, height: 20, borderRadius: 5,
                      border: `1.5px solid ${isSelected ? "var(--gold)" : "rgba(255,255,255,.25)"}`,
                      background: isSelected ? "var(--gold)" : "rgba(0,0,0,.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all .15s",
                      opacity: isSelected || isHovered ? 1 : 0,
                      transform: !visual.starred ? "none" : "translateX(22px)",
                    }}
                  >
                    {isSelected && <Check size={12} style={{ color: "var(--ink)" }} />}
                  </div>

                  {/* Hover overlay */}
                  <AnimatePresence>
                    {isHovered && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,.45)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <button
                          onClick={e => e.stopPropagation()}
                          style={{
                            padding: "8px 12px", background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#fff",
                            fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                            fontFamily: "'Inter_28pt-Regular',sans-serif",
                          }}
                        >
                          <Eye size={12} /> Open
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          style={{
                            padding: 8, background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#fff",
                            cursor: "pointer", display: "flex",
                          }}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          style={{
                            padding: 8, background: "rgba(255,255,255,.12)", backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, color: "#fff",
                            cursor: "pointer", display: "flex",
                          }}
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom metadata gradient */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "24px 12px 10px",
                    background: "linear-gradient(transparent, rgba(0,0,0,.65))",
                  }}>
                    <div style={{ fontSize: 11, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {visual.name}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", fontFamily: "'Inter_28pt-Regular',sans-serif", marginTop: 2 }}>
                      {visual.date}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            marginTop: 60, padding: "60px 30px", textAlign: "center",
            border: "1.5px dashed rgba(255,255,255,.06)", borderRadius: 20,
            background: "rgba(255,255,255,.01)",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
            background: "var(--gold-dim)", border: "1px solid var(--gold-bdr)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Image size={28} style={{ color: "var(--gold)", opacity: .5 }} />
          </div>
          <div style={{ fontFamily: "'Inter_24pt-Medium',sans-serif", fontSize: 22, color: "var(--paper)", marginBottom: 6 }}>
            {searchQuery ? "No visuals found" : "No visuals yet"}
          </div>
          <div style={{ fontSize: 12, color: "var(--steel)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
            {searchQuery
              ? `Nothing matches "${searchQuery}". Try a different search term.`
              : "Your generated visuals will appear here. Head to the Studio to create your first shoot."
            }
          </div>
          {!searchQuery && (
            <button style={{
              marginTop: 20, padding: "10px 22px",
              background: "linear-gradient(135deg,var(--gold-hi),var(--gold),#a07030)",
              border: "none", borderRadius: 10, color: "var(--ink)",
              fontSize: 12, fontWeight: 700, fontFamily: "'Inter_28pt-Regular',sans-serif",
              letterSpacing: ".05em", cursor: "pointer", textTransform: "uppercase",
            }}>
              Go to Studio
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
