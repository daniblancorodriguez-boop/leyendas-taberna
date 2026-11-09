"use strict";
/* =========================================================
   LEYENDAS DE LA TABERNA · contenido de conversación (parte 1)
   Los 3 NPC de la taberna con contenido completo + reacciones a hazañas.
   Formato de una entrada:  { c: condiciones, t: [variantes], una, ac, h, rev }
   Gana la primera que cumple sus condiciones (ver cumple() en dialogo.js).
   ========================================================= */

/* fama por rasgo: [nombre del rasgo, hazaña al 3.º acto, hazaña al 6.º acto] */
const FAMA = {
  valentia: ["valiente", "Empieza a correr la voz de que no te achicas ante el peligro.", "Se te conoce como alguien que planta cara a lo que otros esquivan."],
  honor: ["de palabra", "Se dice que cumples lo que prometes.", "Tu palabra vale más que un sello real: así lo cuentan por las tabernas."],
  piedad: ["compasivo", "Se comenta que perdonas a quien lo merece.", "Hay quien jura que eres de los que no rematan a un enemigo caído."],
  generosidad: ["generoso", "Se cuenta que no regateas con quien lo necesita.", "Cuentan que tienes la mano abierta y el monedero, un poco menos."],
  astucia: ["astuto", "Se rumorea que piensas antes de actuar.", "Se dice que siempre tienes un plan, y otro de repuesto."],
  lealtad: ["leal", "Dicen que no abandonas a los tuyos.", "Tu lealtad es ya cosa de canción de taberna."],
  curiosidad: ["curioso", "Se comenta que haces preguntas y escuchas las respuestas.", "Dicen que no hay secreto que se te resista... ni rincón que no quieras husmear."],
  humor: ["bromista", "Corre la voz de que haces reír a quien te rodea.", "Tus chistes —buenos o malos— son ya famosos en la región."],
  fe: ["devoto", "Se cuenta que tu fe no se tambalea con facilidad.", "Hay quien asegura que la luz te acompaña en los malos pasos."],
  naturaleza: ["amigo del bosque", "Se dice que respetas la tierra que pisas.", "Dicen que los animales del bosque no te temen."],
  sabiduria: ["sabio", "Se comenta que sabes escuchar y aprender.", "Hay quien te consulta, y no solo por cortesía."],
  engano: ["embaucador", "Algunos murmuran que tus palabras no siempre son del todo ciertas.", "Dicen que más vale contar los dedos después de un trato contigo."],
  codicia: ["codicioso", "Se cuenta que el oro te hace brillar los ojos.", "Se dice que harías casi cualquier cosa por unas monedas."],
  violencia: ["pendenciero", "Corre la voz de que tienes el puño demasiado ligero.", "Se murmura que buscas pelea sin motivo."],
  crueldad: ["cruel", "Algunos hablan de tu trato duro hacia los débiles.", "Hay quien baja la voz cuando te nombra."],
  cobardia: ["precavido", "Se cuenta que has dado la espalda al peligro más de una vez.", "Dicen que tienes el sentido de la huida muy bien afinado."],
  orgullo: ["orgulloso", "Se comenta que te gusta que se hable de ti.", "Dicen que no hay hazaña tuya que no cuentes tú mismo."],
};

/* ---------- los tres NPC de La Jarra Tuerta ---------- */
const CONT = {};

