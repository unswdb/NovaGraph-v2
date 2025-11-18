import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import TextBlurCopy from "../text-blur-copy";

import { useIsMobile } from "~/hooks/use-mobile";

const SLIDES = [
  {
    title: "Define or Import Your Graph Data",
    description:
      "Construct nodes and/or edges through a schema-driven interface, specifying properties and metadata, or import existing graph data from CSV or JSON files.",
    image: "import.gif",
  },
  {
    title: "Visualize Your Graph",
    description:
      "Render and explore large graphs smoothly using a high-performance WebGL visualizer.",
    image: "visualizer.gif",
  },
  {
    title: "Run Algorithms and Execute Queries",
    description:
      "Select from a library of algorithms to analyze your graph, or write queries to test your hypotheses directly.",
    image: "algorithm_query.gif",
  },
  {
    title: "Export Results for Further Analysis",
    description:
      "Save your findings as JSON or YAML format for further analysis.",
    image: "export.gif",
  },
];

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(n, max));
}

export default function ScrollCarousel() {
  const isMobile = useIsMobile();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Desktop animation
  useEffect(() => {
    if (isMobile) return;

    if (!containerRef.current) return;

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: `+=${window.innerHeight * (SLIDES.length - 1)}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        setProgress(self.progress);
        const idx = Math.min(
          SLIDES.length - 1,
          Math.floor(self.progress * SLIDES.length)
        );
        setActiveSlideIdx(idx);
      },
    });

    return () => st.kill();
  }, [isMobile]);

  // Mobile animation
  useEffect(() => {
    if (!isMobile) return;
    gsap.utils.toArray<HTMLElement>(".slide-card").forEach((card) => {
      gsap.fromTo(
        card,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "power3.in",
          scrollTrigger: {
            trigger: card,
            start: "top 80%",
            end: "bottom 90%",
          },
        }
      );
    });
  }, [isMobile]);

  // Mobile layout
  if (isMobile) {
    return (
      <section
        id="features"
        className="py-[10%] space-y-16 bg-black text-white mx-auto w-4/5"
      >
        <TextBlurCopy>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium">How does it work?</h1>
            <p className="text-white/50">
              From data to discovery in four simple steps
            </p>
          </div>
        </TextBlurCopy>

        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="slide-card flex flex-col items-center space-y-6 px-6 transition-transform duration-300"
          >
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-black p-4 shadow-lg">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-auto object-contain rounded-md"
              />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs uppercase tracking-wider text-indigo-400">
                Step {i + 1}
              </p>
              <h2 className="text-lg font-semibold">{slide.title}</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                {slide.description}
              </p>
            </div>
          </div>
        ))}
      </section>
    );
  }

  // Desktop layout
  return (
    <section
      id="features"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Header */}
      <div className="absolute top-[10%] left-0 right-0 text-center space-y-2">
        <TextBlurCopy>
          <h1 className="text-2xl font-medium">How does it work?</h1>
          <p className="text-white/50">From data to discovery in four steps</p>
        </TextBlurCopy>
      </div>

      {/* Pinned Slide Stage */}
      <div className="top-[calc(10%+64px)] relative w-full h-[calc(100%-10%-64px-140px-10%)] grid place-items-center">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 py-12 flex flex-col items-center justify-center transition-opacity duration-700 ${
              i === activeSlideIdx ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="h-full aspect-[16/9] bg-black border border-white/10 rounded-xl flex items-center justify-center animate-glow">
              <img
                src={slide.image}
                alt={slide.title}
                className="object-contain w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom text & progress */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-full">
        <div className="grid grid-flow-col auto-cols-fr justify-center gap-6 px-[10%]">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`flex flex-col items-start gap-6 transition-colors ${
                i === activeSlideIdx ? "opacity-100" : "opacity-25"
              }`}
            >
              <div className="flex-1 space-y-2">
                <h2 className="text-xs uppercase tracking-wider text-primary">
                  Step {i + 1}
                </h2>
                <p className="font-semibold text-sm">{slide.title}</p>
                <p className="text-xs text-gray-400">{slide.description}</p>
              </div>
              {/* Progress bar */}
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    transform: `scaleX(${clamp(progress * SLIDES.length - i)})`,
                    transformOrigin: "left",
                    transition: "transform 0.08s linear",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
