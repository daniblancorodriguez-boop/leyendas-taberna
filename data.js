"use strict";
/* =========================================================
   LEYENDAS DE LA TABERNA · datos del mundo
   Razas, personajes legendarios, bestiario, objetos y escenas semilla.
   ========================================================= */

/* ---------- utilidades compartidas ---------- */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 9);
const clonar = (o) => JSON.parse(JSON.stringify(o));
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------- elementos y etiquetas ---------- */
const ELEMENTOS = {
  fisico: { n: "Físico", e: "⚔️" },
  fuego: { n: "Fuego", e: "🔥" },
  hielo: { n: "Hielo", e: "❄️" },
  sagrado: { n: "Sagrado", e: "✨" },
  sombra: { n: "Sombra", e: "🌑" },
  veneno: { n: "Veneno", e: "☠️" },
};

/* Etiquetas que la IA asigna a la ACTITUD del jugador. El juego decide el XP. */
const ETIQUETAS = {
  valentia: { n: "Valentía", e: "🦁" },
  honor: { n: "Honor", e: "🛡️" },
  piedad: { n: "Piedad", e: "🕊️" },
  generosidad: { n: "Generosidad", e: "🎁" },
  astucia: { n: "Astucia", e: "🦊" },
  lealtad: { n: "Lealtad", e: "🤝" },
  curiosidad: { n: "Curiosidad", e: "🔎" },
  humor: { n: "Humor", e: "🎭" },
  fe: { n: "Fe", e: "🙏" },
  naturaleza: { n: "Naturaleza", e: "🌿" },
  sabiduria: { n: "Sabiduría", e: "📚" },
  engano: { n: "Engaño", e: "🃏" },
  codicia: { n: "Codicia", e: "💰" },
  violencia: { n: "Violencia gratuita", e: "🩸" },
  crueldad: { n: "Crueldad", e: "😈" },
  cobardia: { n: "Cobardía", e: "🐔" },
  orgullo: { n: "Orgullo", e: "👑" },
};

/* ---------- razas ---------- */
const RAZAS = {
  humano: {
    n: "Humanos",
    e: "🧑",
    rasgos: "Adaptables, ambiciosos y los más numerosos. Dominan ciudades y comercio.",
    choque: "Los demás pueblos los creen apresurados y poco fiables con los plazos.",
  },
  elfo: {
    n: "Elfos",
    e: "🧝",
    rasgos: "Longevos, elegantes y ligados a los bosques antiguos y la magia. Hablan con calma y recuerdan los agravios durante siglos.",
    choque: "Miran por encima del hombro a los enanos ('tan ruidosos') y desconfían de los orcos.",
  },
  enano: {
    n: "Enanos",
    e: "🧔",
    rasgos: "Robustos, orgullosos, maestros de forja y cerveza. Valoran la palabra dada y las deudas pagadas. Odian a los goblins.",
    choque: "Chocan con los elfos ('demasiado floridos') y juran por sus barbas.",
  },
  orco: {
    n: "Orcos",
    e: "👹",
    rasgos: "Corpulentos, de honor tribal y sorprendente sensibilidad poética. Prefieren los retos cara a cara.",
    choque: "Prejuzgados como brutos; algunos lo aprovechan para ganar apuestas.",
  },
  mediano: {
    n: "Medianos",
    e: "🧒",
    rasgos: "Pequeños, curiosos y amantes de la buena mesa y la mejor charla. Siempre saben a quién preguntar.",
    choque: "Poca gente los toma en serio... hasta que les deben dinero.",
  },
};

const MUNDO = {
  nombre: "Valdoria",
  resumen:
    "Un reino de caminos embarrados, bosques antiguos y cavernas hambrientas, donde las tabernas son el centro del mundo y los rumores valen más que el oro. El tono es fantasía épica con toques de humor socarrón.",
};

/* ---------- objetos ---------- */
const OBJETOS = {
  pocion: { n: "Poción de curación", e: "❤️‍🩹", desc: "Cura 15 + 3 por nivel y limpia el veneno.", precio: 15 },
  aceite: { n: "Frasco de aceite ardiente", e: "🛢️", desc: "Lanzado: 10 + 3 por nivel de daño de fuego. No falla.", precio: 12 },
  agua: { n: "Agua bendita", e: "💧", desc: "Lanzada: 10 + 3 por nivel de daño sagrado. No falla.", precio: 14 },
  escarcha: { n: "Frasco de escarcha", e: "🧊", desc: "Lanzado: 10 + 3 por nivel de daño de hielo. No falla.", precio: 14 },
  vial: { n: "Vial de veneno", e: "🧪", desc: "Lanzado: 10 + 3 por nivel de daño de veneno. No falla.", precio: 14 },
  elixir: { n: "Elixir de vigor", e: "⚗️", desc: "Recupera 8 puntos de energía.", precio: 10 },
};
/* objetos arrojadizos: id → elemento */
const ARROJADIZOS = { aceite: "fuego", agua: "sagrado", escarcha: "hielo", vial: "veneno" };

/* ---------- bestiario ----------
   debil / resiste: elemento (ver ELEMENTOS). tele: aviso del golpe pesado. */