/* ============ BRUNILDA · tabernera enana ============ */
CONT.brunilda = {
  temas: {
    saludo: [
      { c: { hazana: "victoria:goblin", actMin: 2 }, t: ["*deja la jarra de golpe y sonríe de medio lado* ¡Pero si es el que se ha cargado a mis goblins! La primera ronda corre de mi cuenta, {jugador}."] },
      { c: { actMin: 4 }, t: ["¡{jugador}! Mi cliente favorito, que no es decir mucho. Siéntate, que te sirvo lo bueno.", "*sonríe y trata de disimularlo frotando una jarra* Ya era hora. Se te echaba de menos. Un poco."] },
      { c: { actMax: -1 }, t: ["*ni levanta la vista* Si vienes a pagar, bien. Si no, la puerta es la de siempre."] },
      { t: ["¡Por la barba de mi abuelo! ¿Vas a pedir algo o solo a gastar mi aire?", "*alza una ceja* Bienvenido a La Jarra Tuerta. Aquí se paga antes de morir.", "Pasa, siéntate. Si rompes algo, lo cobro; si lo arreglas, también."] },
    ],
    despedida: [
      { c: { actMin: 3 }, t: ["Vuelve entero, {jugador}. Los cadáveres no pagan la cuenta.", "*levanta la jarra* Que la Forja te sea leve. Y vuelve a contármelo."] },
      { t: ["Cierra la puerta, que entra frío. Y si no vuelves, que sea con la cuenta saldada.", "Hasta luego. Se acepta oro, no promesas."] },
    ],
    hostil: [
      { t: ["*golpea la barra con un martillo de madera* Ni una palabra más, hasta que me trates con un poco de decencia.", "Mi paciencia tiene fondo, y acabas de verlo. Fuera de mi vista."] },
    ],
    mision_activa: [
      { c: { actMin: 3 }, t: ["¿Aún con los goblins? Cuéntame, {jugador}: {progreso}. No te vayas a morir antes de cobrar, que sería un desperdicio de recompensa."] },
      { t: ["*sin dejar de fregar* Quedan «{titulo}»: {progreso}. Los goblins no se van a matar solos.", "¿Todavía aquí? {progreso}. No es para pensárselo tanto."] },
    ],
    mision_hecha: [
      { c: { actMin: 3 }, t: ["¿Más trabajo? Ya me has devuelto el barril. Disfruta de la fama. Y de tu cerveza gratis."] },
      { t: ["El barril ya está donde debe. Si quieres otra cosa, pide una jarra y hablamos."] },
    ],
    demasiadas_misiones: [{ t: ["Primero acaba lo que tienes entre manos, {jugador}. Aquí no se acumulan encargos como cerveza caducada."] }],
    oferta_repetida: [{ t: ["*suspira* Te lo repito, que se ve que escuchar no es lo tuyo."] }],
    sin_mision: [{ t: ["Hoy no tengo nada para ti. Pero la barra siempre está abierta."] }],

    monstruo: [{ t: ["Por aquí los que más molestan son {lista}. Pregúntame por cualquiera y te digo lo que sé. Otra cosa es que me interese."] }],
    monstruo_desconoce: [{ t: ["De {monstruo} sé lo que sabe cualquiera: que muerde. Pregunta a quien salga más del pueblo que yo.", "Eso no me suena. Y mira que escucho todo en esta barra."] }],
    monstruo_desconfia: [{ t: ["De {monstruo}, hablo cuando tenga confianza. Antes, tómate una cerveza.", "No me gusta regalar saber. Gánatelo."] }],
    monstruo_intro: [{ t: ["Sobre {monstruo}, te diré lo que sé, que lo he oído de buenas fuentes: clientes borrachos."] }],
    "monstruo:goblin": [
      { c: { hazana: "victoria:goblin" }, t: ["*se inclina* Los goblins... ya los conoces mejor que yo, {jugador}. Les pasa que son listos para robar y tontos para huir. Tú lo sabes."] },
      { t: ["Los goblins son ladrones y cobardes en grupo. No tienen punto débil, solo orgullo mal puesto. Con un par de buenos golpes, se acaba la discusión.", "Verdes, rápidos, con cuchara afilada. Atácales primero, que se cansan antes de lo que parece."] },
    ],
    "monstruo:lobo": [
      { c: { confiado: true }, t: ["Los lobos huargo temen al fuego. Aceite ardiente, antorcha, lo que sea que arda. Eso lo sé porque a mi primo Dorin le salió caro no saberlo.", "Si te los cruzas, quémalos. El fuego les duele el doble y no se lo piensan dos veces."], rev: true, ac: 0, h: "Lobos huargo: débiles al fuego." },
      { t: ["Lobos... grandes, peludos y malhumorados. Cuando me cuentes algo de ti, quizá te cuente cómo espantarlos.", "De lobos hablaremos cuando me traigas un poco de confianza. Y una jarra pagada."], rev: false },
    ],
    "monstruo:ogro": [{ t: ["Los ogros... no los conozco de cerca, gracias a los dioses. Dicen que tienen mala digestión."], rev: false }],

    rumores_fin: [
      { t: ["Rumores, rumores... ya te los he soltado todos. Vuelve cuando haya novedades, o cuando haya más cerveza.", "Se me acabó el cotilleo por hoy. Si quieres más, pregunta a Tobías, que él miente mejor."] },
    ],
    rumor_bloqueado: [{ t: ["*aprieta los labios* Algo sé, pero primero quiero ver qué tal te portas por aquí."] }],
    rumor_pista_confianza: [{ t: ["(A Brunilda le gusta la gente educada: un «gracias» o una ronda ayudan.)"] }],
    rumor_eco: [{ t: ["Dicen por ahí que alguien derrotó a {monstruo}. Y no, no voy a preguntar quién. Aún.", "Por el camino comentan que han acabado con {monstruo}. Los trovadores ya afinan las cuerdas."] }],
    hazanas_ninguna: [{ t: ["¿Hazañas? Lo único que sé de ti es lo que has gastado. Haz algo y ya lo contaré yo, con adornos."] }],
    yo_generico: [{ t: ["Mucho gusto, {jugador}. Yo sirvo, tú pagas."] }],
    afirmar: [{ t: ["Bien. Me gusta la gente que decide rápido.", "*asiente una vez* Trato."] }],
    negar: [{ t: ["Tú sabrás. Yo, mientras, sigo fregando."] }],
    oferta_pendiente_si: [{ t: ["¿Ves? Así se hace. Dale al botón de aceptar y no me hagas repetirlo."] }],
    oferta_pendiente_no: [{ t: ["Bueno. La oferta sigue en pie mientras no cambie de opinión."] }],
    no_entiendo: [{ t: ["*se rasca la barba* No te sigo. ¿Quieres pedir, preguntar o romper algo?", "Habla claro, que mi oído es bueno para el tintineo de monedas, no para acertijos.", "Eso lo vas a tener que repetir. Más despacio. Con más oro."] }],

    sobre_npc: [
      { una: true, t: ["Brunilda Piedragrís. Dueña de esta taberna, del barril, de la barra y de tus deudas. Mi familia lleva tres generaciones sirviendo aquí."], ac: 1 },
      { una: true, c: { actMin: 2 }, t: ["Antes de la taberna, fui cantera. Mi abuelo me enseñó a tallar piedra y a no fiarme de nada que sonara demasiado bonito."] },
      { c: { actMin: 3 }, t: ["Lo que más echo de menos es el Barril del Abuelo. No por la cerveza, que era mala, sino por lo que significa."] },
      { t: ["Ya te he contado lo esencial. Lo demás es privado, y la privacidad en esta casa se cobra aparte."] },
    ],
    secreto_guarda: [{ t: ["*apoya los puños en la barra* ¿Secretos? Todos los que tengo se quedan aquí detrás. Gánate mi confianza y quizá..."] }],
    secreto_revela: [
      { una: true, t: ["*mira alrededor, baja la voz* Está bien. Me robaron el Barril del Abuelo... y no fui a por él porque tuve miedo. Mi abuelo me habría repudiado. Lo digo porque confío en ti, {jugador}."], ac: 2, h: "Brunilda confiesa que no se atrevió a recuperar su barril de los goblins." },
      { t: ["Ya te lo conté. No me hagas repetir cosas que cuestan sudor decirlas."] },
    ],

    servicios: [
      { t: ["Una cama son {descanso} monedas; una poción, {pocion}. Si tienes cuarenta, te cuento algo más. Pulsa el botón de Servicios.", "Servicios: cama, poción, aceite, agua bendita... Dime qué quieres y mira el botón de Servicios; la tienda está ahí."] },
    ],
    dinero: [
      { c: { actMin: 4 }, t: ["Descuento no, que me arruino. Pero te pongo la cerveza sin espuma, que es lo más cerca que llegarás a una oferta."] },
      { t: ["¿Regatear? En esta casa eso se llama «pelea». Paga y calla.", "Fiado no. Ni a ti ni al rey."] },
    ],
    broma: [{ t: ["*tuerce el gesto, pero se le escapa una risa* Cuéntame otro. Pero te cobro el eco.", "Mi humor es seco, como mi cerveza. Pero ese me ha gustado."], ac: 1 }],
    amable: [{ t: ["*carraspea* Vale, vale. Un poco de educación no le hace daño a nadie. Gracias a ti.", "Eres de los buenos, {jugador}. No lo digas muy alto."], ac: 1 }],
    insulto: [{ t: ["*agarra el martillo de madera con aire casual* Repite eso. A ver si tienes la mandíbula tan dura como la lengua.", "Tienes valor. Es lo único que tienes."] }],
    amenaza: [{ t: ["Hmpf. Aquí hay más enanos de los que te gustaría. Baja el tono o te acompaño a la calle, en pedazos pequeños."] }],

    "lugar:taberna": [{ t: ["La Jarra Tuerta aguanta desde antes de que nacieras. Hay una grieta en el techo: no la mires, se ofende."] }],
    "lugar:granero": [{ t: ["El Granero Viejo, a las afueras. Los goblins se han instalado ahí como inquilinos que no pagan. Mi barril está ahí dentro, seguro."] }],
    "lugar:camino": [{ t: ["Los viajeros que vienen por el Camino de los Cuervos cuentan que hay lobos. Los que no vienen, imagino que se los comieron."] }],
    "lugar:bosque": [{ t: ["El bosque lo conoce bien Sylwen. Yo prefiero la bodega: ahí lo peor que me puede pasar es un barril caducado."] }],
    "lugar:cripta": [{ t: ["La cripta... ahí abajo no quiero ni oler. Si vas, pregúntale a Tobías: dice ser descendiente de los guardianes. Y yo digo que bebe demasiado."] }],
    lugar: [{ t: ["De {lugarX} sé poco. Esa es otra mesa y otra cuenta."] }],
    "npc:tobias": [{ t: ["Tobías. Un buen hombre que bebe como un enano y cuenta como un trovador. No me debe nada, que ya me lo pagó con un cuento."] }],
    "npc:sylwen": [{ t: ["Sylwen es dura como la piedra. Cobra por adelantado y no se queja de la herida, aunque se la nota. No la agobies, déjala venir."] }],
    npc: [{ t: ["De {otro} no tengo opinión. Y si la tuviera, te la cobraría."] }],
    "raza:enano": [{ t: ["Los enanos somos gente de piedra y de palabra. Quien dice otra cosa miente o es elfo."] }],
    "raza:elfo": [{ t: ["Los elfos... Mucha pose y poco calor. Pero Sylwen es de las pocas que paga a tiempo, así que algo bueno tendrán."] }],
    "raza:orco": [{ t: ["Los orcos no me han dado problemas. Los goblins, esos sí. Parientes pobres, dicen. Pobres de verdad."] }],
    "raza:humano": [{ t: ["Los humanos son como la cerveza: de buena calidad hasta que fermentan."] }],
    "raza:mediano": [{ t: ["Tobías es mediano, y ya ves. Les gusta mucho el cuento y poco el pago."] }],
    raza: [{ t: ["Cada raza tiene sus cosas. Yo juzgo por cómo pagan."] }],

    cierre_mision: [{ t: ["Hecho está lo de «{titulo}». Gracias, {jugador}."] }],

    /* impresión del personaje al conocerte */
    "pj:aldric": [{ t: ["*te mira de arriba abajo* Un paladín caído. Aquí hemos tenido de esos. Pagan menos y rezan más. Pero siéntate."] }],
    "pj:lyra": [{ t: ["*señala la chimenea* No hagas magia dentro. La última vez que alguien lo intentó, quemó mi alfombra y pagó con una cara de pena."] }],
    "pj:grum": [{ t: ["¡Un enano! Por fin alguien con barba decente. ¿De qué clan? Que si es de los Martillo-Rojo, tengo una cuenta pendiente con tu primo."] }],
    "pj:kael": [{ t: ["*cierra la caja de golpe* Tú. Las manos donde las vea. Sé quién eres y mi caja también."] }],
    "pj:elowen": [{ t: ["Una guardabosques. Bien. Si encuentras bichos en el camino, me los cuentas. Y si no los encuentras, me pagas igual la cerveza."] }],
    "pj:rufo": [{ t: ["¡Un bardo! Si cantas, que sea algo que no haga llorar a los clientes. Y si lloran, que sea por la cerveza."] }],
  },

  /* reacciones propias de Brunilda a tus hazañas */
  hazanas: {
    "victoria:goblin": ["*deja la jarra, se quita el delantal y se cuadra* Mis goblins... ya no. Doscientos años de rencor y los has barrido tú, {jugador}. Hoy no pagas.", "¿Los goblins del granero? ¿Los has derrotado tú? *inclina la cabeza con respeto* Esta casa te debe una."],
    "victoria:lobo": ["Los lobos del camino... ¿has acabado con uno? Dorin se alegrará, el pobre aún no se sienta bien."],
    "victoria:troll": ["¿El troll del puente? ¡Por la barba de mi abuelo! Eso son palabras mayores. Y yo sirviéndote cerveza barata."],
    "victoria:wyvern": ["*suelta la jarra, que rueda sobre la barra* ¿Una wyvern? ¿Tú? Por las barbas de todos mis abuelos... ¡Ronda gratis para toda la casa!"],
    victoria: ["He oído que has derrotado a {monstruo}. Así me gusta: gente que hace cosas y luego paga."],
    "mision:El barril del abuelo": ["El barril... *se le quiebra la voz un instante* Gracias otra vez. No me hagas decirlo más veces."],
    mision: ["Dicen que cumpliste «{titulo}». Con eso se gana buena fama en cualquier taberna."],
    huida: ["Huir de {monstruo}... no es vergüenza, es cálculo. Vivo, pagas; muerto, no."],
    derrota: ["Caíste ante {monstruo}, y aquí estás. La tabernera que no cura heridas no es tabernera: toma, bebe esto."],
    nivel: ["Se te nota más curtido, {jugador}. Eso me gusta. Ya tienes la mirada de quien paga la cuenta."],
    rasgo: ["Se comenta por ahí que eres alguien {rasgo}. Yo solo sirvo; pero lo oigo todo."],
  },
};

