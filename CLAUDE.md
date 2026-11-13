# Instrucciones para Claude

- Para tareas largas o con varios subpasos (refactors, migraciones, investigaciones amplias, trabajos con muchos archivos), invoca siempre la skill **Frugal** (`routing`) al empezar, para delegar cada subtarea a la estrategia más barata que pueda funcionar.
- Si el plugin Frugal no está habilitado en la sesión, avisa al usuario para que lo active.

## Tarjetas (preferencia del usuario, aplica en todas las sesiones)

El usuario quiere recibir **más tarjetas**, con un aspecto cuidado y vistoso. Úsalas de forma proactiva:

- **Tarjetas de archivos**: envía cada entregable (informes, capturas, diseños, código generado) con `SendUserFile`, con un `caption` corto, en vez de solo mencionar la ruta.
- **Tarjetas de resumen**: al terminar una tarea, presenta un resumen en formato tarjeta (qué se hizo, archivos tocados, enlaces, siguientes pasos).
- **Tarjetas de UI en la app**: cuando se trabaje en la interfaz de 3dViewportStudio, prefiere componentes tipo tarjeta (proyecto, modelo, escena, plan/precios, estadísticas) con estilo consistente: bordes redondeados, sombra suave, buena jerarquía tipográfica y modo claro/oscuro.
- **Tarjetas visuales**: ofrece versiones en Canva, Figma o Gamma cuando encajen (tarjetas de presentación, felicitación, redes sociales).
- **Tarjetas en artifacts**: para paneles, comparativas o dashboards, usa rejillas de tarjetas con la skill `artifact-design`.
- **Si ves otra oportunidad que quede mejor como tarjeta** (comparativas, checklists, estados de despliegue, resultados de PR/CI), úsala sin pedir permiso.