const BESTIARIO = {
  goblin: {
    n: "Goblin saqueador", e: "👺", hp: 30, atk: 6, esq: 5, debil: null, resiste: null, regen: 0, nivelMin: 1, xp: 22, oro: 6,
    desc: "Verde, nervioso y armado con una cuchara de palo muy afilada.",
    pista: "No tienen punto débil especial: son frágiles y caen a base de golpes.",
    patron: [
      { n: "te lanza una puñalada nerviosa", m: 1 },
      { n: "te muerde el tobillo", m: 1 },
      { n: "te tira una piedra con muy buena puntería (¡por fin!)", m: 1.3 },
    ],
  },
  lobo: {
    n: "Lobo huargo", e: "🐺", hp: 38, atk: 7, esq: 8, debil: "fuego", resiste: "hielo", regen: 0, nivelMin: 1, xp: 30, oro: 3,
    desc: "Enorme, de pelaje invernal y colmillos que no han oído hablar de la dieta.",
    pista: "Teme al fuego: las antorchas y el aceite ardiente le duelen el doble. El frío apenas le hace cosquillas.",
    patron: [
      { n: "te muerde la pierna", m: 1 },
      { n: "salta a tu garganta", m: 1.1 },
      { n: "se lanza con todo su peso", m: 2, tele: "El lobo agacha el lomo y gruñe, a punto de saltar..." },
    ],
  },
  esqueleto: {
    n: "Esqueleto guardián", e: "💀", hp: 42, atk: 7, esq: 3, debil: "sagrado", resiste: "veneno", regen: 0, nivelMin: 2, xp: 36, oro: 8,
    desc: "Cruje al andar. Se le cae la mandíbula cuando se enfada, y se enfada mucho.",
    pista: "La luz sagrada lo deshace. El veneno no sirve de nada: no tiene a quién envenenar.",
    patron: [
      { n: "te golpea con una espada oxidada", m: 1 },
      { n: "te da un escudazo", m: 1 },
      { n: "levanta la espada con ambas manos", m: 2, tele: "El esqueleto alza la espada sobre su cráneo..." },
    ],
  },
  arana: {
    n: "Araña de las cuevas", e: "🕷️", hp: 44, atk: 7, esq: 7, debil: "fuego", resiste: "veneno", regen: 0, nivelMin: 2, xp: 40, oro: 5,
    desc: "Ocho patas, ocho ojos y cero ganas de que le hables.",
    pista: "Sus telarañas arden; el fuego le duele el doble. Es inmune a su propio veneno, claro.",
    patron: [
      { n: "te clava los colmillos", m: 1, efecto: "veneno" },
      { n: "te enreda con su tela y muerde", m: 1.1 },
      { n: "se descuelga del techo", m: 1.6, efecto: "veneno", tele: "La araña trepa por el techo, justo sobre ti..." },
    ],
  },
  troll: {
    n: "Troll del Puente Roto", e: "👹", hp: 70, atk: 9, esq: 2, debil: "fuego", resiste: null, regen: 4, nivelMin: 3, xp: 75, oro: 25,
    desc: "Cobra peaje a todo el mundo y se ofende si le regatean. Huele a cueva mojada.",
    pista: "Se regenera cada turno, pero el fuego detiene su regeneración y le hace el doble de daño.",
    patron: [
      { n: "te golpea con su garrote", m: 1 },
      { n: "te embiste con el hombro", m: 1 },
      { n: "descarga un tronco entero", m: 2, tele: "El troll alza un tronco gigantesco sobre su cabeza..." },
    ],
  },
  espectro: {
    n: "Espectro de la cripta", e: "👻", hp: 46, atk: 8, esq: 10, debil: "sagrado", resiste: "fisico", regen: 0, nivelMin: 3, xp: 68, oro: 12,
    desc: "Un lamento con forma de capa. Atraviesa las paredes y las conversaciones.",
    pista: "Las armas normales apenas lo rozan. Lo sagrado le hace el doble de daño.",
    patron: [
      { n: "te toca con dedos helados", m: 1 },
      { n: "gime y te drena el calor", m: 1.1 },
      { n: "se lanza en un alarido desgarrador", m: 2, tele: "El espectro se hincha y su gemido llena la cripta..." },
    ],
  },
  ogro: {
    n: "Ogro glotón", e: "🧌", hp: 85, atk: 11, esq: 1, debil: "veneno", resiste: null, regen: 0, nivelMin: 4, xp: 95, oro: 30,
    desc: "Se come cualquier cosa. Eso incluye, con frecuencia, a quienes lo molestan.",
    pista: "Tiene el estómago sensible: el veneno le hace el doble de daño.",
    patron: [
      { n: "te aplasta con un puño", m: 1 },
      { n: "te lanza un barril", m: 1.1 },
      { n: "salta para aplastarte", m: 2, tele: "El ogro flexiona las rodillas, preparando un salto..." },
    ],
  },
  wyvern: {
    n: "Wyvern de las cumbres", e: "🐲", hp: 120, atk: 13, esq: 6, debil: "hielo", resiste: "fuego", regen: 0, nivelMin: 6, xp: 170, oro: 80,
    desc: "Primo pobre de los dragones, pero con la misma opinión de sí mismo.",
    pista: "El hielo le hace el doble de daño. El fuego no le impresiona: ya es suyo.",
    patron: [
      { n: "te desgarra con las garras", m: 1 },
      { n: "te azota con la cola", m: 1.1 },
      { n: "exhala una oleada de llamas", m: 2.2, tele: "La wyvern hincha el pecho; hay brasas entre sus dientes..." },
    ],
  },
};

/* ---------- personajes legendarios ----------
   virtudes: XP completo · defectos: medio XP (interpretarlos también es rolear)
   prohibido: traicionan su historia → pierdes XP. */
