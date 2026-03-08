interface Props {
  currentStep: number
  maxStep: number
  goStep: (n: number) => void
}

const LABELS = ["Upload", "Model", "Camera", "Scene", "Generate"]

export default function StepRail({ currentStep, maxStep, goStep }: Props) {
  return (
    <nav style={{
      position: "fixed", top: 56, left: 0, right: 0, zIndex: 200,
      height: 48, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 28px",
      background: "rgba(7,9,13,.98)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--bdr)",
      overflowX: "auto", overflowY: "hidden",
    }}>
      {LABELS.map((label, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        const isClickable = i <= maxStep

        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div
              onClick={() => isClickable && goStep(i)}
              className="step-item"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "0 3px",
                cursor: isClickable ? "pointer" : "default",
                userSelect: "none",
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8.5,
                fontFamily: "'DM Mono',monospace",
                border: `1.5px solid ${isDone ? "var(--success)" : isActive ? "var(--gold)" : "var(--steel2)"}`,
                background: isDone ? "var(--success-d)" : isActive ? "var(--gold-dim2)" : "var(--panel2)",
                color: isDone ? "var(--success)" : isActive ? "var(--gold)" : "var(--steel2)",
                transition: "all .3s",
                flexShrink: 0,
              }}>
                {isDone ? "✓" : i + 1}
              </div>
              <span className="step-label" style={{
                fontSize: 10, letterSpacing: ".07em", textTransform: "uppercase",
                color: isDone ? "var(--steel)" : isActive ? "var(--gold)" : "var(--steel2)",
                whiteSpace: "nowrap", fontWeight: 500,
                transition: "color .2s",
              }}>
                {label}
              </span>
            </div>
            {i < 4 && (
              <div className="step-connector" style={{
                width: 28, height: 1, margin: "0 4px",
                background: i < currentStep ? "rgba(34,197,94,.25)" : "var(--bdr)",
                flexShrink: 0, transition: "background .3s",
              }} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
