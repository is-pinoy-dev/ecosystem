export function ScanlineOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 4px)",
      }}
      aria-hidden="true"
    />
  )
}
