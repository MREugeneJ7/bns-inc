import { useId, type CSSProperties } from "react";

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return { x: 66 + Math.cos(angle) * 42, y: 40 + Math.sin(angle) * 19 };
});

/** A soft pocket watch, draped like it's been left in the sun at Port Lligat. */
export function MeltingClock({ style }: { style?: CSSProperties }) {
  const id = useId();
  return (
    <svg viewBox="0 0 140 150" className="melting-clock" style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fbf0d6" />
          <stop offset="0.6" stopColor="#e8c98d" />
          <stop offset="1" stopColor="#b8894a" />
        </linearGradient>
      </defs>
      <path
        d="M8 44 C6 20 52 6 96 14 C124 19 136 36 130 52 C126 62 114 64 110 74 C106 86 108 106 100 124 C95 136 84 140 80 128 C76 116 78 96 66 88 C52 79 28 80 16 68 C10 62 8 54 8 44 Z"
        fill={`url(#${id}-face)`}
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M18 44 C18 28 54 18 92 24 C114 28 122 38 118 50 C114 58 102 62 96 68"
        fill="none"
        stroke="#8a6534"
        strokeWidth="0.8"
        opacity="0.6"
      />
      {TICKS.map((tick, i) => (
        <circle key={i} cx={tick.x} cy={tick.y} r={i % 3 === 0 ? 2.2 : 1.3} fill="#3b2a18" />
      ))}
      <path d="M66 40 L64 24 M66 40 L86 47" stroke="#2a1d10" strokeWidth="2" strokeLinecap="round" />
      <circle cx="66" cy="40" r="2.6" fill="#2a1d10" />
      {/* The ants. There are always ants. */}
      <g fill="#140d06">
        <ellipse cx="98" cy="104" rx="2" ry="1.2" />
        <ellipse cx="94" cy="110" rx="2" ry="1.2" />
        <ellipse cx="101" cy="114" rx="1.6" ry="1" />
      </g>
    </svg>
  );
}
