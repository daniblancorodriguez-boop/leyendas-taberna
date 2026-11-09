"use strict";
/* =========================================================
   LEYENDAS DE LA TABERNA · motor de conversación local
   Sin IA: puntúa temas por palabras clave, detecta monstruos, lugares,
   razas y personajes, aplica condiciones (actitud, hazañas, misiones) y
   recuerda lo que cada NPC ya ha dicho. El contenido vive en contenido.js.
   ========================================================= */

/* ---------- vocabulario ---------- */
const ALIAS_MON = {
  goblin: ["goblin", "goblins", "trasgo", "trasgos"],
  lobo: ["lobo", "lobos", "huargo", "huargos", "manada"],
  esqueleto: ["esqueleto", "esqueletos", "huesos", "no muerto", "no muertos"],
  arana: ["arana", "aranas", "aracnido"],
  troll: ["troll", "trolls"],
  espectro: ["espectro", "espectros", "fantasma", "fantasmas", "aparicion"],
  ogro: ["ogro", "ogros"],
  wyvern: ["wyvern", "wyverns", "dragon", "dragones", "dragona", "dragonete"],
};
const ALIAS_LUGAR = {
  camino: ["camino", "cuervos", "carretera", "calzada"],
  bosque: ["bosque", "bosques", "susurrantes", "arboleda", "selva"],
  cripta: ["cripta", "vael", "tumba", "tumbas", "bodega", "sarcofago", "sarcofagos"],
  granero: ["granero", "granja"],
  puente: ["puente", "peaje"],
  montana: ["montana", "montanas", "cumbre", "cumbres", "nido", "riscos"],
  ruinas: ["ruinas", "fuerte", "muralla"],
  mina: ["mina", "minas", "galeria", "galerias"],
  taberna: ["taberna", "jarra tuerta", "posada", "cantina"],
};
const ALIAS_RAZA = {
  elfo: ["elfo", "elfos", "elfa", "elfas"],
  enano: ["enano", "enanos", "enana", "enanas"],
  orco: ["orco", "orcos"],
  humano: ["humano", "humanos", "humana", "humanas"],
  mediano: ["mediano", "medianos", "mediana", "halfling", "halflings"],
};
const NOMBRES_IGNORADOS = ["maestra", "tuerta", "pensativo", "alforja"];
const ALIAS_NPC = (() => {
  const o = {};
  const todos = [].concat(ESCENA_INICIAL.npcs, Object.values(NPC_POOL));
  for (const n of todos) {
    if (!n.clave) continue;
    const base = n.nombre.replace(/«[^»]*»/g, "").replace(/"[^"]*"/g, "");
    o[n.clave] = norm(base).split(" ").filter((w) => w.length >= 4 && !NOMBRES_IGNORADOS.includes(w));
  }
  return o;
})();

