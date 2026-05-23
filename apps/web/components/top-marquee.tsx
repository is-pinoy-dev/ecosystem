export function TopMarquee() {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 101,
      backgroundColor: "#F5C800",
      borderBottom: "3px solid #0D0D0D",
      overflow: "hidden",
      padding: "14px 0",
    }}>
      <div style={{
        display: "flex",
        width: "max-content",
        animation: "marquee-scroll 20s linear infinite",
      }}>
        {[0, 1].map((i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "10px",
              color: "#0D0D0D",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "#D4A800" }}>★</span>
            {" LIBRE "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" FREE SUBDOMAINS "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" IS-PINOY.DEV "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" CLAIM YOURS NOW "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" LIBRE "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" FREE SUBDOMAINS "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" IS-PINOY.DEV "}
            <span style={{ color: "#D4A800" }}>★</span>
            {" CLAIM YOURS NOW "}
          </span>
        ))}
      </div>
    </div>
  )
}
