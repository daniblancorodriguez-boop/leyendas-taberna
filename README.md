# 🍺⚔️ Leyendas de la Taberna

RPG de fantasía épica (con su pizca de humor) para el móvil. Te metes en la piel de un personaje legendario, hablas con NPC que recuerdan y reaccionan como personas, aceptas las aventuras que surgen de esas charlas y subes de nivel **siendo fiel a la historia de tu personaje**.

Es una web estática (PWA): sin servidor, sin build. Se publica tal cual en GitHub Pages y se puede instalar en el móvil como una app.

## Cómo jugarlo

1. Abre la web en el móvil y elige a tu leyenda.
2. Habla con la gente de **La Jarra Tuerta** (toca su nombre bajo el chat y escribe).
3. Bajo cada globo hay un icono **📜**: envía ese dato (editable) a la **Hoja de acontecimientos** de tu **Mochila**.
4. Acepta misiones, viaja (los lugares se crean sobre la marcha), combate y descubre los puntos débiles de los monstruos.

Sin clave de IA el juego funciona en **modo demo** (diálogos predefinidos) para que puedas probarlo. Con clave, los NPC conversan de verdad y los escenarios se inventan al momento.

## Publicarlo en GitHub Pages

1. Crea un repositorio nuevo y sube **todos** los archivos de esta carpeta a la raíz (`index.html`, `style.css`, `data.js`, `ai.js`, `game.js`, `sw.js`, `manifest.webmanifest`, iconos).
2. En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
3. En un minuto tendrás la web en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. En el móvil, ábrela y usa **«Añadir a pantalla de inicio»** para instalarla.

## La IA: tu propia clave (BYOK)

- En **⚙️ Ajustes** elige proveedor (Anthropic o OpenAI), pega tu clave y pulsa *Probar conexión*.
- La clave se guarda **solo en el `localStorage` de tu móvil** y se envía únicamente al proveedor elegido. **No la pongas nunca en el código ni la subas al repositorio.**
- Modelos por defecto: `claude-haiku-5-5` y `gpt-4o-mini`. Puedes escribir otro modelo en Ajustes.
- La llamada a Anthropic desde el navegador usa la cabecera `anthropic-dangerous-direct-browser-access`, necesaria para este tipo de apps sin servidor.

## Cómo está pensado (para seguir creciendo)

| Archivo | Qué contiene |
|---|---|
| `data.js` | Razas, personajes legendarios, bestiario, objetos y la taberna inicial |
| `ai.js` | Cliente de IA, *prompts*, validadores y modo demo |
| `game.js` | Reglas (XP, niveles, misiones, combate) e interfaz |
| `style.css` | Estilo pensado para móvil |

**Principio clave: la IA narra, el código manda.** La IA devuelve JSON con el texto del NPC y unas *etiquetas* sobre la actitud del jugador (valentía, engaño, piedad…). El juego valida todo: el XP, el oro, las misiones aceptables y los puntos débiles reales salen de las reglas, no de la IA. Así no se puede «convencer» a un NPC de regalarte el mundo.

### XP según la historia del personaje
Cada personaje tiene **virtudes** (XP completo), **defectos** (medio XP: interpretarlos también es rolear) y **traiciones** (pierdes XP). Repetir la misma actitud da menos XP (anti-granja).

### Combate
Por turnos y táctico: atacar, defender, habilidades (con energía), objetos, examinar y huir. Cada monstruo tiene **punto débil** y **resistencia** (fuego, hielo, sagrado, sombra, veneno…), y los golpes pesados se **anuncian** un turno antes para que puedas defenderte. Los puntos débiles se descubren hablando con NPC, examinando o probando.

## Siguientes pasos sugeridos

- Más lugares con mapa y mercados, mejoras de equipo y armas únicas.
- Compañeros de grupo y reputación con facciones.
- Memoria a largo plazo (resumen automático de conversaciones).
- Finales según decisiones y capítulos de campaña.
- Proxy opcional (Cloudflare Worker) para que los jugadores no necesiten clave.