/* ---------- temas: k = palabras clave (raíces sin tilde); p = prioridad ---------- */
const TEMAS = {
  insulto: { p: 9, k: ["idiota", "imbecil", "estupid", "inutil", "asqueros", "basura", "payaso", "tonto", "cretino", "maldit", "callate", "te odio", "vete al", "gordo", "feo"] },
  amenaza: { p: 9, k: ["te mato", "te voy a matar", "te rajo", "te deguello", "desenvaino", "saco la espada", "te reto", "pelea", "te golpeo", "te pego", "prepara tu fin", "te destripo", "muere"] },
  despedida: { p: 6, k: ["adios", "hasta luego", "hasta pronto", "hasta la vista", "me voy", "nos vemos", "chao", "me marcho", "tengo que irme", "me despido"] },
  saludo: { p: 3, exacto: true, k: ["hola", "buenas", "saludos", "ey", "hey", "salud", "buenos dias", "buenas tardes", "buenas noches", "que tal", "buen dia"] },
  mision: { p: 5, k: ["mision", "encargo", "trabajo", "tarea", "recompensa", "ayuda", "ayudarte", "problema", "necesitas", "necesitais", "algo que hacer", "que puedo hacer", "busco trabajo", "se te ofrece", "aventura"] },
  progreso: { p: 6, k: ["como va", "como vas", "ya lo hice", "ya esta", "lo consegui", "cumpli", "termine", "acabe", "he vuelto", "ya volvi", "mision cumplida", "hecho el encargo", "lo logre"] },
  rumores: { p: 4, k: ["rumor", "noticia", "novedad", "que se cuenta", "que se dice", "que cuentan", "que pasa", "sabes algo", "algo interesante", "chisme", "cotilleo", "oiste", "que hay de nuevo", "habladurias", "leyenda"] },
  info: { p: 3, k: ["que sabes de", "hablame de", "cuentame sobre", "cuentame de", "sabes algo de", "que me dices de", "que opinas de", "que piensas de", "conoces a", "has oido hablar de", "que sabes sobre", "dime algo de", "informacion"] },
  monstruo: { p: 4, k: ["monstruo", "bestia", "criatura", "peligro", "debilidad", "punto debil", "como matar", "como derroto", "como vencer", "enemigo", "amenaza", "combatir", "luchar", "bichos"] },
  sobre_npc: { p: 4, k: ["quien eres", "quien sois", "tu historia", "tu pasado", "cuentame de ti", "hablame de ti", "a que te dedicas", "de donde eres", "tu vida", "como te llamas", "que haces aqui", "tu nombre", "sobre ti", "de ti"] },
  secreto: { p: 4, k: ["secreto", "ocultas", "escondes", "esconder", "algo que no cuentas", "confiesa", "me ocultas", "tu verdad"] },
  hazanas: { p: 6, k: ["has oido algo de mi", "sabes de mi", "me conoces", "que dicen de mi", "oido hablar de mi", "has oido de mi", "hazana", "mis proezas", "sabes quien soy", "que has oido de mi", "sobre mi", "de mi"] },
  yo: { p: 3, exacto: true, k: ["soy", "llamo", "vengo", "busco", "mi nombre", "mi historia", "me llaman"] },
  servicios: { p: 3, k: ["cerveza", "bebida", "beber", "comer", "comida", "posada", "cuarto", "dormir", "descansar", "tienda", "comprar", "vender", "precio", "cuanto cuesta", "pocion", "aceite", "habitacion", "cama", "vender"] },
  dinero: { p: 2, k: ["descuento", "regatear", "barato", "caro", "te pago", "oro", "monedas", "fiado", "deuda", "dinero"] },
  amable: { p: 3, k: ["gracias", "por favor", "eres genial", "eres increible", "te aprecio", "buen trabajo", "encantado", "un placer", "mucho gusto", "eres muy amable", "amable"] },
  broma: { p: 2, k: ["chiste", "broma", "jaja", "jeje", "gracioso", "reir", "cuentame algo gracioso"] },
  afirmar: { p: 2, exacto: true, k: ["si", "vale", "claro", "acepto", "trato", "ok", "hecho", "de acuerdo"] },
  negar: { p: 2, exacto: true, k: ["no", "nunca", "jamas", "rechazo", "paso"] },
};

/* etiquetas de actitud (XP) que implica cada tema; la IA no interviene */
const TEMA_TAGS = {
  sobre_npc: ["curiosidad"], secreto: ["curiosidad"], rumores: ["curiosidad"], monstruo: ["curiosidad"], lugar: ["curiosidad"],
  npc: ["curiosidad"], raza: ["curiosidad"], amable: ["generosidad"], broma: ["humor"], amenaza: ["violencia"], insulto: ["crueldad"], hazanas: ["orgullo"],
};

/* ---------- utilidades ---------- */
function estiloDe(npc) {
  if (npc.estilo) return npc.estilo;
  const r = norm(npc.rol || "");
  if (/tabern|posad|cantin|mesonero/.test(r)) return "tabernero";
  if (/mercader|buhon|vendedor|comerciante|tendero/.test(r)) return "mercader";
  if (/ermit|sabi|mago|maga|erudit|alquimist|clerig|sacerdot|bruj|druid/.test(r)) return "sabio";
  if (/herrer|miner|artesan|carpinter|constructor|forjador/.test(r)) return "artesano";
  if (/poeta|bardo|cuentacuentos|trovador|juglar/.test(r)) return "poeta";
  if (/caz|guard|soldad|mercenar|rastread|explorador|vigilante/.test(r)) return "cazador";
  return "generico";
}

