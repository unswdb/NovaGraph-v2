import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, type ComponentProps, type ReactElement } from "react";

export default function FadeUpCopy({
  children,
  animateOnScroll = true,
  stagger = 0.1,
  duration = 1,
  delay = 0,
  className,
}: {
  children: ReactElement | ReactElement[];
  animateOnScroll?: boolean;
  stagger?: number;
  duration?: number;
  delay?: number;
} & ComponentProps<"div">) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const targets = containerRef.current.children;

      // Set initial state for all children
      gsap.set(targets, {
        opacity: 0,
        y: 8,
      });

      const animationBaseProps = {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: "power3.out",
        delay,
      };

      if (animateOnScroll) {
        gsap.to(targets, {
          ...animationBaseProps,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            once: true,
          },
        });
      } else {
        gsap.to(targets, animationBaseProps);
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