const PERSONAJES = [
  {
    id: "aldric", nombre: "Sir Aldric Corazón-Quebrado", corto: "Aldric", apodo: "El Paladín Caído", emoji: "🛡️",
    clase: "Paladín caído", raza: "humano",
    resumen: "Juró proteger a un príncipe y falló. Busca redención... y que dejen de llamarlo «Sir Aldrico».",
    historia: "Fuiste el escudo más brillante de la Orden del Alba hasta la noche en que el príncipe Edric murió bajo tu guardia. Te arrancaron el emblema y el nombre de la Orden, pero no el juramento: nadie más volverá a morir por tu culpa. Cada buena acción es un ladrillo para reconstruir tu honor; cada traición, una grieta más en el corazón.",
    motivacion: "Redimirte protegiendo a los inocentes.", miedo: "Volver a fallar a quien depende de ti.",
    virtudes: ["honor", "piedad", "valentia", "lealtad"], defectos: ["orgullo"], prohibido: ["engano", "crueldad", "cobardia", "codicia"],
    stats: { fue: 7, des: 4, int: 3, vol: 6 }, ataque: "fue", crece: ["fue", "vol"],
    arma: { n: "Espada de la Orden (mellada)", bono: 2 }, armadura: { n: "Cota abollada", red: 2 },
    oro: 20, inv: { pocion: 2, agua: 1 },
    habilidades: [
      { id: "sagrado", n: "Golpe sagrado", e: "✨", coste: 4, tipo: "dano", elem: "sagrado", mult: 1.6, stat: "fue", desc: "Daño sagrado ×1.6" },
      { id: "juramento", n: "Juramento", e: "🙏", coste: 5, tipo: "cura", base: 12, desc: "Te curas 12 + nivel" },
    ],
    entrada: "Llevas el yelmo bajo el brazo. Nadie en la sala sabe aún que el hombre de la cota abollada fue el mejor caballero del reino.",
  },
  {
    id: "lyra", nombre: "Lyra Sombraluna", corto: "Lyra", apodo: "La Hechicera Exiliada", emoji: "🔮",
    clase: "Hechicera exiliada", raza: "elfo",
    resumen: "Expulsada de la Torre de Cristal por estudiar la magia que nadie debía mirar. Aún la estudia. Con más ganas.",
    historia: "La Torre de Cristal te expulsó por abrir un libro prohibido, y lo peor es que el libro tenía razón. Ahora vagas con un bastón de fresno y una curiosidad que no cabe en ninguna jaula. Un conjuro mal cerrado sigue susurrando en tu memoria, y solo tú sabes lo que dice.",
    motivacion: "Descubrir qué ocultaba el libro prohibido.", miedo: "Que el conjuro del libro se complete sin ti.",
    virtudes: ["curiosidad", "astucia", "sabiduria"], defectos: ["orgullo", "engano"], prohibido: ["cobardia", "crueldad"],
    stats: { fue: 2, des: 4, int: 9, vol: 5 }, ataque: "int", crece: ["int", "vol"],
    arma: { n: "Bastón de fresno", bono: 1 }, armadura: { n: "Túnica rúnica", red: 0 },
    oro: 25, inv: { pocion: 2, elixir: 1, escarcha: 1 },
    habilidades: [
      { id: "fuego", n: "Bola de fuego", e: "🔥", coste: 4, tipo: "dano", elem: "fuego", mult: 1.8, stat: "int", desc: "Daño de fuego ×1.8" },
      { id: "sombra", n: "Lanza de sombra", e: "🌑", coste: 3, tipo: "dano", elem: "sombra", mult: 1.5, stat: "int", seguro: true, desc: "Sombra ×1.5, nunca falla" },
    ],
    entrada: "La capucha esconde las orejas puntiagudas y varias cosas más. Notas el libro prohibido pesando en tu bolsa, como un remordimiento con tapas de cuero.",
  },
  {
    id: "grum", nombre: "Grum Martillo-Rojo", corto: "Grum", apodo: "El Enano Vengador", emoji: "⚒️",
    clase: "Herrero guerrero", raza: "enano",
    resumen: "Su clan perdió el Martillo Rojo. Él perdió la paciencia. Los goblins van a perder bastante más.",
    historia: "El Martillo Rojo, forjado por tus ancestros en el corazón de la montaña, fue robado por saqueadores mientras tú atendías la fragua. Tu clan te dio la espalda: sin martillo no hay honra. Juraste no volver a casa sin él, y las barbas de tus abuelos son testigos.",
    motivacion: "Recuperar el Martillo Rojo y la honra del clan.", miedo: "Morir sin haber saldado la deuda.",
    virtudes: ["valentia", "lealtad", "honor", "generosidad"], defectos: ["orgullo", "violencia"], prohibido: ["engano", "cobardia"],
    stats: { fue: 8, des: 3, int: 3, vol: 6 }, ataque: "fue", crece: ["fue", "vol"],
    arma: { n: "Maza de herrero", bono: 2 }, armadura: { n: "Coraza enana", red: 2 },
    oro: 15, inv: { pocion: 2, aceite: 1 },
    habilidades: [
      { id: "runico", n: "Martillazo rúnico", e: "🔥", coste: 4, tipo: "dano", elem: "fuego", mult: 1.5, stat: "fue", desc: "Fuego ×1.5 (runas de forja)" },
      { id: "roca", n: "Piel de roca", e: "🪨", coste: 3, tipo: "escudo", factor: 0.3, desc: "El siguiente golpe te hace un 70% menos" },
    ],
    entrada: "Tu barba huele a humo de fragua y a promesas no cumplidas. Por primera vez en semanas, alguien te sirve una cerveza sin preguntarte cuánto mides.",
  },
  {
    id: "kael", nombre: "Kael «Dedos de Plata»", corto: "Kael", apodo: "El Ladrón Noble", emoji: "🗝️",
    clase: "Ladrón noble", raza: "humano",
    resumen: "Roba a los ricos para pagar las deudas de un orfanato. Los ricos, curiosamente, no lo aplauden.",
    historia: "Naciste noble y morirás sospechoso. Tu familia cayó en desgracia y tú caíste con ella... hacia arriba: ahora los tejados son tu hogar. Cada bolsa que aligeras alimenta a los niños del Orfanato de la Vela, y cada mentira que cuentas la cuentas con una sonrisa y por una buena causa.",
    motivacion: "Mantener abierto el Orfanato de la Vela.", miedo: "Que descubran quién eres... o lo que haces.",
    virtudes: ["astucia", "generosidad", "humor", "piedad"], defectos: ["codicia", "engano"], prohibido: ["crueldad", "violencia"],
    stats: { fue: 4, des: 9, int: 5, vol: 3 }, ataque: "des", crece: ["des", "int"],
    arma: { n: "Daga «Dedos de Plata»", bono: 2 }, armadura: { n: "Jubón de cuero", red: 1 },
    oro: 30, inv: { pocion: 1, elixir: 1, vial: 1 },
    habilidades: [
      { id: "punalada", n: "Puñalada trapera", e: "🗡️", coste: 4, tipo: "dano", elem: "fisico", mult: 2.0, stat: "des", desc: "Físico ×2.0" },
      { id: "humo", n: "Frasco de humo", e: "💨", coste: 3, tipo: "evasion", desc: "Esquivas por completo el siguiente golpe" },
    ],
    entrada: "Tu bolsa pesa más de lo que debería, y tu conciencia menos. Desde el rincón, estudias los bolsillos de media taberna... por pura costumbre profesional.",
  },
  {
    id: "elowen", nombre: "Elowen Hojarroble", corto: "Elowen", apodo: "La Guardabosques", emoji: "🏹",
    clase: "Guardabosques", raza: "elfo",
    resumen: "Su bosque ardió. Ella no perdona, pero sí apunta bien.",
    historia: "Los Susurrantes, el bosque donde naciste, ardieron una noche de verano sin explicación. Los árboles aún te hablan en sueños, y todos dicen lo mismo: «encuéntralos». Sigues un rastro de ceniza que conduce hacia los pueblos de los hombres... y hacia secretos que quizá no quieras conocer.",
    motivacion: "Descubrir quién quemó el bosque.", miedo: "Que la respuesta esté entre los tuyos.",
    virtudes: ["naturaleza", "sabiduria", "valentia", "lealtad"], defectos: ["orgullo", "violencia"], prohibido: ["codicia", "crueldad"],
    stats: { fue: 4, des: 8, int: 5, vol: 4 }, ataque: "des", crece: ["des", "vol"],
    arma: { n: "Arco de tejo", bono: 2 }, armadura: { n: "Capa de hojas", red: 1 },
    oro: 18, inv: { pocion: 2, vial: 1 },
    habilidades: [
      { id: "escarcha", n: "Flecha de escarcha", e: "❄️", coste: 4, tipo: "dano", elem: "hielo", mult: 1.6, stat: "des", desc: "Hielo ×1.6" },
      { id: "savia", n: "Savia viva", e: "🌿", coste: 4, tipo: "cura", base: 10, desc: "Te curas 10 + nivel" },
    ],
    entrada: "Hueles el humo de la chimenea y se te encoge el estómago. Aun así entras: hay rumores en las tabernas que los bosques jamás te contarán.",
  },
  {
    id: "rufo", nombre: "Rufo Cascabel", corto: "Rufo", apodo: "El Bardo Inmortal", emoji: "🎻",
    clase: "Bardo", raza: "mediano",
    resumen: "Sus canciones lo hacen héroe. Su cobardía, sensato. Él insiste en que ambas cosas son ciertas.",
    historia: "Has escrito diecisiete baladas sobre tus propias hazañas, y como mucho la mitad ocurrieron. Pero ahora, entre tabernas, empieza a pasar algo raro: la gente quiere oír la verdad... y la verdad exige que algún día hagas algo de lo que cantas. Tu única regla: una buena historia vale más que una vida tranquila (aunque no mucho más).",
    motivacion: "Vivir una historia digna de ser cantada.", miedo: "Que descubran que casi nunca has desenvainado la espada.",
    virtudes: ["humor", "curiosidad", "astucia", "generosidad"], defectos: ["cobardia", "engano", "codicia"], prohibido: ["crueldad", "violencia"],
    stats: { fue: 3, des: 6, int: 7, vol: 5 }, ataque: "des", crece: ["int", "vol"],
    arma: { n: "Laúd reforzado", bono: 1 }, armadura: { n: "Jubón de colores", red: 0 },
    oro: 35, inv: { pocion: 2, elixir: 1, escarcha: 1 },
    habilidades: [
      { id: "estrofa", n: "Estrofa hiriente", e: "🎶", coste: 3, tipo: "dano", elem: "sombra", mult: 1.6, stat: "int", seguro: true, desc: "Sombra ×1.6, nunca falla" },
      { id: "balada", n: "Balada valerosa", e: "🎵", coste: 4, tipo: "cura", base: 10, desc: "Te curas 10 + nivel" },
    ],
    entrada: "Afinas el laúd por costumbre. Alguien al fondo murmura que el bardo de las baladas es mucho más alto en las baladas.",
  },
];