function memoriaNPC(npc) {
  const m = (npc.mem = npc.mem || {});
  m.temas = m.temas || {};
  m.usadas = m.usadas || {};
  m.reaccionadas = m.reaccionadas || [];
  m.ganado = m.ganado || {};
  m.rumUsados = m.rumUsados || [];
  m.cierres = m.cierres || [];
  m.turno = m.turno || 0;
  m.noEntiende = m.noEntiende || 0;
  return m;
}

function nombreCorto(npc) {
  return String(npc.nombre || "").replace(/«[^»]*»/g, "").replace(/\s+/g, " ").trim().split(" ")[0] || "el desconocido";
}

/* ¿conoce este NPC esa hazaña? Los testigos y el que dio la misión, al instante; el resto, según se extiende la noticia. */
function sabeHazana(npc, h, s) {
  if (h.giverId && h.giverId === npc.id) return true;
  if (h.lugar && s.escena && h.lugar === s.escena.nombre) return true;
  const dif = h.dif || 0;
  if (h.peso >= 3) return true;
  if (h.peso === 2) return dif >= 1;
  return dif >= 2;
}
function hazanasConocidas(npc, s) {
  return (s.hazanas || []).filter((h) => sabeHazana(npc, h, s));
}
function textoHazanasIA(npc, s) {
  const lista = hazanasConocidas(npc, s).sort((a, b) => b.peso - a.peso).slice(0, 5);
  return lista.length ? lista.map((h) => "- " + h.texto).join("\n") : "- ninguna todavía";
}

function progresoTexto(q) {
  if (q.tipo === "combate") {
    const b = BESTIARIO[q.objetivo.monstruo];
    const falta = Math.max(0, q.objetivo.cant - q.objetivo.hechas);
    return `${falta} × ${b.n} por derrotar`;
  }
  if (q.tipo === "hablar") return `hablar con ${q.objetivo.npc}`;
  return `el acertijo «${q.objetivo.pregunta}»`;
}

/* ---------- contexto de una conversación ---------- */
function ctxDe(npc, texto, s) {
  const mem = memoriaNPC(npc);
  const pj = PERSONAJES.find((p) => p.id === s.pj);
  const q = npc.gancho ? s.misiones.find((m) => m.titulo === npc.gancho.titulo) : null;
  const conf = npc.confianza === undefined ? 1 : npc.confianza;
  return {
    s, npc, mem, pj, texto, q, conf,
    estilo: estiloDe(npc), clave: npc.clave || null,
    haz: hazanasConocidas(npc, s),
    mDisp: !!npc.gancho && !q, mActiva: !!q && q.estado === "activa", mHecha: !!q && q.estado === "completada",
    confiado: npc.actitud >= conf,
  };
}

function coincideHazana(h, spec) {
  const [tipo, clave] = String(spec).split(":");
  return h.tipo === tipo && (!clave || h.clave === clave);
}

/* condiciones de una entrada de contenido */
function cumple(c, x) {
  if (!c) return true;
  const n = x.npc, s = x.s;
  if (c.actMin !== undefined && n.actitud < c.actMin) return false;
  if (c.actMax !== undefined && n.actitud > c.actMax) return false;
  if (c.pj && ![].concat(c.pj).includes(s.pj)) return false;
  if (c.raza && ![].concat(c.raza).includes(x.pj.raza)) return false;
  if (c.nivelMin !== undefined && s.nivel < c.nivelMin) return false;
  if (c.nivelMax !== undefined && s.nivel > c.nivelMax) return false;
  if (c.hazana && !x.haz.some((h) => [].concat(c.hazana).some((sp) => coincideHazana(h, sp)))) return false;
  if (c.sinHazana && x.haz.some((h) => [].concat(c.sinHazana).some((sp) => coincideHazana(h, sp)))) return false;
  if (c.mDisp !== undefined && c.mDisp !== x.mDisp) return false;
  if (c.mActiva !== undefined && c.mActiva !== x.mActiva) return false;
  if (c.mHecha !== undefined && c.mHecha !== x.mHecha) return false;
  if (c.confiado !== undefined && c.confiado !== x.confiado) return false;
  if (c.turnoMin !== undefined && x.mem.turno < c.turnoMin) return false;
  if (c.primera !== undefined && c.primera !== (x.mem.turno === 1)) return false;
  if (c.rasgo && (s.rasgos[c.rasgo[0]] || 0) < c.rasgo[1]) return false;
  if (c.escena && !norm(s.escena.tipo + " " + s.escena.nombre).includes(norm(c.escena))) return false;
  return true;
}

