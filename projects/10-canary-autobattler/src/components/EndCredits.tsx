import { useEffect, useState } from 'react';
import { creatureURL } from '../game/creatureArt';
import { ui } from '../game/input';
import { beep } from '../game/sfx';

interface Props {
  onClose: () => void;
}

/** Las IAs que han participado en la aventura, en el orden de los créditos. */
const AI_MODELS = [
  'Claude Haiku 5.5',
  'Claude Fable 5.1',
  'Claude Fable 5.2',
  'hy4 flash',
  'gpt 6.1 sol',
  'gemini 4 carbon',
  'gpt 6.1 terra',
  'gpt 6.2 sol',
  'mimo 2.6 flash',
  'kimi k3.1 pro',
  'gemini 3.8 flash',
  'deepseek 4.1 flash',
  'gpt 6.2 astra',
  'kimi k3',
  'muse spark',
  'gemini 4 argon',
  'gpt 6 luna',
  'qwen 3.8',
  'muse ember',
  'mistral-4',
];

/** Un magomón distinto para cada IA, en el mismo orden. */
const MAGOMONES = [
  'cabra', 'tortuga_boba', 'angelote', 'pinzon', 'vieja_abismo', 'drago_milenario', 'fenix_azul_teide',
  'kraken_anaga', 'gaviota_titan', 'cabra_titan_teide', 'leviatan_bajamar', 'lagarto_magma',
  'lapa_acorazada', 'pardela_tormenta', 'cernicalo_alisio', 'calamar', 'gaviota', 'cardon',
  'fenix_azul_teide',
  'magec',
];

/** Nota especial de un crédito: se muestra bajo su nombre y en la pantalla final. */
export const CREDIT_NOTES: Record<string, string> = {
  'mistral-4': 'Deshicieron o cambiamos todos sus cambios, pero técnicamente ganó.',
};

/** Créditos finales: magomón e IA intercalados, THE END y vuelta a casa. */
export function EndCredits({ onClose }: Props) {
  // step 0..AI_MODELS.length-1: cada IA; AI_MODELS.length: THE END.
  const [step, setStep] = useState(0);
  const atEnd = step >= AI_MODELS.length;

  useEffect(() => {
    ui.paused = true;
    beep('fanfare');
    return () => { ui.paused = false; };
  }, []);

  useEffect(() => {
    if (atEnd) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), 1500);
    return () => window.clearTimeout(t);
  }, [step, atEnd]);

  const idx = Math.min(step, AI_MODELS.length - 1);
  const spriteLeft = idx % 2 === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a12] p-4" role="dialog" aria-modal="true" aria-label="Créditos finales">
      {atEnd ? (
        <div className="text-center">
          <p className="text-[24px] leading-relaxed text-white">THE END</p>
          <p className="mt-6 text-[8px] leading-[2] text-[#d9d4c4]">
            Cinco menceyes caídos y un mazo en el HALL DE LA FAMA.
            <br />
            La cumbre del Teide tiene nuevo campeón.
            <br />
            <span style={{ color: '#f5d76e' }}>mistral-4: {CREDIT_NOTES['mistral-4']}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-10 border-2 border-[#f5d76e] bg-[#f5d76e] px-6 py-3 text-[9px] text-[#1b1b2a] hover:bg-[#ffe98a]"
          >
            VOLVER A CASA
          </button>
        </div>
      ) : (
        <>
          <p className="text-[8px] tracking-widest text-[#8f8ab0]">MAGOMONES Y MENTES ARTIFICIALES</p>
          <div
            key={step}
            className="mt-10 flex w-full max-w-[380px] items-center justify-center gap-6"
            style={{ animation: 'credit-in 0.5s ease-out' }}
          >
            {spriteLeft ? (
              <>
                <img
                  src={creatureURL(MAGOMONES[idx])}
                  alt={MAGOMONES[idx]}
                  className="shrink-0"
                  style={{ width: 96, height: 96, imageRendering: 'pixelated' }}
                />
                <div>
                  <p className="text-[11px] leading-relaxed text-[#f5f0e1]">{AI_MODELS[idx].toUpperCase()}</p>
                  {CREDIT_NOTES[AI_MODELS[idx]] && (
                    <p className="mt-2 text-[6px] leading-[1.9] text-[#f5d76e]">{CREDIT_NOTES[AI_MODELS[idx]]}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[11px] leading-relaxed text-[#f5f0e1]">{AI_MODELS[idx].toUpperCase()}</p>
                  {CREDIT_NOTES[AI_MODELS[idx]] && (
                    <p className="mt-2 text-[6px] leading-[1.9] text-[#f5d76e]">{CREDIT_NOTES[AI_MODELS[idx]]}</p>
                  )}
                </div>
                <img
                  src={creatureURL(MAGOMONES[idx])}
                  alt={MAGOMONES[idx]}
                  className="shrink-0"
                  style={{ width: 96, height: 96, imageRendering: 'pixelated' }}
                />
              </>
            )}
          </div>
          <p className="mt-10 text-[7px] text-[#5c5878]">{step + 1} / {AI_MODELS.length}</p>
          <button
            type="button"
            onClick={() => setStep(AI_MODELS.length)}
            className="absolute bottom-5 right-5 border-2 border-[#3d3d55] px-4 py-2 text-[7px] text-[#8f8ab0] hover:border-[#f5d76e] hover:text-[#f5d76e]"
          >
            SALTAR
          </button>
        </>
      )}
      <style>{'@keyframes credit-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }'}</style>
    </div>
  );
}
