export function TopMarquee() {
  return (
    <div className="fixed top-0 right-0 left-0 z-[101] overflow-hidden bg-primary border-b-[3px] border-b-background py-[14px]">
      <div
        className="flex w-max"
        style={{ animation: "marquee-scroll 20s linear infinite" }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="font-pixel text-[10px] text-background whitespace-nowrap"
          >
            <span className="text-primary-dark">★</span>
            {" LIBRE "}
            <span className="text-primary-dark">★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span className="text-primary-dark">★</span>
            {" FREE SUBDOMAINS "}
            <span className="text-primary-dark">★</span>
            {" IS-PINOY.DEV "}
            <span className="text-primary-dark">★</span>
            {" CLAIM YOURS NOW "}
            <span className="text-primary-dark">★</span>
            {" LIBRE "}
            <span className="text-primary-dark">★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span className="text-primary-dark">★</span>
            {" FREE SUBDOMAINS "}
            <span className="text-primary-dark">★</span>
            {" IS-PINOY.DEV "}
            <span className="text-primary-dark">★</span>
            {" CLAIM YOURS NOW "}
          </span>
        ))}
      </div>
    </div>
  )
}