const monNombre = (id) => (BESTIARIO[id] ? BESTIARIO[id].n : "");
const lugarNombre = { camino: "el Camino de los Cuervos", bosque: "el bosque", cripta: "la Cripta de Vael", granero: "el Granero Viejo", puente: "el Puente Roto", montana: "las cumbres", ruinas: "las ruinas", mina: "la mina", taberna: "la taberna" };

function rellenar(t, x, extra = {}) {
  const pj = x.pj, s = x.s;
  const v = Object.assign({
    jugador: pj.corto, apodo: pj.apodo, clase: pj.clase.toLowerCase(), raza: RAZAS[pj.raza].n.replace(/s$/, "").toLowerCase(),
    npc: nombreCorto(x.npc), titulo: x.q ? x.q.titulo : "", progreso: x.q ? progresoTexto(x.q) : "",
    nivel: s.nivel, oro: s.oro, descanso: s.escena.servicios ? s.escena.servicios.descanso : 8, pocion: OBJETOS.pocion.precio,
    lugar: s.escena.nombre,
  }, extra);
  return String(t).replace(/\{(\w+)\}/g, (m, k) => (v[k] === undefined || v[k] === null ? "" : v[k]));
}

/* ---------- búsqueda de contenido por capas: NPC → arquetipo → genérico ---------- */
function capas(x) {
  return [["n", x.clave && CONT[x.clave]], ["a", ARQ[x.estilo]], ["g", ARQ.generico]];
}
function capa(x, key, soloNPC) {
  for (const [id, def] of capas(x)) {
    if (!def || (soloNPC && id !== "n")) continue;
    const arr = def.temas && def.temas[key];
    if (!arr) continue;
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      if (!cumple(e.c, x)) continue;
      const idu = `${id}|${x.clave || x.estilo}|${key}|${i}`;
      if (e.una && x.mem.usadas[idu]) continue;
      return { e, id: idu, key };
    }
  }
  return null;
}
function primeraCapa(x, claves, soloNPC) {
  for (const k of claves) {
    const h = capa(x, k, soloNPC);
    if (h) return h;
  }
  return null;
}
function usar(x, hit, extra) {
  const n = x.mem.usadas[hit.id] || 0;
  x.mem.usadas[hit.id] = n + 1;
  return rellenar(hit.e.t[n % hit.e.t.length], x, extra);
}
function linea(x, key, extra) {
  const h = capa(x, key);
  return h ? usar(x, h, extra) : "";
}
/* devuelve {texto, e} de un tema (o null) */
function decir(x, claves, extra) {
  const h = primeraCapa(x, [].concat(claves));
  return h ? { texto: usar(x, h, extra), e: h.e } : null;
}

/* ---------- puntuación de temas y detección de parámetros ---------- */
function puntuarTemas(texto) {
  const toks = norm(texto).split(" ").filter(Boolean);
  const t = " " + toks.join(" ") + " ";
  const sc = {};
  for (const [tema, d] of Object.entries(TEMAS)) {
    let p = 0;
    for (const k of d.k) {
      if (k.includes(" ")) {
        if (t.includes(" " + k + " ")) p += 3;
      } else if (toks.includes(k)) p += 3;
      else if (!d.exacto && k.length >= 4 && toks.some((tk) => tk.startsWith(k))) p += 2;
    }
    if (p) sc[tema] = p;
  }
  return sc;
}

