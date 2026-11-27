import { memo, type CSSProperties } from "react";
import type { MorseChar } from "../lib/morse";
import { cn } from "../utils/cn";

export const CharStrip = memo(function CharStrip({
  chars,
  activeChar,
}: {
  chars: MorseChar[];
  activeChar: number;
}) {
  if (!chars.length)
    return <p className="empty-strip">Your words become the signal.</p>;
  return (
    <div className="char-strip" aria-label="Letter-by-letter Morse translation">
      {chars.map((char, index) => (
        <div
          key={char.index}
          className={cn(
            "char-unit",
            char.index === activeChar && "is-active",
            index > 0 && char.word !== chars[index - 1].word && "word-start",
          )}
          style={{ "--i": index } as CSSProperties}
        >
          <span className="char-letter">{char.char}</span>
          <span className="char-code">
            {char.code.split("").map((symbol, i) => (
              <i
                key={i}
                className={symbol === "-" ? "symbol-dash" : "symbol-dot"}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
});
