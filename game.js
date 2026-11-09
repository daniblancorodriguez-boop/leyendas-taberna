"use strict";
/* =========================================================
   LEYENDAS DE LA TABERNA · motor del juego e interfaz
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const E = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s) => E(s).replace(/\*([^*\n]+)\*/g, "<em>$1</em>").replace(/\n/g, "<br>");

const CLAVE_PARTIDA = "lt_partida_v1";
const EMOJI_TIPO = { taberna: "🍺", cantina: "🍻", aldea: "🏘️", camino: "🛤️", bosque: "🌲", ruinas: "🏚️", cripta: "⚰️", puente: "🌉", montana: "⛰️", cueva: "🕳️", mercado: "🛒", castillo: "🏰" };
const SIN_PELIGRO = ["taberna", "cantina", "aldea", "mercado", "castillo"];

let S = null; // estado de la partida
let busy = false;
let combate = null;
let nivelMostrado = 1;

/* =========================================================
   REGLAS (puras: no tocan el DOM)
   ========================================================= */
const pjDe = (s) => PERSONAJES.find((p) => p.id === s.pj);
const hpMax = (s) => 24 + s.stats.vol * 2 + (s.nivel - 1) * (5 + Math.floor(s.stats.vol / 2));
const pmMax = (s) => 8 + Math.floor((s.stats.int + s.stats.vol) / 2) + (s.nivel - 1) * 2;
const xpNecesaria = (n) => 50 + 40 * (n - 1);

function serviciosPorTipo(tipo) {
  if (tipo === "taberna" || tipo === "cantina") return { descanso: 8, tienda: true };
  if (tipo === "aldea" || tipo === "mercado") return { descanso: 0, tienda: true };
  return null;
}

function prepararEscena(e) {
  e.npcs = (e.npcs || []).map((n) => Object.assign({ actitud: 0, hechos: [], hist: [], ofrecidas: 0 }, n, { id: n.id || uid() }));
  e.salidas = e.salidas || [];
  e.servicios = e.servicios === undefined || e.servicios === null ? serviciosPorTipo(e.tipo) : e.servicios;
  e.emoji = e.emoji || EMOJI_TIPO[e.tipo] || "📍";
  return e;
}

function nuevaPartida(pjId) {
  const p = PERSONAJES.find((x) => x.id === pjId);
  const s = {
    v: 1, pj: pjId, nivel: 1, xp: 0, stats: clonar(p.stats), oro: p.oro, inv: clonar(p.inv),
    hp: 0, pm: 0, diario: [], misiones: [], escena: null, jarra: null, chat: [], histNarrador: [],
    conocido: {}, recientes: [], destino: null, victorias: 0,
    hazanas: [], rasgos: {}, contador: { victorias: {} }, visita: 0,
  };
  s.hp = hpMax(s);
  s.pm = pmMax(s);
  s.escena = prepararEscena(clonar(ESCENA_INICIAL));
  return s;
}

function ganarXP(s, n) {
  if (n < 0) { s.xp = Math.max(0, s.xp + n); return 0; }
  s.xp += n;
  let subidas = 0;
  while (s.xp >= xpNecesaria(s.nivel) && s.nivel < 30) {
    s.xp -= xpNecesaria(s.nivel);
    s.nivel++;
    subidas++;
    const p = pjDe(s);
    s.stats[p.crece[s.nivel % 2]]++;
    s.hp = hpMax(s);
    s.pm = pmMax(s);
    if ([3, 5, 8, 10, 15, 20].includes(s.nivel)) registrarHazana(s, { tipo: "nivel", clave: String(s.nivel), peso: 1, texto: `Alcanzaste el nivel ${s.nivel}.` });
  }
  return subidas;
}

/* ---------- hazañas: lo que has hecho y la gente recuerda ---------- */
function registrarHazana(s, d) {
  s.hazanas = s.hazanas || [];
  const h = Object.assign({ id: uid(), dif: 0, nivel: s.nivel, lugar: s.escena ? s.escena.nombre : "", ts: Date.now(), nueva: true }, d);
  s.hazanas.unshift(h);
  if (s.hazanas.length > 60) s.hazanas.pop();
  return h;
}

function buscarNPC(s, id) {
  const lista = [].concat((s.escena && s.escena.npcs) || [], (s.jarra && s.jarra.npcs) || []);
  return lista.find((n) => n.id === id) || null;
}

/* Cada etiqueta repetida pierde valor (anti-granja). Las traiciones también. */
function registrarRasgo(s, tag) {
  s.rasgos = s.rasgos || {};
  const n = (s.rasgos[tag] = (s.rasgos[tag] || 0) + 1);
  if ((n === 3 || n === 6) && FAMA[tag]) registrarHazana(s, { tipo: "rasgo", clave: tag, peso: 1, texto: FAMA[tag][n === 3 ? 1 : 2] });
}

/* La IA solo etiqueta la actitud del jugador; el XP lo decide esta función. */
function otorgarTag(s, tag) {
  const p = pjDe(s);
  let tipo = null;
  if (p.virtudes.includes(tag)) tipo = "virtud";
  else if (p.defectos.includes(tag)) tipo = "defecto";
  else if (p.prohibido.includes(tag)) tipo = "prohibido";
  else return null;
  const base = 6 + 2 * s.nivel;
  const veces = s.recientes.filter((t) => t === tag).length;
  const mult = veces === 0 ? 1 : veces === 1 ? 0.5 : veces === 2 ? 0.25 : 0;
  let d = tipo === "virtud" ? base : tipo === "defecto" ? Math.round(base / 2) : -base;
  d = Math.round(d * (d < 0 ? Math.max(mult, 0.5) : mult));
  s.recientes.push(tag);
  if (s.recientes.length > 6) s.recientes.shift();
  ganarXP(s, d);
  return { tag, tipo, delta: d };
}

/* ---------- misiones ---------- */
const misionesActivas = (s) => s.misiones.filter((m) => m.estado === "activa");
const recompensaMision = (m, s) => ({ xp: 25 * m.dif + 8 * s.nivel, oro: 10 * m.dif + 5 });

function aceptarMision(s, oferta, giver, giverId) {
  if (misionesActivas(s).length >= 5) return null;
  if (s.misiones.some((m) => m.titulo === oferta.titulo && m.estado === "activa")) return null;
  const rec = recompensaMision(oferta, s);
  const q = Object.assign(clonar(oferta), { id: uid(), giver, giverId: giverId || null, xp: rec.xp, oro: rec.oro, estado: "activa" });
  delete q.dialogo;
  s.misiones.push(q);
  return q;
}

function completarMision(s, q) {
  q.estado = "completada";
  ganarXP(s, q.xp);
  s.oro += q.oro;
  s.diario.unshift({ id: uid(), texto: `Misión completada: ${q.titulo}.`, fuente: q.giver || "Misión", nivel: s.nivel, ts: Date.now() });
  const h = registrarHazana(s, { tipo: "mision", clave: q.titulo, peso: q.dif, giverId: q.giverId || null, texto: `Completaste «${q.titulo}»${q.giver ? " para " + q.giver : ""}.` });
  q.hazanaId = h.id;
  const g = q.giverId ? buscarNPC(s, q.giverId) : null;
  if (g) {
    g.mem = g.mem || {};
    (g.mem.cierres = g.mem.cierres || []).push({ titulo: q.titulo, hid: h.id });
    g.actitud = clamp(g.actitud + 2, -5, 5);
  }
  return q;
}

function progresoCombate(s, monId) {
  const hechas = [];
  for (const q of misionesActivas(s)) {
    if (q.tipo === "combate" && q.objetivo.monstruo === monId) {
      q.objetivo.hechas++;
      if (q.objetivo.hechas >= q.objetivo.cant) hechas.push(completarMision(s, q));
    }
  }
  return hechas;
}

function progresoHablar(s, npc) {
  const hechas = [];
  const a = norm(npc.nombre);
  for (const q of misionesActivas(s)) {
    if (q.tipo !== "hablar") continue;
    const b = norm(q.objetivo.npc);
    if (b && (a.includes(b) || b.includes(a))) hechas.push(completarMision(s, q));
  }
  return hechas;
}

function respuestaEnigma(q, resp) {
  const x = norm(resp);
  return !!x && q.objetivo.respuestas.some((k) => x.includes(k));
}

