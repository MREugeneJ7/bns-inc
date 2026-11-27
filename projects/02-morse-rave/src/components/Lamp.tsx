import { cn } from "../utils/cn";
import { Icon } from "./Icon";

export function Lamp({
  on,
  running = false,
  kind = "dit",
  activeLetter = null,
  mustache = false,
  badTrip = false,
}: {
  on: boolean;
  running?: boolean;
  kind?: "dit" | "dah";
  activeLetter?: string | null;
  mustache?: boolean;
  badTrip?: boolean;
}) {
  return (
    <div
      className={cn(
        "rave-lamp",
        on && "is-lit",
        running && "is-running",
        mustache && "has-mustache",
        badTrip && "is-bad-trip",
      )}
      aria-hidden="true"
    >
      <div className="lamp-halo" />
      <div className="lamp-ripples">
        <i />
        <i />
        <i />
      </div>
      <div className="lamp-orbit orbit-one" />
      <div className="lamp-orbit orbit-two" />
      <div className="lamp-ticks" />
      <div className="lamp-rim" />
      <div className="lamp-glass">
        <span className="lamp-micro">
          {badTrip
            ? "SIGNAL CORRUPTED"
            : running
              ? "ON THE AIR"
              : "SIGNAL READY"}
        </span>
        <div className="lamp-symbol">
          {running ? (
            <span className={cn("morse-pulse", kind === "dah" && "is-dash")} />
          ) : (
            <Icon name={badTrip ? "warning" : "bolt"} size={46} />
          )}
        </div>
        <svg className="dali-mustache" viewBox="0 0 100 32">
          <path
            d="M50 19 C43 12 31 13 23 17 C15 21 8 15 6 4 C3 14 8 27 21 27 C33 27 43 24 50 22 C57 24 67 27 79 27 C92 27 97 14 94 4 C92 15 85 21 77 17 C69 13 57 12 50 19 Z"
            fill="currentColor"
          />
        </svg>
        <span className="lamp-letter">
          {activeLetter
            ? `${activeLetter} / ${kind === "dit" ? "DIT" : "DAH"}`
            : badTrip
              ? "LOOP LOCKED // BAD TRIP"
              : "LET THERE BE SOUND"}
        </span>
      </div>
    </div>
  );
}
