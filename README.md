# Rhythm Lab — content words, function words y ritmo

Página para practicar el ritmo del inglés con la **Unit 5 «Content Words and Function Words»** de
*Pronouncing American English* (Gertrude F. Orion), con las grabaciones del libro (3.ª edición, `PAE3_U05_…`).

Es corta, a propósito:

- **Key ideas**: los cuatro temas clave. Content words y function words, formas fuertes y débiles
  (las 18 palabras del ejercicio 4B, cada una sola y en su oración), el ritmo del inglés (*Men fight wars*:
  tres beats, el mismo tiempo) y las reducciones de la conversación.
- **Cuatro actividades**, con **Check** y puntaje:
  1. *Check your listening*: tachar las function words débiles que se escuchan (ejercicio 5).
  2. *Strong or weak?*: decidir si se oye la forma fuerte o la débil, y qué cambia en el significado (4C).
  3. *Find the beats*: tocar las content words, que llevan los beats (ejercicio 6).
  4. *Decode the conversation*: qué significa cada línea del diálogo en inglés escrito (8A), y el diálogo completo.

Cada oración se escucha **de la grabación del libro**, recortada justo en esa oración. Lo que no tiene grabación
(las palabras de la tabla, los ejemplos de las reducciones) usa la **voz de ElevenLabs**. Hay grabadora para
compararse con el libro, y cada actividad terminada llega a la **planilla de Google del docente**.

El diseño es el del Stress Lab: la misma página, con su propia configuración (claves `rl.*`) y su propio script.

## Las grabaciones y el texto

Las grabaciones son de la **3.ª edición**; el PDF de la unidad es de una edición anterior. Cada oración de la
página se comprobó contra el audio, palabra por palabra (tres reconocedores de voz y un alineamiento forzado).
Donde el PDF dice otra cosa, la página sigue al audio:

- **Ejercicio 5** (*Check your listening*): la 4 es *I read the play today.*, la 5 *I like him very much.* y la 8
  *Register for the class.* (el PDF dice *We have been here all day*, *Yes, we are coming home now* y
  *They have more than they need*).
- **Ejercicio 4C**: *Molly and Linda are sisters.* (el PDF dice *Mary and June*).
- **Ejercicio 8A**: es otro diálogo (dos amigos, una pizza, un *diner* y la *soupersalad*), no el del PDF
  (*bacon ’n egg sanwich*, *coffee shop*).

Los audios del libro no están en este repositorio: quedan en el Drive del docente y el script los entrega.

## Puesta en marcha (docente)

### 1. El Google Apps Script (una vez)

Es un script **nuevo**, distinto del de Stress Lab y del de Connected Speech.

1. Creá una planilla nueva (sheets.new) → **Extensiones → Apps Script**.
2. Borrá lo que haya y pegá [`google-apps-script/Code.gs`](google-apps-script/Code.gs). Si el editor no te deja
   pegarlo entero, pegá las 8 partes de [`google-apps-script/partes/`](google-apps-script/partes/) en orden, cada
   una en su archivo (＋ → *Secuencia de comandos*). Todas tienen menos de 120 líneas.
3. Elegí la función **setup** → **▶ Ejecutar** → aceptá los permisos.
4. Recargá la planilla: aparece el menú **Rhythm Lab**.
   - **Revisar los audios del libro**: tienen que aparecer los 11 (`PAE3_U05_E4A` … `E8A`), en la hoja
     «Audios del libro».
   - **Guardar API key de ElevenLabs**: pegá la key. **La key se pega solo ahí.** Queda guardada en el script;
     nunca en la página ni en el repositorio.
5. **Implementar → Nueva implementación → Aplicación web** · Ejecutar como: **Yo** ·
   Quién tiene acceso: **Cualquier persona** → copiá la URL que termina en `/exec`.
6. En la página: **Settings** → pegá la URL → **Test connection** → **Save**. El **Student link** que aparece
   ahí abre la página ya conectada para los alumnos.

Si cambiás el código: Implementar → Administrar implementaciones → ✏ → **Nueva versión**. La URL no cambia.

### 2. Los audios del libro

El script busca cada audio **por el nombre del archivo** en la carpeta de Drive
*Unit 5 Content Words & Function Words* (`1guU4uPU29kPyFhqvpnSkc7GCVDmPJk-B`) y sus subcarpetas, y solo entrega
esos 11 archivos. La cuenta que ejecuta el script tiene que poder abrir la carpeta. Para usar otra carpeta (por
ejemplo, una copia en tu Drive), agregá la propiedad del script `BOOK_FOLDER_ID` con su ID.

Para comprobarlo desde la página: **Settings → Book recordings → Check the recordings**.

### 3. GitHub Pages

En el repositorio: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
No hace falta compilar nada.

## Desarrollo

```bash
npm start          # http://localhost:8080
npm test           # pruebas: contenido, clips, corrección y Apps Script
node scripts/split-gs.mjs   # después de cambiar Code.gs (regenera partes/)
npm run version    # antes de publicar: pone una versión nueva a los archivos (?v=…)
```

- `js/worksheets.js`: el contenido. Cada clip es `[audio, inicio, fin]` en segundos de la grabación del libro.
- `js/book.js`: pide las grabaciones al script, las guarda en el navegador y reproduce cada oración.
- `js/views/sheet.js`: cómo se muestra y se corrige cada tipo de actividad.
- `google-apps-script/Code.gs`: audios del libro, voces de ElevenLabs y resultados.
