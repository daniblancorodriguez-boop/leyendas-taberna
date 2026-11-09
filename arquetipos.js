"use strict";
/* =========================================================
   LEYENDAS DE LA TABERNA · contenido de conversación (parte 2)
   Arquetipos de NPC (cualquier personaje generado), reacciones por raza
   y por cada personaje jugable. Capa genérica = red de seguridad.
   ========================================================= */

const ARQ = {};

/* ---------- capa genérica: lo mínimo que cualquier NPC sabe decir ---------- */
ARQ.generico = {
  temas: {
    saludo: [
      { c: { actMin: 4 }, t: ["¡{jugador}! Qué alegría verte otra vez.", "*sonríe de verdad* Ya te echaba de menos, {jugador}."] },
      { c: { actMax: -1 }, t: ["*frunce el ceño* Ah. Tú."] },
      { t: ["Buenas, viajero. ¿Qué te trae por aquí?", "Saludos, {jugador}. Te escucho.", "Hola. ¿En qué puedo ayudarte?"] },
    ],
    despedida: [{ t: ["Hasta la vista, {jugador}. Que el camino te sea leve.", "Cuídate por ahí fuera.", "Adiós. Y vuelve entero."] }],
    hostil: [{ t: ["No tengo nada que decirte. Déjame en paz.", "*aparta la mirada* Se acabó la charla."] }],
    mision_activa: [{ t: ["¿Cómo va «{titulo}»? {progreso}.", "Sigo esperando noticias de «{titulo}»: {progreso}."] }],
    mision_hecha: [{ t: ["Ya me ayudaste bastante, {jugador}. Te lo agradezco de corazón."] }],
    demasiadas_misiones: [{ t: ["Parece que tienes las manos llenas. Termina lo que tienes y hablamos."] }],
    oferta_repetida: [{ t: ["Como te decía..."] }],
    sin_mision: [{ t: ["Por ahora, nada que ofrecerte. Pero gracias por preguntar.", "No necesito nada ahora mismo. El mundo ya es bastante caótico sin mi ayuda."] }],

    monstruo: [{ t: ["Conozco algo de {lista}. Pregúntame por uno en concreto."] }],
    monstruo_desconoce: [{ t: ["De {monstruo} no sé gran cosa. Pregunta a otro.", "Eso se me escapa. No soy experto."] }],
    monstruo_desconfia: [{ t: ["No hablo de eso con desconocidos. Gánate mi confianza."] }],
    monstruo_intro: [{ t: ["Sobre {monstruo}, te diré lo que sé."] }],
    rumores_fin: [{ t: ["Ya te he contado todo lo que sé. Vuelve cuando haya novedades.", "No tengo más noticias, de momento."] }],
    rumor_bloqueado: [{ t: ["Hay algo que sé, pero aún no me fío lo bastante para contarlo."] }],
    rumor_pista_confianza: [{ t: ["(Gánate su confianza con amabilidad, humor o ayudándole.)"] }],
    rumor_eco: [{ t: ["Dicen que alguien acabó con {monstruo} por aquí. Buenas noticias."] }],
    hazanas_ninguna: [{ t: ["No sé gran cosa de ti, {jugador}. Haz algo digno de contarse y ya hablaremos."] }],
    yo_generico: [{ t: ["Encantado, {jugador}."] }],
    afirmar: [{ t: ["Entonces, hecho."] }],
    negar: [{ t: ["Entiendo. Respeto tu decisión."] }],
    oferta_pendiente_si: [{ t: ["Pues acepta la oferta, y manos a la obra."] }],
    oferta_pendiente_no: [{ t: ["Como prefieras. La oferta seguirá ahí."] }],
    no_entiendo: [{ t: ["*ladea la cabeza* No te he entendido. ¿Puedes repetirlo?", "Hmm. ¿Qué quieres decir?", "No sé si te sigo."] }],

    sobre_npc: [
      { una: true, t: ["Me llamo {npc}. Poco más tengo que contar, de momento."], ac: 1 },
      { c: { actMin: 2 }, t: ["Ya me conoces un poco. Pregúntame lo que quieras; si puedo, respondo."] },
      { t: ["Ya te he contado lo esencial."] },
    ],
    secreto_guarda: [{ t: ["Todos tenemos secretos. Los míos se quedan conmigo, por ahora."] }],
    secreto_revela: [{ t: ["Confío en ti, así que te lo diré: hay cosas que no cuento a cualquiera, pero tú pareces de fiar."], ac: 1 }],

    servicios: [{ t: ["Si buscas una cama o provisiones, mira el botón de Servicios. Yo no vendo nada."] }],
    dinero: [{ t: ["El dinero es un tema delicado. Mejor hablamos de otra cosa."] }],
    broma: [{ t: ["*sonríe* Ja. Casi me has hecho gracia.", "No está mal. Sigue practicando."], ac: 1 }],
    amable: [{ t: ["Gracias. Se agradece la cortesía.", "Qué detalle, {jugador}."], ac: 1 }],
    insulto: [{ t: ["Cuida tu lengua o te quedas sin ella."] }],
    amenaza: [{ t: ["No me amenaces. No saldrá bien para ti."] }],

    lugar: [{ t: ["De {lugarX} conozco lo básico. Poco que contar."] }],
    npc: [{ t: ["De {otro} no tengo opinión. Pregúntale a él."] }],
    raza: [{ t: ["Cada raza tiene sus costumbres. Yo juzgo a cada cual por lo que hace."] }],
    cierre_mision: [{ t: ["Gracias por «{titulo}», {jugador}. Te lo agradezco de corazón."] }],
  },
};