/* ---------- combate ---------- */
function crearCombate(s, monId) {
  const b = BESTIARIO[monId];
  const k = s.nivel - 1;
  const hp = Math.round(b.hp * (1 + 0.12 * k));
  const c = {
    id: monId, b, hp, hpMax: hp, atk: Math.round(b.atk * (1 + 0.08 * k)), esq: b.esq,
    idx: 0, guardia: 1, venenoT: 0, quemado: false, turno: 1, fin: null, res: null, resuelto: false, menuObj: false,
    log: [`${b.e} ¡${b.n} te corta el paso! ${b.desc}`], intent: "",
  };
  const nx = b.patron[0];
  c.intent = nx.tele || "";
  return c;
}

const statDe = (s, k) => s.stats[k] || 0;
const probGolpe = (s, c, extra = 0) => clamp(0.85 + (statDe(s, "des") - c.esq) * 0.02 + extra, 0.6, 0.97);

function ataqueBase(s, rng) {
  const p = pjDe(s);
  return Math.floor(rng() * 6) + 1 + Math.floor(statDe(s, p.ataque) / 2) + p.arma.bono + Math.floor(s.nivel / 2);
}

function danoAlMonstruo(s, c, base, elem, rng) {
  let mult = 1, txt = "";
  if (c.b.debil && c.b.debil === elem) { mult = 2; txt = " ¡Punto débil!"; s.conocido[c.id] = Object.assign({ visto: true }, s.conocido[c.id], { debil: true }); }
  else if (c.b.resiste && c.b.resiste === elem) { mult = 0.5; txt = " Lo resiste..."; }
  const crit = rng() < 0.08;
  const d = Math.max(1, Math.round(base * mult * (crit ? 1.5 : 1)));
  c.hp = Math.max(0, c.hp - d);
  if (elem === "fuego" && c.b.regen) c.quemado = true;
  return { d, txt: (crit ? " ¡Crítico!" : "") + txt };
}

function turnoMonstruo(s, c, rng) {
  const L = c.log;
  const mv = c.b.patron[c.idx % c.b.patron.length];
  c.idx++;
  const p = pjDe(s);
  let dmg = Math.round(c.atk * mv.m * (0.8 + rng() * 0.4));
  if (c.guardia === 0) {
    L.push(`${c.b.e} ${c.b.n} ${mv.n}, pero lo esquivas por completo.`);
  } else {
    dmg = Math.max(1, Math.round(dmg * c.guardia) - p.armadura.red);
    s.hp = Math.max(0, s.hp - dmg);
    L.push(`${c.b.e} ${c.b.n} ${mv.n}: ${dmg} de daño${c.guardia < 1 ? " (te cubres)" : ""}.`);
    if (mv.efecto === "veneno") { c.venenoT = 3; L.push("☠️ Estás envenenado."); }
  }
  c.guardia = 1;
  if (s.hp <= 0) { c.fin = "derrota"; L.push("Todo se oscurece..."); return; }
  if (c.venenoT > 0) {
    s.hp = Math.max(0, s.hp - 2);
    c.venenoT--;
    L.push("☠️ El veneno te quema: 2 de daño.");
    if (s.hp <= 0) { c.fin = "derrota"; L.push("Todo se oscurece..."); return; }
  }
  if (c.b.regen && !c.quemado && c.hp < c.hpMax) {
    c.hp = Math.min(c.hpMax, c.hp + c.b.regen);
    L.push(`💚 ${c.b.n} se regenera (+${c.b.regen}).`);
  }
  s.pm = Math.min(pmMax(s), s.pm + 1);
  c.turno++;
  c.intent = c.b.patron[c.idx % c.b.patron.length].tele || "";
}

/* acc: {t:"atacar"|"defender"|"habilidad"|"objeto"|"examinar"|"huir", id} */
function turnoJugador(s, c, acc, rng = Math.random) {
  if (c.fin) return { invalida: true, msg: "El combate ha terminado." };
  const p = pjDe(s);
  const L = c.log;
  if (acc.t === "atacar") {
    if (rng() < probGolpe(s, c)) {
      const r = danoAlMonstruo(s, c, ataqueBase(s, rng), "fisico", rng);
      L.push(`⚔️ ${p.arma.n}: ${r.d} de daño.${r.txt}`);
    } else L.push("⚔️ Fallas el golpe.");
  } else if (acc.t === "defender") {
    c.guardia = 0.35;
    s.pm = Math.min(pmMax(s), s.pm + 2);
    L.push("🛡️ Te cubres y recuperas el aliento (+2 energía).");
  } else if (acc.t === "habilidad") {
    const h = p.habilidades.find((x) => x.id === acc.id);
    if (!h) return { invalida: true, msg: "Habilidad desconocida." };
    if (s.pm < h.coste) return { invalida: true, msg: "No tienes energía suficiente." };
    s.pm -= h.coste;
    if (h.tipo === "dano") {
      const base = Math.round((Math.floor(rng() * 6) + 1 + statDe(s, h.stat) / 2 + p.arma.bono + Math.floor(s.nivel / 2)) * h.mult);
      if (h.seguro || rng() < probGolpe(s, c, 0.1)) {
        const r = danoAlMonstruo(s, c, base, h.elem, rng);
        L.push(`${h.e} ${h.n}: ${r.d} de daño ${ELEMENTOS[h.elem].e}.${r.txt}`);
      } else L.push(`${h.e} ${h.n} no alcanza a su objetivo.`);
    } else if (h.tipo === "cura") {
      const cura = h.base + s.nivel + Math.floor(statDe(s, "vol") / 2);
      s.hp = Math.min(hpMax(s), s.hp + cura);
      L.push(`${h.e} ${h.n}: recuperas ${cura} de vida.`);
    } else if (h.tipo === "escudo") {
      c.guardia = h.factor;
      L.push(`${h.e} ${h.n}: te preparas para encajar el golpe.`);
    } else if (h.tipo === "evasion") {
      c.guardia = 0;
      L.push(`${h.e} ${h.n}: desapareces tras una cortina de humo.`);
    }
  } else if (acc.t === "objeto") {
    const id = acc.id;
    if (!OBJETOS[id] || !(s.inv[id] > 0)) return { invalida: true, msg: "No te queda de eso." };
    if (id === "pocion") {
      const cura = 15 + 3 * s.nivel;
      s.hp = Math.min(hpMax(s), s.hp + cura);
      c.venenoT = 0;
      L.push(`🧪 Bebes una poción: +${cura} de vida y el veneno se va.`);
    } else if (id === "elixir") {
      s.pm = Math.min(pmMax(s), s.pm + 8);
      L.push("⚗️ Bebes un elixir: +8 de energía.");
    } else if (ARROJADIZOS[id]) {
      const elem = ARROJADIZOS[id];
      const r = danoAlMonstruo(s, c, 10 + 3 * s.nivel, elem, rng);
      L.push(`${OBJETOS[id].e} Lanzas ${OBJETOS[id].n.toLowerCase()}: ${r.d} de daño ${ELEMENTOS[elem].e}.${r.txt}`);
    }
    s.inv[id]--;
  } else if (acc.t === "examinar") {
    s.conocido[c.id] = Object.assign({ visto: true }, s.conocido[c.id], { debil: true, resiste: true });
    const b = c.b;
    L.push(`🔍 Examinas a ${b.n}. ${b.pista}`);
  } else if (acc.t === "huir") {
    const prob = clamp(0.45 + statDe(s, "des") * 0.03, 0.3, 0.9);
    if (rng() < prob) {
      c.fin = "huida";
      L.push("🏃 Logras escapar... con algo menos de dignidad.");
      return {};
    }
    L.push("🏃 Intentas huir, pero te cortan el paso.");
  } else return { invalida: true, msg: "Acción desconocida." };

  if (c.hp <= 0) { c.fin = "victoria"; L.push(`${c.b.e} ¡${c.b.n} cae derrotado!`); return {}; }
  turnoMonstruo(s, c, rng);
  return {};
}