function detectarParams(texto) {
  const toks = norm(texto).split(" ").filter(Boolean);
  const t = " " + toks.join(" ") + " ";
  const has = (al) => al.some((a) => (a.includes(" ") ? t.includes(" " + a + " ") : toks.includes(a)));
  const P = {};
  for (const [id, al] of Object.entries(ALIAS_NPC)) if (has(al)) { P.npc = id; break; }
  for (const [id, al] of Object.entries(ALIAS_MON)) if (has(al)) { P.mon = id; break; }
  for (const [id, al] of Object.entries(ALIAS_LUGAR)) if (has(al)) { P.lugar = id; break; }
  for (const [id, al] of Object.entries(ALIAS_RAZA)) if (has(al)) { P.raza = id; break; }
  return P;
}

function elegirTema(texto, x) {
  const sc = puntuarTemas(texto);
  const P = detectarParams(texto);
  const orden = Object.keys(sc).sort((a, b) => sc[b] + TEMAS[b].p * 0.1 - (sc[a] + TEMAS[a].p * 0.1));
  const mejor = orden[0] || null;
  if (mejor === "insulto" || mejor === "amenaza") return { tema: mejor, P };
  if ([null, "info", "monstruo", "rumores", "saludo", "afirmar", "negar", "sobre_npc"].includes(mejor)) {
    if (P.npc && P.npc === x.clave) return { tema: "sobre_npc", P };
    if (P.npc) return { tema: "npc", param: P.npc, P };
    if (P.mon) return { tema: "monstruo", param: P.mon, P };
    if (P.lugar) return { tema: "lugar", param: P.lugar, P };
    if (P.raza && mejor !== "sobre_npc") return { tema: "raza", param: P.raza, P };
  }
  if (mejor === "info") return { tema: "rumores", P };
  return { tema: mejor, P };
}

/* ---------- reacciones a hazañas ---------- */
function reaccionHazana(x, h) {
  const claves = [`${h.tipo}:${h.clave}`, h.tipo];
  const extra = { monstruo: h.tipo === "victoria" || h.tipo === "huida" || h.tipo === "derrota" ? monNombre(h.clave) : "", titulo: h.tipo === "mision" ? h.clave : "", rasgo: h.tipo === "rasgo" && FAMA[h.clave] ? FAMA[h.clave][0] : "", nivelH: h.tipo === "nivel" ? h.clave : "", lugarH: h.lugar || "" };
  const fuentes = [x.clave && CONT[x.clave] && CONT[x.clave].hazanas, ARQ[x.estilo] && ARQ[x.estilo].hazanas];
  for (const f of fuentes) {
    if (!f) continue;
    for (const k of claves) {
      if (f[k] && f[k].length) {
        const id = `hz|${x.clave || x.estilo}|${k}`;
        const n = x.mem.usadas[id] || 0;
        x.mem.usadas[id] = n + 1;
        return rellenar(f[k][n % f[k].length], x, extra);
      }
    }
  }
  for (const k of claves) {
    const g = REACC[k];
    if (!g) continue;
    const arr = g[x.estilo] || g["*"];
    if (arr && arr.length) {
      const id = `hzg|${x.estilo}|${k}`;
      const n = x.mem.usadas[id] || 0;
      x.mem.usadas[id] = n + 1;
      return rellenar(arr[n % arr.length], x, extra);
    }
  }
  return "";
}

function textoCierre(npc, titulo, s) {
  const x = ctxDe(npc, "", s);
  if (npc.gancho && npc.gancho.titulo === titulo && npc.gancho.cierre) return rellenar(npc.gancho.cierre, x, { titulo });
  return linea(x, "cierre_mision", { titulo }) || `Gracias por lo de «${titulo}», ${x.pj.corto}.`;
}

/* ---------- temas con lógica propia ---------- */
function temaMision(x) {
  const { npc, s } = x;
  if (npc.actitud <= -3) return decir(x, "hostil");
  if (!npc.gancho) return decir(x, "sin_mision");
  if (x.mHecha) return decir(x, "mision_hecha") || decir(x, "mision_activa");
  if (x.mActiva) return decir(x, "mision_activa");
  if (s.misiones.filter((m) => m.estado === "activa").length >= 3) return decir(x, "demasiadas_misiones");
  const prev = x.mem.usadas["oferta"] || 0;
  x.mem.usadas["oferta"] = prev + 1;
  const g = npc.gancho;
  const re = prev > 0 ? linea(x, "oferta_repetida", { titulo: g.titulo }) : "";
  return { texto: (re ? re + "\n" : "") + rellenar(g.dialogo, x), mision: g, h: `${nombreCorto(npc)} ofrece: ${g.titulo}.`, tema: "oferta" };
}