/* ---------- escena inicial: La Jarra Tuerta ---------- */
const ESCENA_INICIAL = {
  id: "jarra",
  nombre: "La Jarra Tuerta",
  emoji: "🍺",
  tipo: "taberna",
  ambiente: "Chimenea, jarras y rumores",
  descripcion:
    "La lluvia golpea los postigos de La Jarra Tuerta mientras el fuego chisporrotea y una docena de borrachos discuten sobre quién ganó una guerra que nadie recuerda. El suelo es pegajoso, el techo es bajo y el aire huele a cerveza, humo y aventuras mal pagadas.",
  amenaza: null,
  servicios: { descanso: 8, tienda: true },
  salidas: [
    { texto: "Salir al Camino de los Cuervos", tipo: "camino" },
    { texto: "Ir al Bosque de las Hojas Susurrantes", tipo: "bosque" },
    { texto: "Bajar a la bodega polvorienta", tipo: "cripta" },
  ],
  npcs: [
    {
      clave: "brunilda", estilo: "tabernero", confianza: 1, nombre: "Brunilda «Barril» Piedragrís", raza: "enano", rol: "Tabernera de La Jarra Tuerta",
      personalidad: "Gruñona, maternal y capaz de contar el cambio exacto al ojo. Cobra por todo, incluso por mirar la chimenea. Odia a los goblins con un rencor de doscientos años.",
      habla: "Directa, con refranes enanos y juramentos por la barba de sus abuelos. Frases cortas y contundentes.",
      secreto: "Los goblins del granero viejo le robaron el Barril del Abuelo, el que lleva generaciones en la familia, y le da vergüenza admitir que no se atrevió a recuperarlo.",
      objetivo: "Recuperar el Barril del Abuelo sin tener que ensuciarse las manos.",
      sabe: ["Los goblins del Granero Viejo se están volviendo atrevidos.", "Hay lobos huargo rondando el Camino de los Cuervos."],
      conoce: ["goblin", "lobo"],
      rumores: [
        { t: "*resopla* Los goblins del granero viejo se han hecho con medio camino. Y con mi barril, ya que preguntas. Esos bichos temen más a un martillo que a un sermón.", h: "Goblins del Granero Viejo: roban en el camino (y se llevaron el barril de Brunilda)." },
        { v: "*entrecierra los ojos* Los lobos son cosa seria. Pero no suelto prenda sobre cómo espantarlos a quien aún no me ha pedido ni una cerveza.", t: "Cuidado con los lobos huargo: odian el fuego. Una antorcha o aceite ardiente y salen aullando, que se lo diga a mi primo Dorin.", h: "Lobos huargo: débiles al fuego.", rev: "lobo" },
      ],
      frases: ["¡Por la barba de mi abuelo! ¿Vas a pedir algo o solo a gastar mi aire?", "Aquí se paga antes de morir, que luego nadie liquida.", "*frota una jarra con un trapo que ha visto épocas mejores* Habla, que el tiempo es cerveza."],
      gancho: {
        titulo: "El barril del abuelo",
        resumen: "Brunilda quiere recuperar su barril ancestral, robado por los goblins del Granero Viejo. Derrota a 2 goblins.",
        tipo: "combate", dif: 1, objetivo: { monstruo: "goblin", cant: 2 },
        cierre: "*se le humedecen los ojos un segundo y lo disimula limpiando una jarra* ¡Mi barril! Por la barba de mi abuelo... Bebida de la casa para ti, {jugador}. Y ni se te ocurra decir que me has visto llorar.",
        dialogo: "*se inclina sobre la barra* Escucha. Unos goblins del granero viejo me robaron el Barril del Abuelo. Tráeme a esos ladronzuelos hechos puré y te pago bien.",
      },
    },
    {
      clave: "tobias", estilo: "poeta", confianza: 0, nombre: "Tobías Medianoche", raza: "mediano", rol: "Cuentacuentos y borracho de la casa",
      personalidad: "Dramático, exagerado y mucho más listo de lo que aparenta. Narra cada anécdota como si fuera el fin del mundo; a veces lo es.",
      habla: "Susurra para añadir misterio, hace pausas largas y da diez rodeos antes del dato importante.",
      secreto: "Es el último descendiente de los Guardianes de la Cripta de Vael y teme volver a pisarla. Sabe cómo se abre y cómo se vuelve a cerrar.",
      objetivo: "Que alguien descifre el acertijo de la lápida de Vael para saber si lo que oye por las noches es real.",
      sabe: ["La Cripta de Vael está bajo las ruinas del norte y la custodian esqueletos y espectros.", "Los espectros no soportan la luz sagrada.", "El acertijo de la lápida de Vael dice: «Tengo ciudades sin casas, montañas sin árboles y agua sin peces. ¿Qué soy?»"],
      conoce: ["esqueleto", "espectro"],
      rumores: [
        { v: "*se pone pálido* De los espectros... mejor no hablar sin una buena jarra delante. ¿Eres de fiar?", t: "*baja la voz* En la Cripta de Vael hay muertos que no se cansan de caminar... A los espectros solo los espanta la luz sagrada. Lo sé de buena fuente: la fuente era yo, borracho.", h: "Espectros: débiles a lo sagrado.", rev: "espectro" },
        { v: "Los esqueletos de la cripta... bah, historias. Pídeme otra jarra y quizá se me suelte la lengua.", t: "Dicen que los esqueletos guardianes se desmoronan con agua bendita. Yo nunca lo he probado, por supuesto. Tengo vértigo a las cosas con huesos.", h: "Esqueletos: débiles a lo sagrado.", rev: "esqueleto" },
      ],
      frases: ["*alza la jarra* Hay historias que solo se cuentan a partir de la tercera.", "Una vez vi un dragón... bueno, un lagarto grande. Pero tenía actitud de dragón.", "*se le cae la jarra y la atrapa en el aire* ¡Reflejos de héroe!"],
      gancho: {
        titulo: "El acertijo de la lápida",
        resumen: "Tobías copió el acertijo de la lápida de la Cripta de Vael: «Tengo ciudades sin casas, montañas sin árboles y agua sin peces. ¿Qué soy?». Respóndelo en tu Mochila → Misiones.",
        tipo: "enigma", dif: 1,
        objetivo: { pregunta: "Tengo ciudades sin casas, montañas sin árboles y agua sin peces. ¿Qué soy?", respuestas: ["mapa"], pista: "Piensa en algo que puedes desplegar sobre una mesa." },
        cierre: "*abre mucho los ojos y se tambalea de alegría* ¡Un mapa! ¡Claro que era un mapa! Ciudades sin casas, montañas sin árboles... ¡Y yo dándole vueltas desde hace semanas! Brindemos, {jugador}, que me has quitado un peso.",
        dialogo: "*se inclina en un susurro* ¿Ves esto? Lo copié de la lápida de Vael. Dice: «Tengo ciudades sin casas, montañas sin árboles y agua sin peces. ¿Qué soy?». Si lo resuelves, quizá dejen de visitarme en sueños.",
      },
    },
    {
      clave: "sylwen", estilo: "cazador", confianza: 2, nombre: "Sylwen Hojanegra", raza: "elfo", rol: "Cazarrecompensas herida",
      personalidad: "Seca, sarcástica y muy cansada. Cobra por adelantado y no perdona la impuntualidad. Bajo la coraza hay alguien que también perdió algo.",
      habla: "Frases cortas, ironía fina, ni un adjetivo de más. Odia que le hagan perder el tiempo.",
      secreto: "La herida del costado se la hizo el Troll del Puente Roto, y por eso no puede cobrar su recompensa. Está demasiado orgullosa para pedir ayuda.",
      objetivo: "Que alguien acabe con el Troll del Puente Roto.",
      sabe: ["El Troll del Puente Roto se regenera cada turno, pero el fuego detiene su regeneración y le duele el doble.", "En las cumbres anida una wyvern."],
      conoce: ["troll", "ogro", "wyvern"],
      rumores: [
        { v: "No regalo información. Gánate un poco de mi confianza y hablamos del troll.", t: "El troll del Puente Roto se regenera como si le pagaran por ello. Fuego. Nada más funciona. *toca su costado herido* Lo digo por experiencia.", h: "Troll: se regenera, pero el fuego lo frena y le hace el doble.", rev: "troll" },
        { v: "Los ogros... *aprieta la mandíbula* Otro día. Primero demuéstrame que no eres una pérdida de tiempo.", t: "Los ogros tienen mal estómago. Un buen veneno les destroza mejor que cualquier espada.", h: "Ogros: débiles al veneno.", rev: "ogro" },
      ],
      frases: ["No tengo tiempo para charlas. Ni tampoco ganas.", "*sin levantar la vista* Si vas a hablar, que merezca la pena.", "Los héroes duran poco. Los que cobran por adelantado, más."],
      gancho: {
        titulo: "El peaje del troll",
        resumen: "El Troll del Puente Roto hirió a Sylwen y bloquea el camino. Derrótalo (nivel recomendado: 3).",
        tipo: "combate", dif: 2, objetivo: { monstruo: "troll", cant: 1 },
        cierre: "*asiente despacio, sin sonreír del todo* El troll está muerto. Bien. Te debo la mitad de la recompensa y algo más difícil de dar: respeto. No te acostumbres.",
        dialogo: "*se aprieta el costado* Hay un troll en el Puente Roto. Me dejó así. Mátalo y te doy la mitad de la recompensa. No me discutas el reparto.",
      },
    },
  ],
};