function resolverVictoria(s, c) {
  const b = c.b;
  const k = s.nivel > b.nivelMin + 3 ? 0.5 : 1;
  const xp = Math.round(b.xp * k);
  const oro = b.oro + rnd(0, b.oro);
  ganarXP(s, xp);
  s.oro += oro;
  s.victorias = (s.victorias || 0) + 1;
  s.conocido[c.id] = Object.assign({ visto: true }, s.conocido[c.id]);
  s.contador = s.contador || { victorias: {} };
  const previas = s.contador.victorias[c.id] || 0;
  s.contador.victorias[c.id] = previas + 1;
  const peso = b.nivelMin >= 6 ? 3 : b.nivelMin >= 3 ? 2 : previas === 0 ? 1 : 0;
  if (peso) registrarHazana(s, { tipo: "victoria", clave: c.id, peso, texto: `Derrotaste a ${b.n} en ${s.escena.nombre}.` });
  const misiones = progresoCombate(s, c.id);
  const tag = b.nivelMin >= s.nivel ? otorgarTag(s, "valentia") : null;
  return { xp, oro, misiones, tag };
}

function resolverDerrota(s) {
  const perdido = Math.floor(s.oro / 2);
  s.oro -= perdido;
  s.hp = Math.max(1, Math.floor(hpMax(s) / 2));
  s.pm = pmMax(s);
  return { perdido };
}

/* =========================================================
   GUARDADO
   ========================================================= */
function guardar() {
  if (!S) return;
  try {
    S.chat = S.chat.slice(-80);
    localStorage.setItem(CLAVE_PARTIDA, JSON.stringify(S));
  } catch (e) { /* almacenamiento lleno o bloqueado */ }
}
function cargarPartida() {
  try {
    const o = JSON.parse(localStorage.getItem(CLAVE_PARTIDA) || "null");
    if (o && o.v === 1 && PERSONAJES.some((p) => p.id === o.pj) && o.escena) {
      o.hazanas = o.hazanas || [];
      o.rasgos = o.rasgos || {};
      o.contador = o.contador || { victorias: {} };
      o.visita = o.visita || 0;
      return o;
    }
  } catch (e) { /* partida corrupta */ }
  return null;
}

/* =========================================================
   INTERFAZ: utilidades
   ========================================================= */
function toast(msg, tipo = "") {
  const cont = $("#toasts");
  const d = document.createElement("div");
  d.className = "toast " + tipo;
  d.textContent = msg;
  cont.appendChild(d);
  setTimeout(() => d.remove(), 3600);
}

function barra(val, max, clase) {
  const pct = max > 0 ? clamp((val / max) * 100, 0, 100) : 0;
  return `<div class="barra ${clase}"><i style="width:${pct}%"></i></div>`;
}

function setBusy(v) {
  busy = v;
  $("#msg").disabled = v;
  $("#enviar").disabled = v;
  renderChat();
}

/* =========================================================
   INTERFAZ: pantalla de inicio
   ========================================================= */
function mostrar(pantalla) {
  for (const id of ["inicio", "juego"]) $("#" + id).hidden = id !== pantalla;
}

function renderInicio() {
  mostrar("inicio");
  const guardada = cargarPartida();
  const cont = $("#continuar");
  if (guardada) {
    const p = PERSONAJES.find((x) => x.id === guardada.pj);
    cont.innerHTML = `<button class="btn grande" data-act="continuar">▶ Continuar · ${E(p.corto)} · Nv ${guardada.nivel}</button>`;
  } else cont.innerHTML = "";
  $("#lista-pj").innerHTML = PERSONAJES.map((p) => `
    <button class="card-pj" data-act="ver-pj" data-id="${p.id}">
      <span class="card-emoji">${p.emoji}</span>
      <span class="card-txt"><strong>${E(p.nombre)}</strong><em>${E(p.apodo)} · ${E(RAZAS[p.raza].n.replace(/s$/, ""))}</em><small>${E(p.resumen)}</small></span>
    </button>`).join("");
  actualizarEtiquetaIA();
}

function chipsCodigo(lista, clase) {
  return lista.map((t) => `<span class="chip ${clase}">${ETIQUETAS[t].e} ${ETIQUETAS[t].n}</span>`).join("");
}

function verPersonaje(id) {
  const p = PERSONAJES.find((x) => x.id === id);
  const st = p.stats;
  hojaCtx = { tipo: "pj" };
  abrirHoja(`${p.emoji} ${p.nombre}`, `
    <p class="apodo">${E(p.apodo)} · ${E(RAZAS[p.raza].n.replace(/s$/, ""))} · ${E(p.clase)}</p>
    <h4>Tu historia</h4><p>${E(p.historia)}</p>
    <p><b>Te mueve:</b> ${E(p.motivacion)}<br><b>Temes:</b> ${E(p.miedo)}</p>
    <h4>Tu código (así se gana experiencia)</h4>
    <div class="codigo"><span class="lbl">Virtudes · XP completo</span>${chipsCodigo(p.virtudes, "ok")}</div>
    <div class="codigo"><span class="lbl">Defectos · medio XP (interpretarlos también es rolear)</span>${chipsCodigo(p.defectos, "mid")}</div>
    <div class="codigo"><span class="lbl">Traiciones · pierdes XP</span>${chipsCodigo(p.prohibido, "mal")}</div>
    <h4>Atributos</h4>
    <div class="stats"><span>💪 Fuerza ${st.fue}</span><span>🏃 Destreza ${st.des}</span><span>🧠 Mente ${st.int}</span><span>❤️ Voluntad ${st.vol}</span></div>
    <h4>Habilidades</h4>
    <ul class="lista">${p.habilidades.map((h) => `<li>${h.e} <b>${E(h.n)}</b> (${h.coste} energía): ${E(h.desc)}</li>`).join("")}</ul>
    <button class="btn grande" data-act="empezar" data-id="${p.id}">⚔️ Comenzar la aventura</button>`);
}

/* =========================================================
   INTERFAZ: hoja inferior (modal)
   ========================================================= */
function abrirHoja(titulo, html) {
  $("#hoja-titulo").innerHTML = titulo;
  $("#hoja-cuerpo").innerHTML = html;
  $("#hoja").hidden = false;
  $("#hoja-cuerpo").scrollTop = 0;
}
function cerrarHoja() {
  $("#hoja").hidden = true;
  $("#hoja-cuerpo").innerHTML = "";
  hojaCtx = null;
}
let hojaCtx = null; // contexto de la hoja abierta (pestaña de mochila, nota...)

/* =========================================================
   INTERFAZ: partida
   ========================================================= */
function empezarPartida(id) {
  S = nuevaPartida(id);
  nivelMostrado = S.nivel;
  cerrarHoja();
  entrarEscena(true);
  guardar();
}

function continuarPartida() {
  S = cargarPartida();
  if (!S) return renderInicio();
  nivelMostrado = S.nivel;
  S.histNarrador = S.histNarrador || [];
  S.chat = S.chat || [];
  if (!S.chat.length) addMsg({ who: "narrador", name: "Narrador", text: S.escena.descripcion }, true);
  if (!S.destino || (S.destino !== "narrador" && !S.escena.npcs.some((n) => n.id === S.destino))) S.destino = S.escena.npcs.length ? S.escena.npcs[0].id : "narrador";
  mostrar("juego");
  renderTodo();
}

function entrarEscena(primera = false) {
  mostrar("juego");
  const e = S.escena;
  S.visita = (S.visita || 0) + 1;
  S.chat = [];
  S.histNarrador = [];
  S.destino = e.npcs.length ? e.npcs[0].id : "narrador";
  const p = pjDe(S);
  if (primera) addMsg({ who: "narrador", name: "Narrador", text: `${e.descripcion}\n\n*${p.entrada}*` }, true);
  else addMsg({ who: "narrador", name: "Narrador", text: e.descripcion }, true);
  if (e.amenaza) addMsg({ who: "sistema", text: `⚠️ Algo acecha por aquí: ${BESTIARIO[e.amenaza].e} ${BESTIARIO[e.amenaza].n}. Pulsa «Combate» cuando estés listo.` }, true);
  renderTodo();
}

function renderTodo() {
  renderHUD();
  renderEscena();
  renderChat();
  renderDestinos();
  renderTemas();
  renderBarra();
}