function temaMonstruo(x, mon) {
  const { npc } = x;
  if (npc.actitud <= -3) return decir(x, "hostil");
  if (!mon) {
    const conoce = (npc.conoce || []).map(monNombre).filter(Boolean);
    return decir(x, "monstruo", { lista: conoce.join(", ") || "ninguno" }) ;
  }
  const b = BESTIARIO[mon];
  const extra = { monstruo: b.n };
  const sabe = (npc.conoce || []).includes(mon);
  if (!sabe) return decir(x, "monstruo_desconoce", extra);
  const propio = primeraCapa(x, [`monstruo:${mon}`], true);
  if (propio) {
    const texto = usar(x, propio, extra);
    const r = { texto, e: propio.e };
    if (propio.e.rev !== undefined ? propio.e.rev : x.confiado && b.debil) r.rev = mon;
    return r;
  }
  if (!x.confiado) return { texto: (linea(x, "monstruo_desconfia", extra) + " " + b.desc).trim() };
  const intro = linea(x, "monstruo_intro", extra);
  const r = { texto: `${intro} ${b.pista}`.trim(), h: b.debil ? `${b.n}: débil a ${ELEMENTOS[b.debil].n.toLowerCase()}.` : "" };
  if (b.debil) r.rev = mon;
  return r;
}

function temaRumores(x) {
  const { npc, mem, s } = x;
  if (npc.actitud <= -3) return decir(x, "hostil");
  const lista = npc.rumores || [];
  let bloqueado = null;
  for (let i = 0; i < lista.length; i++) {
    if (mem.rumUsados.includes(i)) continue;
    const ru = lista[i];
    if (ru.rev && !x.confiado) { if (!bloqueado) bloqueado = ru; continue; }
    mem.rumUsados.push(i);
    const r = { texto: rellenar(ru.t, x), h: ru.h || "" };
    if (ru.rev && BESTIARIO[ru.rev] && BESTIARIO[ru.rev].debil) r.rev = ru.rev;
    return r;
  }
  if (bloqueado) {
    const v = bloqueado.v || linea(x, "rumor_bloqueado");
    return { texto: v + " " + linea(x, "rumor_pista_confianza") };
  }
  // eco de tus hazañas como rumor del mundo; si no hay, rumores agotados
  const eco = (s.hazanas || []).filter((h) => h.tipo === "victoria" && h.peso >= 2);
  if (eco.length) {
    const h = eco[(mem.usadas["eco"] = (mem.usadas["eco"] || 0) + 1) % eco.length];
    return { texto: rellenar(linea(x, "rumor_eco", { monstruo: monNombre(h.clave) }), x, { monstruo: monNombre(h.clave) }) };
  }
  return decir(x, "rumores_fin");
}

function temaHazanas(x) {
  const { npc, mem } = x;
  if (npc.actitud <= -3) return decir(x, "hostil");
  const conocidas = x.haz.slice().sort((a, b) => b.peso - a.peso || b.ts - a.ts);
  if (!conocidas.length) return decir(x, "hazanas_ninguna");
  const nuevo = conocidas.find((h) => !mem.reaccionadas.includes(h.id));
  const h = nuevo || conocidas[(mem.usadas["haz"] = (mem.usadas["haz"] || 0) + 1) % conocidas.length];
  if (!mem.reaccionadas.includes(h.id)) mem.reaccionadas.push(h.id);
  const t = reaccionHazana(x, h);
  return { texto: t || linea(x, "hazanas_ninguna"), ganar: ["hazana", 1] };
}

function temaYo(x) {
  const partes = [];
  const pjl = capa(x, `pj:${x.pj.id}`, true);
  const prop = pjl ? usar(x, pjl) : "";
  const genericas = PJ_OPS[x.pj.id];
  partes.push(prop || (genericas ? rellenar(genericas[(x.mem.usadas["pjgen"] = (x.mem.usadas["pjgen"] || 0) + 1) % genericas.length], x) : ""));
  const rz = RAZA_OPS[x.npc.raza] && RAZA_OPS[x.npc.raza][x.pj.raza];
  if (rz && !prop) partes.push(rellenar(rz, x));
  return { texto: partes.filter(Boolean).join(" ") || linea(x, "yo_generico"), ganar: ["yo", 0] };
}

