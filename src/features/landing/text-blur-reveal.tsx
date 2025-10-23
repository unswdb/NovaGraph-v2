import { useRef, type ReactElement } from "react";

import gsap from "gsap";
import SplitText from "gsap/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

export default function TextBlurCopy<T extends TextTag>({
  children,
  animateOnScroll = true,
  stagger = 0.1,
  duration = 0.8,
  delay = 0,
}: {
  children: ReactElement<T> | ReactElement<T>[];
  animateOnScroll?: boolean;
  stagger?: number; // in seconds
  duration?: number; // in seconds
  delay?: number; // in seconds
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementRefs = useRef<HTMLElement[]>([]);
  const splitRefs = useRef<SplitText[]>([]);
  const words = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      gsap.registerPlugin(SplitText, ScrollTrigger);

      if (!containerRef.current) return;

      elementRefs.current = [];
      splitRefs.current = [];
      words.current = [];

      const elements = containerRef.current.hasAttribute("data-copy-wrapper")
        ? Array.from(containerRef.current.children).filter(
            (n): n is HTMLElement => n instanceof HTMLElement
          )
        : [containerRef.current];

      elements.forEach((element) => {
        elementRefs.current.push(element);

        const split = SplitText.create(element, {
          type: "lines,words",
          linesClass: "line++",
          lineThreshold: 0.1,
        });
        splitRefs.current.push(split);

        const splitLines = split.lines as HTMLElement[];
        const textIndent = window.getComputedStyle(element).textIndent;
        if (!!textIndent && textIndent !== "0px") {
          if (splitLines.length > 0) {
            splitLines[0].style.paddingLeft = textIndent;
            element.style.textIndent = "0";
          }
        }

        const splitWords = split.words as HTMLElement[];
        words.current.push(...splitWords);
      });

      gsap.set(words.current, {
        opacity: 0,
        y: 8,
        filter: "blur(24px)",
        willChange: "transform, filter, opacity",
      });

      const animationBaseProps = {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration,
        stagger,
        ease: "power3.out",
        delay: delay,
      };

      if (animateOnScroll) {
        gsap.to(words.current, {
          ...animationBaseProps,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            once: true,
          },
        });
      } else {
        gsap.to(words.current, animationBaseProps);
      }

      return () => {
        splitRefs.current.forEach((split) => {
          if (split) {
            split.revert();
          }
        });
      };
    },
    { scope: containerRef, dependencies: [animateOnScroll, delay] }
  );

  return <div ref={containerRef}>{children}</div>;
}
