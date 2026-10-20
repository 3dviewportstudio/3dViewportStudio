---
name: juzgado-de-negocios
description: Use when the user wants to know if a business, startup, product or idea would succeed or fail, asks for a verdict, a second opinion, "¿saldría bien este negocio?", a viabilidad check, or wants opposing views debated before deciding. Triggers - juzgado, jurado, juicio, fiscal vs defensor, go/no-go.
---

# Juzgado de Negocios

## Overview

Un juicio simulado sobre la viabilidad de un negocio. **Dos Claudes abogados** defienden posturas opuestas, **15 Claudes jurados** (cada uno con una óptica distinta) votan de forma independiente y un **juez** (tú) emite el veredicto final.

**Principio:** la opinión se forma por contraste y por votos independientes, nunca por consenso previo. Los jurados no se ven entre sí.

## Cuándo usar

- "¿Funcionaría este negocio / app / producto?"
- Decisión go/no-go, pivot, o validar una idea antes de invertir.
- NO usar para preguntas factuales simples ni para ejecutar un plan ya decidido.

## Modos

| Modo | Jurados | Cuándo | Agentes |
|---|---|---|---|
| **Ligero** (por defecto si el usuario pide gastar poco o es un primer filtro) | 5: perfiles 1, 2, 3, 13, 14 de la tabla (inversor, CFO, cliente comprador, optimista, pesimista) | Primera pasada, decisión barata, ideas aún difusas | 7 (2 abogados + 5 jurados) |
| **Completo** | 15 | Decisión con dinero o tiempo reales en juego, o si el ligero sale dividido | 17 |

Pregunta el modo solo si no está claro; ante la duda, usa el ligero y ofrece el completo. Con el ligero: ≥4 de 5 en una postura = veredicto claro; 2-3 = dividido y se recomienda pasar al modo completo. El control de diversidad no aplica en el ligero; avisa de que 5 jurados dan una señal, no una muestra.

## Proceso

1. **Expediente.** Resume el caso en ≤200 palabras: qué se vende, a quién, precio, costes, mercado, competencia, recursos del fundador. Si faltan datos críticos, haz como máximo 3 preguntas; si no hay respuesta, declara las suposiciones en el expediente. Busca en la web datos de mercado/competencia si hay WebSearch.
2. **Alegatos (2 subagentes, en paralelo).**
   - **Defensor:** el mejor argumento de que el negocio SALE BIEN (3-5 argumentos con evidencia, y cómo mitiga los riesgos).
   - **Fiscal:** el mejor argumento de que FRACASA (3-5 argumentos con evidencia, causa de muerte más probable).
   Cada uno recibe solo el expediente. Máx. 300 palabras. Deben ser honestos: sin inventar cifras; marcar estimaciones como tales.
3. **Jurado (5 o 15 subagentes según el modo, en paralelo, en un solo mensaje).** Cada jurado recibe el expediente, **el texto íntegro de ambos alegatos** (no un resumen tuyo), y SU ficha de perfil (ver tabla: sesgo, qué le importa, su umbral de rechazo y su punto ciego). Cada uno debe:
   - Decidir **solo desde su perfil** y puntuar el negocio solo en SU criterio (p. ej. el inversor solo mira escala).
   - Dar **dos votos binarios**, sin término medio: `VOTO HOY` (el negocio tal como está en el expediente) y `VOTO CON PLAN` (si cumple las condiciones que tú mismo exiges). Si dudas, elige hacia dónde caes.
   - Nombrar su **umbral de rechazo**: el hecho concreto que le haría cambiar el voto.
   Formato: `VOTO HOY` · `VOTO CON PLAN` · `CONFIANZA 1-10` (usa todo el rango; 5 es "no sé") · `RAZÓN ≤60 palabras` · `UMBRAL DE RECHAZO` · `CONDICIONES`.
4. **Veredicto (tú, el juez).** Cuenta por separado los votos HOY y CON PLAN, calcula confianza media por postura, identifica el desacuerdo principal y las condiciones más repetidas. Emite el informe.

## Perfiles del jurado (uno por jurado; el modo ligero usa los marcados con ★)

Cada ficha: **mide** (su único criterio) · **rechaza si** (su umbral) · **punto ciego** (lo que ignora).

