import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { CARDS, EVO_CHAINS, STAGE_LABEL } from '../battle/cards';
import { countOwned } from '../battle/booster';
import { RUTA, BOLICHES_TOTAL } from '../game/ruta';
import { save, subscribeSave, touchSave } from '../game/save';
import { ui } from '../game/input';
import { Sprite, GB } from './CardArt';
import { GOURMET } from '../game/rosarioQuest';
import { GOMERA_SEA_START } from '../game/mapsGomera';

type Tab = 'magodex' | 'ruta' | 'encargo';

const CREATURE_IDS = Object.values(CARDS).filter((c) => c.type === 'creature').map((c) => c.id);

export function objective(): string {
  const f = save.flags;
  if (save.mapId === 'parrandero_2') return 'Club del Cable: SALA DE INTERCAMBIO a la izquierda y SALA DE COMBATE a la derecha. Hace falta otra persona y un cable de verdad entre las dos máquinas; el técnico del vestíbulo te dice cuál.';
  if (save.mapId === 'cueva_magec') return f.magec_beaten
    ? 'Magec ya no está en la cueva. Lo que te contó al fondo, eso sí, no se olvida.'
    : 'Cueva del Llano: pista (4x4 desde la mochila), barrancos (vara) y lago (Pukas). Al fondo espera MAGEC, el magomón libre.';
  if (save.mapId === 'sendero_telesforo') return 'Sendero Telesforo Bravo: cinco menceyes en orden hasta el cráter (hielo, roca y lucha, fantasma, dragón y el campeón). Cada uno abre su paso al caer.';
  if ((f.campeon_teide || (save.beaten['alto_mando_bencomo'] ?? 0) > 0) && !f.magec_beaten) return '¡CAMPEÓN DEL ALTO MANDO! Al ESTE del LLANO DE LOS VIEJOS (Anaga) hay una boca de cueva tras un barranco: sáltalo con la vara. El guardia solo deja pasar al campeón. Y en cualquier Centro Parrandero, la escalera del fondo sube al CLUB DEL CABLE.';
  if ((f.campeon_teide || (save.beaten['alto_mando_bencomo'] ?? 0) > 0) && f.magec_beaten && save.mapId === 'parrandero') return 'Eres campeón: la escalera del fondo, tras el mostrador, sube al CLUB DEL CABLE (intercambios y combates por cable con otra persona).';
  if (save.mapId === 'montana_blanca') return f.got_narices_teide
    ? 'Ya tienes Narices del Teide. El refugio de arriba es colegio y Centro Parrandero en miniatura; baja por la senda del sur para volver al Diablito.'
    : 'Montaña Blanca: sube por las cornisas con la VARA DEL SALTO DEL PASTOR desde la mochila. Los senderistas alemanes te retan; una carta legendaria duerme entre la arena.';
  if (save.mapId === 'santa_ursula') return f.boliche_8
    ? 'El Boliche del Diablito es tuyo. El Centro Parrandero y el colegio siguen en el pueblo; la subida de La Quinta te devuelve a la TF-5.'
    : f.diablito_discovered
    ? '¡El Diablito es el octavo guachinche! Aparca en su parking y entra a pie: el Coco canta en la cocina.'
    : 'Sube desde La Quinta hasta el pueblo. Después sigue la carretera general al SUROESTE; un aroma italiano te espera más adelante.';
  if (save.mapId === 'el_diablito') return f.boliche_8
    ? 'Último boliche conseguido. Repasa los ocho guachinches de la Ruta del Buen Yantar. La salida está al sur.'
    : 'El Coco, tercera aparición: rétalo por el Boliche del Diablito. Sus negocios del Meridiano y de Magos quedaron atrás; este es el último gimnasio.';
  if (save.mapId === 'calle' && f.tf5_underpass) return 'Paso inferior de la TF-5 bajo el Puente de Taco: sigue TODO TIESO AL NORTE hacia Padre Anchieta y el Aeropuerto TFN (o baja al SUR para volver a la Estación de S/C).';
  if (save.mapId === 'tf5') {
    if (save.playerPos.x <= 20) return 'Santa Úrsula · Salida 31 La Quinta: toma la salida al SUR y sube hasta el pueblo. Después sigue la carretera general al suroeste.';
    if (save.playerPos.x >= 96) return 'Autopista TF-5 Norte: culebrea en 4x4 por la ultra-cola de Padre Anchieta hasta el Aeropuerto TFN (Los Rodeos), donde la autopista vira rumbo SUROESTE.';
    return 'Autopista TF-5 (rumbo SUROESTE): pasa el aguacero de Tacoronte, las curvas plagadas de radares de El Sauzal, La Matanza y La Victoria hasta la salida de La Quinta en Santa Úrsula.';
  }
  if (save.mapId === 'san_sebastian' || save.mapId === 'mansion_curbelo') return f.boliche_7
    ? 'Colón estuvo aquí y ya tienes el Boliche de Colón. El pantalán queda al norte para volver en Pukas.'
    : f.has_curbelo_key
    ? 'Ya tienes la llave. Sal de la mansión y entra al guachinche de fuego al sureste de la plaza. Colón estuvo aquí.'
    : 'Colón estuvo aquí. Busca la llave del guachinche recorriendo el laberinto de la mansión al suroeste de la plaza.';
  if (save.mapId === 'certificador_gomera') return 'Casimiro certifica las ediciones antiguas que tengas en el PC o en el mazo. Colón estuvo aquí.';
  if (save.mapId === 'guachinche_curbelo') return f.boliche_7
    ? 'El Boliche de Colón es tuyo. La puerta de salida está al sur. Colón estuvo aquí.'
    : 'El líder Casimiro te espera al fondo del guachinche de fuego. Colón estuvo aquí.';
  if (save.mapId === 'san_borondon') return f.got_nevada_teide
    ? 'Nevada del Teide conseguida. Vuelve por los riscos hasta la cala y sal por el sur para retomar la travesía.'
    : 'San Borondón: busca los mojones en pie. Usa la vara de la mochila para cruzar los riscos estrechos.';
  if (save.mapId === 'veronicas' && save.playerPos.y >= GOMERA_SEA_START) return 'Sigue las boyas al sur hasta el pantalán de San Sebastián. Puedes retar a los del barco y las motos con A. A mitad del canal, espera a que la bruma deje ver una cala.';
  if (save.mapId === 'el_rosario') return save.flags.guachinche_rosario_beaten ? 'El Rosario: el guachinche real ya está vencido. Centro Parrandero y colegio dan a la calle; el terrero sigue aceptando retos.' : 'El Rosario: entra en la plaza al GUACHINCHE DE EL ROSARIO (nueve salas con telepads; la mesa del líder está en la sala central superior). Al lado está el terrero de lucha.';
  if (save.mapId.startsWith('eci_')) return save.mapId === 'eci_azotea' ? 'Zona Gourmet: el mostrador de cervezas está a la izquierda del ascensor.' : 'Usa el ascensor del fondo para subir a la azotea. Ahí está la Zona Gourmet.';
  if (save.mapId.startsWith('magos_')) {
    const keys = save.magosKeys.length;
    if (f.coco_beaten) return 'El Coco está derrotado y Ricardo García libre. La FOTOCOPIADORA es tuya: en un duelo, pulsa FOTO para copiar una carta rival. Un solo uso.';
    if (save.mapId === 'magos_azotea') return `Azotea de Magos de la Costa. Puerta del despacho: llaves ${keys}/2. Ricardo García sigue dentro.`;
    return `Magos de la Costa: planta ${save.mapId === 'magos_pb' ? 'baja' : save.mapId.slice(-1)}. Llaves magnéticas ${keys}/2. Pisa el teletransportador para subir.`;
  }
  if (f.rosario_open && (save.mapId === 'barranco_hondo' || save.mapId === 'acceso_taco')) return 'Las vallas están abiertas. Sigue la carretera al ESTE para entrar en El Rosario.';
  if (f.met_rosario_workers && !f.rosario_open) return GOURMET.some(b => (save.beers[b.id] ?? 0) > 0)
    ? 'Llevas cerveza en la mochila. Puedes ofrecérsela a cualquiera de las dos cuadrillas: Barranco Hondo o Taco.'
    : 'Los obreros quieren una cerveza de aquí. Entra en El Corte Inglés de Tres de Mayo y sube en ascensor a la Zona Gourmet.';
  if (save.mapId === 'barranco_hondo' || save.mapId === 'acceso_taco') return 'Sigue la carretera al ESTE hasta las obras. Habla con la cuadrilla que corta el paso a El Rosario.';
  if (f.got_unelco && save.mapId === 'tf1') return 'Desde el apartadero de Candelaria, toma el desvío al NORTE hacia Barranco Hondo. El Rosario queda al ESTE por esa carretera.';
  if (f.hm_pukas && !f.got_unelco && save.mapId === 'tf1') return 'Desde las escaleras del extremo este de la plaza de Candelaria, cruza la ensenada en Pukas hasta Caletillas.';
  if (f.boliche_5) return 'Quinto boliche conseguido en Papagayos. La pista ya está fregada. Puedes volver a Troya o visitar Siam Park por el puente del Magma.';
  if (save.mapId === 'papagayos') return 'Llega a la cabina de Yéssica. Las baldosas secas y las pegajosas son idénticas: si oyes CHOF, prueba otro giro. El encargado te puede dar una pista.';
  if (save.mapId === 'veronicas') return save.playerPos.y <= 10 ? 'Ve al oeste por San Eugenio hasta el H10. Desde la esquina del hotel, baja al sureste por la callejuela al Monkey.' : save.playerPos.y < 17 ? 'Sigue bajando hacia el sureste hasta el Monkey. En el paseo, gira al este.' : 'Desde el Monkey, sigue el paseo de Troya al este junto al mar. En Las Verónicas busca Papagayos: gimnasio nº 5 de veneno.';
  if (f.hm_pukas && !f.got_unelco && (save.mapId === 'tf1' || save.mapId === 'siam_park')) return 'En el extremo ESTE de la PLAZA DE LA PATRONA de Candelaria, usa la Pukas mirando a la derecha. Cruza la ensenada recto al ESTE hasta la subestación de Caletillas, bajo la TF-1.';
  if (f.mago_americas_done && save.mapId !== 'siam_park') return 'Estación de Las Américas: al NORTE, Magma y la pasarela sobre la TF-1 a Siam Park. Al OESTE, San Eugenio y el H10. Baja al SURESTE hasta el Monkey; luego sigue al ESTE hasta Papagayos (gym nº 5).';
  if (!f.starterChosen) return 'Ve pal OESTE hasta WEYLER, coge el tranvia a LA CANDELARIA y elige tu mazo inicial con Acaymo.';
  if (!f.errand) return 'Habla con el profesor Acaymo en el laboratorio.';
  if (!f.parcel) return 'Cruza el puente de la TF-5 pal OESTE y recoge el pedido en el Chino de Taco.';
  if (!f.delivered) return 'Vuelve pal ESTE cruzando la TF-5 y entregale el paquete a Acaymo.';
  if (!f.boliche_1) return 'Sube desde WEYLER hasta el parking del Campus Central ULL y ganale a DOMINGO el 1er Boliche en el Guachinche-Truck! (Si necesitas cartas, cuelate en los COLEGIOS).';
  if (!f.magomaniaco_done) return 'Sal del Campus ULL al NORTE → SAN BENITO → recto al ESTE hasta LAS MERCEDES y gana al MAGOMANIACO junto al fogon para elegir una carta de 1ª EDICION (Burgado o Cangrejo)!';
  if (!f.first_ed_claimed) return 'Habla con el MAGOMANIACO en Las Mercedes para elegir tu carta de 1ª edicion (descatalogada hasta certificarla en La Gomera).';
  if (!f.cathaysa_rescued) return 'Sube por la CTRA. GENERAL (noreste) → LLANO DE LOS VIEJOS → VUELTAS DE TAGANANA → TAGANANA. Pedro dice que CATHAYSA no esta: bajala del agua en ALMACIGA!';
  if (!f.boliche_2) return 'Cathaysa ya salio del agua! Vuelve al Gimnasio #2 en TAGANANA y ganale el BOLICHE DE LA MAREA.';
  if (!f.cayuco_done) return 'La carretera a San Andres esta llena de zanjas del TEAM ENRISCADA. Baja a BENIJO (este): Carmelo el cayuquero te cruza a GALDAR!';
  if (!f.heard_canarion) return 'Sube LAS CURVAS DEL DEMONIO hacia el norte desde el Muelle de Galdar hasta la puerta de las CUEVAS PINTADAS.';
  if (!f.got_translator) return 'El portero te hablo en canarion cerrado ("hasta landon no abremoh"). Baja al muelle y sube al S.S. OLSEN a rascarle la espalda al Capitan mareado!';
  if (!f.cueva_door_open) return 'El S.S. Olsen ya zarpo y son las dos ("landon"): entra a las CUEVAS PINTADAS y busca los 2 botones entre las 15 mesas de carne fiesta!';
  if (!f.boliche_3) return 'Puerta de la cocina abierta! Reta a BENTEJUI en los fogones por el BOLICHE DE LA CUEVA PINTADA.';
  if (!f.hm_todo_terreno) return 'El S.S. Olsen ya se fue: baja al muelle de Galdar y vuelve a BENIJO en el CAYUCO de Carmelo para recibir el M.O. 1 TODO TERRENO!';
  if (!f.boliche_4) return 'Pisa el ASFALTO, abre 🎒 MOCHILA y usa el M.O. 1 TODO TERRENO (Landcruiser del 34). Cruza los baches a SAN ANDRES (de noche), coge AVENIDA ANAGA al OESTE, entra en 4x4 al parking reventado del PALMETUM, aparca y gana el GYM #4 (TIPO PLANTA)!';
  if (!f.bershka_opened) return 'Aparca el Landcruiser y entra a pie al C.C. MERIDIANO (casino fast-fashion, frente al Palmetum). El recluta del Team Enriscada del BERSHKA desaparecio: husmea su cartel de descuento!';
  if (!f.coco_beaten) return 'Baja por las ESCALERAS MECANICAS secretas del Bershka a la GUARIDA ENRISCADA y derrota a EL COCO DE SANTA URSULA y sus gatos callejeros!';
  if (save.mapId.startsWith('torre_teresitas_')) {
    const floor = Number(save.mapId.slice(-1));
    if (floor < 5 && !save.beaten[`torre_enriscada_${floor}`]) {
      return `PISO ${floor} DE LA TORRE ENCANTADA: vence al recluta del Team Enriscada para despejar la escalera. La señora de las Peras del Barranco acepta duelos repetibles.`;
    }
    if (floor === 5 && !f.has_bucio) return 'Habla con la doña que hace santería canaria en el mirador de la azotea.';
  }
  if (!f.has_bucio) return 'Vuelve a San Andres y al ESTE, al Cementerio de Las Teresitas. Usa el Equipo Cazafantasmas en la verja y sube la torre: cuatro reclutas guardan las escaleras.';
  if (!f.hm_binter) return 'Ya tienes el 🐚 BUCIO y abrieron la AUTOPISTA TF-1 SUR (al OESTE del Recinto Ferial en S/C Sur)! Recorrela en tu Toyota pasando Candelaria, los aerogeneradores de Abades, Montaña Roja/El Medano y entra a pie al AEROPUERTO TFS por la ✈️ M.O. 2 TARIFA PLANA DE BINTER!';
  if (!f.romeria_done) return 'La entrada a ADEJE al final de la TF-1 esta cortada por una ROMERIA! Acercate al corte (o abre 🎒 MOCHILA) y toca el 🐚 BUCIO para infiltrarte cantando una Isa Canaria hasta la ESTACION DE LAS AMERICAS!';
  if (!f.mago_americas_done) return 'La Romeria acabo en la ESTACION DE LAS AMERICAS! Vence al MAGO DON SERVANDO (con sus Magomones de Vino Peleon y Yunta de Bueyes) en combate obligatorio antes de entrar a CIUDAD FUCSIA (esto... ADEJE)!';
  if (!f.has_crema_fp50 && !f.hm_salto_pastor) return '¡Entra al NORTE desde el Magma por el puente sobre la TF-1 a la ZONA SAFARI (SIAM PARK)! En las tumbonas de arena un guiri rojo (Dave) te pide buscar su CREMA SOLAR FP50 pa darte la 🪵 M.O. 4 SALTO DEL PASTOR!';
  if (!f.hm_salto_pastor) return '¡Llevale el bote dorado de CREMA SOLAR FP50 a Dave en Siam Park para que te entregue la 🪵 M.O. 4 SALTO DEL PASTOR!';
  if (!f.hm_pukas) return '¡Acercate a la orilla de The Wave Palace (piscina de olas) en Siam Park durante la serie para recuperar la tabla Pukas del pibe y ganar la 🏄 M.O. 3 PUKAS (SURF)!';
  return `¡Completaste la Zona Safari (Siam Park)! Tienes la 🏄 M.O. 3 PUKAS (SURF) y la 🪵 M.O. 4 SALTO DEL PASTOR. Llevas 4/${BOLICHES_TOTAL} Boliches, el 🐚 BUCIO y la ✈️ M.O. 2 BINTER. ¡Guarda tu PARTIDA arriba!`;
}

