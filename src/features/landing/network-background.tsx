import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

// ====== Tunables (feel free to tweak these) ======
const DENSITY = 0.00002; // nodes per pixel (lower = fewer)
const MIN_DIST = 40; // min spacing (higher = more separated)
const CONNECT_RADIUS = 140; // max edge length
const K_NEIGHBORS = 4; // neighbors per node (avoid hairballs)

const EDGE_ALPHA_BASE = 0.15; // very subtle edges
const EDGE_ALPHA_SPOT = 1; // extra alpha near spotlight (will be scaled)
const EDGE_WIDTH = 0.5;

const NODE_BASE_R = 1.2; // base star radius
const NODE_R_TWINKLE = 0.9; // twinkle radius gain
const NODE_BASE_ALPHA = 0.18; // base star opacity
const NODE_TWINKLE_ALPHA = 0.35; // twinkle alpha gain
const STAR_FLARE_LEN = 5; // cross flare length (px)
const STAR_FLARE_ALPHA = 0.18; // flare opacity at max twinkle
const STAR_FLARE_WIDTH = 0.7; // flare line width

const SIGMA = 150; // spotlight width (bigger = softer)
const SPOT_GAMMA = 0.7; // soften spotlight ramp
const LERP = 0.5; // mouse smoothing (0..1)

