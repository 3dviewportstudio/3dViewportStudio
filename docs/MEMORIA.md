# Memoria del trabajo · Web de ViewportStudio3D

Rama de trabajo: `claude/beautiful-fermat-i5cl2g` (no fusionada en `main`).
Última actualización: 2 de octubre de 2026.

## 1. Punto de partida

- La web vivía solo en el equipo de Lucas (`C:\Users\Lucas\Desktop\web\viewportstudio3d-web`). El repositorio de GitHub `3dviewportstudio/3dViewportStudio` estaba vacío.
- La subimos a `main` (commit `788020f`, «Estado actual de la web»). Para ello hubo que:
  - configurar la identidad de git del repositorio (`git config user.name` / `user.email`);
  - ejecutar los comandos dentro de la carpeta de la web, no desde `C:\Users\Lucas`.
- En Windows, PowerShell bloquea `npm.ps1`. Se usa `npm.cmd run dev`, o se habilita con `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

### Stack que ya tenía el proyecto

| Pieza | Versión / detalle |
|---|---|
| Framework | Next.js 16.3 (App Router), React 19.3, TypeScript |
| Estilos | Tailwind CSS 4 + `src/app/globals.css` (tokens y componentes propios) |
| Movimiento | GSAP 3.15 + ScrollTrigger y Lenis 1.3, cargados bajo demanda en `MotionProvider.tsx` |
| 3D | Three.js en `VariantStudio.tsx`, importado dinámicamente |
| Tipografía | Satoshi (titulares), Geist (texto), Geist Mono (datos técnicos) |
| Idiomas | Español (`/`) e inglés (`/en`), cada uno con su layout raíz |
| Medios | AVIF/JPEG y MP4 pregenerados con `npm run media` |

### Identidad (se mantiene)

La web es el visor de Blender del estudio:
- grafito en lugar de negro puro, para que los renders se lean como piezas enmarcadas;
- ámbar como color de selección (hover, foco, acción principal);
- rojo, verde y azul solo para los ejes del gizmo;
- esquinas de encuadre de cámara (`ViewportFrame`) y HUD en monoespaciada con datos reales del archivo.

## 2. Primera fase · Scroll cinematográfico (commit `f46ad8e`)

Objetivo: mejorar el scroll sin cambiar diseño, contenido ni funciones.

- **Expansión de imágenes:** las portadas grandes de Trabajo y las filas panorámicas de los casos (excepto la primera) se abren desde un marco compacto (84 % en escritorio, 94 % en móvil). La imagen interior se asienta de 1,14 a 1. Se escala el marco entero, así que la proporción no cambia y al final la imagen se ve completa.
- **Parallax:** la primera pieza de cada par de portadas se mueve en sentido contrario a la segunda (`parallax={-3}`). `Media` acepta ahora un número como recorrido.
- **Responsive:** ScrollTrigger se configura con `gsap.matchMedia`. Escritorio y móvil tienen valores propios, que se recalculan al redimensionar o girar el dispositivo. En móvil los recorridos se reducen a la mitad, no hay fundido de salida y se ignoran los cambios de altura de la barra del navegador (`ignoreMobileResize`).
- **Movimiento reducido:** con `prefers-reduced-motion` no hay animaciones de desplazamiento.

## 3. Segunda fase · Rediseño de la experiencia (commit `26ab738`)

### Auditoría

- **Puntos fuertes, que se conservan:** el concepto de visor de Blender, la combinación tipográfica y las microinteracciones (pulsación al 97 %, hover solo con ratón, curvas de salida).
- **Puntos débiles:**
  - Servicios era un bento de tarjetas con marcos dobles y tres botones iguales.
  - La entrada del hero era una apertura genérica que no decía «render».
  - No había continuidad entre la portada y los casos.
  - Las etiquetas del proceso estaban en inglés también en la página en español.

### Cambios

1. **Hero · render progresivo** (`components/ui/RenderTiles.tsx`, `sections/Hero.tsx`, `globals.css`)
   - La imagen aparece por cuadrículas desde el producto hacia fuera, como la ventana de render de Cycles, con esquinas ámbar en la cuadrícula activa.
   - Rejillas: 12×6 en escritorio (a todo el ancho) y 5×6 en móvil.
   - El orden en espiral se calcula en el servidor; el navegador solo anima la opacidad con CSS. Funciona desde el primer pintado, sin esperar a JavaScript.
   - Se ve una vez por visita: la clase `intro-done` en `<html>` lo controla.
   - No existe con movimiento reducido ni sin JavaScript.
2. **Servicios · scroll storytelling** (`sections/Services.tsx`)
   - En escritorio, un visor fijo 4:5 cambia de plano (packshot → escena → animación del mismo producto, Fine Nipona) según el servicio que cruza el centro de la pantalla. El cambio lleva un reenfoque de lente (desenfoque 12 px → 0).
   - Los servicios inactivos quedan al 75 % de opacidad, el mínimo que mantiene el contraste AA.
   - En móvil o sin JavaScript, cada servicio lleva su propia imagen.
   - Cada botón «Pedir presupuesto» sigue preseleccionando su servicio en el formulario (`data-service`).
   - `VideoLoop` no reproduce ni descarga un vídeo que está en un plano oculto (evento `vp-layer`).
3. **Transiciones entre páginas** (`components/layout/Transitions.tsx`)
   - Usan la View Transitions API nativa a través de `<ViewTransition>` de React, sin librería.
   - **Elemento compartido:** la portada de cada proyecto en Trabajo viaja hasta su sitio en la página del caso.
   - **Resto de navegaciones:** la página saliente se funde y la nueva entra con un leve ascenso. La cabecera queda fija como ancla.
   - Se anima la captura raíz (del tamaño de la ventana), activada con un marcador de 1 px. Nombrar el contenedor de la página obligaba a capturar un elemento de unos 12.500 px de alto, y Chrome cancelaba la transición a los 4 s.
4. **Contacto:** la luz ámbar sigue al cursor con inercia; solo con ratón.
5. **Ajustes**
   - Entradas al hacer scroll más cortas: 16 px, 650/750 ms.
   - Se eliminan las etiquetas en inglés del proceso (`tags` en `content/copy.ts`).
6. **Error previo corregido · efecto cristal.** El minificador de CSS descartaba `backdrop-filter` cuando `-webkit-backdrop-filter` iba detrás. Por eso la cabecera, los botones fantasma y el gizmo no se desenfocaban en Chrome, Edge ni Firefox. Regla: escribir siempre el prefijo primero.
7. **Rendimiento · fuentes** (`lib/fonts.ts`, `src/fonts/`)
   - Geist y Geist Mono en subconjunto latino: de unos 70 KB a 36 KB cada una.
   - Geist Mono ya no se precarga.
   - El comando para regenerar los subconjuntos está en `fonts.ts`.

### Librerías que no se añadieron

| Librería | Motivo |
|---|---|
| Framer Motion / Motion | Duplicaría GSAP, Lenis y CSS, y añadiría peso. |
| Shadcn UI | Aspecto genérico y sin componentes complejos que lo justifiquen. |
| Lucide | Ya hay un juego de iconos propio. |
| React Three Fiber | Three.js ya se carga bajo demanda; R3F añadiría una capa sin aportar nada. |

Tampoco se añadieron aurora ni mesh gradients genéricos, que competirían con los renders. No se inventaron testimonios ni precios.

## 4. Tercera fase · Rediseño completo «Estudio / Sala de proyección» (commit siguiente)

Petición: rediseño evidente, no mejora incremental. El contenido se mantiene; cambian layout, color, tipografía y estructura.

- **Dos mundos que se alternan.** Sala de proyección (negro absoluto, `.theme-dark`), donde los renders se funden con la página, y estudio (gris de ciclorama `#e6e6e3` con tinta, `.theme-light`). Cada sección es una «lámina» (`.sheet`) con las esquinas superiores redondeadas que se monta sobre la anterior.
- **Tipografía.** Geist medio, a escala gigante y con el espaciado cerrado, para todos los titulares (`h-section`, `h-giant`). Satoshi Black solo para el logotipo.
- **Acento.** Naranja de render `#ff6a1a`; en fondo claro, `#b54100` para texto y foco (AA).
- **Cabecera.** Detecta el tono de la sección que tiene debajo y cambia sus colores con una transición.
- **Hero.** Render a sangre a pantalla completa, titular enorme con las palabras subiendo desde una máscara y render progresivo por cuadrículas.
- **Manifiesto.** Declaración gigante que se ilumina con el scroll, tres ideas en columnas y el estudio de variantes dentro de una pantalla negra.
- **Trabajo.** Cada proyecto es un capítulo con el nombre a escala gigante. Fine Nipona se muestra en díptico 4:5 y pPhone a todo el ancho.
- **Servicios.** Se mantiene el storytelling, ahora en el estudio claro.
- **Proceso.** Cuatro pasos en horizontal, numerales grandes y una línea de progreso naranja.
- **Sobre mí y FAQ.** En el estudio claro.
- **Contacto y pie.** Contacto en negro con un titular gigante; el pie cierra con el logotipo a todo el ancho.
- **Páginas de caso.** En la sala negra.
- **Lighthouse.** Móvil: 92 de rendimiento (la primera pasada, en frío, 85) y 100 de accesibilidad. Escritorio: 100 de rendimiento, 100 de accesibilidad, buenas prácticas y SEO.

