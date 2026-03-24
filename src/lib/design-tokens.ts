// Design tokens — single source of truth mirroring src/index.css :root vars.
// Import these instead of hardcoding values in components.

export const colors = {
  // Base dark backgrounds
  ink:   '#07090d',
  ink2:  '#0b0e15',
  ink3:  '#0f1219',

  // Panel surfaces
  panel:  '#0c0f17',
  panel2: '#10141e',
  panel3: '#141824',

  // Gold accent
  gold:     '#c9a84c',
  goldHi:   '#ddb95a',
  goldDim:  'rgba(201,168,76,0.09)',
  goldDim2: 'rgba(201,168,76,0.16)',
  goldBdr:  'rgba(201,168,76,0.26)',
  goldBdr2: 'rgba(201,168,76,0.45)',

  // Steel muted tones
  steel:  '#7080a0',
  steel2: '#3d4d64',

  // Paper light tones
  paper:  '#eef0f6',
  paper2: '#b8c0d0',
  paper3: '#8090a8',

  // Semantic
  success:  '#22c55e',
  successD: 'rgba(34,197,94,0.11)',
  accent2:  '#204070',

  // Generic borders
  bdr:  'rgba(255,255,255,0.055)',
  bdr2: 'rgba(255,255,255,0.035)',
} as const

export const radius = {
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '14px',
} as const

export const spacing = {
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
} as const

export const transition = {
  fast:   '150ms ease',
  normal: '220ms ease',
  slow:   '300ms ease',
} as const

// Duration values separated for use with JS animation APIs
export const duration = {
  fast:   150,
  normal: 220,
  slow:   300,
} as const

export const typography = {
  fontFamily: {
    base:    "'Inter_28pt-Regular', sans-serif",
    heading: "'Inter_24pt-Medium', sans-serif",
  },
  fontWeight: {
    regular: 400,
    medium:  500,
  },
  // font-variation-settings optical sizes
  opticalSize: {
    base:    28,
    heading: 24,
  },
} as const

// Keyframe animation names — use with className or CSS animation property
export const animation = {
  orbDrift:    'orbDrift',
  dotPulse:    'dotPulse',
  shimmer:     'shimmer',
  thumbPop:    'thumbPop',
  badgeIn:     'badgeIn',
  pulseRing:   'pulseRing',
  stageFadeIn: 'stageFadeIn',
  confirmPulse: 'confirmPulse',
} as const

export type Color      = keyof typeof colors
export type Radius     = keyof typeof radius
export type Spacing    = keyof typeof spacing
export type Animation  = keyof typeof animation
