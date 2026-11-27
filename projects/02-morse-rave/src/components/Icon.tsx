import type { CSSProperties } from "react";

const paths = {
  play: <path d="m9 5 11 7-11 7V5Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" strokeWidth="3.5" />
    </>
  ),
  stop: (
    <rect
      x="6"
      y="6"
      width="12"
      height="12"
      rx="1"
      fill="currentColor"
      stroke="none"
    />
  ),
  volume: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14" />
    </>
  ),
  mute: (
    <>
      <path d="m11 4-6 5H2v6h3l6 5V4ZM17 9l6 6m0-6-6 6" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3" />
    </>
  ),
  bolt: <path d="m14 2-10 12h7l-1 8L20 10h-7l1-8Z" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  settings: (
    <>
      <path d="M4 7h16M4 17h16M8 4v6m8 4v6" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  light: (
    <>
      <path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2Z" />
      <path d="M12 1v1M2 8H1m22 0h-1M4 2l1 1m14 0 1-1" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5m0 3v.1" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};

export function Icon({
  name,
  size = 18,
  style,
  className,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