const DRIFT_AMPL = 4.0; // autonomous drift amplitude (px)
const DRIFT_SPEED = 0.0015; // drift speed multiplier
const TWINKLE_SPEED = 0.0025; // twinkle speed

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Static graph data
  const basePosRef = useRef<Vec2[]>([]);
  const neighborsRef = useRef<number[][]>([]);
  const driftPhaseRef = useRef<number[]>([]);
  const driftSpeedRef = useRef<number[]>([]);
  const twinklePhaseRef = useRef<number[]>([]);
  const twinkleSpeedRef = useRef<number[]>([]);

  // Animation state
  const smMouseRef = useRef<Vec2 | null>(null);
  const t0Ref = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  // Size & DPR
  useLayoutEffect(() => {
    const onResize = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Build nodes with Poisson-like spacing + neighbor list
  useEffect(() => {
    if (!size.w || !size.h) return;

    const targetCount = Math.floor(size.w * size.h * DENSITY);

    // Poisson-ish sampling using grid bins
    const cell = MIN_DIST / Math.SQRT2;
    const cols = Math.ceil(size.w / cell);
    const rows = Math.ceil(size.h / cell);
    const grid = new Array<number>(cols * rows).fill(-1);
    const pts: Vec2[] = [];
    const gi = (x: number, y: number) => y * cols + x;

    const ok = (p: Vec2) => {
      const gx = Math.floor(p.x / cell);
      const gy = Math.floor(p.y / cell);
      for (
        let yy = Math.max(0, gy - 2);
        yy <= Math.min(rows - 1, gy + 2);
        yy++
      ) {
        for (
          let xx = Math.max(0, gx - 2);
          xx <= Math.min(cols - 1, gx + 2);
          xx++
        ) {
          const k = grid[gi(xx, yy)];
          if (k !== -1) {
            const q = pts[k];
            const dx = p.x - q.x,
              dy = p.y - q.y;
            if (dx * dx + dy * dy < MIN_DIST * MIN_DIST) return false;
          }
        }
      }
      return true;
    };

    let tries = 0;
    while (pts.length < targetCount && tries < targetCount * 30) {
      tries++;
      const p = { x: Math.random() * size.w, y: Math.random() * size.h };
      if (!ok(p)) continue;
      const gx = Math.floor(p.x / cell),
        gy = Math.floor(p.y / cell);
      grid[gi(gx, gy)] = pts.length;
      pts.push(p);
    }

    basePosRef.current = pts;

    // Per-node drift and twinkle params (varied for organic feel)
    driftPhaseRef.current = pts.map((_, i) => Math.random() * 1000 + i * 11.7);
    driftSpeedRef.current = pts.map(() => 0.8 + Math.random() * 0.6); // 0.8..1.4
    twinklePhaseRef.current = pts.map((_, i) => Math.random() * 1000 + i * 7.3);
    twinkleSpeedRef.current = pts.map(() => 0.7 + Math.random() * 0.9); // 0.7..1.6

    // Neighbor graph via spatial bins
    const bin = CONNECT_RADIUS;
    const bx = Math.ceil(size.w / bin);
    const by = Math.ceil(size.h / bin);
    const bins: number[][] = Array.from({ length: bx * by }, () => []);
    const bi = (x: number, y: number) => y * bx + x;

    pts.forEach((p, i) => {
      const x = Math.min(bx - 1, Math.max(0, Math.floor(p.x / bin)));
      const y = Math.min(by - 1, Math.max(0, Math.floor(p.y / bin)));
      bins[bi(x, y)].push(i);
    });

    const neighbors: number[][] = Array.from({ length: pts.length }, () => []);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const cx = Math.floor(p.x / bin),
        cy = Math.floor(p.y / bin);
      const cand: { j: number; d2: number }[] = [];
      for (let yy = Math.max(0, cy - 1); yy <= Math.min(by - 1, cy + 1); yy++) {
        for (
          let xx = Math.max(0, cx - 1);
          xx <= Math.min(bx - 1, cx + 1);
          xx++
        ) {
          for (const j of bins[bi(xx, yy)]) {
            if (j === i) continue;
            const q = pts[j];
            const dx = q.x - p.x,
              dy = q.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= CONNECT_RADIUS * CONNECT_RADIUS) cand.push({ j, d2 });
          }
        }
      }
      cand.sort((a, b) => a.d2 - b.d2);
      neighbors[i] = cand.slice(0, K_NEIGHBORS).map((c) => c.j);
    }
    neighborsRef.current = neighbors;
  }, [size.w, size.h]);

  // Mouse (spotlight only; animation is autonomous)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = { x: e.clientX, y: e.clientY }; // viewport coords
      const m = smMouseRef.current;
      smMouseRef.current = m
        ? { x: m.x + (target.x - m.x) * LERP, y: m.y + (target.y - m.y) * LERP }
        : target;
    };
    const onLeave = () => (smMouseRef.current = null);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Canvas + RAF loop (continuous)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPR
    const setDPR = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(size.w * dpr);
      canvas.height = Math.floor(size.h * dpr);
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setDPR();

    const draw = (now: number) => {
      const t = now - t0Ref.current;

      const pts = basePosRef.current;
      const nbs = neighborsRef.current;
      const driftPhase = driftPhaseRef.current;
      const driftSpeed = driftSpeedRef.current;
      const twPhase = twinklePhaseRef.current;
      const twSpeed = twinkleSpeedRef.current;

      ctx.clearRect(0, 0, size.w, size.h);

      // Drifted positions
      const pos: Vec2[] = new Array(pts.length);
      for (let i = 0; i < pts.length; i++) {
        const b = pts[i];
        const s = DRIFT_SPEED * driftSpeed[i];
        const ph = driftPhase[i];
        // gentle Lissajous drift
        pos[i] = {
          x: b.x + Math.sin(s * t + ph) * DRIFT_AMPL,
          y: b.y + Math.cos(s * 1.13 * t + ph * 0.73) * DRIFT_AMPL,
        };
      }

      // Twinkle factor per node: 0..1
      const tw: number[] = new Array(pts.length);
      for (let i = 0; i < pts.length; i++) {
        const s = TWINKLE_SPEED * twSpeed[i];
        // 0..1 smooth oscillation
        tw[i] = 0.5 + 0.5 * Math.sin(s * t + twPhase[i]);
      }

      // Spotlight weights (0..1) — very soft & dim
      const mouse = smMouseRef.current;
      const weights = new Float32Array(pts.length);
      if (mouse) {
        const k = 1 / (2 * SIGMA * SIGMA);
        for (let i = 0; i < pos.length; i++) {
          const dx = pos[i].x - mouse.x,
            dy = pos[i].y - mouse.y;
          const w = Math.exp(-(dx * dx + dy * dy) * k);
          weights[i] = Math.pow(w, SPOT_GAMMA);
        }
      }

      // Edges (super subtle, follow nodes)
      ctx.lineCap = "round";
      ctx.lineWidth = EDGE_WIDTH;
      for (let i = 0; i < pos.length; i++) {
        const a = pos[i];
        for (const j of nbs[i]) {
          if (j < i) continue;
          const b = pos[j];
          // Edge brightness influenced a little by nearest spotlight
          const spot = Math.max(weights[i] || 0, weights[j] || 0);
          const alpha = EDGE_ALPHA_BASE + spot * EDGE_ALPHA_SPOT * 0.4; // keep it dim
          if (alpha <= 0.002) continue;

          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "rgba(255,255,255,1)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Stars (radial glow + cross flare, twinkling)
      for (let i = 0; i < pos.length; i++) {
        const p = pos[i];
        const w = weights[i] || 0;
        const twn = tw[i];

        const r = NODE_BASE_R + NODE_R_TWINKLE * twn; // twinkle radius
        const alpha = NODE_BASE_ALPHA + NODE_TWINKLE_ALPHA * twn + 0.18 * w; // subtle spot boost

        // Radial glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.2);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);
        ctx.globalAlpha = 1; // use color stop alpha
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, alpha + 0.1)})`;
        ctx.fill();

        // Cross flare (very faint, scales with twinkle)
        const flareAlpha = STAR_FLARE_ALPHA * twn;
        if (flareAlpha > 0.01) {
          const len = STAR_FLARE_LEN * (0.7 + 0.6 * twn);
          ctx.globalAlpha = flareAlpha;
          ctx.strokeStyle = "rgba(255,255,255,1)";
          ctx.lineWidth = STAR_FLARE_WIDTH;

          // Horizontal
          ctx.beginPath();
          ctx.moveTo(p.x - len, p.y);
          ctx.lineTo(p.x + len, p.y);
          ctx.stroke();

          // Vertical
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - len);
          ctx.lineTo(p.x, p.y + len);
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size.w, size.h]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
