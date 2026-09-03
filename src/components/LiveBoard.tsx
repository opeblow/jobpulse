import type { CSSProperties } from "react";
import "../liveboard.css";

/*
 * LiveBoard — the animated isometric hero illustration for JobPulse.
 * A calm "live board": a warm diamond floor with floating mini kanban
 * cards wired together by flowing dashed connections, an orbiting icon
 * at the top, and a self-drawing sparkline off to the lower-left.
 *
 * The mini cards mirror the real demo board (scripts/seed.mjs): same
 * companies and column stamps, with a staggered highlight that fakes a
 * live update landing on one card at a time.
 *
 * All motion is CSS-only (float, dash-flow, spin, pulse, draw-in, peak
 * pulse) so it stays lightweight and is fully disabled for
 * prefers-reduced-motion.
 */

type Vec = [number, number];

const round1 = (n: number) => Math.round(n * 10) / 10;

function curve(a: Vec, b: Vec, bend: number): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const c1: Vec = [x1 + dx * 0.42 + nx * bend, y1 + dy * 0.42 + ny * bend];
  const c2: Vec = [x2 - dx * 0.42 + nx * bend, y2 - dy * 0.42 + ny * bend];
  return `M${x1} ${y1} C${round1(c1[0])} ${round1(c1[1])} ${round1(c2[0])} ${round1(c2[1])} ${x2} ${y2}`;
}

type CardDef = {
  id: string;
  x: number;
  y: number;
  label: string;
  status: string;
  fill: string;
  floatDelay: number;
  pulseDelay: number;
  pulseCycle: number;
};

const pulseStyle = (c: CardDef): CSSProperties =>
  ({
    "--pulse-cycle": `${c.pulseCycle}s`,
    "--pulse-delay": `${c.pulseDelay}s`,
  }) as CSSProperties;

const C = {
  dusty: "#a6b6c2",
  sage: "#a6b78f",
  coral: "#cf7a5e",
  gold: "#e8bd66",
};

/* The four seeded jobs, placed with clean spacing (any two cards differ by
   >=100px horizontally or >=46px vertically, so 100x46 cards never overlap). */
const CARDS: CardDef[] = [
  { id: "nimbus", x: 225, y: 215, label: "Nimbus Labs", status: "APPLIED", fill: C.dusty, floatDelay: 0, pulseDelay: 1.0, pulseCycle: 19 },
  { id: "fern", x: 408, y: 240, label: "Fern & Field", status: "INTERVIEW", fill: C.sage, floatDelay: 0.8, pulseDelay: 9.0, pulseCycle: 23 },
  { id: "halcyon", x: 352, y: 328, label: "Halcyon Data", status: "OFFER", fill: C.gold, floatDelay: 1.6, pulseDelay: 7.0, pulseCycle: 17 },
  { id: "bright", x: 245, y: 340, label: "Brightpath", status: "REJECTED", fill: C.coral, floatDelay: 2.4, pulseDelay: 13.0, pulseCycle: 29 },
];

type EdgeDef = { a: string; b: string; bend: number; delay: number };

const EDGES: EdgeDef[] = [
  { a: "nimbus", b: "fern", bend: -20, delay: 0 },
  { a: "nimbus", b: "halcyon", bend: 14, delay: 0.4 },
  { a: "fern", b: "halcyon", bend: 22, delay: 0.8 },
  { a: "nimbus", b: "bright", bend: 26, delay: 1.2 },
];

const EDGE_PATHS = EDGES.map((e) => {
  const a = CARDS.find((c) => c.id === e.a)!;
  const b = CARDS.find((c) => c.id === e.b)!;
  return { d: curve([a.x, a.y], [b.x, b.y], e.bend), delay: e.delay, key: `${e.a}->${e.b}` };
});

/* Isometric floor grid — two families of faint lines inside the diamond. */
const ORIGIN: Vec = [330, 122];
const U: Vec = [184, 150];
const V: Vec = [-184, 150];

const GRID = (() => {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    lines.push({
      x1: ORIGIN[0] + V[0] * t,
      y1: ORIGIN[1] + V[1] * t,
      x2: ORIGIN[0] + V[0] * t + U[0],
      y2: ORIGIN[1] + V[1] * t + U[1],
    });
    lines.push({
      x1: ORIGIN[0] + U[0] * t,
      y1: ORIGIN[1] + U[1] * t,
      x2: ORIGIN[0] + U[0] * t + V[0],
      y2: ORIGIN[1] + U[1] * t + V[1],
    });
  }
  return lines;
})();

