---
name: trabajo-nocturno
description: Turno autónomo de noche para Viewport Studio 3D (Lucas). Úsala cuando el usuario diga "trabaja mientras duermo", "haz dinero esta noche", "haz vídeos con Blender/Higgsfield" o se vaya a dormir dejando trabajo. Trabaja sin preguntar, gasta pocos tokens y deja todo listo para las 8:45 (Europe/Madrid).
---

# Trabajo nocturno autónomo

El usuario duerme: **no preguntes, no esperes respuesta**. Ahorra tokens: pocas llamadas, sin leer hilos completos si no hace falta, mensajes cortos.

## Datos fijos
- Upwork org_uid: `2109987152200207020` (freelancer, tarifa base $30/h).
- Gmail: `3dviewportstudio@gmail.com`. Portfolio: https://viewportstudio3d.netlify.app/es/
- Renders del repo (importables en Higgsfield vía raw.githubusercontent.com/3dviewportstudio/3dViewportStudio/main/public/media/img/...). La subida directa a upload.higgsfield.ai está bloqueada por la red; usa `media_import_url`.
- Blender NO está instalado en el contenedor: usa Higgsfield.

## Orden de trabajo
1. **Clientes primero**: revisa Gmail (respuestas reales, ignora autorespuestas) y Upwork `get_messages list_rooms`. Contesta a quien espere respuesta.
2. **Upwork**: busca trabajos de render/animación de producto en Blender. Aplica solo a los que encajen, con pocas propuestas (<20) y un coste de connects razonable (≤15). Cartas honestas: eres nuevo en Upwork, el portfolio son proyectos personales (PS5, ROG Ally, Logitech G435) + packaging Fine Nipona. Ofrece una prueba corta. Haz boost solo si 1–2 connects dan puesto pagado. Máximo 3 propuestas por noche.
3. **Vídeos (Higgsfield)**: clips 9:16 de 5 s a partir de renders (`seedance_2_5`, unos 35 créditos cada uno). Máximo 2–3 por noche; comprueba el coste con `get_cost` y deja créditos de reserva.
4. **Prospección por email**: solo seguimientos ya programados. No insistas a quien pidió no reenviar (Matcha & CO).
5. **No polling**: para esperar resultados usa `send_later` (un único aviso hacia las 8:35 Europe/Madrid).

## Límites
- No comprometas el tiempo de terceros (p. ej., Sofía en trabajos de grabación de voz).
- No inventes experiencia ni reseñas.
- Guarda resultados en `TRABAJO-NOCHE.md` (raíz del repo) y deja a las 8:45 un resumen de 3 líneas como máximo: qué se hizo, gasto (connects/créditos) y qué queda pendiente.