/* ---------- plantillas para el modo demo (sin IA) ---------- */
const PLANTILLAS_ESCENA = [
  { tipo: "camino", emoji: "🛤️", nombre: "El Camino de los Cuervos", ambiente: "Viento, polvo y graznidos", descripcion: "Un camino embarrado serpentea entre campos baldíos. Una bandada de cuervos te observa desde un poste torcido con la actitud de quien sabe cómo termina la historia.", amenazas: ["lobo", "goblin"], salidas: ["Seguir hasta el Puente Roto", "Desviarte hacia las ruinas del norte", "Volver a la taberna"], npcPool: ["viajero", "cazadora"] },
  { tipo: "bosque", emoji: "🌲", nombre: "Bosque de las Hojas Susurrantes", ambiente: "Luz verde y raíces traicioneras", descripcion: "Los árboles se inclinan unos hacia otros como chismosos. La luz se cuela en hilos dorados y, a lo lejos, algo con muchas patas se mueve entre los troncos.", amenazas: ["arana", "lobo", "goblin"], salidas: ["Adentrarte en la espesura", "Seguir el arroyo", "Volver al camino"], npcPool: ["ermitana", "cazadora"] },
  { tipo: "ruinas", emoji: "🏚️", nombre: "Ruinas del Fuerte Olvidado", ambiente: "Piedras caídas y ecos", descripcion: "Los muros del antiguo fuerte se desmoronan en silencio. Las banderas son jirones y, en el patio, huesos recientes sugieren que alguien (o algo) sigue de guardia.", amenazas: ["esqueleto", "goblin", "espectro"], salidas: ["Entrar en la cripta", "Rodear la muralla", "Volver al camino"], npcPool: ["minero", "orco"] },
  { tipo: "cripta", emoji: "⚰️", nombre: "Cripta de Vael", ambiente: "Frío, polvo y susurros", descripcion: "La escalera desciende hasta una sala de sarcófagos. Las antorchas se encienden solas, lo que no tranquiliza. En la lápida central alguien grabó un acertijo con muy mala letra.", amenazas: ["esqueleto", "espectro"], salidas: ["Seguir hacia la cámara interior", "Subir a la superficie"], npcPool: ["orco"] },
  { tipo: "puente", emoji: "🌉", nombre: "El Puente Roto", ambiente: "Agua oscura y olor a cueva", descripcion: "Un puente de piedra partido por la mitad cruza el río. Un cartel torcido dice «PEAJE: TODO LO QUE LLEVES». Debajo del arco algo enorme respira.", amenazas: ["troll"], salidas: ["Cruzar por las piedras", "Volver al camino"], npcPool: ["viajero"] },
  { tipo: "cantina", emoji: "🍻", nombre: "La Cantina del Gnomo Cojo", ambiente: "Música desafinada y apuestas", descripcion: "Una cantina cutre en el cruce de caminos. Un gnomo cojo sirve jarras mientras un tablón de apuestas anuncia combates de ranas. Huele a sopa de dudosa procedencia.", amenazas: [], salidas: ["Volver al camino", "Ir hacia el bosque"], npcPool: ["viajero", "orco", "minero"], servicios: { descanso: 6, tienda: true } },
  { tipo: "montana", emoji: "⛰️", nombre: "Paso de las Cumbres Heladas", ambiente: "Viento y cielo enorme", descripcion: "El sendero se estrecha entre riscos nevados. Hay plumas del tamaño de un brazo y huesos roídos en las rocas. Algo grande te vigila desde arriba.", amenazas: ["ogro", "wyvern"], salidas: ["Subir hacia el nido", "Bajar al valle"], npcPool: ["minero", "cazadora"] },
];