/* ============ TOBÍAS · mediano poeta y borracho ============ */
CONT.tobias = {
  temas: {
    saludo: [
      { c: { actMin: 3 }, t: ["*abre los brazos, derramando algo* ¡{jugador}! ¡El único que me escucha hasta el final! Siéntate, que el tercer acto es mejor.", "¡Mi oyente favorito! Hoy cuento la historia de un hombre que... no, espera, esa era la mía."] },
      { c: { hazana: "mision" }, t: ["*te señala con la jarra* ¡Tú! ¡El que hace cosas! Se canta de ti en alguna esquina. Yo mismo, esta noche, a la tercera."] },
      { t: ["*levanta la jarra con solemnidad* Hay historias que solo se cuentan a partir de la tercera. ¿Vas a invitarme a ella?", "Shhh... ¿oyes eso? No. Era mi estómago. Siéntate, extraño.", "¡Un oyente! Hace días que solo me escuchan las moscas. Te cuento algo, si me alcanza el aliento."] },
    ],
    despedida: [{ t: ["¡Vete, vete, que la historia necesita misterio! Pero vuelve, que el final aún no está escrito.", "*susurra* Si ves algo raro por la cripta, no me lo cuentes. O sí. Pero a la mañana."] }],
    hostil: [{ t: ["*se encoge detrás de la jarra* Hoy no estoy para dramas ajenos, déjame. Solo los míos."] }],
    mision_activa: [
      { t: ["*en un susurro* ¿Has resuelto ya el enigma? «{progreso}». La lápida no perdona la tardanza.", "El acertijo de la lápida sigue sin respuesta. La Mochila, apartado Misiones: ahí lo escribes. Piensa en algo que cabe en una mesa..."] },
    ],
    mision_hecha: [{ t: ["¡Un mapa! Y yo vigilando la cripta como un tonto. Gracias, {jugador}. ¿Quieres otra historia de pago?"] }],
    oferta_repetida: [{ t: ["*suspira dramáticamente* ¿Escuchas? Repito: la lápida tiene un enigma. No lo digo dos veces. Bueno, sí."] }],
    demasiadas_misiones: [{ t: ["Antes de hundirte en acertijos, remata lo que traes. Lo digo por tu bien... y por el mío, que quiero oír cómo acaba."] }],
    sin_mision: [{ t: ["Hoy no tengo más misterios. Pero la noche es joven."] }],

    monstruo: [{ t: ["De monstruos, domino {lista}. Pregúntame por ellos y te lo cuento a mi manera. Con pausas."] }],
    monstruo_desconoce: [{ t: ["De {monstruo} solo sé lo que oí en un sueño. Y los sueños, ya se sabe...", "No es mi especialidad. Mis monstruos son de ultratumba."] }],
    monstruo_desconfia: [{ t: ["*se pone pálido* De eso... no hablo sin una buena jarra delante. ¿Eres de fiar?"] }],
    monstruo_intro: [{ t: ["Sobre {monstruo}... *carraspea* Voy a contarlo sin que se me escape el dato. A veces se me escapa."] }],
    "monstruo:esqueleto": [
      { c: { confiado: true }, t: ["Los esqueletos guardianes... *baja la voz* se desmoronan con agua bendita. Lo sé porque mi abuelo la llevaba siempre en el cinturón. Yo la llevo en la jarra, pero es otra cosa.", "El agua bendita hace polvo a los esqueletos. Lo leí una vez, borracho, y creo que era cierto."], rev: true, h: "Esqueletos: débiles a lo sagrado." },
      { t: ["Esqueletos... crujen al andar. Eso ya lo sabes. Lo demás, cuando tenga más confianza."], rev: false },
    ],
    "monstruo:espectro": [
      { c: { confiado: true }, t: ["Los espectros no soportan la luz sagrada, {jugador}. Un poco de agua bendita y se les acaba la fiesta. Del resto de armas, olvídalas: les atraviesan como el aire.", "A los espectros solo los espanta lo sagrado. Lo sé de buena fuente: la fuente era yo, borracho."], rev: true, h: "Espectros: débiles a lo sagrado." },
      { t: ["*se pone pálido* De los espectros... mejor no hablar sin una buena jarra delante. ¿Eres de fiar?"], rev: false },
    ],

    rumores_fin: [{ t: ["Se me acabaron las historias de hoy. Mañana habrá más, que la noche siempre inventa algo.", "Si quieres más cuentos, paga otra ronda."] }],
    rumor_bloqueado: [{ t: ["*susurra* Lo que sé es peligroso. Primero demuéstrame que eres de fiar."] }],
    rumor_pista_confianza: [{ t: ["(Tobías se suelta más con quien es amable o bromea con él.)"] }],
    rumor_eco: [{ t: ["Dicen que alguien acabó con {monstruo}. Y yo, escribiendo una balada. ¡Quién sabe! Tal vez sea sobre ti.", "He oído que un valiente derrotó a {monstruo}. Aún busco rima para «{monstruo}»."] }],
    hazanas_ninguna: [{ t: ["¿Hazañas tuyas? Aún nada. Pero cuando las haya, las escribiré con letra grande. Y errores de ortografía."] }],
    yo_generico: [{ t: ["Un placer, {jugador}. Tobías Medianoche. Poeta, trovador y, a esta hora, mitad de ambos."] }],
    afirmar: [{ t: ["¡Excelente! La decisión es la mitad del poema.", "*aplaude con una sola mano* ¡Así se habla!"] }],
    negar: [{ t: ["Qué decepción. Pero comprensible. El misterio no es para todos."] }],
    oferta_pendiente_si: [{ t: ["¡Pues aprieta el botón de aceptar! Los cuentos no se cuentan solos."] }],
    oferta_pendiente_no: [{ t: ["Como quieras. El enigma esperará. Los enigmas son pacientes."] }],
    no_entiendo: [{ t: ["*parpadea con dramatismo* No capto el hilo... ¿Quieres preguntar, comprar o brindar?", "Hum. Interesante. No tengo ni idea de lo que dices. ¡Pero lo diré en un verso!", "*ladea la cabeza* Si no es una pregunta sobre misterios, rumores o jarras, no sé responderte."] }],

    sobre_npc: [
      { una: true, t: ["Soy Tobías Medianoche, hijo de los Medianoche, nieto de los que vigilaban lo que no debía despertar. O eso me cuentan los sueños.", "Tobías. Contador de cuentos, vigilante involuntario, bebedor oficial de esta casa."], ac: 1 },
      { una: true, c: { actMin: 2 }, t: ["Mi familia custodiaba la Cripta de Vael. Yo salí corriendo hace años. No me juzgues: tú tampoco entrarías sin una jarra."] },
      { c: { actMin: 3 }, t: ["Lo que más temo es volver a entrar ahí. No por los muertos, sino por lo que me recuerdan de mí mismo."] },
      { t: ["Ya sabes lo esencial. Lo demás son sombras y borracheras."] },
    ],
    secreto_guarda: [{ t: ["*se lleva un dedo a los labios* Hay cosas que se dicen en la tercera jarra. Aún voy por la segunda."] }],
    secreto_revela: [
      { una: true, t: ["*mira alrededor y baja la voz hasta casi desaparecer* Soy el último de los Guardianes de Vael. Sé cómo se abre la cripta... y cómo se cierra. Por eso me dan miedo mis propios sueños.", "Confío en ti, {jugador}. Mi linaje es el que custodiaba lo que descansa en Vael. Y ahora yo, el último, bebo para no recordarlo."], ac: 2, h: "Tobías es el último descendiente de los Guardianes de la Cripta de Vael." },
      { t: ["Ya te lo dije. No me hagas pagar dos veces el mismo susto."] },
    ],

    servicios: [{ t: ["Servicios aquí los gestiona Brunilda, aunque yo recomiendo la cerveza (primera ronda: {descanso} monedas por la cama, {pocion} por la poción). Pulsa el botón de Servicios.", "Para comprar o dormir, busca el botón de Servicios. Yo solo ofrezco palabras. Y mucha sed."] }],
    dinero: [{ t: ["¿Oro? Soy poeta. Lo único que tengo son deudas y recuerdos.", "Fiado, fiado... En esta casa lo único que se fía es mi palabra. Y sin cobrar."] }],
    broma: [{ t: ["*se ríe a carcajadas, derramando cerveza* ¡Otro! ¡Otro! Tengo uno mejor: ¿cuántos bardos hacen falta para...? No me acuerdo.", "¡Ja! Eso va a mi repertorio. Con derechos de autor para ti, claro."], ac: 1 }],
    amable: [{ t: ["*se enjuga una lágrima* Qué amable. Hacía tiempo que nadie me trataba como a una persona. Y no como a una fuente de rumores.", "Eres un caballero. O quizá estás borracho. Da igual: ¡brindo por ello!"], ac: 1 }],
    insulto: [{ t: ["*se lleva la mano al pecho, teatral* Me hieres. Pero escribiré un poema sobre ello. Y saldrás mal."] }],
    amenaza: [{ t: ["*palidece* Vale, vale. Calma. Esto no necesita violencia. Necesita cerveza."] }],

    "lugar:taberna": [{ t: ["La Jarra Tuerta: techo bajo, cerveza fuerte y secretos en cada rincón. Mi segunda casa, si no la primera."] }],
    "lugar:cripta": [
      { c: { actMin: 2 }, t: ["La Cripta de Vael... *se estremece* Está bajo las ruinas del norte. Esqueletos en la primera sala, espectros más abajo. Y una lápida con un enigma."], h: "La Cripta de Vael: esqueletos arriba, espectros más abajo." },
      { t: ["La cripta... sí, existe. No digo más hasta la tercera jarra."] },
    ],
    "lugar:ruinas": [{ t: ["Las ruinas del norte guardan la entrada a Vael. De día parecen un montón de piedras; de noche, un montón de piedras que te miran."] }],
    "lugar:granero": [{ t: ["El granero... cosas de Brunilda y los goblins. Yo solo observo desde la barra."] }],
    "lugar:camino": [{ t: ["El camino de los cuervos tiene más historias que vecinos. Y los cuervos, más memoria que yo."] }],
    lugar: [{ t: ["De {lugarX} tengo una canción a medias. Te la canto cuando se me ocurra la rima."] }],
    "npc:brunilda": [{ t: ["Brunilda es un roble. Gruñe, pero sin ella esta casa se desploma. Y mi hígado, también."] }],
    "npc:sylwen": [{ t: ["Sylwen... tiene mirada de lobo con frío. No hables con ella antes de la segunda jarra."] }],
    npc: [{ t: ["De {otro} no sé nada, pero puedo inventar algo bonito."] }],
    "raza:mediano": [{ t: ["Los medianos somos los mejores narradores del mundo. Y los peores pagadores. Es una compensación."] }],
    "raza:orco": [{ t: ["Un orco me dejó una vez su manuscrito. Era mejor que el mío. Lo escondí. Fue el crimen más bonito de mi vida."] }],
    "raza:elfo": [{ t: ["Los elfos viven tanto que se aburren de todo menos de mirarse. Pero escriben versos preciosos."] }],
    "raza:enano": [{ t: ["Los enanos beben mejor que los medianos, pero cuentan peor. Como mucho, un chiste cada siglo."] }],
    "raza:humano": [{ t: ["Los humanos viven poco y lo cuentan todo. Por eso me caen bien."] }],
    raza: [{ t: ["Cada raza tiene su canción. A mí me faltan las rimas."] }],

    cierre_mision: [{ t: ["¡{titulo}! ¡Qué hazaña! Voy a escribir esto con letras de oro, o de cerveza."] }],

    "pj:aldric": [{ t: ["*susurra* Un paladín caído... Los dioses no abandonan del todo. Te cantaré una balada a medias, que es como se canta lo triste."] }],
    "pj:lyra": [{ t: ["*abre mucho los ojos* Una hechicera exiliada. En mis versos serías la protagonista... o la villana. Depende de cómo pagues la ronda."] }],
    "pj:grum": [{ t: ["Un enano con un martillo rojo y mala cara. ¡Perfecto! Seguro que tienes una historia triste. Ven, cuéntame, me falta material."] }],
    "pj:kael": [{ t: ["Un ladrón noble. Qué contradicción tan hermosa. Cuidado, que mis bolsillos los vigilo solo después de la cuarta jarra."] }],
    "pj:elowen": [{ t: ["Guardabosques... Los árboles hablan, ¿verdad? Pregúntales si saben cómo acaba mi enigma."] }],
    "pj:rufo": [{ t: ["¡Un bardo! ¡Colega! Dime, ¿tú también escribes con rimas que no funcionan? ¡Brindemos por la inspiración, aunque sea mala!"] }],
  },
  hazanas: {
    "victoria:esqueleto": ["¿Has derrotado esqueletos? *se agarra la jarra* Entonces tú entras donde yo no. Cuéntame cómo suena un hueso cuando se rinde."],
    "victoria:espectro": ["¿Un espectro? *se queda blanco* ¿Y sigues vivo? Te escribiré una oda. Una larga. Con estrofas sobre tus botas."],
    "victoria:goblin": ["Los goblins del granero... Brunilda no habla de otra cosa. Y ahora sabe que fuiste tú. Te canto algo, ¿quieres? ¡Es corto!"],
    "victoria:wyvern": ["*suelta la jarra* ¿Una wyvern? ¿TÚ? ¡Esto va a mi epopeya! Dime los detalles. Ni uno falso: los falsos los pongo yo."],
    victoria: ["He oído que derrotaste a {monstruo}. Mi musa está despierta. Hazme el favor de volver a hacerlo, que me falta una estrofa."],
    "mision:El acertijo de la lápida": ["¡El acertijo, lo resolviste! Eres, hasta ahora, el único que ha logrado que dejen de visitarme en sueños. Me debes un brindis."],
    mision: ["¡Cumpliste «{titulo}»! Eso merece balada. O por lo menos, una jarra."],
    huida: ["¿Huiste de {monstruo}? ¡Qué sensatez! Un héroe vivo da más material que uno muerto."],
    derrota: ["Caíste ante {monstruo}... y volviste. Eso es lo que llamo yo un buen giro de guion."],
    nivel: ["Se te nota crecer, {jugador}. Cada nivel es un capítulo. Yo voy por el prólogo, pero me ilusiona."],
    rasgo: ["Dicen por ahí que eres {rasgo}. Si fuera verdad, saldrías en mi balada. Si no, también."],
  },
};