function impresionInicial(x) {
  const pjl = capa(x, `pj:${x.pj.id}`, true);
  if (pjl) return usar(x, pjl);
  const rz = RAZA_OPS[x.npc.raza] && RAZA_OPS[x.npc.raza][x.pj.raza];
  return rz ? rellenar(rz, x) : "";
}

/* ---------- motor principal ---------- */
function motorDialogo(npc, texto, s) {
  const x = ctxDe(npc, texto, s);
  const mem = x.mem;
  mem.turno++;
  const primera = mem.visita !== s.visita;
  mem.visita = s.visita;
  const r = { texto: "", actitud: 0, recuerda: "", hecho_clave: "", tags: [], mision: null, debilidad_revelada: null };
  const ganar = (razon, n) => { if (!mem.ganado[razon]) { mem.ganado[razon] = 1; r.actitud += n; } };

  const { tema, param, P } = elegirTema(texto, x);
  mem.temas[tema || "nada"] = (mem.temas[tema || "nada"] || 0) + 1;

  /* antes de responder: cierre de misión pendiente y reacción a una hazaña */
  const previas = [];
  if (mem.cierres.length) {
    const c = mem.cierres.shift();
    previas.push(textoCierre(npc, c.titulo, s));
    if (!mem.reaccionadas.includes(c.hid)) mem.reaccionadas.push(c.hid);
  }
  const pend = x.haz.filter((h) => !mem.reaccionadas.includes(h.id) && h.tipo !== "rasgo" && h.tipo !== "nivel").sort((a, b) => b.peso - a.peso || b.ts - a.ts);
  const hayTestigo = pend.some((h) => h.lugar === s.escena.nombre);
  if (!previas.length && pend.length && (primera || hayTestigo) && tema !== "hazanas" && tema !== "insulto" && tema !== "amenaza" && tema !== "despedida") {
    const h = pend[0];
    mem.reaccionadas.push(h.id);
    const t = reaccionHazana(x, h);
    if (t) previas.push(t);
  }

  /* respuesta principal */
  let res = null;
  let t = tema;
  if (tema === "mision" || tema === "progreso") res = temaMision(x);
  else if (tema === "monstruo") res = temaMonstruo(x, param || P.mon);
  else if (tema === "rumores") res = temaRumores(x);
  else if (tema === "hazanas") res = temaHazanas(x);
  else if (tema === "yo") res = temaYo(x);
  else if (tema === "lugar") res = decir(x, [`lugar:${param}`, "lugar"], { lugarX: lugarNombre[param] || "ese sitio" });
  else if (tema === "npc") res = decir(x, [`npc:${param}`, "npc"], { otro: (ALIAS_NPC[param] && ALIAS_NPC[param][0]) || "esa persona" });
  else if (tema === "raza") res = decir(x, [`raza:${param}`, "raza"], { razaX: param });
  else if (tema === "afirmar" || tema === "negar") {
    const pendiente = s.chat.some((m) => m.oferta && m.oferta.estado === "pendiente" && m.npcId === npc.id);
    res = pendiente ? decir(x, tema === "afirmar" ? "oferta_pendiente_si" : "oferta_pendiente_no") : decir(x, tema);
  } else if (["sobre_npc", "secreto", "servicios", "dinero", "broma", "amable", "insulto", "amenaza", "despedida", "saludo"].includes(tema)) {
    if (npc.actitud <= -3 && ["sobre_npc", "secreto", "servicios"].includes(tema)) res = decir(x, "hostil");
    else if (tema === "secreto") {
      res = x.npc.actitud >= Math.max(3, x.conf + 1) ? decir(x, "secreto_revela") : decir(x, "secreto_guarda");
    } else if (tema === "sobre_npc") {
      res = decir(x, "sobre_npc");
      ganar("interes", 1);
    } else res = decir(x, tema);
  }
  if (!res || !res.texto) {
    mem.noEntiende++;
    const sug = sugerenciasTema(npc, s).slice(0, 4).map((c) => c.l.replace(/^\S+\s/, "")).join(", ");
    res = { texto: (linea(x, "no_entiendo") || "*te mira sin comprender*") + (mem.noEntiende <= 2 && sug ? `\n*(Prueba a hablarme de: ${sug}.)*` : "") };
    t = "nada";
  }

  /* efectos del tema sobre la actitud y la memoria */
  if (tema === "amable") ganar("cortesia", 1);
  if (tema === "broma") ganar("humor", 1);
  if (tema === "insulto") { r.actitud -= 1; r.recuerda = `${x.pj.corto} me insultó.`; }
  if (tema === "amenaza") { r.actitud -= 1; r.recuerda = `${x.pj.corto} me amenazó.`; }
  if (res.ganar) ganar(res.ganar[0], res.ganar[1]);
  if (res.e && res.e.ac) {
    const kid = `ac|${tema}|${(res.e.t || [])[0] || ""}`.slice(0, 60);
    if (!mem.ganado[kid]) { mem.ganado[kid] = 1; r.actitud += res.e.ac; }
  }
  if (res.e && res.e.h) r.hecho_clave = rellenar(res.e.h, x);
  if (res.h) r.hecho_clave = res.h;
  if (res.rev && BESTIARIO[res.rev] && BESTIARIO[res.rev].debil) r.debilidad_revelada = { monstruo: res.rev, elemento: BESTIARIO[res.rev].debil };
  if (res.mision) r.mision = res.mision;
  if (mem.turno === 1) r.recuerda = r.recuerda || `Conocí a ${x.pj.nombre}.`;

  /* impresión del personaje: primera charla (después del saludo, o antes de lo demás) */
  const imp = mem.turno === 1 && previas.length < 2 ? impresionInicial(x) : "";
  const partes = [].concat(previas);
  if (tema === "saludo") { partes.push(res.texto); if (imp) partes.push(imp); }
  else { if (imp) partes.push(imp); partes.push(res.texto); }
  r.texto = partes.filter(Boolean).join("\n\n");

  r.tags = Array.from(new Set([].concat(TEMA_TAGS[tema] || [], mockTags(texto)))).slice(0, 2);
  return r;
}

