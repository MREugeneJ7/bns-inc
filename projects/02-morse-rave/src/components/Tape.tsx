import { memo, type RefObject } from "react";
import type { Segment } from "../lib/morse";

export const Tape = memo(function Tape({
  onSegments,
  total,
  playheadRef,
  progressRef,
  active,
}: {
  onSegments: Segment[];
  total: number;
  playheadRef: RefObject<HTMLDivElement | null>;
  progressRef: RefObject<HTMLDivElement | null>;
  active: boolean;
}) {
  return (
    <div
      className="signal-tape"
      data-active={active}
      aria-label="Morse playback timeline"
    >
      <div className="tape-track">
        {onSegments.map((segment, i) => (
          <span
            key={i}
            className={segment.kind === "dah" ? "tape-dash" : "tape-dot"}
            style={{
              left: `${(segment.start / (total || 1)) * 100}%`,
              width: `${(segment.dur / (total || 1)) * 100}%`,
            }}
          />
        ))}
        <div
          className="tape-progress"
          ref={progressRef}
          style={{ transform: "scaleX(0)" }}
        />
        <div
          className="tape-playhead"
          ref={playheadRef}
          style={{ transform: "translateX(0%)" }}
        >
          <i />
        </div>
      </div>
    </div>
  );
});