/* ============ SYLWEN · elfa cazarrecompensas ============ */
CONT.sylwen = {
  temas: {
    saludo: [
      { c: { actMin: 5 }, t: ["*levanta la vista y asiente una vez* {jugador}. Siéntate. Hoy no tengo prisa. Casi nunca me paso de la raya."] },
      { c: { hazana: "mision:El peaje del troll" }, t: ["*te mira de arriba abajo, sin sonreír del todo* El que acabó con el troll. Bien. Siéntate si quieres."] },
      { c: { actMax: 0 }, t: ["*sin levantar la vista* Si vas a hablar, que merezca la pena."] },
      { t: ["No tengo tiempo para charlas. Ni tampoco ganas. Pero habla.", "*apoya la mano en el costado* Dime. Rápido."] },
    ],
    despedida: [{ t: ["Hasta luego. No te mueras antes de cobrar.", "*asiente seca* Cuídate. O no. Tú sabrás."] }],
    hostil: [{ t: ["*desliza la mano hacia el puñal* No te lo vuelvo a decir: fuera.", "Ya hablamos de más. Lárgate."] }],
    mision_activa: [{ t: ["¿Y el troll? {progreso}. Cada día que pasa me sangra más el costado, y mi paciencia, también.", "*sin mirarte* Sigue vivo. Lo sé porque yo sigo herida."] }],
    mision_hecha: [{ t: ["El troll está muerto y yo, en deuda. No lo olvides, ni yo lo olvidaré."] }],
    oferta_repetida: [{ t: ["Lo repito una vez: el troll del Puente Roto. Mátalo y cobras la mitad. Sin regateos."] }],
    demasiadas_misiones: [{ t: ["Ya tienes demasiado entre manos. No me traigas cadáveres a medio terminar."] }],
    sin_mision: [{ t: ["No tengo nada más. Me quedé sin presas, por ahora."] }],

    monstruo: [{ t: ["Conozco bien {lista}. Pregunta por el que quieras. Cobro la información al final, en respeto."] }],
    monstruo_desconoce: [{ t: ["Eso no lo he cazado. No hablo de lo que no conozco.", "De {monstruo} sé lo que sabe cualquiera. Pregunta a otro."] }],
    monstruo_desconfia: [{ t: ["No regalo información. Gánate un poco de mi confianza y hablamos."] }],
    monstruo_intro: [{ t: ["De {monstruo}: atiende, que no lo repito."] }],
    "monstruo:troll": [
      { c: { confiado: true }, t: ["El troll del Puente Roto se regenera como si le pagaran por ello. Fuego. Nada más funciona. *toca su costado herido* Lo digo por experiencia.", "Se regenera cada turno. Con fuego se detiene y le duele el doble. Aceite ardiente, antorcha, lo que sea."], rev: true, h: "Troll: se regenera, pero el fuego lo frena y le hace el doble." },
      { t: ["Troll. Grande, rápido, difícil de matar. Cuando me demuestres que no eres un pesado, te explicaré cómo."], rev: false },
    ],
    "monstruo:ogro": [
      { c: { confiado: true }, t: ["Los ogros tienen mal estómago. Un buen veneno les destroza mejor que cualquier espada.", "El veneno es lo suyo con los ogros. Lleva un vial y no pelees cuerpo a cuerpo."], rev: true, h: "Ogros: débiles al veneno." },
      { t: ["Ogros... *aprieta la mandíbula* Otro día. Primero demuéstrame que no eres una pérdida de tiempo."], rev: false },
    ],
    "monstruo:wyvern": [
      { c: { confiado: true }, t: ["La wyvern de las cumbres es una bestia de verdad. Hielo, escarcha: le duele más que el fuego. No es para novatos. Ni siquiera para mí.", "Hielo para las wyverns. Y mucha suerte."], rev: true, h: "Wyvern: débil al hielo." },
      { t: ["La wyvern... no es asunto para cualquiera. Vuelve cuando seas más fuerte."], rev: false },
    ],

    rumores_fin: [{ t: ["Ya te he dicho todo lo útil. Lo demás es ruido."] }],
    rumor_bloqueado: [{ t: ["Hay cosas que sé y no regalo. Gánate mi respeto con hechos, no con palabras."] }],
    rumor_pista_confianza: [{ t: ["(Sylwen respeta a quienes cumplen y a quienes no pierden su tiempo.)"] }],
    rumor_eco: [{ t: ["Alguien acabó con {monstruo}. Buen trabajo. Quizá no todos son un desperdicio de oxígeno.", "He oído que cayó {monstruo}. No fui yo. Qué lástima."] }],
    hazanas_ninguna: [{ t: ["¿Hazañas? Las pruebas se ven en las cicatrices. Y tú, aún, estás limpio."] }],
    yo_generico: [{ t: ["Sylwen Hojanegra. Cazarrecompensas. Si me necesitas, ya sabes dónde estoy: aquí."] }],
    afirmar: [{ t: ["Bien. Sin vueltas.", "*asiente una vez* Eso me gusta."] }],
    negar: [{ t: ["Entonces no hay nada más que hablar."] }],
    oferta_pendiente_si: [{ t: ["Entonces acepta. No me hagas perder el tiempo."] }],
    oferta_pendiente_no: [{ t: ["Como quieras. La oferta no caduca, pero mi paciencia, sí."] }],
    no_entiendo: [{ t: ["*suspira* No he entendido nada. Sé directo.", "Frases cortas. Hechos. Pregunta o márchate.", "¿Eso era una pregunta? Parecía una confusión."] }],

    sobre_npc: [
      { una: true, t: ["Sylwen. Elfa, cazarrecompensas. Lo demás no es asunto tuyo. Aún."], ac: 1 },
      { una: true, c: { actMin: 3 }, t: ["Cobro por adelantado desde que un cliente me dejó con la mitad de lo prometido. Aprendí rápido."] },
      { c: { actMin: 4 }, t: ["Perdí algo hace tiempo. No te diré qué. Pero me enseñó a no pedir ayuda. Hasta ahora."] },
      { t: ["Ya te he dicho suficiente. Lo demás, que se lo cuente a mis cicatrices."] },
    ],
    secreto_guarda: [{ t: ["*entrecierra los ojos* ¿Secretos? Los míos se quedan donde están."] }],
    secreto_revela: [
      { una: true, t: ["*se aprieta el costado y desvía la mirada* El troll me hirió. Por eso no puedo cobrar la recompensa. Y por eso... estoy aquí, pidiéndote algo que no sé pedir.", "No lo digo dos veces: el troll del Puente Roto me hizo esto. Y soy demasiado orgullosa para pedir ayuda. Tú me ayudas, y yo pago. Fin."], ac: 2, h: "Sylwen confiesa que el troll del Puente Roto la hirió y no se atreve a pedir ayuda." },
      { t: ["Ya te lo conté. No me hagas pasar vergüenza dos veces."] },
    ],

    servicios: [{ t: ["Servicios los lleva Brunilda: cama, {descanso} monedas; poción, {pocion}. Pulsa el botón de Servicios y déjame en paz."] }],
    dinero: [{ t: ["Cobro por adelantado. Sin excepciones.", "Descuentos no. Las cicatrices tampoco son baratas."] }],
    broma: [{ t: ["*casi sonríe* Casi. Sigue intentándolo.", "Mmm. Un humor negro bien pensado. Me gusta."], ac: 1 }],
    amable: [{ t: ["*parpadea, sorprendida* Hmm. Gracias. No estoy acostumbrada.", "Dejemos eso. Pero acepto el agradecimiento."], ac: 1 }],
    insulto: [{ t: ["*la mano va al puñal* Una más y te enseño por qué me llaman Hojanegra."] }],
    amenaza: [{ t: ["Prueba. Aquí o fuera. Pero piensa antes de gastarte esa vida."] }],

    "lugar:puente": [{ t: ["El Puente Roto. Allí está el troll. Y mi sangre, medio kilo, en el barro."] }],
    "lugar:camino": [{ t: ["El Camino de los Cuervos: lobos, goblins y viajeros muertos. Vete con cuidado."] }],
    "lugar:bosque": [{ t: ["El bosque lo conozco como mi palma. Y me conoce a mí. Se llevan bien con quien no hace ruido."] }],
    "lugar:montana": [{ t: ["En las cumbres anida una wyvern. Me pagan bien por ella. Con una pierna menos, no aceptaría."] }],
    "lugar:cripta": [{ t: ["La cripta no es mi terreno. Los muertos no pagan recompensa."] }],
    lugar: [{ t: ["De {lugarX}, no tengo informes recientes. Pregunta a otro."] }],
    "npc:brunilda": [{ t: ["Brunilda es honesta. Es lo mejor que se puede decir de una tabernera."] }],
    "npc:tobias": [{ t: ["Tobías habla mucho y dice poco. Excepto cuando bebe: entonces dice demasiado."] }],
    npc: [{ t: ["De {otro} no tengo opinión. Y si la tuviera, la guardaría."] }],
    "raza:elfo": [{ t: ["Soy elfa. Y no, no pienso decir que lo lleve con orgullo. Lo llevo con puntería."] }],
    "raza:enano": [{ t: ["Los enanos son testarudos. Como yo. Por eso nos entendemos mal."] }],
    "raza:orco": [{ t: ["Los orcos que he cazado luchan con honor. Los que no, huyen. Como cualquiera."] }],
    "raza:humano": [{ t: ["Los humanos duran poco, pero hacen ruido mientras tanto."] }],
    "raza:mediano": [{ t: ["Los medianos son buenos informantes. Y malos guerreros."] }],
    raza: [{ t: ["Las razas me importan poco. Me importa si cumplen o no."] }],

    cierre_mision: [{ t: ["«{titulo}» cumplido. Tienes un punto a tu favor. No pidas dos."] }],

    "pj:aldric": [{ t: ["Un paladín. He cazado algunos. Los que no se sabían arrepentir, mal. Los que sí, bastante peor. A ver qué tal tú."] }],
    "pj:lyra": [{ t: ["Una hechicera exiliada. Me han pagado por traer cabezas más pequeñas. Pero hoy estoy cansada. Siéntate y no cambies de forma."] }],
    "pj:grum": [{ t: ["Un enano vengador. Me gusta la gente con un propósito. Siempre es más fácil predecirlos."] }],
    "pj:kael": [{ t: ["Un ladrón. Y por lo visto, famoso. Si se te cae algo de mi bolsa, aparecerá en tu cuello."] }],
    "pj:elowen": [{ t: ["Una guardabosques elfa. Mmm. Al menos sabes caminar sin hacer ruido. Eso ya te hace mejor que la mayoría."] }],
    "pj:rufo": [{ t: ["Un bardo. Si cantas aquí, que sea bajo. Y si cantas de mí, que sea mentira."] }],
  },
  hazanas: {
    "victoria:troll": ["*se queda mirándote, con un destello raro en los ojos* Acabaste con el troll. Te debo más que una recompensa. Te debo una vida entera... aunque no te lo diga así."],
    "victoria:ogro": ["¿Un ogro? Bien. Ahora sabes cómo sangran las cosas grandes."],
    "victoria:wyvern": ["*suelta el puñal que estaba afilando* ¿La wyvern? ¿Tú? Eso es lo que yo no pude. Mi respeto, sin condiciones."],
    "victoria:goblin": ["Los goblins del granero... Cosas de principiante. Pero todos empezamos así."],
    victoria: ["He oído que derrotaste a {monstruo}. No está mal. No te lo digo dos veces."],
    mision: ["Cumpliste «{titulo}». Eso se nota. La gente confía más en quien termina lo que empieza."],
    huida: ["Huiste de {monstruo}. No te juzgo: yo lo hice. Pero volví, y tú también deberías."],
    derrota: ["Caíste ante {monstruo}. Mis cicatrices dicen que no eres el primero. Ni el último."],
    nivel: ["Se te nota más afilado, {jugador}. Sigue así."],
    rasgo: ["Hay quien dice que eres {rasgo}. Yo no creo en etiquetas. Creo en actos."],
  },
};