function renderHUD() {
  const p = pjDe(S);
  $("#hud").innerHTML = `
    <div class="hud-fila">
      <span class="hud-pj">${p.emoji} <b>${E(p.corto)}</b> <span class="nv">Nv ${S.nivel}</span></span>
      <span class="hud-oro">🪙 ${S.oro}</span>
    </div>
    <div class="hud-barras">
      <div class="hud-b"><span>❤️ ${S.hp}/${hpMax(S)}</span>${barra(S.hp, hpMax(S), "rojo")}</div>
      <div class="hud-b"><span>⚡ ${S.pm}/${pmMax(S)}</span>${barra(S.pm, pmMax(S), "azul")}</div>
      <div class="hud-b"><span>✨ ${S.xp}/${xpNecesaria(S.nivel)}</span>${barra(S.xp, xpNecesaria(S.nivel), "oro")}</div>
    </div>`;
  for (const h of S.hazanas) {
    if (h.nueva) { h.nueva = false; toast(`🏆 Nueva hazaña: ${h.texto}`, "gold"); }
  }
  if (S.nivel > nivelMostrado) {
    for (let n = nivelMostrado + 1; n <= S.nivel; n++) {
      toast(`⬆️ ¡Nivel ${n}! Te sientes más fuerte.`, "gold");
      S.chat.push({ id: uid(), who: "sistema", text: `⬆️ Has alcanzado el nivel ${n}. Vida y energía restauradas.` });
    }
    nivelMostrado = S.nivel;
  }
}

function etiquetaIA() {
  const m = modoIA();
  return m === "demo" ? "🧪 Modo demo (sin IA)" : m === "anthropic" ? "🤖 IA: Claude" : "🤖 IA: OpenAI";
}
function actualizarEtiquetaIA() {
  const el = $("#etiqueta-ia");
  if (el) el.textContent = etiquetaIA();
  const el2 = $("#etiqueta-ia-inicio");
  if (el2) el2.textContent = etiquetaIA();
}

function renderEscena() {
  const e = S.escena;
  $("#escena-barra").innerHTML = `
    <div class="esc-tit"><span class="esc-emoji">${e.emoji}</span><div><b>${E(e.nombre)}</b><small>${E(e.ambiente || "")}</small></div></div>
    <button class="etq" data-act="ajustes" id="etiqueta-ia">${E(etiquetaIA())}</button>`;
}

function renderDestinos() {
  const e = S.escena;
  const chips = e.npcs.map((n) => {
    const hum = n.actitud >= 2 ? " 💛" : n.actitud <= -2 ? " 💢" : "";
    return `<button class="dest ${S.destino === n.id ? "sel" : ""}" data-act="destino" data-id="${n.id}">${RAZAS[n.raza] ? RAZAS[n.raza].e : "🧑"} ${E(n.nombre.split(" ")[0].replace(/[«»]/g, ""))}${hum}</button>`;
  });
  chips.push(`<button class="dest ${S.destino === "narrador" ? "sel" : ""}" data-act="destino" data-id="narrador">🎲 Narrador</button>`);
  $("#destinos").innerHTML = chips.join("");
  const npc = e.npcs.find((n) => n.id === S.destino);
  $("#msg").placeholder = npc ? `Habla con ${npc.nombre.split(" ")[0].replace(/[«»]/g, "")}…` : "Describe lo que haces…";
}