## 5. Verificación (fases 1 y 2)

- `tsc --noEmit`, `eslint` y `next build` sin errores.
- Navegador (Chromium): sin errores de consola ni scroll horizontal en 7 rutas, en español e inglés, en escritorio, móvil y con movimiento reducido. Las transiciones de página se probaron en escritorio y móvil.
- Lighthouse, comparado con la versión original (tres pasadas cada una):

| | Original | Nueva |
|---|---|---|
| Móvil, rendimiento | 86–88 | 90–91 |
| LCP en móvil | 3,7 s | 3,3 s |
| Escritorio | — | 99 en rendimiento, 100 en accesibilidad, buenas prácticas y SEO |

En móvil quedó justo en el límite del objetivo de «más de 90».

### Limitaciones de las pruebas

- El entorno de pruebas no tenía GPU: no se pudo ver el desenfoque del cristal en pantalla, aunque el navegador ya aplica la propiedad.
- El Chromium de pruebas no reproduce H.264: se comprobó la lógica de los vídeos, no la imagen.
- Las cifras de Lighthouse pueden variar en un equipo real.

## 6. Pendiente / ideas

- Fusionar `claude/beautiful-fermat-i5cl2g` en `main` cuando se haya revisado en local.
- Probar en Safari y Firefox, y en un móvil real.
- Si se quiere más margen en Lighthouse móvil:
  - reducir el JavaScript inicial;
  - añadir una variante de 720 px a la imagen móvil del hero.

## 7. Cómo verlo en local (Windows)

```powershell
cd C:\Users\Lucas\Desktop\web\viewportstudio3d-web
git fetch origin
git checkout claude/beautiful-fermat-i5cl2g
git pull
npm.cmd install
npm.cmd run dev
```

Después abre http://localhost:3000. Para volver a la versión anterior: `git checkout main`.
