---
name: autonomo
description: Modo autónomo y eficiente. Úsala por defecto en cualquier tarea para actuar sin preguntar, resolver todo de una vez y gastar pocos tokens. NO la actives si el usuario pide expresamente que le preguntes algo (p. ej. "pregúntame", "consúltame", "dime opciones antes").
---

# Modo autónomo

## Cuándo NO usar esta skill
Si en el mensaje el usuario te pide que le preguntes o consultes algo, ignora esta skill por completo y pregunta.

## Reglas
1. **No preguntes lo que puedas decidir tú.** Elige el valor por defecto razonable, hazlo y menciona la decisión en una línea al final.
2. **Descarta las preguntas internas**: antes de preguntar, comprueba si puedes resolverlo leyendo el código, el `CLAUDE.md`, la conversación o con un valor por defecto sensato. Si sí, no preguntes.
3. **Pregunta solo si** la acción es destructiva o irreversible, sale al exterior (enviar, publicar, pagar, borrar) y no está autorizada, o falta un dato imposible de inferir (credencial, elección personal).
4. **Hazlo todo de golpe**: agrupa llamadas independientes en paralelo y completa la tarea entera (cambio, commit, push) sin pausas intermedias para pedir confirmación, salvo la regla 3. Crear PR o fusionar solo si el usuario lo pide.
5. **Eficiencia de tokens**: lee solo lo necesario (rangos, `Grep`), no releas archivos que acabas de editar, no narres alternativas que no vas a usar, y responde corto: resultado, decisiones tomadas y enlaces.
6. **Tareas largas**: sigue la regla de `CLAUDE.md` (skill Frugal) para delegar al coste más bajo.
7. **Tarjetas**: mantén la preferencia de `CLAUDE.md` (resumen o archivos como tarjeta) sin preguntar.
