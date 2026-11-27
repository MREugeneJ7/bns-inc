// Textos de historia: Magomaniaco (1ª edicion), S.S. Olsen, M.O. 1 Todo Terreno,
// TF-134 nocturna, San Andres (Torre de Las Teresitas), Av. Anaga / Palmetum (Gym #4),
// C.C. Meridiano (casino fast-fashion + cartel Bershka) y Guarida Enriscada (El Coco de Santa Ursula).

export const STORY = {
  // ---- Magomaniaco: un unico notas tiznado de ceniza bloqueando el paso a Taganana ----
  magomaniaco_gate: [
    'MAGOMANIACO: EY, QUIETO PARAO! No pises mis cenizas! Escarbando en estos fogones me encontre DOS cartas de 1ª EDICION: un BURGADO y un CANGREJO!',
    'MAGOMANIACO: La 1ª edicion esta descatalogada hasta llevarla al Centro Certificador de LA GOMERA, pero si me ganas te doy UNA. Sin duelo no subes!',
  ],
  gym2_block: [
    'PEDRO: Antes de retar el Gym #2 tienes que ganarle al MAGOMANIACO que anda escarbando en los fogones de Las Mercedes!',
  ],
  magomaniaco_after: [
    'MAGOMANIACO: Cuida esa joya de 1ª edicion en funda doble, chacho! Cuando llegues al Centro Certificador de LA GOMERA podras meterla al mazo.',
  ],
  first_ed_offer: [
    'MAGOMANIACO: Trato es trato! Escarbando entre las cenizas saque estas DOS cartas de 1ª edicion descatalogadas. Cual te quedas?',
    'MAGOMANIACO: Ojo: no se pueden jugar hasta que las sellen en el CENTRO CERTIFICADOR DE LA GOMERA (quedan guardadas en tu PC).',
  ],
  first_ed_later: ['MAGOMANIACO: Aqui sigo junto al fogon. Hablame cuando decidas si prefieres el Burgado o el Cangrejo!'],
  first_ed_received: (name: string): string[] => [
    `Recibes ${name}! Guardada en el PC de Ayoze.`,
    'AVISO: 1ª edicion descatalogada. Cuando abras el Centro Certificador de La Gomera podras legalizarla y jugarla.',
  ],

  // ---- S.S. Olsen: zarpa en cuanto le rascas la espalda al Capitan y sales ----
  olsen_sail_on_exit: [
    'BOOOOOOM!! Nada mas pisar el pantalan tras rascarle la espalda al Capitan, el S.S. OLSEN recoge pasarela y sale disparado a 38 nudos!',
    'El fast-ferry se pierde en el horizonte dejando olor a gasoil y aire acondicionado polar. Cuando termines en Galdar, tocara volver en CAYUCO.',
  ],
  olsen_gone: [
    'El atraque esta vacio: el S.S. Olsen zarpo en cuanto le rascaste el lomo al Capitan y saliste.',
    'Pa volver a BENIJO (Tenerife) habla con CARMELO en el pantalan del oeste.',
  ],

  // ---- Benijo: M.O. 1 Todo Terreno al volver en cayuco tras Gym #3 ----
  m_o_granted: [
    'UN MECANICO DE ANAGA baja corriendo al verte desembarcar: "Chacho, tu eres el que tumbo las Cuevas Pintadas?! Toma, regalo del taller!"',
    'Recibes el M.O. 1 · TODO TERRENO! Ya esta guardado en tu 🎒 MOCHILA (en el menú START).',
    'MECANICO: Sube 3 pasos al SUR hasta pisar el ASFALTO de la carretera, saca las llaves de la mochila y arranca: un Toyota Landcruiser de antes de la guerra civil!',
    'MECANICO: Con esa bestia te la pelan los baches del Team Enriscada. Tira pal OESTE por Taganana y baja la carretera a SAN ANDRES!',
  ],
  car_spawn: [
    'Usas el M.O. 1 · TODO TERRENO sobre el asfalto... BRRRUM-PATA-PATA-CLONK!!',
    'Spawnea un TOYOTA LANDCRUISER de antes de la guerra civil que de algun modo aun arranca. Los baches del Team Enriscada te la pelan!',
    '(Ojo: somos gente civilizada, el 4x4 SOLO circula por CARRETERAS y PARKINGS. Abre MOCHILA para aparcar y caminar por aceras o playas.)',
  ],
  car_park: [
    'Echas el freno de mano (un bloque de hormigon) y guardas el Toyota Landcruiser en la Mochila. Vuelves a ir a pata.',
  ],
  car_offroad_spawn: [
    'Chacho, no vas a spawnear un Toyota Landcruiser encima de la acera o en mitad de la playa! Que no somos un rent-a-car de guiris.',
    'Pisa primero una CARRETERA de asfalto o un PARKING y vuelve a usar el M.O. 1 en la Mochila.',
  ],
  car_indoor_spawn: [
    'PROF. ACAYMO resuena en tu cabeza: "Chacho, cada cosa en su momento! No metas un Landcruiser del 34 bajo techo!"',
  ],
  car_hazard_park: [
    'Estas encima de un socavon o de la barrera! Avanza un metro hasta asfalto o plaza de parking firme antes de bajarte.',
  ],
  car_curb_hint: [
    'Bordillo peatonal: el Landcruiser solo circula por calles y parkings. Abre la 🎒 MOCHILA desde el menú START si quieres aparcar y bajarte a pie.',
  ],

  // ---- Baches del Team Enriscada y TF-134 nocturna ----
  pothole_first: [
    'CLONK-BADABUM!! Pasas por encima de una zanja del Team Enriscada como si fuera mantequilla. Al Landcruiser del 34 se la pela!',
  ],
  pothole_banner: ['BACHE SUPERADO!', 'SUSPENSION DE HIERRO!', 'FARO PARPADEANDO...', 'AL TOYOTA SE LA PELA!'],
  tf134_blocked: [
    'ZANJAS DEL TEAM ENRISCADA: a pie te partes tres tobillos.',
    'Ponte sobre el asfalto, abre 🎒 MOCHILA y usa el M.O. 1 TODO TERRENO para pasarles por encima!',
  ],
  carretera_sign: [
    'TF-134 CUMBRE -> SAN ANDRES. Noche cerrada y al Landcruiser le fallan las largas: no se ve un pimiento. Sigue el asfalto al SUR!',
  ],

  // ---- San Andres y Cementerio de Las Teresitas ----
  sanandres_vecina: [
    'DOÑA CANDELARIA: Ay mi nino, bajaste de Anaga de noche con esos faros de vela?! Bienvenido a SAN ANDRES!',
    'DOÑA CANDELARIA: Ni te acerques al ESTE, al CEMENTERIO DE LAS TERESITAS: alguien monto una TORRE encima y esta encantadisima!',
    'DOÑA CANDELARIA: Sin un EQUIPO DE CAZAFANTASMAS no se puede entrar. Mejor sigue la carretera al OESTE por toda la AVENIDA ANAGA hasta Santa Cruz!',
  ],
  sanandres_vecina_ghost: [
    'DOÑA CANDELARIA: Ños!! Ese trasto que llevas a la espalda es un EQUIPO DE CAZAFANTASMAS de verdad?!',
    'DOÑA CANDELARIA: Cuando abran la verja del CEMENTERIO DE LAS TERESITAS (al este) vas a poder subir la Torre Encantada sin que te de un aire!',
  ],
  sanandres_pescador: [
    'PESCADOR: Al ESTE queda Las Teresitas y su cementerio, donde un chiflado levanto una TORRE ENCANTADA. Ni los gatos se arriman sin equipo cazafantasmas!',
    'PESCADOR: Tira pal OESTE en el todoterreno: coges toda la AVENIDA ANAGA pegadita al mar y caes en el Muelle, el Palmetum y el Meridiano!',
  ],
  cemetery_sign: [
    'CEMENTERIO DE LAS TERESITAS — TORRE ENCANTADA. Se oyen psicofonias y cadenas oxidadas detras del muro.',
    'Sin un EQUIPO DE CAZAFANTASMAS ni de broma entras ahi. De momento pasamos de ella: tira al OESTE hacia Avenida Anaga!',
  ],
  cemetery_sign_ready: [
    'CEMENTERIO DE LAS TERESITAS — TORRE ENCANTADA. Tu EQUIPO DE CAZAFANTASMAS pita como loco frente a la verja!',
    'La verja tiene un cierre de hierro con forma de bucio. Con el equipo puesto puedes entrar a la torre.',
  ],
  cemetery_enter: [
    'Conectas el medidor de psicofonias. La verja reconoce el Equipo Cazafantasmas y se abre con un suspiro helado.',
    'Una escalera de caracol sube entre lapidas. La Torre Encantada de Las Teresitas empieza aqui.',
  ],
  cemetery_locked: [
    'La verja no cede. Desde dentro llega una voz que susurra "sin equipo no se sube".',
    'Necesitas el EQUIPO CAZAFANTASMAS que te dio El Coco de Santa Ursula.',
  ],
  tower_guard_block: (floor: number): string[] => [
    `RECLUTA ENRISCADA: Alto! No se sube al piso ${floor + 1} sin vencerme. Ordenes del Team Enriscada.`,
    'El recluta te corta el paso en la escalera. RETALO para continuar.',
  ],
  tower_return: ['Bajas con cuidado la escalera de caracol y sales al Cementerio de Las Teresitas.'],
  bucio_hint: ['Un bucio canario bendecido con romero en la Torre de Las Teresitas. No tienes claro pa que sirve, pero impone.'],

  tower_bruja: [
    'DOÑA PINO: (abanicando humo de romero seco y santiguando un mazo con un gajo de ruda) "San Borondon bendito, quitale el mal de ojo y el empacho a estas criaturas, amen..."',
    'DOÑA PINO: Ay, mi niño! Menos mal que echaste a esos golfos del Team Enriscada! Con tanto grito me tenian a los Magomones temblando de susto!',
    'DOÑA PINO: Porque los Magomones NO son juguetes, eh! Son seres vivos que sienten, padecen, cogen frio por los pies y lloran si los metes en fundas de los chinos sin darles antes las buenas noches!',
    'DOÑA PINO: Yo a mi Cabra le pongo un platito de gofio al lado del velon y le paso el santiguado cada martes. Prometeme que los vas a querer como a hijos! Toma, te regalo este BUCIO bendecido!',
    'Recibes el 🐚 BUCIO DE LAS TERESITAS! (Guardado en tu 🎒 MOCHILA.)',
    'TU: ...',
    'TU: (A ver. No tengo ni la mas remota idea de por que esta señora estaba haciendo santeria canaria en el atico de un cementerio...)',
    'TU: (...ni por que me acaba de echar una charla lacrimogena sobre dar de comer a UNOS CROMOS DE CARTON PLASTIFICADO como si fueran un podenco con ansiedad...)',
    'TU: (...pero sonrio educadamente, suelto un "faltaria mas, señora" y asumo que es movida local que mi cerebro de guirufo no esta preparado pa entender.)',
    'RADIO CLUB (en el transistor de la doña): "ULTIMA HORA: abierta de par en par la incorporacion a la AUTOPISTA TF-1 SUR en Santa Cruz! Trafico fluido hasta ADEJE!"',
  ],
  tower_bruja_after: [
    'DOÑA PINO: Acuerdate de arropar bien el mazo por la noche y no barajarlo con corriente, que a las cartas les coge frio en los riñones, mi cielo!',
    'TU: (Asientes muy serio sin entender absolutamente nada. Mejor bajamos y pillamos el Toyota por la TF-1 rumbo a ADEJE, al oeste del Recinto Ferial!)',
  ],

  // ---- Santa Cruz Sur + Incorporacion a la TF-1 (la "Ruta Bici" en Toyota) ----
  tf1_blocked: [
    '🚧 INCORPORACION TF-1 (AUTOPISTA DEL SUR): CORTADA POR OBRAS DEL CABILDO.',
    'Tus asuntos ahora estan aqui mismo: el PALMETUM (lado mar), el C.C. MERIDIANO (lado norte) y la Torre de Las Teresitas en San Andres!',
  ],
  tf1_need_car: [
    '← INCORPORACION TF-1 AUTOPISTA DEL SUR (CANDELARIA · ABADES · EL MEDANO · AEROPUERTO · ADEJE).',
    'Ya esta abierta, pero es una AUTOPISTA, chacho: a pata te lleva puesto una Caddy blanca! Sube al TOYOTA LANDCRUISER (🎒 MOCHILA) para entrar!',
  ],
  tf1_sign_open: [
    '← AUTOPISTA TF-1 SUR (ABIERTA!): Candelaria 17 km · Abades 42 km · El Medano 56 km · Aeropuerto TFS 60 km · Adeje 78 km.',
    'Entra conduciendo tu Toyota Landcruiser como si fuera la Ruta Bici, pero esquivando Guaguas de TITSA y furgonetas Caddy!',
  ],

  // ---- Autopista TF-1 Sur (Candelaria -> Abades -> El Medano -> Aeropuerto TFS -> Adeje) ----
  tf1_candelaria: [
    'BASILICA DE CANDELARIA Y PLAZA DE LA PATRONA. Nueve estatuas gigantes de los Menceyes Guanches vigilan el Atlantico con cara de pocos amigos.',
  ],
  tf1_menceyes: [
    'ESTATUAS DE LOS MENCEYES GUANCHES. Parecen a punto de sacarte un mazo de Malpais y Volcan si tiras una pipa al suelo.',
  ],
  tf1_abades: [
    'PARQUE EOLICO DE ABADES / ARICO. Cuarenta aerogeneradores dando vueltas a toda mecha: si sacas la cabeza por la ventanilla del Toyota llegas peinado a Adeje!',
  ],
  tf1_faro_abades: [
    'ABADES: casitas blancas de postal, jable dorado y el viejo sanatorio abandonado mirando al mar.',
  ],
  tf1_medano: [
    'MONTAÑA ROJA Y PLAYA DE EL MEDANO. Hay tantisimo viento que las palomas vuelan marcha atras y el cielo esta lleno de cometas de kitesurf!',
  ],
  tf1_airport_sign: [
    '✈️ SALIDA 59 · AEROPUERTO TENERIFE SUR (REINA SOFIA). Mete el Toyota en el PARKING del norte, aparca y entra a pie a la TERMINAL!',
  ],
  tf1_adeje_wip: [
    '🐂 SALIDA 78 · ENTRADA A ADEJE CORTADA POR UNA ROMERIA!!',
    'Hay una YUNTA DE BUEYES tirando de una carreta con una barrica de VINO PELEON, cuarenta magos tocando timples y olor a chorizo de Teror en mitad de la autopista!',
    'ROMERO MAYOR: "Chacho, frena ese Toyota! Hoy no pasa ni el Tato por la entrada de Adeje a menos que venga de ROMERIA con un buen BUCIO!"',
  ],
  romeria_prompt: [
    '🐂 La entrada a ADEJE esta totalmente cortada por una ROMERIA con yuntas de bueyes, carretas y parrandas.',
    'Llevas el 🐚 BUCIO DE LAS TERESITAS en la mochila... ¿Te pones a tocar el bucio y te cuelas en la romeria como si estuvieras tu tambien de fiesta?',
  ],
  romeria_wait: [
    'Guardas el Bucio por ahora. La yunta de bueyes sigue rumiando tranquilamente en mitad del carril.',
  ],
  romeria_already_done: [
    'La cola de la Romeria sigue desfilando hacia la ESTACION DE LAS AMERICAS. ¿Quieres ir directo alli?',
  ],
  romeria_arrival_after_isa: [
    'Despues de tres cuartos de hora de Isa Canaria a todo pulmon, dos vasos de vino peleon y medio huevo duro que te metio una abuela en el bolsillo...',
    '...la Romeria desemboca por fin en la ESTACION DE GUAGUAS DE LAS AMERICAS, donde termina el recorrido!',
    'Justo al OESTE se levanta el arco de entrada a CIUDAD FUCSIA (esto... ADEJE), pero un MAGO con cachorro canario y garrote te corta el paso!',
  ],
  mago_americas_gate: [
    'DON SERVANDO (EL MAGO): ¡EEEPA, QUIETO AHI EN LA RAYA, FORASTERO! ¿Vienes cantando la Isa en la romeria y te crees que vas a entrar a CIUDAD FUCSIA... digo, a ADEJE asi por las buenas?',
    'DON SERVANDO: Antes de pisar Ciudad Fucsia (esto... Adeje) tienes que aguantar mi mazo de VINO PELEON y YUNTA DE BUEYES en combate obligatorio!',
  ],
  mago_americas_after: [
    'DON SERVANDO: ¡Ños, aguantaste el Vino Peleon y la Yunta de Bueyes sin pestañear! Ya tienes libre el paso a CIUDAD FUCSIA... digo, a ADEJE, mi niño!',
  ],
  romera_americas: [
    'ROMERA: Ay, que pecha de caminar desde la TF-1 cantando la Isa! Menos mal que la carreta traia una Barrica de Romeria y papas arrugadas.',
  ],
  timplista_americas: [
    'TIMPLISTA: ♪ "A la entrada de Adeje me encontre un guirufo tocando el bucio..." ♫ ¡Chacho, te salio redonda la infiltracion!',
  ],
  cartel_fucsia_adeje: [
    'CARTEL MUNICIPAL: "BIENVENIDOS A CIUDAD FUCSIA" (alguien ha tachado "CIUDAD FUCSIA" con spray rojo y ha escrito debajo: "ESTO... COSTA ADEJE").',
    '↑ SIAM PARK: desde el Magma cruza la TF-1 por la pasarela norte. ← ADEJE: hotel H10, Monkeys y paseo de Troya.',
  ],

  // ---- ZONA SAFARI · SIAM PARK (COLAS DE TOBOGANES, GUIRI FP50 Y PISCINA DE OLAS PUKAS) ----
  siam_gate: [
    'TAQUILLERO SIAM PARK: ¡Sawadee krap, mi niño! Bienvenido a la ZONA SAFARI de Tenerife: ¡SIAM PARK!',
    'TAQUILLERO: Deja las cholas, ponte el bañador y ojo con las colas de los toboganes, que la peña se pica a echar duelos mientras espera!',
  ],
  siam_guiri_quest_prompt: [
    'GUIRI ROJO (DAVE): "Excuse me, mate! You look proper canarian with that tanned neck and that smell of vintage Landcruiser... could you give us a hand?"',
    'DAVE: "I lost my bottle of FACTOR 50 SUNCREAM somewhere near the sunbeds by the wave pool! If I don\'t put it on in five minutes I will literally evaporate into a cloud of tea!"',
    'DAVE: "Find me that cream, brother, and I\'ll give you an ancient wooden pole a local goatherd gave me in Vilaflor: THE SALTO DEL PASTOR POLE (HM 4)!"',
  ],
  siam_guiri_waiting: [
    'DAVE: "Still looking like a poached salmon here, mate! Check the sandy beach loungers near the wave pool for my gold Factor 50 bottle!"',
  ],
  siam_crema_pickup: [
    '¡Encuentras el bote dorado de CREMA SOLAR FACTOR 50 tirado sobre una toalla de rayas cerca de las tumbonas!',
    '(Huele a coco, manteca de karite y proteccion ultravioleta extrema nivel Chernobyl. Llevaselo a Dave antes de que se calcine!)',
  ],
  siam_guiri_reward: [
    'DAVE: "MY FACTOR 50!! Oh bless your soul, brother!! (se embadurna 3 kilos de crema blanca hasta parecer un fantasma de la torre) Aaaaah, instant relief!"',
    'DAVE: "As promised: here is that giant wooden lance with the goat horn tip that shepherd gave me in the mountains! HM 4: VARA DEL SALTO DEL PASTOR!"',
    '¡Recibes la 🪵 M.O. 4 · VARA DEL SALTO DEL PASTOR! (Guardada en tu 🎒 MOCHILA.)',
    'DAVE: "With this you can vault across ledges, rocks and drop-offs like a proper canarian goatherd! Absolute legend, mate!"',
  ],
  siam_guiri_done: [
    'DAVE: "Fully coated in white paste now, mate! Factor 50 is life! Enjoy the Salto del Pastor pole!"',
  ],
  siam_pukas_event: [
    '¡¡WUUUUUUUUUUSSSSH!! La sirena de The Wave Palace retumba y una OLA DE TRES METROS rompe con fuerza bruta!',
    'En mitad de la espuma, a un pibe que intentaba meterse en el tubo se le suelta la tabla PUKAS y sale disparada hacia la orilla.',
    'Atrapas la tabla de surf en el aire antes de que le parta la cabeza a un flotador de patito.',
    'PIBE SURFERO (BORJA): "¡¡ÑOOOOOS, MENUDO REFLEJO, LOCO!! Iba directo al arrecife falso! Oye, te vi cogerla con una mano limpia de pro..."',
    'BORJA: "Mira, a mi me da que a ti te va a hacer mas falta que a mi, que yo me voy a por un mojito al chiringuito. ¡QUEDATELA! ¡Es una PUKAS original!"',
    '¡Recibes la 🏄 M.O. 3 · TABLA PUKAS (SURF)! (Guardada en tu 🎒 MOCHILA.)',
    'BORJA: "Con la Pukas puedes surfear por cualquier charco, piscina de olas o marea de la isla. ¡A disfrutar la serie!"',
  ],
  caletillas_shore_sign: [
    'PLAZA DE LA PATRONA. El barranco corta el paso a la subestación de Caletillas, al ESTE, bajo la TF-1.',
    'Desde estas escaleras, mira al ESTE y usa la PUKAS para cruzar la ensenada. Las vallas no dejan entrar desde la carretera.',
  ],
  unelco_pickup: (destination: 'deck' | 'pc'): string[] => [
    'Levantas la carta envuelta en plastico de obra: UNELCO, tierra legendaria de la subestacion de Caletillas!',
    'UNELCO: gírala por 1 maná del color que elijas. Si decides sacrificarla, activas APAGÓN: nadie endereza tierras durante el resto del duelo.',
    destination === 'deck' ? 'Va directa a tu MAZO (maximo 1 copia por ser legendaria).' : 'Tu mazo esta lleno: Ayoze la guarda en el PC.',
  ],
  siam_pukas_after: [
    'BORJA: "Esa Pukas coge tubos hasta en un vaso de agua, mi niño. ¡Remala con orgullo!"',
  ],
  siam_shark_tank: [
    'EL TÚNEL DE LOS TIBURONES (TORRE DEL PODER). Tubo acrilico transparente sumergido en un tanque donde nadan jaquetones y cazones afilados.',
    'Ves pasar un Megalodon de Siam de seis metros rozando el cristal con la tripa. Menos mal que el metacrilato tiene 20 centimetros.',
  ],
  siam_sealions_pool: [
    'PISCINA DE LOS LEONES MARINOS. Una familia de leones marinos de Siam toma el sol en las rocas y aplaude con las aletas.',
    'El Gran Otario duerme panza arriba con una piña colada vacia apoyada en la barriga.',
  ],

  // ---- Terminal del Aeropuerto Tenerife Sur (Reina Sofia) + M.O. 2 Tarifa Plana Binter ----
  dona_binter_give: [
    'DOÑA MARUCA: Ay, mi niño, ven pa aca! Tu tienes cara de viajar mas que el baul de la Piquer!',
    'DOÑA MARUCA: Mira, llame a un concurso de la Tele Canaria pa ganar una freidora de aire y me toco un TICKET TARIFA PLANA VITALICIO DE BINTER!',
    'DOÑA MARUCA: A mi esos avioncitos de helice me dan un yuyu tremendo, asi que quedatelo tu con descuento de residente y todo!',
    'Recibes la ✈️ M.O. 2 · TICKET TARIFA PLANA DE BINTER! (Guardada en tu 🎒 MOCHILA.)',
    'DOÑA MARUCA: Abre la MOCHILA cuando quieras pegar un salto en Binter... y ni se te ocurra rechazar la chocolatina Tirma que da la azafata, que es delito!',
  ],
  dona_binter_after: [
    'DOÑA MARUCA: Ya tienes la ✈️ M.O. 2 · TARIFA PLANA DE BINTER en tu 🎒 MOCHILA, mi cielo! Vuelos infinitos, agua con gas y ambrosia Tirma gratis!',
  ],
  azafata_binter: [
    'AZAFATA BINTER: Buenas tardes y bienvenido a Binter Canarias! Con la M.O. 2 Tarifa Plana puede volar desde su 🎒 MOCHILA cuando le apetezca.',
    'AZAFATA BINTER: La linea a LA GOMERA (Centro Certificador de 1ª Edicion) esta a puntito de abrir embarque. Tenga una chocolatina mientras tanto!',
  ],
  guiri_aeropuerto: [
    'GUIRI ROJO GAMBA: "Mate, I fell asleep 12 minutes in El Medano without factor 50 and now I glow in the dark. Proper mint island though!"',
    'TU: (Dios mio... yo me veia asi hace cuatro gimnasios?! Menos mal que ya digo "chacho".)',
  ],
  airport_board: [
    'PANEL DE SALIDAS TFS: NT104 Gran Canaria EN HORA · NT212 Tenerife Norte EN HORA · NT601 La Gomera EMBARQUE PROXIMO · Ryanair Manchester RETRASADO (sorpresa).',
  ],
  airport_dutyfree: [
    'DUTY FREE TFS: torres de dos metros de Ambrosias Tirma, ron miel, mojo en bote pa guiris y Toblerones del tamaño de una viga.',
  ],
  binter_fly: (destName: string): string[] => [
    `✈️ DING-DONG! Embarcas con tu M.O. 2 TARIFA PLANA DE BINTER. Te dan una ambrosia Tirma y un vasito de agua antes de que de tiempo a abrocharte!`,
    `Aterrizaje suave de turbohelice ATR-72: llegas fresquito a ${destName}! (Los aeropuertos también están en la tarifa plana, aunque no tengan Centro Parrandero.)`,
  ],
  plaza_espana: [
    'PLAZA DE ESPAÑA Y EL CHARCO. Hacia el norte subiria la Calle del Castillo hasta Weyler, pero esta cortada por un escenario de murgas.',
  ],
  muelle: ['MUELLE DE ANAGA Y ESTACION MARITIMA. Al sur ruge el Atlantico entre gruas, contenedores y olor a salitre.'],
  auditorio: ['AUDITORIO DE TENERIFE. La gran vela blanca de Calatrava asomada al mar al sur de la avenida.'],
  maritimo: ['PARQUE MARITIMO CESAR MANRIQUE. Piscinas de agua salada, piedra volcanica y palmeras frente al oceano.'],
  estacion: [
    'ESTACION DE GUAGUAS / INTERCAMBIADOR DE SANTA CRUZ. Guaguas verdes saliendo pa media isla cada tres minutos.',
    '↑ TODO TIESO AL NORTE (en 4x4): AUTOPISTA TF-5 (Puente de Taco · Padre Anchieta · TFN · Tacoronte · El Sauzal · Acentejo · Santa Ursula).',
  ],
  corte_ingles: ['EL CORTE INGLÉS · TRES DE MAYO. Entrada junto a este cartel. Ascensor al fondo; Zona Gourmet en la azotea.'],
  meridiano_sign: [
    'C.C. MERIDIANO — TEMPLO DEL FAST FASHION. Aparca el coche, baja a pie y entra: Zara, Bershka, Pull&Bear y Primark!',
    '(Gastas hoy, se te rompe mañana y pasado vuelves a gastar: basicamente un CASINO con perchas!)',
  ],
  recinto: ['RECINTO FERIAL DE TENERIFE. Huele a algodon de azucar, feria del saldo y concurso de murgas.'],
  parking_sign: [
    'ENTRADA AL PARKING DEL PALMETUM (GIMNASIO #4 · TIPO PLANTA). La rampa esta DE CULO: llena de socavones y con barrera.',
    'Entra conduciendo el TOYOTA LANDCRUISER, aparca dentro y baja a pie para pasar al jardin botanico!',
  ],
  parking_guard: [
    'VIGILANTE: La entrada del parking del Palmetum esta hecha un cristo, chacho! A pata no dejo pasar por si te caes en un socavon.',
    'VIGILANTE: Entra montado en un TODOTERRENO, aparcas en las plazas de dentro y ya caminas al GIMNASIO DE PLANTA!',
  ],
  palmetum_sign: [
    'PALMETUM DE SANTA CRUZ — GIMNASIO #4 (TIPO PLANTA). Sigue el sendero entre palmeras y dragos hasta el mirador de JONAY.',
  ],
  jardin: [
    'Dejas el Landcruiser aparcado y entras a pie al PALMETUM. Cientos de palmeras canarias y dragos mecidos por la brisa del mar!',
    'Al fondo del jardin te espera JONAY, Lider del GIMNASIO #4 (TIPO PLANTA).',
  ],
  palmetum_post: [
    'JONAY: Felicidades por tu 4o Boliche, chacho! Oye, una cosa rara: antes vi a un recluta del TEAM ENRISCADA cruzar corriendo al C.C. MERIDIANO!',
    'JONAY: Se metio en la tienda BERSHKA con un rollo de carteles de descuento muy sospechoso. Aparca el 4x4 y echale un ojo a Meridiano!',
  ],
  palmetum_after: [
    'JONAY: Ya tienes el BOLICHE DEL PALMETUM! Pasate a pie por el C.C. MERIDIANO (justo al norte): el cartel de BERSHKA olia a trampa del Team Enriscada.',
  ],

  // ---- C.C. Meridiano: Casino Fast-Fashion y Cartel de Bershka ----
  meridiano_shopper_1: [
    'CLIENTA: Me compre esta blusa hace diez minutos por 5 duros, estornude y ahora es una bufanda! Voy a tirar otra vez en ZARA a ver si esta aguanta hasta el jueves!',
  ],
  meridiano_shopper_2: [
    'PIBE CON BOLSAS: Meridiano es puro casino, hermano: gastas hoy, se te rompe mañana y pasado estas haciendo cola otra vez! Prueba las cajas de rebajas!',
  ],
  meridiano_shopper_hint_before: [
    'DEPENDIENTA: Ese pibe con chaleco del TEAM ENRISCADA lleva dos horas colgando un cartel de descuento en BERSHKA, al fondo. Ni trabaja aqui!',
  ],
  meridiano_shopper_hint_after: [
    'DEPENDIENTA: Oye! En cuanto ganaste en el Palmetum, el notas del TEAM ENRISCADA que colgaba el cartel de BERSHKA desaparecio por arte de magia... y dejo el cartel rarisimo!',
  ],
  enriscada_bershka: [
    'RECLUTA ENRISCADA: (silbando nervioso) Eh, tu! Solo estoy colgando este cartel de DESCUENTO -70% EN BERSHKA! Totalmente normal!',
    'RECLUTA ENRISCADA: Detras de este cartel de carton piedra NO hay ningunas escaleras mecanicas secretas, vale?! Circula a comprar calcetines!',
  ],
  bershka_poster_weird_seen: [
    'Oye... el miembro del TEAM ENRISCADA que estaba aqui colgando el cartel de descuento de BERSHKA ya no esta!',
    'Te fijas bien y el cartel de "BERSHKA -70%" esta torcido, abombado y sale aire frio con olor a espresso por debajo...',
  ],
  bershka_poster_weird_unseen: [
    'El cartel de descuento de "BERSHKA -70%" esta colgado fatal, medio despegado, y el recluta del Team Enriscada que lo puso ha desaparecido.',
    'Al acercarte notas corriente de aire y un zumbido metalico detras del cartel...',
  ],
  bershka_poster_reveal: [
    'Apartas el cartel de descuento de BERSHKA y pulsas un perchero falso... CLANK-RRRRRR!!',
    'Se abre un probador oculto con unas ESCALERAS MECANICAS bajando a la GUARIDA ENRISCADA!! (Pisalas a la derecha para bajar!)',
  ],
  bershka_poster_already: [
    'Detras del cartel torcido de BERSHKA siguen abiertas las ESCALERAS MECANICAS a la Guarida Enriscada (justo a la derecha).',
  ],

  // ---- Guarida Enriscada y El Coco de Santa Ursula ----
  don_michi_npc: [
    'DON MICHI: "Miau... capisci?" (Te mira por encima del hombro mientras afila las unas en una caja de Bershka.)',
  ],
  copier_prop: [
    'Solo queda el hueco de la fotocopiadora y un cartel: "TRASLADADA A MAGOS DE LA COSTA". El Coco se llevó la máquina de verdad.',
  ],
  coco_meridiano_first: [
    'EL COCO: Buonasera, guirufo... digo, buenas tardes mi niño. Soy EL COCO DE SANTA URSULA, un humilde empresario norteño... nada italiano, capisci? 🤌',
    'EL COCO: Has bajado por el probador falso como si fuera tu casa. Aquí abajo mis gatos hacen de guardia y el EQUIPO CAZAFANTASMAS vive en mi cajón.',
  ],
  coco_meridiano_again: [
    'EL COCO: ¿Otra vez por mi sótano? Mi espresso está caliente y mi paciencia también.',
    'EL COCO: Si me ganas, el equipo cazafantasmas es tuyo y yo me voy a MAGOS DE LA COSTA. Si no... el ascensor de Bershka te espera.',
  ],
  coco_magos_first: [
    'EL COCO: ¿Vienes a mi azotea de Magos de la Costa a faltarme al respeto? ¡Ricardo García está secuestrado por un contrato de copias!',
    'EL COCO: Don Michi y mis gatos te harán una oferta que no podrás rechazar. Aquí arriba ya no te salva ni el probador falso.',
  ],
  coco_magos_again: [
    'EL COCO: ¡Otra vez aquí arriba! Ricardo se te quedó mirando con ojos de profesor de matemáticas.',
    'EL COCO: La fotocopiadora no se muda dos veces, ragazzo. O juegas, o bajas por las escaleras de incendios.',
  ],
  magos_ricardo: [
    'RICARDO GARCÍA: ¡Menos mal que llegaste! El Coco me tenía aquí secuestrado firmando pagarés y contando cartas falsas mientras bajaba al terrero.',
    'RICARDO GARCÍA: Yo solo quería diseñar un juego de cartas coleccionables donde los magos se tiran rayos y gestionan maná... y mira en lo que ha acabado la costa.',
    'RICARDO GARCÍA: Dicen que el azar equilibra la matemática, pero a mí el Coco me equilibró dos hostias bien dadas.',
    'EL COCO: Ecco... basta de cháchara matemática, profesor Garfield... digo, García. La máquina de fotocopias no duplica tus cartas, ragazzo: copia las del rival EN PLENO DUELO.',
    'EL COCO: Una Master Ball de papel, capisci? La sacas en pleno combate, le copias una carta al rival y la copia te entra directa a la mano. Toner para una sola vez.',
    '(En combate, la FOTOCOPIADORA se usa con el botón FOTO.)',
  ],
  ricardo_waiting: [
    'RICARDO GARCÍA: El Coco sigue en la azotea con Don Michi. Gánale y esa fotocopiadora pasa a ser tuya... siempre que no la use para fotocopiar mis reglamentos.',
    'RICARDO GARCÍA: Consejo de diseñador: los jugadores recuerdan una jugada injusta mucho antes que un balance perfecto.',
  ],
  magos_door_after: ['La puerta ya está abierta. Dentro solo queda olor a espresso recién hecho y el zumbido de los teletransportadores.'],
  ricardo_chat: [
    'RICARDO GARCÍA: Gracias por sacarme del despacho. ¿Sabías que el primer prototipo de Magos de la Costa se jugaba con posavasos de cerveza?',
    'RICARDO GARCÍA: La idea era sencilla: cinco colores, tierras que se giran, criaturas legendarias... y un vampiro de Sengir que nadie sabía cómo pronunciar en La Laguna.',
    'RICARDO GARCÍA: Luego vinieron los combos de cartas prohibidas, las demandas por derechos y este secuestro en El Rosario. En fin: la matemática nunca miente.',
  ],
  magos_coco_post: [
    'EL COCO: Madonna santa... digo, chacho, fuerte paliza. El Coco cumple su palabra, aunque le duela el orgullo.',
    'RICARDO GARCÍA: Me voy pitando a repartir. La máquina del Coco es TUYA: se usa en combate, no en la mochila.',
  ],
  magos_coco_after: ['EL COCO: La FOTOCOPIADORA ya es tuya. Sácala en pleno duelo y cópiale una carta al rival. Le queda toner para una sola vez.'],
  coco_post: [
    'EL COCO: Madonna santa... digo, chacho fuerte paliza! Un hombre de Santa Ursula cumple su palabra.',
    'Recibes el 👻 EQUIPO CAZAFANTASMAS! Con esto ya puedes plantarte en la Torre Encantada del CEMENTERIO DE LAS TERESITAS!',
    'EL COCO: Don Michi y yo nos vamos a MAGOS DE LA COSTA, en El Rosario. Si quieres la fotocopiadora, sube a la azotea y pregúntame allí. Ci vediamo!',
  ],
  coco_meridiano_after: ['EL COCO: El equipo cazafantasmas ya es tuyo. Yo me voy a MAGOS DE LA COSTA. La fotocopiadora la encontrarás arriba, si puedes.'],
  fotocopiadora_done: (cardName: string, dest: 'deck' | 'pc'): string[] => [
    `BZZZZT-CLACK!! La Maquina Fotocopiadora escupe una copia perfecta de ${cardName} y funde el ultimo cartucho de toner!`,
    dest === 'deck'
      ? `Ni un juez con lupa nota el truco! Tu nueva ${cardName} entra directa a tu MAZO (la fotocopiadora queda gastada).`
      : `Ni un juez con lupa nota el truco! Tu nueva ${cardName} queda guardada en el PC DE AYOZE (la fotocopiadora queda gastada).`,
  ],

  // ---- Bloqueos peatonales en coche ----
  car_escuela: ['Ni de broma metes un Landcruiser del 34 en el patio de un colegio. Abre 🎒 MOCHILA, aparca y entra a pie.'],
  car_parrandero: ['Deja el Landcruiser en la calle (🎒 MOCHILA) antes de entrar al Centro Parrandero.'],
  car_pc: ['Bajate del Landcruiser primero para usar el PC de Ayoze.'],
  car_tranvia: ['El tranvia no admite todoterrenos. Aparca primero desde la 🎒 MOCHILA.'],
  car_cueva: ['No cabe un Landcruiser por la puerta del guachinche. Aparca fuera primero.'],
};