| # | Perfil | Mide | Rechaza si | Punto ciego |
|---|---|---|---|---|
| 1 ★ | Inversor VC | Escala 10x | Techo ligado a horas de una persona | Negocios pequeños pero rentables |
| 2 ★ | CFO | Caja y margen por proyecto | Sin punto de equilibrio claro | Valor de marca y oportunidad |
| 3 ★ | Cliente que compraría | Confianza para pagar | Pruebas insuficientes para arriesgar su dinero | Cómo capta el vendedor |
| 4 | Cliente escéptico | Ahorro frente a su alternativa | La alternativa barata le basta | Calidad premium |
| 5 | Experto en adquisición | CAC y canales | Sin canal medible | Producto y ejecución |
| 6 | Técnico del sector | Calidad y factibilidad | Entrega irrealista | Ventas |
| 7 | Abogado / regulador | Cumplimiento y contratos | Riesgo legal sin resolver | Mercado |
| 8 | Competidor directo | Amenaza real | No tiene nada que yo no pueda copiar | Nichos pequeños |
| 9 | Fundador que quebró | Causas de muerte | Repite un patrón de fracaso conocido | Casos de éxito |
| 10 | Veterano exitoso | Ejecución y networking | Depende solo de marketing pasivo | Escala |
| 11 | Analista de mercado | Tamaño y tendencia | Mercado se encoge | Ejecución individual |
| 12 | Comprador B2B / agencia | Fiabilidad y plazos | Sin garantías de continuidad | Precio |
| 13 ★ | Optimista | Camino realista a funcionar | No existe ningún camino | Riesgos silenciosos |
| 14 ★ | Pesimista | Punto de ruptura | Ningún riesgo mortal sin mitigar | Posibilidades de mejora |
| 15 | Ciudadano neutral | Sentido común | Suena a proyecto personal, no a negocio | Detalles del sector |

Adapta 2-3 perfiles al sector del caso (p. ej. artista 3D, gamer, educador) sustituyendo los menos relevantes; mantén 15 y mezcla optimistas, pesimistas y neutros.

## Plantilla del informe final

```
# Veredicto: HOY [VIABLE / NO VIABLE / DIVIDIDO] · CON PLAN [VIABLE / NO VIABLE / DIVIDIDO]
Votos HOY: X viable · Y no viable (confianza media N/10)
Votos CON PLAN: X viable · Y no viable (confianza media N/10)
## Por qué ganó la mayoría   (3 puntos)
## La voz disidente          (mejor argumento de la minoría)
## Riesgos que decidirán el resultado
## Condiciones para que salga bien   (las más repetidas por el jurado)
## Próximos pasos de validación barata (≤3, con coste/tiempo)
```

Regla de decisión en modo completo (se aplica a HOY y a CON PLAN por separado): ≥10 de 15 en una postura = veredicto claro; 6-9 = "dividido", recomienda el experimento que resolvería la duda. Las condiciones se resumen aparte, no cambian el voto.

**Lectura conjunta:** HOY no viable + CON PLAN viable = "no está listo, pero tiene camino": el informe debe listar las condiciones del plan. HOY no viable + CON PLAN no viable = no viable de fondo. HOY viable = viable ya.

**Control de diversidad (antes de emitir el veredicto):** si ≥13 de 15 votan igual con confianza dentro de ±1, avisa de que el jurado puede estar sesgado hacia el consenso. Relanza solo a los 3 jurados con ficha más opuesta (1, 14, 4) con la instrucción "argumenta el voto contrario al de la mayoría y di si te convence", y reporta ambos resultados.

## Errores comunes

| Error | Corrección |
|---|---|
| Jurados lanzados en serie y leyéndose | Lanza los 15 en paralelo, sin compartir votos |
| Alegatos blandos o con cifras inventadas | Exige evidencia y marcar estimaciones |
| Veredicto = promedio ciego | Pondera por calidad del argumento, no solo por conteo |
| Dar la razón al usuario por halagar | El juez reporta el resultado aunque sea "no viable" |
| Jurados idénticos | Cada uno recibe ficha única (mide, rechaza si, punto ciego) y vota solo desde ella |
| Voto "con condiciones" como refugio | Prohibido: dos votos binarios (HOY y CON PLAN) y las condiciones van aparte |
| Tratar la falta de pruebas como "no viable de fondo" | El voto CON PLAN separa "hoy no" de "nunca" |
| Resumir los alegatos al jurado | Pasar el texto íntegro; el resumen introduce tu sesgo |
