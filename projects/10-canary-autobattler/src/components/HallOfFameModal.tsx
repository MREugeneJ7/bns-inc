import { useEffect } from 'react';
import { CARDS } from '../battle/cards';
import { ui } from '../game/input';
import { beep } from '../game/sfx';

interface Props {
  entry: { date: string; deck: string[] };
  onClose: () => void;
}

/** Pantalla del HALL DE LA FAMA: el mazo con el que se vencio al Alto Mando entra en la historia del Teide. */
export function HallOfFameModal({ entry, onClose }: Props) {
  useEffect(() => {
    ui.paused = true;
    beep('fanfare');
    return () => { ui.paused = false; };
  }, []);

  const counts = new Map<string, number>();
  for (const id of entry.deck) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || (CARDS[a[0]]?.name ?? a[0]).localeCompare(CARDS[b[0]]?.name ?? b[0]),
  );
  const landCount = entry.deck.filter((id) => CARDS[id]?.type === 'land').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" role="dialog" aria-modal="true" aria-label="Hall de la fama">
      <div className="w-full max-w-[460px] border-4 border-[#f5d76e] bg-[#1b1b2a] p-4 text-[#f5f0e1] shadow-[0_0_0_4px_#111118]">
        <p className="text-center text-[10px] text-[#f5d76e]">★ HALL DE LA FAMA ★</p>
        <h2 className="mt-3 text-center text-[11px] leading-relaxed text-white">CAMPEÓN DEL ALTO MANDO</h2>
        <p className="mt-3 text-[7px] leading-[1.9] text-[#d9d4c4]">
          Bencomo cae al pie del cráter. Han caído los cinco menceyes: Acaimo, Tegueste, Romen, Pelicar y Bencomo.
        </p>
        <p className="mt-2 text-[7px] leading-[1.9] text-[#d9d4c4]">
          Tu mazo entra en el HALL DE LA FAMA y tú te conviertes en el campeón del Teide.
        </p>
        <div className="mt-3 border-2 border-[#3d3d55] bg-[#101018] p-2">
          <p className="mb-2 text-[7px] text-[#f5d76e]">
            MAZO CAMPEÓN · {entry.deck.length} CARTAS · {landCount} TIERRAS · {entry.date}
          </p>
          <ul className="max-h-[170px] space-y-1 overflow-y-auto text-[6px] leading-[1.8]">
            {rows.map(([id, n]) => (
              <li key={id} className="flex justify-between gap-2">
                <span>{(CARDS[id]?.name ?? id).toUpperCase()}</span>
                <span>x{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full border-2 border-[#f5d76e] bg-[#f5d76e] py-2 text-[8px] text-[#1b1b2a] hover:bg-[#ffe98a]"
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