/* ---------- reacciones genéricas a hazañas (cualquier NPC; por estilo o "*") ---------- */
const REACC = {
  victoria: {
    "*": ["He oído que derrotaste a {monstruo}. Aquí cualquiera lo cuenta, aunque se lo inventa."],
    tabernero: ["Dicen que has derrotado a {monstruo}. Aquí se bebe a la salud de quien hace esas cosas."],
    poeta: ["¡Has derrotado a {monstruo}! Eso son versos, {jugador}. Versos largos y sangrientos."],
    cazador: ["Derrotaste a {monstruo}. Buen trabajo. La caza es sucia, pero alguien tiene que hacerla."],
    mercader: ["¿Derrotaste a {monstruo}? Eso mueve el mercado. Los caminos serán más seguros... y los precios, más altos."],
    sabio: ["Has vencido a {monstruo}. La fuerza sin sabiduría es solo ruido; confío en que tengas ambas."],
    artesano: ["Vencer a {monstruo} no es poca cosa. Eso se gana con callos, no con palabras."],
  },
  "victoria:wyvern": {
    "*": ["¿¡La wyvern!? Entonces los cuentos eran ciertos. Que los cielos te guarden, {jugador}."],
  },
  "victoria:troll": {
    "*": ["¿El troll del Puente Roto? ¡Gran noticia! Los viajeros podrán cruzar sin pagar peaje con la vida."],
  },
  mision: {
    "*": ["Corre la voz de que cumpliste «{titulo}». Se agradece, {jugador}."],
    tabernero: ["He oído que cumpliste «{titulo}». Bien por ti. La próxima ronda, a ti te toca invitar."],
    poeta: ["¡Cumpliste «{titulo}»! ¡Ya tengo tema para la próxima balada!"],
    cazador: ["Cumpliste «{titulo}». Eso se ve. Cuentan con gente así."],
    mercader: ["Dicen que cumpliste «{titulo}». Gente de fiar. Podemos hacer negocios."],
    sabio: ["Cumpliste «{titulo}». Eso no solo se hace con fuerza; hay algo más en ti."],
    artesano: ["Cumpliste «{titulo}». Obra bien hecha, mejor que palabra bonita."],
  },
  huida: {
    "*": ["Dicen que huiste de {monstruo}. Más vale correr hoy que ser leyenda mañana... tarde y muerto."],
    cazador: ["Huiste de {monstruo}. Sin vergüenza: la presa sabe elegir cuándo volver."],
    poeta: ["¡Huiste de {monstruo}! Qué dramático. ¿Corriste con gracia o sin ella?"],
  },
  derrota: {
    "*": ["Caíste ante {monstruo}, pero aquí estás. Eso también es una hazaña."],
    sabio: ["La derrota enseña más que la victoria. Aprende de {monstruo}."],
  },
  nivel: {
    "*": ["Se te nota más curtido, {jugador}. Se ve en la mirada."],
    poeta: ["¡Nivel {nivelH}! Cada nivel es un capítulo. ¡Tienes buena trama!"],
  },
  rasgo: {
    "*": ["Se comenta por ahí que eres alguien {rasgo}. A mí, me parece cierto."],
    cazador: ["Dicen que eres {rasgo}. En el camino, esas cosas se notan."],
  },
};