const NPC_POOL = {
  viajero: {
    clave: "viajero", estilo: "mercader", confianza: 1, nombre: "Ferdinand Alforja", raza: "humano", rol: "Buhonero de camino", personalidad: "Hablador, interesado y con una mercancía sospechosa.", habla: "Rápido, entusiasta, siempre con una oferta.",
    secreto: "Sus «reliquias» las fabrica en el sótano.", objetivo: "Hacer llegar un recado a Brunilda en La Jarra Tuerta.",
    sabe: ["Hay goblins en el granero viejo."], conoce: ["goblin", "lobo"],
    rumores: [{ t: "Ayer vi goblins con un barril enorme. Un barril con una familia grabada. Raro, ¿no? Y yo que pensaba que solo robaban cucharas.", h: "Goblins con un barril robado cerca del camino." }],
    frases: ["¡Todo lo que ves está en oferta! Bueno, casi todo.", "*abre su capa llena de cachivaches* ¿Una pata de conejo? Es de un conejo grande."],
    gancho: { titulo: "Un recado para Brunilda", resumen: "Ferdinand quiere que le digas a Brunilda, en La Jarra Tuerta, que sus botellas llegarán mañana.", tipo: "hablar", dif: 1, objetivo: { npc: "Brunilda" }, cierre: "*aplaude* ¡Sabía que se lo dirías! Le das mucha tranquilidad a un buhonero, amigo. Toma esto por las molestias.",
        dialogo: "Mira, amigo, ¿podrías decirle a Brunilda, la de La Jarra Tuerta, que sus botellas llegarán mañana? Yo no puedo acercarme: es complicado." },
  },
  ermitana: {
    clave: "ermitana", estilo: "sabio", confianza: 1, nombre: "Maestra Ilvanna", raza: "elfo", rol: "Ermitaña del bosque", personalidad: "Serena, algo condescendiente, aficionada a los acertijos.", habla: "Pausada y poética; remata cada frase con una pregunta.",
    secreto: "Fue maestra en la Torre de Cristal antes de perder la fe en ella.", objetivo: "Encontrar a alguien con ingenio suficiente para su acertijo.",
    sabe: ["Las arañas de las cuevas temen al fuego."], conoce: ["arana"],
    rumores: [{ v: "Las arañas tienen un punto débil, claro. ¿Lo comparto con alguien a quien apenas conozco? Hmm.", t: "Las arañas tejen con fuego en la mente. Una chispa y huyen despavoridas. ¿No te parece justo?", h: "Arañas: débiles al fuego.", rev: "arana" }],
    frases: ["*sonríe con calma* El bosque te escucha. ¿Tú a él?", "Los apresurados rara vez encuentran lo que buscan. ¿Y tú?"],
    gancho: { titulo: "El acertijo de la ermitaña", resumen: "Ilvanna propone: «Cuanto más me quitas, más grande me hago. ¿Qué soy?».", tipo: "enigma", dif: 1, objetivo: { pregunta: "Cuanto más me quitas, más grande me hago. ¿Qué soy?", respuestas: ["agujero", "hoyo"], pista: "Piensa en algo que cavas." }, cierre: "*asiente con serenidad* Un agujero. Cuanto más quitas, más grande. Piensas con claridad, {jugador}. Eso es más raro que el oro.",
        dialogo: "*sonríe* Te propongo un juego: «Cuanto más me quitas, más grande me hago». ¿Qué soy?" },
  },
  minero: {
    clave: "minero", estilo: "artesano", confianza: 1, nombre: "Durgan Picohondo", raza: "enano", rol: "Minero sin mina", personalidad: "Cabezota, leal y obsesionado con los pasillos subterráneos.", habla: "Corto y gutural. Habla de piedras como otros hablan de hijos.",
    secreto: "Su mina fue tomada por arañas gigantes y no se atreve a contarlo.", objetivo: "Despejar de arañas su mina.",
    sabe: ["Las arañas odian el fuego."], conoce: ["arana", "goblin"],
    rumores: [{ v: "Mi mina... *gruñe* No es tema para extraños. Hazte útil y hablamos.", t: "Mi mina estaba llena de arañas. Les eché una antorcha y salieron como cucarachas... Y volvieron peor. Pero el fuego duele, lo sé.", h: "Arañas: el fuego les hace el doble.", rev: "arana" }],
    frases: ["Las piedras no mienten. Las arañas sí.", "*golpea la pared con el nudillo* Buena roca."],
    gancho: { titulo: "Las arañas de la mina", resumen: "Durgan quiere que elimines a una araña gigante de su mina (nivel recomendado: 2).", tipo: "combate", dif: 2, objetivo: { monstruo: "arana", cant: 1 }, cierre: "*se frota las manos callosas* Las piedras vuelven a respirar. Gracias, {jugador}. Eso no se paga con oro, pero el oro ayuda.",
        dialogo: "Mi mina está infestada de arañas. Mata a una de las grandes y te pago bien. Las piedras ya no me dejan dormir." },
  },
  orco: {
    clave: "orco", estilo: "poeta", confianza: 1, nombre: "Grakk el Pensativo", raza: "orco", rol: "Orco poeta errante", personalidad: "Melancólico, educado y muy sensible. Sospecha de quien lo trata como a un bruto.", habla: "Lento y solemne; compone versos sin querer.",
    secreto: "Es el heredero de una tribu y huyó para escribir poesía.", objetivo: "Encontrar a alguien que escuche sus versos hasta el final.",
    sabe: ["Los esqueletos guardianes caen con agua bendita."], conoce: ["esqueleto", "espectro"],
    rumores: [{ v: "Sé cosas de los espectros. Pero son versos largos, y no me fío de quien no me ha dedicado ni un silencio.", t: "Oí que los espectros huyen de lo sagrado. Es hermoso, ¿verdad? La luz como respuesta a todo. *suspira*", h: "Espectros: débiles a lo sagrado.", rev: "espectro" }],
    frases: ["*suspira como un fuelle* La vida es una balada que nadie termina.", "No todos los orcos rugen. Algunos solo... rimamos."],
    gancho: { titulo: "Esqueletos molestos", resumen: "Grakk no puede concentrarse con tanto esqueleto. Derrota a 2 (nivel recomendado: 2).", tipo: "combate", dif: 2, objetivo: { monstruo: "esqueleto", cant: 2 }, cierre: "*suspira aliviado* El silencio. Por fin. Te debo un poema de cinco estrofas, {jugador}. Y créeme, es un honor terrible.",
        dialogo: "Los esqueletos de la cripta no me dejan componer en paz. Haz que callen, y te escribo un poema de cinco estrofas." },
  },
  cazadora: {
    clave: "cazadora", estilo: "cazador", confianza: 1, nombre: "Marta la Tuerta", raza: "humano", rol: "Cazadora veterana", personalidad: "Práctica, sin rodeos y con un humor negrísimo.", habla: "Frases cortas con anécdotas macabras.",
    secreto: "Perdió el ojo contra un lobo huargo y aún lo respeta.", objetivo: "Reducir la manada de lobos del camino.",
    sabe: ["Los lobos huargo huyen del fuego."], conoce: ["lobo", "goblin"],
    rumores: [{ v: "Un lobo me quitó un ojo. Cómo pararlos se lo cuento a quien se lo gane, forastero.", t: "Un lobo huargo te arranca un ojo y te enseña lo que vale la prudencia. El fuego los espanta, apunta ese consejo.", h: "Lobos huargo: débiles al fuego.", rev: "lobo" }],
    frases: ["Los lobos no son el problema. El problema es tu puntería.", "*se toca el parche* Todo tiene su precio."],
    gancho: { titulo: "La manada del camino", resumen: "Marta quiere que acabes con 2 lobos huargo del camino.", tipo: "combate", dif: 1, objetivo: { monstruo: "lobo", cant: 2 }, cierre: "*se toca el parche y esboza media sonrisa* Menos lobos en el camino. Buen trabajo, {jugador}. Se nota que sabes lo que haces.",
        dialogo: "Hay una manada rondando el camino. Mata a dos y cobras de mi bolsa. ¿Trato hecho?" },
  },
};