function Book({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  const discovered = CREATURE_IDS.filter((id) => save.flags['seen_' + id]);
  const boliches = RUTA.filter((g) => save.flags['boliche_' + g.n]).length;

  const byChain = useMemo(() => Object.entries(EVO_CHAINS), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Escape' || e.code === 'KeyB') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.page} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${GB[3]}`, paddingBottom: 5, marginBottom: 7 }}>
          <span style={{ fontSize: 9 }}>
            {tab === 'magodex' ? 'MAGODEX DE RESORTES' : tab === 'ruta' ? 'RUTA DEL BUEN YANTAR' : 'ENCARGO EN CURSO'}
          </span>
          <button onClick={onClose} style={S.btn}>CERRAR</button>
        </div>

        {tab === 'encargo' && (
          <>
            <div className="fadeup" style={{ fontSize: 6.5, lineHeight: '11px', marginBottom: 8, border: `2px solid ${GB[3]}`, background: GB[1], padding: 7 }}>
              {objective()}
            </div>
            <div style={{ fontSize: 5.5, lineHeight: '9px', color: GB[2], marginBottom: 8 }}>
              Brujula chicharrera: al ESTE de Santa Cruz solo hay agua. Pal OESTE van Weyler → H. La Candelaria → Puente TF-5 → Taco.
              Desde WEYLER hacia el NORTE sube Ramon y Cajal → Las Ramblas → La Granja → La Cuesta → Museo de la Ciencia → Cruz de Piedra → Campus Central ULL.
            </div>
            <div style={S.section}>CICLO DE JUEGO</div>
            <div style={{ fontSize: 5.5, lineHeight: '10px', color: GB[2] }}>
              1. Entrenadores con <b style={{ color: GB[3] }}>!</b>: 1 victoria cada uno (si pierdes puedes repetir; a 0D peleas <b style={{ color: GB[3] }}>SIN RIESGO</b>).<br />
              2. <b style={{ color: GB[3] }}>COLEGIOS (!!):</b> cuelate al patio pa jugar contra los chinijos. Son <b style={{ color: GB[3] }}>REPETIBLES</b> (nivel ascendente: Weyler, La Cuesta, San Benito, Taganana)!<br />
              3. Al ganar cobras DUROS y eliges <b style={{ color: GB[3] }}>1 DE 5</b> cartas (al mazo max 60 o al PC de Ayoze).<br />
              4. Si es tu 5a copia, guardala o combinala al vuelo → 1 evolucion (o +1/+1 BRILLO en la ultima etapa).<br />
              5. Con los 8 BOLICHES de la Ruta del Buen Yantar, vas al ALTO MANDO.
            </div>
          </>
        )}

        {tab === 'magodex' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6, marginBottom: 8 }}>
              <span>DESCUBIERTOS {discovered.length}/{CREATURE_IDS.length}</span>
              <span style={{ color: GB[2] }}>por cadena evolutiva</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {byChain.map(([root, chain]) => (
                <div key={root} style={{ border: `1px solid ${GB[3]}`, background: GB[1], padding: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 5.5, color: GB[2], marginBottom: 5 }}>
                    <span>{CARDS[chain[0]].firstEdition ? `${chain.length} ETAPAS · 1ª ED. (CADA CARTA SE CERTIFICA)` : `${chain.length} ETAPAS · combina 5 copias`}</span>
                    <span>{CARDS[chain[0]].biome?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                    {chain.map((cid, i) => {
                      const seen = !!save.flags['seen_' + cid];
                      const have = countOwned({ deck: save.deck, pc: save.pc, shine: save.shine }, cid);
                      const shine = save.shine[cid] ?? 0;
                      return (
                        <React.Fragment key={cid}>
                          {i > 0 && <span style={{ fontSize: 8, color: GB[2], alignSelf: 'center' }}>→</span>}
                          <div style={{ textAlign: 'center', width: 62, opacity: seen ? 1 : 0.4 }}>
                            <Sprite id={cid} size={34} dim={!seen} />
                            <div style={{ fontSize: 4.5, lineHeight: '6px', marginTop: 2, height: 12, overflow: 'hidden' }}>
                              {seen ? CARDS[cid].name.toUpperCase() : '???????'}
                            </div>
                            <div style={{ fontSize: 5, color: GB[2] }}>{STAGE_LABEL[CARDS[cid].stage ?? 0]}</div>
                            {CARDS[cid].firstEdition && have > 0 && <div style={{ fontSize: 4.5, color: GB[2] }}>{save.flags['cert_' + cid] ? 'CERTIFICADA' : 'SIN CERTIFICAR'}</div>}
                            {seen && (
                              <div style={{ fontSize: 5.5, color: have >= 5 ? GB[3] : GB[2] }}>
                                {have}/5{shine > 0 ? ` ★${shine}` : ''}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'ruta' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 6.5, marginBottom: 6 }}>
              <span>BOLICHES {boliches}/{BOLICHES_TOTAL}</span>
              <span style={{ color: GB[2] }}>{boliches >= BOLICHES_TOTAL ? 'ALTO MANDO DESBLOQUEADO' : 'faltan ' + (BOLICHES_TOTAL - boliches)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${GB[3]}`, borderBottom: `1px solid ${GB[3]}`, maxHeight: 210, overflowY: 'auto' }}>
              {RUTA.map((g) => {
                const done = save.flags['boliche_' + g.n];
                const unlocked = g.n === 1 ? save.flags.reached_ull : save.flags['boliche_' + (g.n - 1)];
                return (
                  <div key={g.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 5, borderBottom: `1px dashed ${GB[2]}`, padding: '5px 0', opacity: unlocked || done ? 1 : 0.45 }}>
                    <span style={{ fontSize: 7, width: 14, color: GB[2] }}>{g.n}</span>
                    <span style={{ fontSize: 11, lineHeight: '11px' }}>{unlocked || done ? g.icon : '🔒'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
                        <span style={{ fontSize: 6 }}>{g.name.toUpperCase()}</span>
                        <span style={{ fontSize: 5, color: GB[2] }}>{g.zona.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 5, lineHeight: '8px', color: GB[2], marginTop: 2 }}>
                        {unlocked || done ? `${g.leader} · ${g.type}` : 'Sin descubrir'}<br />
                        {done ? '✓ BOLICHE CONSEGUIDO' : unlocked ? `Recompensa: ${g.boliche}` : 'Gana el gimnasio anterior primero.'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 5, lineHeight: '8px', marginTop: 6, color: GB[2] }}>
              A boli en el margen: "El #1 esta en el parking del Campus Central ULL. Sube desde Weyler por Ramon y Cajal, to tieso parriba."
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PocketBooks() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => subscribeSave(force), []);
  useEffect(() => { touchSave(); }, []);
  useEffect(() => { ui.paused = !!tab; return () => { ui.paused = false; }; }, [tab]);

  if (!save.flags.starterChosen) return null;
  const boliches = RUTA.filter((g) => save.flags['boliche_' + g.n]).length;
  const fucsia = ['las_americas', 'puente_magma', 'veronicas', 'papagayos'].includes(save.mapId);
  const chip = fucsia ? { ...S.chip, background: '#f2d9ee', borderColor: '#382342', color: '#382342' } : S.chip;

  return (
    <>
      <div className="absolute left-2 z-30 flex flex-wrap gap-1.5 max-w-[62%]" style={{ top: 40 }}>
        <button onClick={() => setTab('encargo')} style={chip}>ENCARGO</button>
        {save.flags.magodex && <button onClick={() => setTab('magodex')} style={chip}>MAGODEX</button>}
        {save.flags.ruta && <button onClick={() => setTab('ruta')} style={chip}>RUTA {boliches}/8</button>}
      </div>
      {tab && <Book tab={tab} onClose={() => setTab(null)} />}
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 62, background: 'rgba(8,12,8,.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  page: {
    width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto',
    background: GB[0], color: GB[3], border: `4px double ${GB[3]}`,
    fontFamily: '"Press Start 2P", monospace', padding: 11,
    boxShadow: '0 16px 50px rgba(0,0,0,.7)',
  },
  section: {
    fontSize: 7, borderBottom: `2px solid ${GB[3]}`, paddingBottom: 3, marginBottom: 6, marginTop: 8,
  },
  btn: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 5.5, padding: '4px 6px',
    border: `2px solid ${GB[3]}`, background: GB[3], color: GB[0], cursor: 'pointer',
  },
  chip: {
    fontFamily: '"Press Start 2P", monospace', fontSize: 6.5, padding: '5px 6px',
    border: `2px solid ${GB[3]}`, background: 'rgba(155,188,15,.94)', color: GB[3], cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,.45)', transition: 'transform .12s ease, background .12s ease',
  },
};
