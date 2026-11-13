---
name: contexto
description: Tarjeta de uso de la sesión. Úsala cuando el usuario escriba /contexto o /context, o pregunte cuánto uso lleva la sesión o qué hay dentro (contexto, tokens, herramientas, archivos, PRs).
---

# Tarjeta de contexto

Cuando el usuario pida `/context`, `/contexto` o el uso de la sesión, responde con una tarjeta, no con texto largo. No preguntes nada.

## Pasos (todo de golpe)
0. **Si en la conversación está la salida de `/context` (local-command-stdout), usa SUS números reales** (tokens usados, ventana, mensajes, herramientas MCP, skills, buffer, libre). Los de herramientas "deferred" no ocupan contexto: no los sumes a lo usado; el segmento "Libre" es la ventana menos lo usado y el buffer. En ese caso el pie dice "Datos reales de /context", no "estimado". Segmentos: `label` corto con porcentaje (la que empieza por "Libre" se pinta gris) y `pct` numérico; suma 100.
1. Si no hay salida de `/context`, reúne datos **reales** en paralelo: `get_session` (modelo y estado), `git log --oneline | wc -l`, rama actual, PRs y commits de la sesión, archivos tocados, y los tokens restantes si el sistema los muestra (`total_tokens`).
2. Escribe `datos.json` en el scratchpad con este formato:
   ```json
   {"tabs":["Contexto","Sesión"],"range":"Sesión actual",
    "tiles":[["Modelo","Sonnet 5.5"],["Tokens restantes","15M"],["PRs","4"],["Commits","5"],["Archivos","2"],["Skills","3"]],
    "segments":[{"label":"Sistema y herramientas","pct":30},{"label":"Skills","pct":10},{"label":"Conversación","pct":35},{"label":"Resultados de herramientas","pct":15},{"label":"Libre","pct":10}],
    "foot":"Porcentajes estimados: no tengo acceso al contador exacto."}
   ```
   Los números de casillas deben ser reales. Los porcentajes de `segments` son una **estimación** y la línea `foot` debe decirlo siempre. Suma 100.
3. Ejecuta `node .claude/skills/contexto/render.js datos.json <scratchpad>` (genera `tarjeta-ancha.png` y `tarjeta-cuadrada.png`).
4. Envía las dos con un solo `SendUserFile` (`display: "render"`): ancha para ordenador, cuadrada para móvil.
5. Cierra con una línea: lo que ocupa más y, si el contexto está casi lleno, recomienda `/compact`.