function renderTemas() {
  const el = $("#temas");
  if (!el) return;
  const npc = S.escena.npcs.find((n) => n.id === S.destino);
  if (!npc) { el.innerHTML = ""; el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = sugerenciasTema(npc, S).map((c, i) => `<button class="tema${c.nuevo ? " nuevo" : ""}" data-act="tema" data-id="${i}">${E(c.l)}</button>`).join("");
}

function renderBarra() {
  const e = S.escena;
  const bot = [
    `<button data-act="mover"><span>🧭</span>Moverse</button>`,
    e.amenaza ? `<button class="peligro" data-act="combate"><span>${BESTIARIO[e.amenaza].e}</span>Combate</button>` : "",
    e.servicios ? `<button data-act="servicios"><span>🍺</span>Servicios</button>` : "",
    `<button data-act="mochila"><span>🎒</span>Mochila</button>`,
    `<button data-act="ajustes"><span>⚙️</span>Ajustes</button>`,
  ];
  $("#barra-acc").innerHTML = bot.join("");
}

/* ---------- chat ---------- */
function addMsg(m, sinRender = false) {
  m.id = uid();
  S.chat.push(m);
  if (!sinRender) renderChat();
  return m;
}
function addSistema(texto) {
  addMsg({ who: "sistema", text: texto });
}

function ofertaHTML(m) {
  const o = m.oferta;
  const rec = recompensaMision(o, S);
  const nivRec = o.tipo === "combate" ? BESTIARIO[o.objetivo.monstruo].nivelMin : Math.max(1, o.dif * 2 - 1);
  const botones =
    o.estado === "pendiente"
      ? `<div class="oferta-btns"><button class="btn" data-act="aceptar" data-id="${m.id}">Aceptar</button><button class="btn sec" data-act="rechazar" data-id="${m.id}">Ahora no</button></div>`
      : `<div class="oferta-est">${o.estado === "aceptada" ? "✅ Misión aceptada" : "✖ Rechazada"}</div>`;
  return `<div class="oferta">
    <b>📜 Nueva misión · ${E(o.titulo)}</b>
    <p>${E(o.resumen)}</p>
    <small>${"★".repeat(o.dif)} · Nivel recomendado ${nivRec} · Recompensa ≈ ${rec.xp} XP y ${rec.oro} 🪙</small>
    ${botones}</div>`;
}

function msgHTML(m) {
  if (m.who === "sistema") return `<div class="msg sis">${fmt(m.text)}</div>`;
  const jug = m.who === "jugador";
  const av = jug ? pjDe(S).emoji : m.who === "narrador" ? "📖" : RAZAS[m.raza] ? RAZAS[m.raza].e : "🧑";
  const sug = m.hecho ? " sug" : "";
  const ico = m.anotado ? "✅" : "📜";
  const tit = m.hecho ? "Anotar en la hoja de acontecimientos (hay un dato clave sugerido)" : "Anotar en la hoja de acontecimientos";
  return `<div class="msg ${m.who}">
    <div class="av">${av}</div>
    <div class="cuerpo">
      <div class="nombre">${E(m.name || "")}</div>
      <div class="globo">${fmt(m.text)}</div>
      <div class="acc"><button class="ico${sug}" data-act="anotar" data-id="${m.id}" title="${tit}" aria-label="${tit}">${ico}</button></div>
      ${m.oferta ? ofertaHTML(m) : ""}
    </div></div>`;
}

function renderChat() {
  const el = $("#chat");
  const typing = busy ? `<div class="msg npc"><div class="av">…</div><div class="cuerpo"><div class="globo escribiendo"><span></span><span></span><span></span></div></div></div>` : "";
  el.innerHTML = S.chat.map(msgHTML).join("") + typing;
  el.scrollTop = el.scrollHeight;
}

/* ---------- enviar mensaje ---------- */
function mostrarTag(o) {
  if (!o || o.delta === 0) return;
  const et = ETIQUETAS[o.tag];
  const txt =
    o.tipo === "virtud" ? `+${o.delta} XP · ${et.e} ${et.n} — fiel a tu historia`
    : o.tipo === "defecto" ? `+${o.delta} XP · ${et.e} ${et.n} — tus defectos también te hacen humano`
    : `${o.delta} XP · ${et.e} ${et.n} — traicionas tu historia`;
  toast(txt, o.tipo === "prohibido" ? "mal" : o.tipo === "virtud" ? "ok" : "mid");
}

function revelarDebilidad(d, quien) {
  const b = BESTIARIO[d.monstruo];
  S.conocido[d.monstruo] = Object.assign({ visto: false }, S.conocido[d.monstruo], { debil: true });
  S.diario.unshift({ id: uid(), texto: `Debilidad: ${b.n} → ${ELEMENTOS[d.elemento].e} ${ELEMENTOS[d.elemento].n}.`, fuente: quien, nivel: S.nivel, ts: Date.now() });
  toast(`🔍 Debilidad descubierta: ${b.n} — ${ELEMENTOS[d.elemento].e} ${ELEMENTOS[d.elemento].n}`, "gold");
}

function mostrarMisionCompleta(q) {
  toast(`✅ Misión completada: ${q.titulo} (+${q.xp} XP, +${q.oro} 🪙)`, "gold");
  S.chat.push({ id: uid(), who: "sistema", text: `✅ Misión completada: «${q.titulo}». +${q.xp} XP, +${q.oro} 🪙.` });
}

function aplicarRespuesta(r, npc, texto) {
  const hist = npc ? npc.hist : S.histNarrador;
  hist.push({ role: "user", content: texto }, { role: "assistant", content: r._raw });
  while (hist.length > 10) hist.shift();
  const msg = { who: npc ? "npc" : "narrador", npcId: npc ? npc.id : null, name: npc ? npc.nombre : "Narrador", raza: npc ? npc.raza : null, text: r.texto, hecho: r.hecho };
  if (npc) {
    npc.actitud = clamp(npc.actitud + r.actitud, -5, 5);
    if (r.recuerda) { npc.hechos.push(r.recuerda); while (npc.hechos.length > 8) npc.hechos.shift(); }
    if (r.mision && misionesActivas(S).length < 3 && !S.misiones.some((m) => m.titulo === r.mision.titulo)) {
      msg.oferta = Object.assign({}, r.mision, { estado: "pendiente" });
      npc.ofrecidas = (npc.ofrecidas || 0) + 1;
    }
  }
  addMsg(msg, true);
  for (const t of r.tags) { registrarRasgo(S, t); const o = otorgarTag(S, t); if (o) mostrarTag(o); }
  if (r.debil) revelarDebilidad(r.debil, msg.name);
  if (r.encuentro) {
    S.escena.amenaza = r.encuentro;
    addMsg({ who: "sistema", text: `⚔️ ${BESTIARIO[r.encuentro].e} ${BESTIARIO[r.encuentro].n} aparece. Pulsa «Combate» cuando estés listo.` }, true);
  }
  if (npc) progresoHablar(S, npc).forEach(mostrarMisionCompleta);
  renderTodo();
}

async function enviar(texto) {
  texto = (texto || "").trim();
  if (!texto || busy) return;
  const dest = S.destino;
  const npc = dest && dest !== "narrador" ? S.escena.npcs.find((n) => n.id === dest) : null;
  if (!npc && dest !== "narrador") { toast("Elige con quién hablar."); return; }
  const p = pjDe(S);
  const mj = addMsg({ who: "jugador", name: p.corto, text: texto });
  setBusy(true);
  try {
    const qe = npc && S.misiones.find((q) => q.estado === "activa" && q.tipo === "enigma" && q.giver && norm(npc.nombre).includes(norm(q.giver).split(" ")[0]));
    if (qe && respuestaEnigma(qe, texto)) {
      completarMision(S, qe);
      mostrarMisionCompleta(qe);
      renderTodo();
      return;
    }
    const r = await iaDialogar(npc, texto, S);
    aplicarRespuesta(r, npc, texto);
  } catch (e) {
    S.chat = S.chat.filter((m) => m.id !== mj.id);
    $("#msg").value = texto;
    addSistema(`⚠️ ${e.message || e}`);
    toast("No se pudo obtener respuesta. Revisa tus ajustes de IA.", "mal");
  } finally {
    setBusy(false);
    guardar();
  }
}

/* =========================================================
   Hoja de acontecimientos: anotar desde el chat
   ========================================================= */
function abrirNota(msgId) {
  const m = S.chat.find((x) => x.id === msgId);
  if (!m) return;
  const sug = (m.hecho || m.text || "").slice(0, 300);
  hojaCtx = { tipo: "nota", msgId, fuente: m.name || "Conversación" };
  abrirHoja("📜 Anotar en la hoja de acontecimientos", `
    <p class="dim">Fuente: <b>${E(hojaCtx.fuente)}</b>${m.hecho ? " · dato clave sugerido" : ""}. Edítalo si quieres quedarte solo con lo importante.</p>
    <textarea id="nota-texto" rows="5" maxlength="400">${E(sug)}</textarea>
    <div class="fila"><button class="btn" data-act="guardar-nota">Guardar en la hoja</button><button class="btn sec" data-act="cerrar">Cancelar</button></div>`);
}

function guardarNota(texto, fuente, msgId) {
  texto = (texto || "").trim();
  if (!texto) return false;
  S.diario.unshift({ id: uid(), texto: texto.slice(0, 400), fuente: fuente || "Nota", nivel: S.nivel, ts: Date.now() });
  const m = S.chat.find((x) => x.id === msgId);
  if (m) m.anotado = true;
  return true;
}

/* =========================================================
   Mochila: objetos, hoja, misiones, personaje, bestiario
   ========================================================= */
const TABS = [["objetos", "🎒 Objetos"], ["hoja", "📜 Hoja"], ["misiones", "🧭 Misiones"], ["hazanas", "🏆 Hazañas"], ["pj", "🧙 Personaje"], ["bestiario", "👹 Bestiario"]];

function abrirMochila(tab = "objetos") {
  hojaCtx = { tipo: "mochila", tab };
  const tabs = `<div class="tabs">${TABS.map(([id, n]) => `<button class="tab ${id === tab ? "sel" : ""}" data-act="tab" data-id="${id}">${n}</button>`).join("")}</div>`;
  abrirHoja("🎒 Mochila", tabs + `<div id="tab-cuerpo">${tabHTML(tab)}</div>`);
}

function tabHTML(tab) {
  if (tab === "objetos") {
    const p = pjDe(S);
    const items = Object.keys(OBJETOS).filter((id) => S.inv[id] > 0).map((id) => {
      const o = OBJETOS[id];
      const usable = id === "pocion" || id === "elixir";
      return `<li><span>${o.e} <b>${E(o.n)}</b> ×${S.inv[id]}<small>${E(o.desc)}</small></span>${usable ? `<button class="btn peq" data-act="usar" data-id="${id}">Usar</button>` : ""}</li>`;
    }).join("");
    return `<p>🪙 <b>${S.oro}</b> monedas</p>
      <ul class="lista obj">${items || "<li class='dim'>Tu mochila está vacía.</li>"}</ul>
      <h4>Equipo</h4><p>⚔️ ${E(p.arma.n)} (+${p.arma.bono} ataque)<br>🛡️ ${E(p.armadura.n)} (−${p.armadura.red} daño recibido)</p>`;
  }
  if (tab === "hoja") {
    const items = S.diario.map((d) => `
      <li class="nota"><div>${fmt(d.texto)}</div><small>${E(d.fuente)} · Nv ${d.nivel}</small><button class="x" data-act="borrar-nota" data-id="${d.id}" aria-label="Borrar nota">✕</button></li>`).join("");
    return `<p class="dim">Tu hoja de acontecimientos: pistas, nombres y promesas que no quieres olvidar. Usa el icono 📜 bajo cualquier globo del chat para enviar un dato aquí.</p>
      <div class="fila"><input id="nota-libre" type="text" maxlength="200" placeholder="Escribe una nota propia…"><button class="btn peq" data-act="nota-libre">Añadir</button></div>
      <ul class="lista notas">${items || "<li class='dim'>Aún no has anotado nada.</li>"}</ul>`;
  }
  if (tab === "misiones") {
    const act = S.misiones.filter((m) => m.estado === "activa");
    const hechas = S.misiones.filter((m) => m.estado === "completada");
    const card = (q) => {
      let detalle = "";
      if (q.tipo === "combate") detalle = `<p>🎯 ${BESTIARIO[q.objetivo.monstruo].e} ${E(BESTIARIO[q.objetivo.monstruo].n)}: ${q.objetivo.hechas}/${q.objetivo.cant}</p>`;
      else if (q.tipo === "hablar") detalle = `<p>🗣️ Habla con <b>${E(q.objetivo.npc)}</b>.</p>`;
      else detalle = `<p>❓ <i>${E(q.objetivo.pregunta)}</i></p>${q.objetivo.pista ? `<small class="dim">Pista: ${E(q.objetivo.pista)}</small>` : ""}
        <div class="fila"><input id="resp-${q.id}" type="text" placeholder="Tu respuesta…" maxlength="80"><button class="btn peq" data-act="responder" data-id="${q.id}">Responder</button></div>`;
      return `<li class="mision"><b>${E(q.titulo)}</b> <span class="est">${"★".repeat(q.dif)}</span><p>${E(q.resumen)}</p>${detalle}<small>De ${E(q.giver || "?")} · ${q.xp} XP · ${q.oro} 🪙</small></li>`;
    };
    return `<h4>Activas (${act.length}/5)</h4><ul class="lista">${act.map(card).join("") || "<li class='dim'>Habla con la gente: las aventuras surgen de las conversaciones.</li>"}</ul>
      ${hechas.length ? `<h4>Completadas</h4><ul class="lista">${hechas.map((q) => `<li class="dim">✅ ${E(q.titulo)}</li>`).join("")}</ul>` : ""}`;
  }
  if (tab === "hazanas") {
    const fam = Object.keys(S.rasgos || {}).filter((t) => S.rasgos[t] >= 3 && FAMA[t]).map((t) => `<span class="chip">${ETIQUETAS[t].e} ${E(FAMA[t][0])}</span>`).join(" ");
    const li = (S.hazanas || []).map((h) => `<li><b>${{ victoria: "⚔️", mision: "🧭", huida: "🏃", derrota: "💀", nivel: "⬆️", rasgo: "🎭" }[h.tipo] || "🏆"}</b> ${E(h.texto)}<small>Nv ${h.nivel} · ${E(h.lugar || "")}${h.dif ? " · la noticia ya corre por " + h.dif + (h.dif === 1 ? " lugar" : " lugares") : ""}</small></li>`).join("");
    return `<p class="dim">Tus hazañas: los NPC las conocen y las comentan. Las grandes se saben pronto y viajan lejos; las pequeñas, solo donde ocurrieron.</p>
      ${fam ? `<p>Fama: ${fam}</p>` : ""}<ul class="lista">${li || "<li class='dim'>Aún no has hecho nada digno de contarse.</li>"}</ul>`;
  }
  if (tab === "pj") {
    const p = pjDe(S);
    const st = S.stats;
    return `<p class="apodo">${p.emoji} ${E(p.nombre)} · ${E(p.apodo)}</p>
      <p>Nivel <b>${S.nivel}</b> · ✨ ${S.xp}/${xpNecesaria(S.nivel)} XP · Victorias: ${S.victorias || 0}</p>
      <div class="stats"><span>💪 Fuerza ${st.fue}</span><span>🏃 Destreza ${st.des}</span><span>🧠 Mente ${st.int}</span><span>❤️ Voluntad ${st.vol}</span></div>
      <h4>Tu historia</h4><p>${E(p.historia)}</p>
      <h4>Tu código</h4>
      <div class="codigo"><span class="lbl">Virtudes</span>${chipsCodigo(p.virtudes, "ok")}</div>
      <div class="codigo"><span class="lbl">Defectos</span>${chipsCodigo(p.defectos, "mid")}</div>
      <div class="codigo"><span class="lbl">Traiciones</span>${chipsCodigo(p.prohibido, "mal")}</div>
      <h4>Habilidades</h4><ul class="lista">${p.habilidades.map((h) => `<li>${h.e} <b>${E(h.n)}</b> (${h.coste} ⚡) — ${E(h.desc)}</li>`).join("")}</ul>`;
  }
  /* bestiario */
  return `<p class="dim">Habla con la gente, examina a los monstruos o pruébalo todo en combate para descubrir sus puntos débiles.</p>
    <ul class="lista">${Object.keys(BESTIARIO).map((id) => {
      const b = BESTIARIO[id];
      const k = S.conocido[id];
      if (!k || (!k.visto && !k.debil)) return `<li class="dim">❓ Criatura desconocida</li>`;
      const deb = k.debil ? (b.debil ? `${ELEMENTOS[b.debil].e} ${ELEMENTOS[b.debil].n}` : "ninguno evidente") : "❓";
      const res = k.resiste ? (b.resiste ? `${ELEMENTOS[b.resiste].e} ${ELEMENTOS[b.resiste].n}` : "ninguna") : "❓";
      return `<li><b>${b.e} ${E(b.n)}</b><small>${E(b.desc)}</small><small>Débil a: ${deb} · Resiste: ${res}</small>${k.debil ? `<small>💡 ${E(b.pista)}</small>` : ""}</li>`;
    }).join("")}</ul>`;
}

function refrescarTab() {
  if (hojaCtx && hojaCtx.tipo === "mochila") {
    const cont = $("#tab-cuerpo");
    if (cont) cont.innerHTML = tabHTML(hojaCtx.tab);
  }
}

function usarObjeto(id) {
  if (!(S.inv[id] > 0)) return;
  if (id === "pocion") {
    if (S.hp >= hpMax(S)) return toast("Ya tienes la vida completa.");
    S.hp = Math.min(hpMax(S), S.hp + 15 + 3 * S.nivel);
  } else if (id === "elixir") {
    if (S.pm >= pmMax(S)) return toast("Ya tienes la energía completa.");
    S.pm = Math.min(pmMax(S), S.pm + 8);
  } else return;
  S.inv[id]--;
  toast(`${OBJETOS[id].e} Has usado ${OBJETOS[id].n.toLowerCase()}.`);
  renderHUD();
  refrescarTab();
  guardar();
}

/* ---------- servicios ---------- */
function abrirServicios() {
  const sv = S.escena.servicios;
  if (!sv) return;
  hojaCtx = { tipo: "servicios" };
  let html = `<p>🪙 <b>${S.oro}</b> monedas</p>`;
  if (sv.descanso > 0) html += `<button class="btn grande" data-act="descansar">🛏️ Descansar y recuperarte (${sv.descanso} 🪙)</button>`;
  if (sv.tienda) {
    html += `<h4>Tienda</h4><ul class="lista obj">${Object.keys(OBJETOS).map((id) => {
      const o = OBJETOS[id];
      return `<li><span>${o.e} <b>${E(o.n)}</b><small>${E(o.desc)}</small></span><button class="btn peq" data-act="comprar" data-id="${id}">${o.precio} 🪙</button></li>`;
    }).join("")}</ul>`;
  }
  abrirHoja(`${S.escena.emoji} Servicios`, html);
}

function descansar() {
  const sv = S.escena.servicios;
  if (!sv || !(sv.descanso > 0)) return;
  if (S.oro < sv.descanso) return toast("No te alcanza el dinero.", "mal");
  S.oro -= sv.descanso;
  S.hp = hpMax(S);
  S.pm = pmMax(S);
  cerrarHoja();
  addSistema("🛏️ Duermes unas horas en un colchón que ha visto cosas. Despiertas con la vida y la energía al máximo.");
  renderHUD();
  guardar();
}

function comprar(id) {
  const o = OBJETOS[id];
  if (!o) return;
  if (S.oro < o.precio) return toast("No te alcanza el dinero.", "mal");
  S.oro -= o.precio;
  S.inv[id] = (S.inv[id] || 0) + 1;
  toast(`${o.e} Compras ${o.n.toLowerCase()}.`);
  renderHUD();
  abrirServicios();
  guardar();
}

/* ---------- misiones: aceptar / rechazar / enigma ---------- */
function decidirOferta(msgId, acepta) {
  const m = S.chat.find((x) => x.id === msgId);
  if (!m || !m.oferta || m.oferta.estado !== "pendiente") return;
  if (acepta) {
    const q = aceptarMision(S, m.oferta, m.name, m.npcId);
    if (!q) return toast("Ya tienes demasiadas misiones activas (máx. 5) o esta ya está en curso.", "mal");
    m.oferta.estado = "aceptada";
    const g = m.npcId ? buscarNPC(S, m.npcId) : null;
    if (g) { g.mem = g.mem || {}; g.mem.ganado = g.mem.ganado || {}; if (!g.mem.ganado.aceptar) { g.mem.ganado.aceptar = 1; g.actitud = clamp(g.actitud + 1, -5, 5); } }
    toast(`🧭 Misión aceptada: ${q.titulo}`, "ok");
  } else m.oferta.estado = "rechazada";
  renderChat();
  guardar();
}

function responderMision(id) {
  const q = S.misiones.find((x) => x.id === id);
  const inp = $("#resp-" + id);
  if (!q || !inp) return;
  if (respuestaEnigma(q, inp.value)) {
    completarMision(S, q);
    mostrarMisionCompleta(q);
    renderHUD();
    renderChat();
    refrescarTab();
    guardar();
  } else {
    toast("No es la respuesta correcta... piénsalo otra vez.", "mal");
  }
}

/* ---------- viajar ---------- */
function questNudge(esc) {
  if (esc.amenaza || SIN_PELIGRO.includes(esc.tipo)) return;
  const objs = misionesActivas(S).filter((q) => q.tipo === "combate" && q.objetivo.hechas < q.objetivo.cant);
  if (objs.length && Math.random() < 0.6) esc.amenaza = objs[0].objetivo.monstruo;
}

function abrirMovimiento() {
  const e = S.escena;
  hojaCtx = { tipo: "mover" };
  const salidas = e.salidas.map((s, i) => `<button class="btn grande sec" data-act="ir" data-id="${i}">${EMOJI_TIPO[s.tipo] || "📍"} ${E(s.texto)}</button>`).join("");
  const volver = e.id !== "jarra" && !e.salidas.some((s) => s.tipo === "taberna") ? `<button class="btn grande sec" data-act="ir-taberna">🍺 Volver a La Jarra Tuerta</button>` : "";
  abrirHoja("🧭 ¿Adónde vas?", `<div class="col">${salidas}${volver}</div>`);
}

async function viajar(salida) {
  if (busy) return;
  cerrarHoja();
  setBusy(true);
  try {
    if (S.escena.id === "jarra") S.jarra = clonar(S.escena);
    let esc;
    if (salida.tipo === "taberna") esc = S.jarra ? clonar(S.jarra) : clonar(ESCENA_INICIAL);
    else {
      esc = await iaEscena(S, salida);
      questNudge(esc);
    }
    S.escena = prepararEscena(esc);
    S.hazanas.forEach((h) => { h.dif = (h.dif || 0) + 1; }); // las noticias viajan
    entrarEscena(false);
  } catch (e) {
    addSistema(`⚠️ ${e.message || e}`);
    toast("No se pudo crear el lugar. Inténtalo de nuevo.", "mal");
  } finally {
    setBusy(false);
    guardar();
  }
}

/* =========================================================
   INTERFAZ: combate
   ========================================================= */
function abrirCombate(forzar = false) {
  const id = S.escena.amenaza;
  if (!id || !BESTIARIO[id]) return;
  const b = BESTIARIO[id];
  if (!forzar && b.nivelMin > S.nivel) {
    const k = S.conocido[id] || {};
    const pista = k.debil && b.debil
      ? `Sabes que es débil a ${ELEMENTOS[b.debil].e} <b>${ELEMENTOS[b.debil].n}</b>.`
      : "Aún no conoces su punto débil: pregunta por las tabernas o examínalo.";
    hojaCtx = { tipo: "aviso" };
    abrirHoja(`⚠️ ${b.e} ${E(b.n)}`, `
      <p>${E(b.desc)}</p>
      <p>Nivel recomendado: <b>${b.nivelMin}</b> (tú: ${S.nivel}). ${pista}</p>
      <div class="col"><button class="btn grande peligro" data-act="combate-seguro">⚔️ Enfrentarlo igualmente</button>
      <button class="btn grande sec" data-act="cerrar">Mejor no</button></div>`);
    return;
  }
  cerrarHoja();
  combate = crearCombate(S, id);
  S.conocido[id] = Object.assign({ visto: true }, S.conocido[id]);
  $("#combate").hidden = false;
  renderCombate();
}

function renderCombate() {
  const c = combate;
  const p = pjDe(S);
  const b = c.b;
  const k = S.conocido[c.id] || {};
  const deb = k.debil ? (b.debil ? `${ELEMENTOS[b.debil].e} ${ELEMENTOS[b.debil].n}` : "ninguno evidente") : "❓ desconocido";
  const res = k.resiste ? (b.resiste ? `${ELEMENTOS[b.resiste].e} ${ELEMENTOS[b.resiste].n}` : "ninguna") : "❓";
  const log = c.log.slice(-6).map((l) => `<div>${E(l)}</div>`).join("");
  let acciones;
  if (c.fin) {
    let resumen = "";
    if (c.res) {
      if (c.fin === "victoria") resumen = `<div class="res ok"><b>¡Victoria!</b><br>+${c.res.xp} XP · +${c.res.oro} 🪙</div>`;
      else if (c.fin === "derrota") resumen = `<div class="res mal"><b>Has caído...</b><br>Pierdes ${c.res.perdido} 🪙 y despiertas en La Jarra Tuerta.</div>`;
      else resumen = `<div class="res mid"><b>Huida</b><br>Sigues vivo, que ya es mucho.</div>`;
    }
    acciones = `${resumen}<button class="btn grande" data-act="cerrar-combate">Continuar</button>`;
  } else if (c.menuObj) {
    const items = Object.keys(OBJETOS).filter((id) => S.inv[id] > 0).map((id) => `<button class="btn sec" data-act="c-obj" data-id="${id}">${OBJETOS[id].e} ${E(OBJETOS[id].n)} ×${S.inv[id]}</button>`).join("");
    acciones = `<div class="c-grid">${items || "<p class='dim'>No tienes objetos.</p>"}<button class="btn sec" data-act="c-menu">← Volver</button></div>`;
  } else {
    const hab = p.habilidades.map((h) => `<button class="btn" data-act="c-hab" data-id="${h.id}" ${S.pm < h.coste ? "disabled" : ""}>${h.e} ${E(h.n)} <small>${h.coste}⚡</small></button>`).join("");
    acciones = `<div class="c-grid">
      <button class="btn" data-act="c-atacar">⚔️ Atacar</button>
      <button class="btn" data-act="c-defender">🛡️ Defender</button>
      ${hab}
      <button class="btn sec" data-act="c-menu">🎒 Objeto</button>
      <button class="btn sec" data-act="c-examinar">🔍 Examinar</button>
      <button class="btn sec" data-act="c-huir">🏃 Huir</button></div>`;
  }
  $("#combate").innerHTML = `
    <div class="c-mon"><div class="c-emoji ${c.hp <= 0 ? "caido" : ""}">${b.e}</div>
      <h2>${E(b.n)}</h2>
      ${barra(c.hp, c.hpMax, "rojo")}<small>${c.hp}/${c.hpMax} · Débil a: <b>${deb}</b> · Resiste: ${res}</small>
      ${!c.fin && c.intent ? `<div class="c-intent">⚠️ ${E(c.intent)} <small>(¡Defiéndete!)</small></div>` : ""}
    </div>
    <div class="c-log" id="c-log">${log}</div>
    <div class="c-jug"><div><span>${p.emoji} ❤️ ${S.hp}/${hpMax(S)}</span>${barra(S.hp, hpMax(S), "rojo")}</div><div><span>⚡ ${S.pm}/${pmMax(S)}</span>${barra(S.pm, pmMax(S), "azul")}</div>${c.venenoT > 0 ? "<small>☠️ Envenenado</small>" : ""}</div>
    <div class="c-acc">${acciones}</div>`;
  const lg = $("#c-log");
  if (lg) lg.scrollTop = lg.scrollHeight;
}

function accionCombate(acc) {
  if (!combate || combate.fin) return;
  const r = turnoJugador(S, combate, acc);
  if (r && r.invalida) return toast(r.msg || "No puedes hacer eso.", "mal");
  combate.menuObj = false;
  if (combate.fin) finalizarCombate();
  renderHUD();
  renderCombate();
  guardar();
}

function finalizarCombate() {
  const c = combate;
  if (c.resuelto) return;
  c.resuelto = true;
  if (c.fin === "victoria") {
    c.res = resolverVictoria(S, c);
    if (c.res.tag) mostrarTag(c.res.tag);
    c.res.misiones.forEach(mostrarMisionCompleta);
    const sigue = misionesActivas(S).some((q) => q.tipo === "combate" && q.objetivo.monstruo === c.id);
    if (!sigue) S.escena.amenaza = null;
    S.chat.push({ id: uid(), who: "sistema", text: `${c.b.e} Derrotas a ${c.b.n}. +${c.res.xp} XP, +${c.res.oro} 🪙.` });
  } else if (c.fin === "derrota") {
    c.res = resolverDerrota(S);
    registrarHazana(S, { tipo: "derrota", clave: c.id, peso: 1, texto: `Caíste ante ${c.b.n}.` });
  } else if (c.fin === "huida") {
    const t = otorgarTag(S, "cobardia");
    if (t) mostrarTag(t);
    c.res = {};
    if (c.b.nivelMin >= 2) registrarHazana(S, { tipo: "huida", clave: c.id, peso: 1, texto: `Huiste de ${c.b.n}.` });
  }
}

function cerrarCombate() {
  if (!combate) return;
  const fin = combate.fin;
  combate = null;
  $("#combate").hidden = true;
  if (fin === "derrota") {
    if (S.escena.id === "jarra") S.escena.amenaza = null; // ya estás en la taberna: conservas a sus clientes
    else S.escena = prepararEscena(S.jarra ? clonar(S.jarra) : clonar(ESCENA_INICIAL));
    entrarEscena(false);
    addSistema("Despiertas en La Jarra Tuerta con un chichón y la bolsa más ligera. Brunilda dice que el vendaje se paga aparte.");
  } else {
    renderTodo();
  }
  guardar();
}

/* =========================================================
   Ajustes y partida
   ========================================================= */
function abrirAjustes() {
  hojaCtx = { tipo: "ajustes" };
  const hay = !!cargarPartida();
  abrirHoja("⚙️ Ajustes", `
    <h4>Inteligencia artificial</h4>
    <p class="dim">Usas <b>tu propia clave</b>. Se guarda solo en este dispositivo (localStorage) y se envía únicamente al proveedor que elijas. Nunca la subas a GitHub.</p>
    <label>Proveedor
      <select id="aj-modo">
        <option value="demo" ${AJUSTES.modo === "demo" ? "selected" : ""}>🧪 Demo (sin IA)</option>
        <option value="anthropic" ${AJUSTES.modo === "anthropic" ? "selected" : ""}>🤖 Anthropic (Claude)</option>
        <option value="openai" ${AJUSTES.modo === "openai" ? "selected" : ""}>🤖 OpenAI</option>
      </select></label>
    <label>Modelo (vacío = por defecto)
      <input id="aj-modelo" type="text" placeholder="${E(MODELOS_DEFECTO.anthropic)} / ${E(MODELOS_DEFECTO.openai)}" value="${E(AJUSTES.modelo)}" autocapitalize="off" autocomplete="off"></label>
    <label>Clave de API
      <input id="aj-clave" type="password" placeholder="sk-..." value="${E(AJUSTES.clave)}" autocomplete="off" autocapitalize="off"></label>
    <div class="fila"><button class="btn" data-act="aj-guardar">Guardar</button><button class="btn sec" data-act="aj-probar">Probar conexión</button></div>
    <p id="aj-estado" class="dim"></p>
    <h4>Partida</h4>
    <div class="col">
      <button class="btn sec" data-act="exportar" ${hay ? "" : "disabled"}>⬇️ Exportar partida</button>
      <button class="btn sec" data-act="importar">⬆️ Importar partida</button>
      <button class="btn sec peligro" data-act="reiniciar">🗑️ Borrar partida y volver al inicio</button>
    </div>`);
}

function leerAjustesForm() {
  AJUSTES.modo = $("#aj-modo").value;
  AJUSTES.modelo = $("#aj-modelo").value.trim();
  AJUSTES.clave = $("#aj-clave").value.trim();
}

function exportarPartida() {
  const s = S || cargarPartida();
  if (!s) return;
  const blob = new Blob([JSON.stringify(s, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leyendas-partida.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function importarPartida(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const o = JSON.parse(rd.result);
      if (!o || o.v !== 1 || !PERSONAJES.some((p) => p.id === o.pj) || !o.escena) throw new Error("formato");
      localStorage.setItem(CLAVE_PARTIDA, JSON.stringify(o));
      cerrarHoja();
      continuarPartida();
      toast("Partida importada.", "ok");
    } catch (e) {
      toast("El archivo no es una partida válida.", "mal");
    }
  };
  rd.readAsText(file);
}

/* =========================================================
   Eventos
   ========================================================= */
function onClick(ev) {
  const b = ev.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act;
  const id = b.dataset.id;
  switch (act) {
    /* inicio */
    case "continuar": return continuarPartida();
    case "ver-pj": return verPersonaje(id);
    case "empezar": return empezarPartida(id);
    /* juego */
    case "destino": S.destino = id; return renderDestinos();
    case "tema": { const npc = S.escena.npcs.find((n) => n.id === S.destino); const c = npc && sugerenciasTema(npc, S)[+id]; if (c) enviar(c.t); return; }
    case "anotar": return abrirNota(id);
    case "guardar-nota": {
      const ok = guardarNota($("#nota-texto").value, hojaCtx && hojaCtx.fuente, hojaCtx && hojaCtx.msgId);
      if (!ok) return toast("La nota está vacía.");
      cerrarHoja();
      toast("📜 Anotado en tu hoja de acontecimientos.", "ok");
      renderChat();
      return guardar();
    }
    case "cerrar": return cerrarHoja();
    case "aceptar": return decidirOferta(id, true);
    case "rechazar": return decidirOferta(id, false);
    case "mochila": return abrirMochila();
    case "tab": hojaCtx.tab = id; return abrirMochila(id);
    case "usar": return usarObjeto(id);
    case "borrar-nota": S.diario = S.diario.filter((d) => d.id !== id); refrescarTab(); return guardar();
    case "nota-libre": {
      const v = $("#nota-libre").value;
      if (guardarNota(v, "Nota propia")) { refrescarTab(); guardar(); }
      return;
    }
    case "responder": return responderMision(id);
    case "servicios": return abrirServicios();
    case "descansar": return descansar();
    case "comprar": return comprar(id);
    case "mover": return abrirMovimiento();
    case "ir": return viajar(S.escena.salidas[Number(id)]);
    case "ir-taberna": return viajar({ texto: "Volver a La Jarra Tuerta", tipo: "taberna" });
    case "combate": return abrirCombate();
    case "combate-seguro": return abrirCombate(true);
    /* combate */
    case "c-atacar": return accionCombate({ t: "atacar" });
    case "c-defender": return accionCombate({ t: "defender" });
    case "c-hab": return accionCombate({ t: "habilidad", id });
    case "c-examinar": return accionCombate({ t: "examinar" });
    case "c-huir": return accionCombate({ t: "huir" });
    case "c-menu": combate.menuObj = !combate.menuObj; return renderCombate();
    case "c-obj": return accionCombate({ t: "objeto", id });
    case "cerrar-combate": return cerrarCombate();
    /* ajustes */
    case "ajustes": return abrirAjustes();
    case "aj-guardar": leerAjustesForm(); guardarAjustes(); actualizarEtiquetaIA(); $("#aj-estado").textContent = "Guardado. " + etiquetaIA(); return;
    case "aj-probar": return probarIA();
    case "exportar": return exportarPartida();
    case "importar": return $("#archivo").click();
    case "reiniciar":
      if (confirm("¿Borrar la partida guardada? Esta acción no se puede deshacer.")) {
        localStorage.removeItem(CLAVE_PARTIDA);
        S = null;
        cerrarHoja();
        renderInicio();
      }
      return;
  }
}

async function probarIA() {
  leerAjustesForm();
  guardarAjustes();
  actualizarEtiquetaIA();
  const st = $("#aj-estado");
  if (modoIA() === "demo") { st.textContent = "Modo demo: no hace falta conexión."; return; }
  st.textContent = "Probando…";
  try {
    await iaProbar();
    st.textContent = "✅ Conexión correcta con " + etiquetaIA() + ".";
  } catch (e) {
    st.textContent = "❌ " + (e.message || e);
  }
}

function iniciar() {
  cargarAjustes();
  document.addEventListener("click", onClick);
  $("#hoja-cerrar").addEventListener("click", cerrarHoja);
  $("#hoja").addEventListener("click", (ev) => { if (ev.target.id === "hoja") cerrarHoja(); });
  $("#form-msg").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = $("#msg").value;
    $("#msg").value = "";
    enviar(v);
  });
  $("#archivo").addEventListener("change", (ev) => {
    const f = ev.target.files[0];
    if (f) importarPartida(f);
    ev.target.value = "";
  });
  renderInicio();
  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
}
