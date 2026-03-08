export interface ViziiaState {
  step: number
  maxStep: number
  qty: number
  qualityMult: number
  // Camera
  shotStyle: string
  lens: string
  lighting: string
  grain: number
  grainLabel: string
  exposure: number
  temperature: number
  temperatureLabel: string
  dof: number
  dofLabel: string
  flashMode: string
  lensEffect: string
  // Scene
  mood: string
  background: string
  customBg: string
  useCustomBg: boolean
  bgColor: string
  lightColor: string
  // Model
  modelMode: "saved" | "new"
  selectedModel: string
  modelBg: string
  modelGender: string
  modelEthnicity: string
  modelAge: number
  modelFaceShape: string
  modelHairColor: string
  modelHairLength: string
  modelEyeColor: string
  modelSkinTone: string
  modelBodyType: string
  modelOutfit: string
  modelHaircutType: string
  modelMakeup: number
  modelEarrings: boolean
  modelFreckles: boolean
  modelNaturalSkin: boolean
  modelNeckCollarbone: boolean
  modelUpperBodyCrop: boolean
  modelExpression: string
  modelPoseAngle: string
  // Generate
  intent: string
  format: string
  formatLabel: string
  quality: string
  qualityLabel: string
  uploadStarted: boolean
  // Generation
  generating: boolean
  generated: boolean
  previewMode: boolean
}

export const TOTAL_CREDITS = 68
export const STEP_LABELS = ["Upload Frames", "Build Model", "Camera Settings", "Set the Scene", "Review & Generate"]
export const NEXT_LABELS = ["Continue to Model →", "Continue to Camera →", "Continue to Scene →", "Review & Generate →"]

export const MOOD_GRADIENTS: Record<string, string> = {
  Editorial:   "linear-gradient(135deg,#1a1a2e,#16213e)",
  Lifestyle:   "linear-gradient(135deg,#f9a825,#fb8c00)",
  Luxury:      "linear-gradient(135deg,#3e2723,#c9a84c)",
  Fashion:     "linear-gradient(135deg,#1a0530,#7b1fa2)",
  Minimal:     "linear-gradient(135deg,#e0e0e0,#bdbdbd)",
  Sport:       "linear-gradient(135deg,#1b5e20,#4caf50)",
  Vintage:     "linear-gradient(135deg,#795548,#d4a96a)",
  Clinical:    "linear-gradient(135deg,#e3f2fd,#90caf9)",
  Futuristic:  "linear-gradient(135deg,#0d1b2a,#00bcd4)",
  Natural:     "linear-gradient(135deg,#388e3c,#a5d6a7)",
}

export const QUALITY_MULTS: Record<string, number> = { "1K": 1, "2K": 1, "4K": 2, "8K": 4 }
export const QUALITY_INFO: Record<string, string> = {
  "1K": "1K Draft — fast preview quality. Great for internal review.",
  "2K": "2K Standard — ideal for social media, e-commerce, and most web use.",
  "4K": "4K High Res — magazine print, large-format display. Uses 2× credits.",
  "8K": "8K Max Print — billboard and large-format print. Uses 4× credits.",
}
