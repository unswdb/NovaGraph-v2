import {
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { cn } from "~/lib/utils";

export default function GlowBorderCard({
  children,
  hoveredRadius = 240,
  className,
}: {
  children: ReactNode;
  hoveredRadius?: number; // in px
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setPos({ x, y });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-xl border border-transparent bg-gradient-to-br from-white/5 to-white/0 transition-all duration-300",
        hovered && "border-white/10 shadow-[0_0_12px_rgba(255,255,255,0.05)]",
        className
      )}
    >
      {/* Glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle ${hoveredRadius}px at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.05), rgba(255,255,255,0) 70%)`,
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          mixBlendMode: "screen",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
