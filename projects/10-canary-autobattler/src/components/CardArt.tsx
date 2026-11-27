import React from 'react';
import { creatureURL } from '../game/creatureArt';
import { CARDS, CardDef, formatMana, LAND_INFO, STAGE_LABEL } from '../battle/cards';

export const GB = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];

export function NevadaGlyph({ size, dim }: { size: number; dim?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true" style={{ opacity: dim ? 0.22 : 1 }}>
      <path fill={GB[3]} d="M1 21v-2h3v-3h3v-4h3V8h2V6h3v3h2v4h2v4h2v2h2v2z" />
      <path fill={GB[0]} d="M7 14v-2h3V8h2V6h3v3h2v4h-3v-2h-2v3z" />
      <path fill={GB[2]} d="M3 18h5v-2h5v2h7v1h2v1H3zM4 5h1V4h1v1h1v1H6v1H5V6H4zM18 3h1V2h1v1h1v1h-1v1h-1V4h-1zM2 10h2v1H2zM20 9h2v1h-2z" />
    </svg>
  );
}

export function Sprite({ id, size, dim }: { id: string; size: number; dim?: boolean }) {
  const def = CARDS[id];
  if (id === 'nevada_teide') return <NevadaGlyph size={size} dim={dim} />;
  if (def?.type === 'creature') {
    return (
      <img
        src={creatureURL(id)}
        alt={def.name}
        draggable={false}
        style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block', opacity: dim ? 0.22 : 1 }}
      />
    );
  }
  return (
    <span style={{
      fontSize: size * 0.7, lineHeight: `${size}px`, opacity: dim ? 0.25 : 1,
      filter: 'grayscale(1) sepia(1) hue-rotate(45deg) saturate(3) contrast(1.5)',
    }}>
      {def?.icon ?? '?'}
    </span>
  );
}

const STAGE_TONE: Record<number, string> = {
  0: GB[2], 1: GB[2], 2: GB[3], 3: GB[3], 4: GB[3],
};

/** Ficha de carta reutilizable (marco programatico, arte del bicho). */
export function CardChip({
  id, size = 'md', shine = 0, count, footer, onClick, dim, highlight,
}: {
  id: string;
  size?: 'sm' | 'md' | 'lg';
  shine?: number;
  count?: number;
  footer?: React.ReactNode;
  onClick?: () => void;
  dim?: boolean;
  highlight?: boolean;
}) {
  const def: CardDef | undefined = CARDS[id];
  if (!def) return null;
  const px = size === 'sm' ? 86 : size === 'lg' ? 150 : 116;
  const art = size === 'sm' ? 34 : size === 'lg' ? 74 : 52;

  return (
    <div
      onClick={onClick}
      className="magocard"
      style={{
        width: px, flexShrink: 0, position: 'relative',
        border: `2px solid ${GB[3]}`,
        background: highlight ? GB[2] : GB[0],
        color: highlight ? GB[0] : GB[3],
        padding: 4, cursor: onClick ? 'pointer' : 'default',
        opacity: dim ? 0.55 : 1,
        boxShadow: highlight ? `0 0 0 2px ${GB[0]}, 0 6px 18px rgba(15,56,15,.55)` : '0 3px 10px rgba(0,0,0,.35)',
        transition: 'transform .16s ease, box-shadow .16s ease, background .16s ease',
      }}
    >
      {/* cabecera: coste + etapa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, marginBottom: 3 }}>
        <span style={{
          fontSize: 7, letterSpacing: '.5px', border: `1px solid currentColor`, padding: '1px 3px',
          background: def.type === 'land' ? GB[3] : 'transparent', color: def.type === 'land' ? GB[0] : undefined,
          whiteSpace: 'nowrap',
        }}>
          {def.type === 'land' ? (def.producesAny ? '*' : LAND_INFO[def.produces!].short) : formatMana(def.mana, true)}
        </span>
        {def.type === 'creature' && def.stage !== undefined && (
          <span style={{ fontSize: 5.5, color: highlight ? GB[0] : STAGE_TONE[def.stage], whiteSpace: 'nowrap' }}>
            {STAGE_LABEL[def.stage]}{shine > 0 ? ` ${'★'.repeat(Math.min(shine, 4))}` : ''}
          </span>
        )}
        {def.legendary && <span style={{ fontSize: 5 }}>LEGENDARIA</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: art, background: GB[1], border: `1px solid ${GB[3]}` }}>
        <Sprite id={id} size={art - 12} dim={dim} />
      </div>

      <div style={{ fontSize: size === 'sm' ? 6 : 7, lineHeight: '9px', marginTop: 3, height: 18, overflow: 'hidden', textAlign: 'center' }}>
        {def.name.toUpperCase()}
      </div>

      {def.type === 'creature' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, borderTop: `1px solid currentColor`, paddingTop: 2 }}>
          <span>⚔{(def.atk ?? 0) + shine}</span>
          <span style={{ fontSize: 5.5, alignSelf: 'center' }}>
            {(def.keywords ?? []).map((k) => k.slice(0, 2).toUpperCase()).join('·')}
          </span>
          <span>♥{(def.hp ?? 0) + shine}</span>
        </div>
      )}
      {(def.type === 'spell' || def.legendary) && (
        <div style={{ fontSize: 5, lineHeight: '7px', borderTop: `1px solid currentColor`, paddingTop: 2, height: def.legendary ? undefined : 22, overflow: 'hidden' }}>
          {def.text}
        </div>
      )}
      {footer}

      {count !== undefined && (
        <span style={{
          position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 3px',
          background: GB[3], color: GB[0], border: `2px solid ${GB[0]}`,
          fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {count}
        </span>
      )}
    </div>
  );
}
