import { BadgeCheck, MonitorSmartphone, ServerOff, Zap } from "lucide-react";

import TextBlurCopy from "../text-blur-copy";
import FadeUpCopy from "../fade-up-copy";
import GlowBorderCard from "../glow-border-card";

const FEATURES = [
  {
    title: "Near‑Native Performance",
    description:
      "NovaGraph runs at speeds you'd expect from installed software, not a website.",
    icon: Zap,
  },
  {
    title: "No Server Processing",
    description:
      "Unlike tools that ship your data to distant servers, NovaGraph processes everything locally. Your data never leaves your device.",
    icon: ServerOff,
  },
  {
    title: "Cross‑Platform Compatibility",
    description:
      "Works the same on Chrome, Safari, Firefox, and Edge — no plugins or downloads. If you have a modern browser, you're good to go.",
    icon: MonitorSmartphone,
  },
  {
    title: "No Setup Required",
    description:
      "Professional-grade graph analysis right in your browser. No installation or specialized infrastructure required.",
    icon: BadgeCheck,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="my-[10%] mx-auto w-11/12 space-y-16 bg-black text-white"
    >
      <TextBlurCopy>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-medium">WASM Architecture</h1>
          <p className="text-white/50">
            How NovaGraph delivers graph analysis directly in your browser
          </p>
        </div>
      </TextBlurCopy>

      <FadeUpCopy
        stagger={0.25}
        className="px-[10%] mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8"
      >
        {FEATURES.map((feature, i) => (
          <GlowBorderCard
            key={i}
            className={
              i % (FEATURES.length - 1) === 0
                ? "lg:col-span-3"
                : "lg:col-span-2"
            }
          >
            <div className="flex items-start gap-4 w-full p-4">
              <div className="relative grid place-items-center rounded-md p-2.5 sm:p-3 bg-white/5 border border-white/10">
                <feature.icon />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-white/70">
                  {feature.description}
                </p>
              </div>
            </div>
          </GlowBorderCard>
        ))}
      </FadeUpCopy>
    </section>
  );
}
