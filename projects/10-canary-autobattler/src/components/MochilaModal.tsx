import { useState } from 'react';
import { BINTER_DESTINATIONS, isBinterUnlocked, type BinterDestination } from '../game/binterDestinations';
import { save } from '../game/save';
import { GOURMET } from '../game/rosarioQuest';

const BINTER_ROUTES = BINTER_DESTINATIONS;

interface MochilaModalProps {
  hasTodoTerreno: boolean;
  carOut: boolean;
  hasBinter: boolean;
  hasPukas: boolean;
  hasSaltoPastor: boolean;
  hasCremaFP50: boolean;
  hasFotocopiadora: boolean;
  usedFotocopiadora: boolean;
  hasCazafantasmas: boolean;
  hasBucio: boolean;
  magosKeys: number[];
  onUseTodoTerreno: () => void;
  onUseBucio: () => void;
  onUsePukas: () => void;
  onUseSaltoPastor: () => void;
  onFlyBinter: (dest: BinterDestination) => void;
  onClose: () => void;
}

/** Mochila del jugador: M.O. 1 Todo Terreno, M.O. 2 Binter, M.O. 3 Pukas, M.O. 4 Salto Pastor y objetos clave. */
export function MochilaModal({
  hasTodoTerreno,
  carOut,
  hasBinter,
  hasPukas,
  hasSaltoPastor,
  hasCremaFP50,
  hasFotocopiadora,
  usedFotocopiadora,
  hasCazafantasmas,
  hasBucio,
  magosKeys,
  onUseTodoTerreno,
  onUseBucio,
  onUsePukas,
  onUseSaltoPastor,
  onFlyBinter,
  onClose,
}: MochilaModalProps) {
  const [pickingFlight, setPickingFlight] = useState(false);

  const bottles = GOURMET.filter(({ id }) => (save.beers[id] ?? 0) > 0);
  const isEmpty = !bottles.length &&
    !hasTodoTerreno && !hasBinter && !hasPukas && !hasSaltoPastor &&
    !hasCremaFP50 && !hasFotocopiadora && !hasCazafantasmas && !hasBucio && !save.flags.has_curbelo_key && magosKeys.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3" onClick={onClose}>
      <div
        className="w-full max-w-[360px] max-h-[88vh] overflow-y-auto bg-[#9bbc0f] text-[#0f380f] border-4 border-[#0f380f] rounded-md p-3 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#0f380f] pb-2 mb-3">
          <span className="text-[9px]">🎒 MOCHILA DEL GUIRUFO</span>
          <button onClick={onClose} className="text-[7px] px-2 py-1 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer">
            CERRAR
          </button>
        </div>

        {isEmpty ? (
          <p className="text-[7px] leading-relaxed text-center py-6">
            Vacia salvo dos pipas y arena de playa. Los M.O. y objetos clave aparecen siguiendo la ruta.
          </p>
        ) : pickingFlight ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[7px]">✈️ BINTER · ELIGE DESTINO</span>
              <button
                onClick={() => setPickingFlight(false)}
                className="text-[6px] px-1.5 py-1 bg-[#306230] text-[#9bbc0f] rounded cursor-pointer"
              >
                VOLVER
              </button>
            </div>
            <p className="text-[6px] leading-relaxed mb-2 text-[#306230]">
              Tarifa Plana 75% Residente: vuelos ilimitados con ambrosia Tirma incluida. Solo puedes volar a los
              destinos por los que ya has pasado: aparecen nuevos al visitar su ciudad, ruta o aeropuerto.
            </p>
            <div className="flex flex-col gap-1.5 max-h-[52vh] overflow-y-auto pr-1">
              {BINTER_ROUTES.filter((r) => isBinterUnlocked(r, save)).map((r) => (
                <div key={r.id} className="bg-[#8bac0f] border border-[#0f380f] p-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[6.5px] truncate">[{r.code}] {r.label.toUpperCase()}</div>
                  </div>
                  <button
                    onClick={() => onFlyBinter(r)}
                    className="text-[6px] px-2 py-1 bg-[#0f380f] text-[#9bbc0f] rounded shrink-0 cursor-pointer"
                  >
                    VOLAR
                  </button>
                </div>
              ))}
              {BINTER_ROUTES.filter((r) => !isBinterUnlocked(r, save)).map((r) => (
                <div key={r.id} className="bg-[#8bac0f]/40 border border-dashed border-[#0f380f]/50 p-1.5 flex items-center justify-between gap-2 opacity-70">
                  <div className="text-[6px] truncate">[{r.code}] {r.label.toUpperCase()}</div>
                  <span className="text-[5px] px-1.5 py-0.5 bg-[#306230] text-[#9bbc0f] rounded shrink-0">SIN DESCUBRIR</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {save.flags.has_curbelo_key && <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
              <div className="text-[7.5px] mb-1">LLAVE DEL GUACHINCHE DE CASIMIRO</div>
              <div className="text-[6px] leading-relaxed">Encontrada en la mansión. Abre el guachinche de fuego de San Sebastián, donde estuvo Colón.</div>
            </div>}
            {magosKeys.length > 0 && <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7.5px]">🗝️ LLAVES MAGNÉTICAS · {magosKeys.length}/2</span>
                <span className="text-[5.5px] px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] rounded">MAGOS DE LA COSTA</span>
              </div>
              <div className="text-[6px] leading-relaxed text-[#0f380f]/90">
                {[1, 2].map(k => <div key={k}>{magosKeys.includes(k) ? '✓' : '□'} Llave {k} · {k === 1 ? 'Archivo (planta 2)' : 'Dirección (planta 4)'}</div>)}
                {magosKeys.length === 2 ? 'Las dos abren el despacho de la azotea.' : 'Con las dos podrás abrir la puerta del despacho de la azotea.'}
              </div>
            </div>}
            {bottles.length > 0 && <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
              <div className="text-[7.5px] mb-2">COMPRA GOURMET</div>
              {bottles.map(({ id, name }) => <div key={id} className="flex justify-between text-[7px] leading-loose"><span>{name}</span><span>x{save.beers[id]}</span></div>)}
            </div>}
            {hasTodoTerreno && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="text-[7.5px] leading-relaxed mb-1">🚙 M.O. 1 · TODO TERRENO</div>
                <div className="text-[6px] leading-relaxed mb-2 text-[#0f380f]/90">
                  Toyota Landcruiser de antes de la guerra civil. Circula por CARRETERAS, PARKINGS y PISTAS DE TIERRA, y aplasta los socavones. Se saca y se aparca aquí mismo (en los socavones no se puede aparcar).
                </div>
                <button
                  onClick={onUseTodoTerreno}
                  className="w-full text-[7px] py-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer"
                >
                  {carOut ? 'APARCAR Y BAJAR A PIE' : 'USAR (SPAWNEAR EN ASFALTO)'}
                </button>
              </div>
            )}

            {hasBinter && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">✈️ M.O. 2 · BINTER</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] rounded">TARIFA PLANA</span>
                </div>
                <div className="text-[6px] leading-relaxed mb-2 text-[#0f380f]/90">
                  Ticket Tarifa Plana vitalicio de Binter Canarias que te regalo Doña Maruca en el Aeropuerto TFS. Incluye chocolatina Tirma. Desbloquea destinos al pasar por ellos (incluidos TFS y TFN, aunque no tengan centro parrandero).
                </div>
                <button
                  onClick={() => setPickingFlight(true)}
                  className="w-full text-[7px] py-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer"
                >
                  USAR (VOLAR CON BINTER)
                </button>
              </div>
            )}

            {hasPukas && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">🏄 M.O. 3 · PUKAS (SURF)</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] rounded">SURF</span>
                </div>
                <div className="text-[6px] leading-relaxed mb-2 text-[#0f380f]/90">
                  Tabla de surf Pukas original que te regalo el surfero Borja en la piscina de olas (The Wave Palace) de Siam Park. Sirve en el mar abierto: desde la plaza de Candelaria llegas a Caletillas.
                </div>
                <button
                  onClick={onUsePukas}
                  className="w-full text-[7px] py-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer"
                >
                  USAR TABLA PUKAS (SURF)
                </button>
              </div>
            )}

            {hasSaltoPastor && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">🪵 M.O. 4 · SALTO DEL PASTOR</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] rounded">SALTO</span>
                </div>
                <div className="text-[6px] leading-relaxed mb-2 text-[#0f380f]/90">
                  Vara de madera noble con regatona de cuerno de cabra que te regalo Dave tras devolverle su Crema FP50. Permite saltar desniveles y riscos.
                </div>
                <button
                  onClick={onUseSaltoPastor}
                  className="w-full text-[7px] py-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer"
                >
                  USAR VARA DEL PASTOR (SALTAR)
                </button>
              </div>
            )}

            {hasCremaFP50 && !hasSaltoPastor && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">🧴 CREMA SOLAR FP50</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#306230] text-[#9bbc0f] rounded">MISIÓN</span>
                </div>
                <div className="text-[6px] leading-relaxed text-[#0f380f]/90">
                  Bote dorado de proteccion extrema encontrado sobre una toalla en Siam Park. Llevaselo a Dave antes de que se ase como un pollo!
                </div>
              </div>
            )}

            {hasFotocopiadora && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">🖨️ FOTOCOPIADORA</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#0f380f] text-[#9bbc0f] rounded">
                    {usedFotocopiadora ? 'GASTADA' : '1 SOLO USO'}
                  </span>
                </div>
                <div className="text-[6px] leading-relaxed text-[#0f380f]/90">
                  {usedFotocopiadora
                    ? 'Sin toner. La copia ya salió durante un duelo y engañó hasta al juez.'
                    : 'Del despacho del Coco de Santa Ursula. No se usa aquí: en un duelo, interrumpe el autobattle y copia una carta rival. Un solo uso.'}
                </div>
              </div>
            )}

            {hasCazafantasmas && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">👻 EQ. CAZAFANTASMAS</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#306230] text-[#9bbc0f] rounded">CLAVE</span>
                </div>
                <div className="text-[6px] leading-relaxed text-[#0f380f]/90">
                  Aspiradora de ectoplasma y medidor de psicofonias requisado al Coco de Santa Ursula. Equipo necesario para la Torre Encantada del Cementerio de Las Teresitas (San Andres).
                </div>
              </div>
            )}

            {hasBucio && (
              <div className="bg-[#8bac0f] border-2 border-[#0f380f] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[7.5px]">🐚 BUCIO DE LAS TERESITAS</span>
                  <span className="text-[5.5px] px-1.5 py-0.5 bg-[#306230] text-[#9bbc0f] rounded">ROMERIA</span>
                </div>
                <div className="text-[6px] leading-relaxed mb-2 text-[#0f380f]/90">
                  Concha marina bendecida por la doña de la Torre Encantada. Si te encuentras una ROMERIA cortando la entrada a Adeje, tocalo para colarte en la fiesta al ritmo de una Isa!
                </div>
                <button
                  onClick={onUseBucio}
                  className="w-full text-[7px] py-2 bg-[#0f380f] text-[#9bbc0f] rounded cursor-pointer"
                >
                  TOCAR EL BUCIO (BOOOO-UUU!)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
