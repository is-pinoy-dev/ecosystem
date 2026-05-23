export function ScanlineOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 4px)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  )
}
