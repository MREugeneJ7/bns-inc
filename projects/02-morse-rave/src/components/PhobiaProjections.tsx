import { PHOBIAS, type PhobiaKind } from "../lib/badTrip";
import { cn } from "../utils/cn";

export function PhobiaProjections({
  active,
  flash,
  pulseIndex,
}: {
  active: boolean;
  flash: boolean;
  pulseIndex: number;
}) {
  if (!active) return null;
  const phobia: PhobiaKind = PHOBIAS[pulseIndex % PHOBIAS.length];

  return (
    <div
      className={cn("phobia-projection", flash && "is-flashing")}
      data-phobia={phobia}
      aria-hidden="true"
    >
      <div className="phobia-beam-warp" />
      <svg
        className="phobia-silhouette"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {phobia === "spider" && (
          <g className="phobia-spider">
            {/* Fractured web lines in the light */}
            <g stroke="currentColor" strokeWidth="0.7" opacity="0.34">
              <line x1="160" y1="0" x2="160" y2="320" />
              <line x1="0" y1="160" x2="320" y2="160" />
              <line x1="36" y1="36" x2="284" y2="284" />
              <line x1="284" y1="36" x2="36" y2="284" />
              <circle cx="160" cy="160" r="46" />
              <circle cx="160" cy="160" r="88" />
              <circle cx="160" cy="160" r="132" />
            </g>
            {/* Silk thread */}
            <line
              x1="160"
              y1="0"
              x2="160"
              y2="136"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.6"
            />
            {/* 8 jointed arachnid legs */}
            <g
              stroke="#050103"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M150 156 L112 108 L68 74 L44 96" />
              <path d="M148 162 L96 138 L46 134 L22 162" />
              <path d="M148 168 L98 178 L52 204 L34 238" />
              <path d="M152 174 L118 214 L88 258 L74 294" />

              <path d="M170 156 L208 108 L252 74 L276 96" />
              <path d="M172 162 L224 138 L274 134 L298 162" />
              <path d="M172 168 L222 178 L268 204 L286 238" />
              <path d="M168 174 L202 214 L232 258 L246 294" />
            </g>
            {/* Pedipalps & fangs */}
            <path
              d="M154 182 L146 198 L152 206 M166 182 L174 198 L168 206"
              stroke="#050103"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Abdomen & cephalothorax */}
            <ellipse cx="160" cy="142" rx="18" ry="24" fill="#050103" />
            <ellipse cx="160" cy="171" rx="12" ry="14" fill="#050103" />
            {/* Crimson hourglass mark */}
            <polygon
              points="155,134 165,134 160,142 165,150 155,150 160,142"
              fill="currentColor"
              opacity="0.9"
            />
          </g>
        )}

        {phobia === "clown" && (
          <g className="phobia-clown">
            {/* Wild hair tufts */}
            <path
              d="M78 118 C54 94 56 62 84 56 C76 34 104 20 120 40 C138 18 182 18 200 40 C216 20 244 34 236 56 C264 62 266 94 242 118"
              fill="#050103"
              opacity="0.88"
            />
            {/* Warped skull-like theatrical mask */}
            <path
              d="M94 96 C94 54 226 54 226 96 C230 148 214 212 160 232 C106 212 90 148 94 96 Z"
              fill="#050103"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Vertical harlequin eye diamonds */}
            <polygon points="128,94 142,126 128,158 114,126" fill="currentColor" />
            <polygon points="192,94 206,126 192,158 178,126" fill="currentColor" />
            {/* Hollow dark pupils */}
            <circle cx="128" cy="126" r="6" fill="#050103" />
            <circle cx="192" cy="126" r="6" fill="#050103" />
            {/* Bulbous nose shadow */}
            <circle cx="160" cy="152" r="14" fill="currentColor" />
            {/* Stretched jagged grin */}
            <path
              d="M108 168 C126 212 194 212 212 168 C192 186 128 186 108 168 Z"
              fill="currentColor"
            />
            {/* Teeth silhouettes inside grin */}
            <path
              d="M124 177 L128 190 L134 179 L140 193 L147 181 L154 195 L160 181 L166 195 L173 181 L180 193 L186 179 L192 190 L196 177"
              stroke="#050103"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {/* Ruffled collar */}
            <path
              d="M84 246 Q112 224 134 246 Q160 222 186 246 Q208 224 236 246 L224 274 Q160 256 96 274 Z"
              fill="#050103"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </g>
        )}

        {phobia === "blood" && (
          <g className="phobia-blood">
            {/* Viscous curtain of dripping crimson tendrils */}
            <path
              d="M0 0 H320 V58 C306 58 304 128 294 128 C284 128 282 72 268 72 C254 72 254 198 242 198 C230 198 228 88 212 88 C196 88 198 248 184 248 C170 248 168 104 154 104 C140 104 142 224 128 224 C114 224 112 82 96 82 C80 82 82 178 68 178 C54 178 52 66 36 66 C22 66 20 134 10 134 C4 134 0 92 0 92 Z"
              fill="currentColor"
            />
            {/* Falling arterial droplets */}
            <path d="M184 260 C184 260 193 278 193 286 A9 9 0 1 1 175 286 C175 278 184 260 184 260 Z" fill="currentColor" />
            <path d="M128 236 C128 236 135 250 135 256 A7 7 0 1 1 121 256 C121 250 128 236 128 236 Z" fill="currentColor" />
            <path d="M242 212 C242 212 248 224 248 230 A6 6 0 1 1 236 230 C236 224 242 212 242 212 Z" fill="currentColor" />
            {/* Dark coagulated veins */}
            <path
              d="M64 18 L78 76 L68 138 M154 12 L162 84 L150 156 L160 206 M236 16 L228 96 L242 168"
              stroke="#050103"
              strokeWidth="3.2"
              strokeLinecap="round"
              opacity="0.72"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
