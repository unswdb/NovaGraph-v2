import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

export default function SeparatorOnScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !fillRef.current) return;

      // Animate the inner fill from 0 to full height
      gsap.fromTo(
        fillRef.current,
        { scaleY: 0, transformOrigin: "top center" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
            end: "bottom 20%",
            scrub: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative mx-auto w-[1px] h-[35vh]">
      {/* Base track (faint outline) */}
      <div className="absolute inset-0 w-[1px] bg-primary/10 rounded-full" />

      {/* Animated fill gradient */}
      <div
        ref={fillRef}
        className="absolute inset-0 w-[1px] origin-top bg-gradient-to-b from-primary/0 to-primary rounded-full"
      />

      {/* Tip dot */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_theme(colors.primary.DEFAULT)]" />
    </div>
  );
}
