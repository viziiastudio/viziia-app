import { useState, useCallback, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import Header from "@/components/Header"
import StepRail from "@/components/StepRail"
import Sidebar from "@/components/Sidebar"
import BottomNav from "@/components/BottomNav"
import GenerationOverlay from "@/components/GenerationOverlay"
import SuccessScreen from "@/components/SuccessScreen"
import Step1Upload from "@/components/steps/Step1Upload"
import Step2Model from "@/components/steps/Step2Model"
import Step3Camera from "@/components/steps/Step3Camera"
import Step4Scene from "@/components/steps/Step4Scene"
import Step5Generate from "@/components/steps/Step5Generate"
import MyVisuals from "@/components/pages/MyVisuals"
import MyPlan from "@/components/pages/MyPlan"
import HelpPage from "@/components/pages/HelpPage"
import AffiliatePage from "@/components/pages/AffiliatePage"
import type { ViziiaState, AppPage } from "@/types"
import { TOTAL_CREDITS, MOOD_GRADIENTS, QUALITY_MULTS } from "@/types"


const defaultState: ViziiaState = {
  step: 0,
  maxStep: 0,
  qty: 8,
  qualityMult: 1,
  shotStyle: "Upper Body",
  lens: "85",
  lighting: "Soft Box",
  grain: 0,
  grainLabel: "Clean",
  exposure: 0,
  temperature: 50,
  temperatureLabel: "Neutral",
  dof: 25,
  dofLabel: "f/2.0 — Shallow",
  flashMode: "No flash",
  lensEffect: "None",
  mood: "Editorial",
  background: "White seamless",
  customBg: "",
  useCustomBg: false,
  bgColor: "#f5f5f5",
  lightColor: "#fff",
  modelMode: "saved",
  selectedModel: "Sofia",
  modelBg: "linear-gradient(135deg,#1a1a2e,#16213e)",
  modelGender: "Female",
  modelEthnicity: "European",
  modelAge: 30,
  modelFaceShape: "Oval",
  modelHairColor: "Dark Brown",
  modelHairLength: "Long",
  modelEyeColor: "Brown",
  modelSkinTone: "#c8956c",
  modelBodyType: "Slim",
  modelOutfit: "",
  modelHaircutType: "Long straight",
  modelMakeup: 2,
  modelEarrings: false,
  modelFreckles: false,
  modelNaturalSkin: true,
  modelNeckCollarbone: true,
  modelUpperBodyCrop: false,
  modelExpression: "Neutral",
  modelPoseAngle: "Front",
  intent: "Social Media",
  format: "4:5",
  formatLabel: "Portrait",
  quality: "2K",
  qualityLabel: "Standard",
  uploadStarted: false,
  generating: false,
  generated: false,
  previewMode: false,
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const [page, setPage] = useState<AppPage>("studio")
  const [state, setState] = useState<ViziiaState>(defaultState)
  const [savedState, setSavedState] = useState<ViziiaState | null>(null)
  const [showRestoreBanner, setShowRestoreBanner] = useState(false)
  const isFirstSave = useRef(true)

  const update = useCallback((patch: Partial<ViziiaState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const scrollToTop = useCallback(() => {
    document.getElementById("mainArea")?.scrollTo({ top: 0, behavior: "instant" })
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [])

  const STEP_TRANSITION_MS = 220

  const nextStep = () => {
    setState(prev => {
      const next = Math.min(prev.step + 1, 4)
      prevStepRef.current = prev.step
      stepDirectionRef.current = 1
      return { ...prev, step: next, maxStep: Math.max(prev.maxStep, next) }
    })
    setTimeout(scrollToTop, STEP_TRANSITION_MS)
  }
  const prevStep = () => {
    setState(prev => {
      prevStepRef.current = prev.step
      stepDirectionRef.current = -1
      return {
        ...prev,
        step: Math.max(prev.step - 1, 0),
        uploadStarted: prev.step === 0 ? false : prev.uploadStarted,
      }
    })
    setTimeout(scrollToTop, STEP_TRANSITION_MS)
  }
  const goStep = (n: number) => {
    setState(prev => {
      if (n <= prev.maxStep) {
        prevStepRef.current = prev.step
        stepDirectionRef.current = n > prev.step ? 1 : -1
        return { ...prev, step: n }
      }
      return prev
    })
    setTimeout(scrollToTop, STEP_TRANSITION_MS)
  }

  const runGenerate = (previewOnly: boolean) => {
    update({ generating: true, previewMode: previewOnly })
  }
  const onGenerationComplete = () => {
    update({ generating: false, generated: true })
  }

  const [returnToStart, setReturnToStart] = useState(false)
  const prevStepRef = useRef(0)
  const stepDirectionRef = useRef<1 | -1>(1)
  const handleStartOver = useCallback(() => {
    setReturnToStart(true)
  }, [])

  // Scroll to top on page navigation
  useEffect(() => {
    scrollToTop()
  }, [page, scrollToTop])

  // Mount: check localStorage for prior session
  useEffect(() => {
    const raw = localStorage.getItem("viziia_state")
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ViziiaState
        if (parsed && parsed.maxStep > 0) {
          setSavedState(parsed)
          setShowRestoreBanner(true)
        }
      } catch (_) {}
    }
  }, [])

  // Auto-save on every state change (skip first render)
  useEffect(() => {
    if (isFirstSave.current) { isFirstSave.current = false; return }
    localStorage.setItem("viziia_state", JSON.stringify(state))
  }, [state])

  const handleContinueSaved = () => {
    if (savedState) setState({ ...savedState, generating: false, generated: false })
    setShowRestoreBanner(false)
  }
  const handleStartFresh = () => {
    localStorage.removeItem("viziia_state")
    setState(defaultState)
    setShowRestoreBanner(false)
  }

  const totalCredits = state.qty * state.qualityMult
  const remaining = TOTAL_CREDITS - totalCredits

  const STEPS = [
    <Step1Upload key="s1" state={state} update={update} onNext={nextStep} />,
    <Step2Model  key="s2" state={state} update={update} />,
    <Step3Camera key="s3" state={state} update={update} />,
    <Step4Scene  key="s4" state={state} update={update} />,
    <Step5Generate key="s5" state={state} update={update} />,
  ]

  const modelBg = MOOD_GRADIENTS[state.mood] || state.modelBg
  const qualityMult = QUALITY_MULTS[state.quality] ?? 1

  const isStudio = page === "studio"

  const PAGE_COMPONENTS: Record<Exclude<AppPage, "studio">, React.ReactNode> = {
    visuals: <MyVisuals />,
    plan: <MyPlan />,
    help: <HelpPage />,
    affiliate: <AffiliatePage />,
  }

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: "var(--ink)" }}>
      <Header totalCredits={TOTAL_CREDITS} step={state.step} onReset={handleStartOver} page={page} onNavigate={setPage} />

      {isStudio && (
        <StepRail currentStep={state.step} maxStep={state.maxStep} goStep={goStep} />
      )}

      <div style={{ display: "flex", flexDirection: "row", minHeight: "100dvh" }}>
        <main
          id="mainArea"
          style={{
            flex: 1,
            paddingTop: isStudio ? "20px" : "24px",
            paddingBottom: "max(100px, calc(72px + env(safe-area-inset-bottom)))",
            paddingLeft: "max(24px, env(safe-area-inset-left))",
            paddingRight: "max(24px, env(safe-area-inset-right))",
            marginTop: isStudio ? "140px" : "56px",
            maxHeight: isStudio ? "calc(100dvh - 140px)" : "calc(100dvh - 56px)",
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            transition: "margin-top 0.22s ease, max-height 0.22s ease, padding-top 0.22s ease",
          }}
          className={isStudio ? "main-scroll" : "page-scroll"}
        >
          <AnimatePresence mode="wait" custom={stepDirectionRef.current}>
            {isStudio ? (
              <motion.div
                key="studio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
              >
                <AnimatePresence>
                  {state.step === 0 && showRestoreBanner && (
                    <motion.div
                      key="restore-banner"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: reducedMotion ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                      style={{ marginBottom: 14 }}
                    >
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 10, padding: "9px 14px",
                        background: "rgba(201,168,76,.07)", border: "1px solid var(--gold-bdr)",
                        borderLeft: "2px solid var(--gold)", borderRadius: 9,
                        fontSize: 11, color: "var(--paper2)",
                      }}>
                        <span>Continue where you left off?</span>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                          <button onClick={handleContinueSaved} style={{ minHeight: 36, padding: "8px 14px", background: "var(--gold)", border: "none", borderRadius: 8, color: "var(--ink)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Continue</button>
                          <button onClick={handleStartFresh} style={{ minHeight: 36, padding: "8px 12px", background: "transparent", border: "1px solid var(--bdr)", borderRadius: 8, color: "var(--steel)", fontFamily: "'Inter_28pt-Regular',sans-serif", fontSize: 11, cursor: "pointer" }}>Start Fresh</button>
                          <button onClick={() => setShowRestoreBanner(false)} style={{ minWidth: 36, minHeight: 36, padding: 6, background: "transparent", border: "none", color: "var(--steel2)", fontSize: 14, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Dismiss">✕</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {returnToStart ? (
                  <motion.div
                    key="exiting"
                    initial={false}
                    animate={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                    onAnimationComplete={() => {
                      setState(defaultState)
                      setReturnToStart(false)
                    }}
                  >
                    {STEPS[state.step]}
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait" custom={stepDirectionRef.current}>
                    <motion.div
                      key={state.step}
                      custom={stepDirectionRef.current}
                      variants={{
                        enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 18 : -18 }),
                        center: { opacity: 1, x: 0 },
                        exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -18 : 18 }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: reducedMotion ? 0.01 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {STEPS[state.step]}
                    </motion.div>
                  </AnimatePresence>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: "easeOut" }}
              >
                {PAGE_COMPONENTS[page as Exclude<AppPage, "studio">]}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {isStudio && (
          <Sidebar
            state={state}
            modelBg={modelBg}
            totalCredits={TOTAL_CREDITS}
            totalCost={state.qty * qualityMult}
            remaining={remaining}
          />
        )}
      </div>

      {isStudio && !state.generating && !state.generated && (
        <BottomNav
          step={state.step}
          qty={state.qty}
          qualityMult={qualityMult}
          onBack={prevStep}
          onNext={nextStep}
          onGenerate={runGenerate}
          totalCredits={TOTAL_CREDITS}
          totalCost={state.qty * qualityMult}
          hidden={state.step === 0 && !state.uploadStarted}
        />
      )}

      {state.generating && (
        <GenerationOverlay
          qty={state.previewMode ? 2 : state.qty}
          onComplete={onGenerationComplete}
        />
      )}

      {state.generated && !state.generating && (
        <motion.div
          initial={false}
          animate={returnToStart ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (returnToStart) {
              setState(defaultState)
              setReturnToStart(false)
            }
          }}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            pointerEvents: returnToStart ? "none" : "auto",
          }}
        >
          <SuccessScreen
            qty={state.qty}
            previewMode={state.previewMode}
            onReset={handleStartOver}
            onApprove={() => runGenerate(false)}
          />
        </motion.div>
      )}
    </div>
  )
}