/* ---------- tabernero / posadero ---------- */
ARQ.tabernero = {
  temas: {
    saludo: [{ t: ["Pasa, pasa. ¿Qué te sirvo?", "Bienvenido. Siéntate donde quieras, menos en esa silla, que cojea."] }],
    despedida: [{ t: ["Vuelve cuando quieras. Siempre hay sitio en la barra."] }],
    servicios: [{ t: ["Cama: {descanso} monedas. Poción: {pocion}. Pulsa el botón de Servicios y elige."] }],
    dinero: [{ t: ["Aquí no se fía, amigo. Cada cual paga lo suyo."] }],
    broma: [{ t: ["*suelta una carcajada* ¡Ese me lo guardo!"], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Llevo años detrás de esta barra. He visto de todo, y casi todo borracho."], ac: 1 }, { t: ["Ya te lo conté. Lo demás es cuenta aparte."] }],
    no_entiendo: [{ t: ["¿Pides algo o solo hablas? Aquí lo segundo es gratis, pero lo primero no."] }],
  },
  hazanas: {
    victoria: ["He oído que derrotaste a {monstruo}. La primera ronda es mía."],
    mision: ["He oído que cumpliste «{titulo}». Gente así es buena para el negocio."],
  },
};

/* ---------- poeta / bardo / cuentacuentos ---------- */
ARQ.poeta = {
  temas: {
    saludo: [{ t: ["*hace una reverencia teatral* Ah, un nuevo personaje en mi historia.", "¡Entra, forastero! La noche es joven y el verso, travieso."] }],
    despedida: [{ t: ["Parte, pues, y que los versos te acompañen."] }],
    servicios: [{ t: ["Servicios no ofrezco; solo palabras. Pero mira el botón de Servicios si necesitas más prosaico."] }],
    dinero: [{ t: ["El dinero va y viene; las historias, quedan."] }],
    broma: [{ t: ["*se ríe a carcajadas* ¡Eso va a mi repertorio!"], ac: 1 }],
    amable: [{ t: ["*se lleva una mano al corazón* Qué dulzura. Escribiré algo en tu honor."], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Soy {npc}, cantor de lo que otros olvidan. Mi vida es una balada sin final."], ac: 1 }, { t: ["Ya te conté lo esencial. El resto, en la próxima estrofa."] }],
    no_entiendo: [{ t: ["¿Cómo? Mi musa se ha distraído un instante."] }],
  },
  hazanas: {
    victoria: ["Has derrotado a {monstruo}. ¡Eso merece verso, y de los largos!"],
    mision: ["Cumpliste «{titulo}». ¡Ya tengo tema para una canción!"],
  },
};

/* ---------- cazador / mercenario / rastreador ---------- */
ARQ.cazador = {
  temas: {
    saludo: [{ t: ["Sin rodeos. ¿Qué quieres?", "*inclina la cabeza* Habla."] }],
    despedida: [{ t: ["Hasta la próxima. Mantén los ojos abiertos."] }],
    servicios: [{ t: ["Yo no vendo nada. Para eso, el botón de Servicios."] }],
    dinero: [{ t: ["Cobro por adelantado, siempre. Sin excepciones."] }],
    broma: [{ t: ["*medio sonríe* Humor negro. Mi preferido."], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Soy {npc}. Cazo lo que otros temen. No pregunto más."], ac: 1 }, { t: ["Ya sabes bastante. No me gusta hablar de mí."] }],
    no_entiendo: [{ t: ["Frases cortas, por favor. Hechos."] }],
    monstruo_desconfia: [{ t: ["Esa información tiene precio. Gánate mi confianza."] }],
  },
  hazanas: {
    victoria: ["Derrotaste a {monstruo}. Buen trabajo. Pocos pueden decirlo."],
    mision: ["Cumpliste «{titulo}». Eso se agradece."],
  },
};

/* ---------- mercader / buhonero ---------- */
ARQ.mercader = {
  temas: {
    saludo: [{ t: ["¡Amigo mío! ¿Buscas algo? Tengo de todo, incluidas cosas que no sé qué son.", "¡Bienvenido! Mira, mira... ¿una oferta?"] }],
    despedida: [{ t: ["¡Vuelve cuando quieras! Que los precios no suben... demasiado."] }],
    servicios: [{ t: ["¿Comprar? Pulsa el botón de Servicios si estamos en una taberna; yo, por aquí, solo hago negocios de palabra."] }],
    dinero: [{ t: ["Regateo con gusto. Pero no te hagas ilusiones: yo regateo mejor."] }],
    broma: [{ t: ["¡Ja! Buen humor. Eso se paga con descuento... futuro."], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Me llamo {npc}. Compro, vendo y, sobre todo, hablo."], ac: 1 }, { t: ["Ya te lo conté. Todo lo demás está a la venta."] }],
    no_entiendo: [{ t: ["¿Cómo? Repítelo, que me he distraído contando monedas."] }],
  },
  hazanas: {
    victoria: ["Derrotaste a {monstruo}. Los caminos más seguros... ¡el comercio sube!"],
    mision: ["Cumpliste «{titulo}». Gente así da confianza. Y a mí, el negocio."],
  },
};

/* ---------- sabio / ermitaño / erudito ---------- */
ARQ.sabio = {
  temas: {
    saludo: [{ t: ["Sé bienvenido, viajero. ¿Qué te inquieta?", "Los caminos traen visitas curiosas. ¿Qué buscas?"] }],
    despedida: [{ t: ["Que la sabiduría te acompañe, aunque no la busques."] }],
    servicios: [{ t: ["No ofrezco servicios, solo consejo. Para lo demás, existe el botón de Servicios."] }],
    dinero: [{ t: ["El oro es útil, pero no responde a los grandes misterios."] }],
    broma: [{ t: ["*sonríe levemente* El humor es una forma de sabiduría. La menos reconocida."], ac: 1 }],
    amable: [{ t: ["La cortesía es el primer paso de la sabiduría. Gracias."], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Soy {npc}. He vivido mucho y entendido poco. Es la proporción habitual."], ac: 1 }, { t: ["Ya te lo conté. El resto, la vida te lo irá enseñando."] }],
    no_entiendo: [{ t: ["Interesante... pero no te comprendo. ¿Puedes explicarlo de otra forma?"] }],
  },
  hazanas: {
    victoria: ["Has derrotado a {monstruo}. La fuerza es útil; la prudencia, mejor."],
    mision: ["Cumpliste «{titulo}». Algo se ha movido en el mundo, y tú lo moviste."],
  },
};

/* ---------- artesano / minero / herrero ---------- */
ARQ.artesano = {
  temas: {
    saludo: [{ t: ["*levanta la vista del trabajo* ¿Qué necesitas?", "Habla. Mientras, sigo trabajando."] }],
    despedida: [{ t: ["Hasta la vista. Que no se te rompa nada importante."] }],
    servicios: [{ t: ["Yo trabajo la piedra y el metal. Para lo demás, está el botón de Servicios."] }],
    dinero: [{ t: ["El trabajo bien hecho se paga. Lo demás, es charla."] }],
    broma: [{ t: ["*gruñe, divertido* No está mal. Para un blando."], ac: 1 }],
    sobre_npc: [{ una: true, t: ["Soy {npc}. Trabajo con las manos. Ya está."], ac: 1 }, { t: ["Poco más que contar. Mis obras hablan por mí."] }],
    no_entiendo: [{ t: ["No te entiendo. Habla claro."] }],
  },
  hazanas: {
    victoria: ["Derrotaste a {monstruo}. Hay que tener callo para eso."],
    mision: ["Cumpliste «{titulo}». Obra bien hecha."],
  },
};

/* ---------- opiniones sobre cada personaje jugable (cualquier NPC) ---------- */
const PJ_OPS = {
  aldric: [
    "{jugador}, ¿verdad? Un paladín en una taberna. Raro, pero no desagradable.",
    "Se nota que llevas el peso de algo grande en la espalda, caballero.",
  ],
  lyra: [
    "{jugador}... una hechicera exiliada. Aquí no preguntamos, pero te vigilamos un poco.",
    "Los magos traen problemas. Pero también soluciones. A ver qué eres tú.",
  ],
  grum: [
    "Un enano con martillo y cara de pocos amigos. Perfecto: en esta casa también somos de pocas palabras.",
    "{jugador}, ¿tú no eres el que anda buscando a alguien? Se te nota en los ojos.",
  ],
  kael: [
    "Dedos de Plata, dicen. Mantendré la bolsa bien apretada.",
    "Un ladrón noble. No sé si es oxímoron o apuesta. Me quedo con las manos a la vista.",
  ],
  elowen: [
    "Una guardabosques. El camino no tiene secretos para ti, ¿no?",
    "Elowen, ¿verdad? Los bosques cuentan que andas por ellos a menudo.",
  ],
  rufo: [
    "Un bardo, y con cascabeles. Que no suenen cuando yo duerma.",
    "Rufo Cascabel, ¿cierto? Dicen que has muerto más veces de las que cantas. Interesante.",
  ],
};

/* ---------- reacciones por raza: RAZA_OPS[razaDelNPC][razaDelJugador] ---------- */
const RAZA_OPS = {
  enano: {
    enano: "Un hermano de barba. Eso se agradece: aquí hay poca gente seria.",
    elfo: "*resopla* Un elfo. Mucha pose, poca fuerza. Pero, mientras no toques mi cerveza, bien.",
    humano: "Un humano. Duran poco, pero hacen ruido. Siéntate.",
    mediano: "Un mediano. Conozco a uno que bebe más que tú. Y eso es mucho.",
    orco: "Un orco. Nada personal, pero vigilaré tu cuchillo.",
  },
  elfo: {
    enano: "Un enano. Huele a hierro y a cerveza. Ya sabes lo que pienso.",
    elfo: "Un hermano de sangre. Aquí hay pocos de los nuestros.",
    humano: "Un humano: vivirás menos de lo que tardo yo en afilar un arco.",
    mediano: "Un mediano. Curiosos y rápidos. Eso sí lo respeto.",
    orco: "Un orco. Curioso verte por aquí. No te juzgo. Aún.",
  },
  humano: {
    enano: "Un enano. Buen herrero, mal humor. Siéntate.",
    elfo: "Un elfo. Bonito perfil. Precio de la cerveza: el mismo que para los demás.",
    humano: "Un humano más, aunque con cara de tener algo que contar.",
    mediano: "Un mediano. ¡Lo que faltaba para animar la noche!",
    orco: "Un orco. No hay problema mientras no haya problema.",
  },
  mediano: {
    enano: "¡Un enano! Perfecto, siempre quise ver cómo se mide uno con la cerveza.",
    elfo: "Un elfo. Qué alto. Y qué serio.",
    humano: "Un humano. Cuéntame algo, que las historias son mi pan.",
    mediano: "¡Otro mediano! La noche promete.",
    orco: "Un orco. ¿Cantas? Siempre quise un orco que cantara.",
  },
  orco: {
    enano: "Un enano. La mayoría me teme. Tú no pareces temer a nadie.",
    elfo: "Un elfo. Pocos de los tuyos me hablan sin hacer una mueca.",
    humano: "Un humano. Siéntate. No muerdo. A menos que me provoquen.",
    mediano: "Un mediano. Siempre amables, siempre pequeños. Me caes bien.",
    orco: "Un hermano. Aquí no hay muchos de los nuestros.",
  },
};
