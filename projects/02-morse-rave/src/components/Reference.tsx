import { MORSE } from "../lib/morse";
import { cn } from "../utils/cn";

export function Reference({ activeChar }: { activeChar: string | null }) {
  return (
    <section className="reference">
      <h3 className="micro-label">The international alphabet</h3>
      <div className="reference-grid">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map((char) => (
          <div
            key={char}
            className={cn(
              "reference-letter",
              activeChar === char && "is-active",
            )}
          >
            <span>{char}</span>
            <span>{MORSE[char]}</span>
          </div>
        ))}
      </div>
      <p className="tools-caption">
        A dot is 1 unit. A dash is 3. Leave 3 between letters, 7 between words.
      </p>
    </section>
  );
}
