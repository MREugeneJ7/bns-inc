import type { BadTripReason } from "../lib/badTrip";
import { TRIP_LEVELS, TRIP_SPEEDS, TRIP_THRESHOLDS, type TripSpeed } from "../lib/trip";
import { cn } from "../utils/cn";
import { Toggle } from "./Controls";
import { Icon } from "./Icon";

export function TripPanel({
  level,
  speed,
  onSpeed,
  escalate,
  onEscalate,
  loop,
  onEnableLoop,
  comingDown,
  onComeDown,
  badTrip,
  badTripReason,
}: {
  level: number;
  speed: TripSpeed;
  onSpeed: (speed: TripSpeed) => void;
  escalate: boolean;
  onEscalate: (on: boolean) => void;
  loop: boolean;
  onEnableLoop: () => void;
  comingDown: boolean;
  onComeDown: () => void;
  badTrip: boolean;
  badTripReason: BadTripReason;
}) {
  const line = badTrip
    ? badTripReason === "words"
      ? "Cursed words detected. Loop locked on; shadows are refracting in the light."
      : "Bad batch (1% roll). Loop locked on; shadows are refracting in the light."
    : comingDown
      ? "Breathe. The clocks are firming up again."
      : !loop
        ? "Turn on repeat. The longer it loops, the weirder it gets."
        : !escalate
          ? "Escalation is off. Reality is holding steady."
          : TRIP_LEVELS[level].line;

  return (
    <section
      className={cn("trip-panel", badTrip && "is-bad-trip")}
      aria-label="Trip escalation"
    >
      <div className="trip-head">
        <span className="micro-label">
          <span className="section-number">05</span>{" "}
          {badTrip ? "BAD TRIP // LOCKED" : "THE RABBIT HOLE"}
        </span>
        <span className="trip-level-name" aria-live="polite">
          {badTrip ? "Nightmare" : TRIP_LEVELS[level].name}
          <small>
            {badTrip ? "FORCED LOOP" : `${level + 1}/${TRIP_LEVELS.length}`}
          </small>
        </span>
      </div>

      <div className="trip-gauge">
        <div className="trip-meter" aria-hidden="true">
          <div className="trip-meter-fill" />
          {TRIP_THRESHOLDS.map((threshold) => (
            <i key={threshold} style={{ left: `${threshold * 100}%` }} />
          ))}
        </div>
        <p className="trip-line">{line}</p>
      </div>

      <div className="trip-actions">
        {badTrip ? (
          <span className="trip-loop-locked" role="status">
            <Icon name="repeat" size={14} />
            Loop locked
          </span>
        ) : (
          !loop && (
            <button type="button" className="trip-loop-button" onClick={onEnableLoop}>
              <Icon name="repeat" size={14} />
              Loop it
            </button>
          )
        )}
        <div className="trip-speeds" role="radiogroup" aria-label="How fast it escalates">
          {TRIP_SPEEDS.map((item) => (
            <button
              type="button"
              role="radio"
              aria-checked={speed === item.id}
              key={item.id}
              className={cn("trip-speed", speed === item.id && "is-selected")}
              onClick={() => onSpeed(item.id)}
            >
              <span>{item.name}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
        <Toggle label="Escalate" on={escalate} onChange={onEscalate} />
        <button
          type="button"
          className="come-down"
          onClick={onComeDown}
          disabled={comingDown || (level === 0 && badTripReason !== "chance")}
        >
          {comingDown
            ? "Coming down..."
            : badTripReason === "words"
              ? "Clear text to exit"
              : "Come down"}
        </button>
      </div>
    </section>
  );
}