/* ---------- botones de tema bajo el chat ---------- */
function sugerenciasTema(npc, s) {
  const x = ctxDe(npc, "", s);
  const out = [];
  const pendH = x.haz.some((h) => !x.mem.reaccionadas.includes(h.id));
  if (x.mem.cierres.length) out.push({ l: "🧭 He vuelto", t: "Ya he vuelto. ¿Cómo va el encargo?", nuevo: true });
  if (pendH) out.push({ l: "🏆 ¿Me conoces?", t: "¿Has oído algo de mí?", nuevo: true });
  if (x.mDisp) out.push({ l: "📜 Un encargo", t: "¿Tienes algún encargo para mí?" });
  if (x.mActiva) out.push({ l: "🧭 El encargo", t: "¿Cómo va el encargo?" });
  out.push({ l: "💬 Rumores", t: "¿Qué rumores corren por aquí?" });
  out.push({ l: "🙋 Sobre ti", t: "Háblame de ti. ¿Quién eres?" });
  for (const id of (npc.conoce || []).slice(0, 2)) if (BESTIARIO[id]) out.push({ l: `${BESTIARIO[id].e} ${BESTIARIO[id].n.split(" ")[0]}`, t: `¿Qué sabes de ${ALIAS_MON[id][1] || ALIAS_MON[id][0]}?` });
  for (const o of s.escena.npcs.filter((n) => n.id !== npc.id).slice(0, 2)) out.push({ l: `👥 ${nombreCorto(o)}`, t: `¿Qué opinas de ${nombreCorto(o)}?` });
  if (s.escena.servicios) out.push({ l: "🍺 Servicios", t: "¿Qué puedo comprar o beber aquí?" });
  if (x.mem.turno >= 2) out.push({ l: "🔒 Un secreto", t: "¿Qué secreto me ocultas?" });
  out.push({ l: "👋 Adiós", t: "Hasta luego." });
  return out;
}