export function SwappingWord({ words }: { words: string[] }) {
  return (
    <span className="swap-wrap">
      {words.map((w, i) => (
        <span
          key={w}
          className="swap-word"
          style={{ animationDelay: `${i * 4000}ms` }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

export default function LiveBoard() {
  return (
    <svg
      className="liveboard"
      viewBox="0 0 620 560"
      width="620"
      height="560"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="lbFloor" cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#f3b158" />
          <stop offset="26%" stopColor="#d58a36" />
          <stop offset="55%" stopColor="#7a4519" />
          <stop offset="80%" stopColor="#3d2010" />
          <stop offset="100%" stopColor="#201106" />
        </radialGradient>
        <radialGradient id="lbShade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0d0703" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#0d0703" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0d0703" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lbSheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6e3" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fff6e3" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lbSpark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2a94f" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#f2a94f" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lbOrbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd893" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffd893" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The diamond floor, lit warm from within */}
      <polygon
        points="330,122 514,272 330,422 146,272"
        fill="url(#lbFloor)"
        stroke="#edc27f"
        strokeOpacity="0.25"
        strokeWidth="1.4"
      />
      <g opacity="0.5">
        {GRID.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#e8b564"
            strokeOpacity="0.07"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Card ground shadows (stay put while the cards float) */}
      {CARDS.map((c) => (
        <ellipse key={`${c.id}-sh`} cx={c.x} cy={c.y + 14} rx={58} ry={30} fill="url(#lbShade)" />
      ))}

      {/* Flowing dashed connections */}
      <g>
        {EDGE_PATHS.map((e) => (
          <path
            key={e.key}
            className="lb-line"
            d={e.d}
            style={{ animationDelay: `${e.delay}s` }}
          />
        ))}
      </g>

      {/* Floating kanban cards — one at a time briefly glows like a live update */}
      {CARDS.map((c) => (
        <g key={c.id} transform={`translate(${c.x} ${c.y})`}>
          <g className="lb-card" style={{ animationDelay: `${c.floatDelay}s` }}>
            <g className="lb-pulse" style={pulseStyle(c)}>
              <rect x={-50} y={-23} width={100} height={46} rx={11} fill={c.fill} />
              <rect x={-50} y={-23} width={100} height={46} rx={11} fill="url(#lbSheen)" />
              <rect
                x={-50}
                y={-23}
                width={100}
                height={46}
                rx={11}
                fill="none"
                stroke="#2a1a0c"
                strokeOpacity="0.14"
              />
              <text x={0} y={-4} className="lb-label">
                {c.label}
              </text>
              <text x={0} y={13} className="lb-status">
                {c.status}
              </text>
            </g>
          </g>
        </g>
      ))}

      {/* Rotating icon/orb near the top of the board */}
      <g transform="translate(330 86)">
        <circle r={44} fill="url(#lbOrbGlow)" />
        <circle r={19} fill="#2a1608" opacity="0.72" />
        <path
          d="M325.5 86 h3 l2 -4.5 4 9 2 -4.5 h4.5"
          fill="none"
          stroke="#ffd893"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle r={19} fill="none" stroke="#f0c988" strokeOpacity="0.5" strokeWidth="1.3" />
        <g className="lb-orb-spin">
          <circle
            r={13}
            fill="none"
            stroke="#ffd893"
            strokeOpacity="0.55"
            strokeWidth="1.4"
          />
          <circle cx={13} cy={0} r={2.3} fill="#ffd893" />
        </g>
      </g>

      {/* Standalone sparkline, lower-left, drawing itself in */}
      <g>
        <line
          x1={112}
          x2={322}
          y1={500}
          y2={500}
          stroke="#e9bd74"
          strokeOpacity="0.32"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M134 492 C 150 488 162 480 180 482 C 196 484 202 470 220 470 C 236 470 242 456 260 456 C 272 456 284 456 296 452 C 306 448 308 440 310 436 L 310 500 L 134 500 Z"
          fill="url(#lbSpark)"
        />
        <path
          className="lb-spark-path"
          pathLength="100"
          d="M134 492 C 150 488 162 480 180 482 C 196 484 202 470 220 470 C 236 470 242 456 260 456 C 272 456 284 456 296 452 C 306 448 308 440 310 436"
        />
        <circle className="lb-spark-dot" cx={310} cy={436} r={4.5} fill="#f2a94f" />
        <circle
          cx={310}
          cy={436}
          r={12}
          fill="none"
          stroke="#f2a94f"
          strokeOpacity="0.35"
          strokeWidth="1.3"
        />
      </g>
    </svg>
  );
}