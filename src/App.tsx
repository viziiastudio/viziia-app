import { useState, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"
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
import type { ViziiaState } from "@/types"
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
  const [state, setState] = useState<ViziiaState>(defaultState)

  const update = useCallback((patch: Partial<ViziiaState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const nextStep = () => {
    setState(prev => {
      const next = Math.min(prev.step + 1, 4)
      return { ...prev, step: next, maxStep: Math.max(prev.maxStep, next) }
    })
  }
  const prevStep = () => setState(prev => ({
    ...prev,
    step: Math.max(prev.step - 1, 0),
    uploadStarted: prev.step === 0 ? false : prev.uploadStarted,
  }))
  const goStep = (n: number) => {
    setState(prev => n <= prev.maxStep ? { ...prev, step: n } : prev)
  }

  const runGenerate = (previewOnly: boolean) => {
    update({ generating: true, previewMode: previewOnly })
  }
  const onGenerationComplete = () => {
    update({ generating: false, generated: true })
  }
  const resetAll = () => setState(defaultState)

  const totalCredits = state.qty * state.qualityMult
  const remaining = TOTAL_CREDITS - totalCredits

  const STEPS = [
    <Step1Upload key="s1" state={state} update={update} />,
    <Step2Model  key="s2" state={state} update={update} />,
    <Step3Camera key="s3" state={state} update={update} />,
    <Step4Scene  key="s4" state={state} update={update} />,
    <Step5Generate key="s5" state={state} update={update} />,
  ]

  const modelBg = MOOD_GRADIENTS[state.mood] || state.modelBg
  const qualityMult = QUALITY_MULTS[state.quality] ?? 1

  return (
    <div style={{ minHeight: "100svh", width: "100%", background: "var(--ink)" }}>
      <Header totalCredits={TOTAL_CREDITS} />
      <StepRail currentStep={state.step} maxStep={state.maxStep} goStep={goStep} />

      <div style={{ display: "flex", flexDirection: "row", minHeight: "100svh" }}>
        {/* MAIN AREA */}
        <main
          id="mainArea"
          style={{
            flex: 1,
            padding: "14px 28px 100px",
            marginTop: "104px",
            maxHeight: "calc(100vh - 104px)",
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
          }}
          className="main-scroll"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              {STEPS[state.step]}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* SIDEBAR */}
        <Sidebar
          state={state}
          modelBg={modelBg}
          totalCredits={TOTAL_CREDITS}
          totalCost={state.qty * qualityMult}
          remaining={remaining}
        />
      </div>

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

      {state.generating && (
        <GenerationOverlay
          qty={state.previewMode ? 2 : state.qty}
          onComplete={onGenerationComplete}
        />
      )}

      {state.generated && !state.generating && (
        <SuccessScreen
          qty={state.qty}
          previewMode={state.previewMode}
          onReset={resetAll}
          onApprove={() => runGenerate(false)}
        />
      )}
    </div>
  )
}
