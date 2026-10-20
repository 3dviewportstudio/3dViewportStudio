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

## Proceso

1. **Expediente.** Resume el caso en ≤200 palabras: qué se vende, a quién, precio, costes, mercado, competencia, recursos del fundador. Si faltan datos críticos, haz como máximo 3 preguntas; si no hay respuesta, declara las suposiciones en el expediente. Busca en la web datos de mercado/competencia si hay WebSearch.
2. **Alegatos (2 subagentes, en paralelo).**
   - **Defensor:** el mejor argumento de que el negocio SALE BIEN (3-5 argumentos con evidencia, y cómo mitiga los riesgos).
   - **Fiscal:** el mejor argumento de que FRACASA (3-5 argumentos con evidencia, causa de muerte más probable).
   Cada uno recibe solo el expediente. Máx. 300 palabras. Deben ser honestos: sin inventar cifras; marcar estimaciones como tales.
3. **Jurado (15 subagentes, en paralelo, en un solo mensaje).** Cada jurado recibe expediente + ambos alegatos + SU perfil. Devuelve exactamente:
   `VOTO: VIABLE | NO VIABLE | VIABLE CON CONDICIONES` · `CONFIANZA: 1-10` · `RAZÓN (≤60 palabras)` · `CONDICIÓN CLAVE (si aplica)`.
   Instrúyeles: "Decide solo según tu perfil y la calidad de los argumentos, no por quién habló primero. Sé independiente."
4. **Veredicto (tú, el juez).** Cuenta votos, calcula confianza media por postura, identifica el desacuerdo principal y las condiciones más repetidas. Emite el informe.

## Perfiles del jurado (uno por jurado, 15)

| # | Perfil | Sesgo deliberado |
|---|---|---|
| 1 | Inversor de capital riesgo | Escala y retorno 10x |
| 2 | Contable / CFO | Márgenes, caja, punto de equilibrio |
| 3 | Cliente típico | ¿Pagaría yo por esto? |
| 4 | Cliente escéptico | Solución actual me basta |
| 5 | Experto de marketing | CAC, canales, tracción |
| 6 | Ingeniero / técnico | Factibilidad y deuda técnica |
| 7 | Abogado / regulador | Legal, licencias, propiedad intelectual |
| 8 | Competidor directo | Cómo lo aplastaría o copiaría |
| 9 | Emprendedor veterano que quebró | Causas de fracaso reales |
| 10 | Emprendedor veterano exitoso | Ejecución y timing |
| 11 | Analista de mercado | Tamaño y tendencia del mercado |
| 12 | Experto en operaciones/logística | Coste y complejidad de operar |
| 13 | Optimista pragmático | Busca el camino a que funcione |
| 14 | Pesimista / abogado del diablo | Busca el punto de ruptura |
| 15 | Ciudadano neutral sin sesgo | Sentido común |

Adapta 2-3 perfiles al sector del caso (p. ej. artista 3D, gamer, educador) sustituyendo los menos relevantes; mantén 15 y mezcla optimistas, pesimistas y neutros.

## Plantilla del informe final

```
# Veredicto: [VIABLE / NO VIABLE / VIABLE CON CONDICIONES]
Votos: X viable · Y con condiciones · Z no viable (confianza media N/10)
## Por qué ganó la mayoría   (3 puntos)
## La voz disidente          (mejor argumento de la minoría)
## Riesgos que decidirán el resultado
## Condiciones para que salga bien   (las más repetidas por el jurado)
## Próximos pasos de validación barata (≤3, con coste/tiempo)
```

Regla de decisión: ≥10 de 15 en una postura = veredicto claro; 6-9 = "dividido", recomienda el experimento que resolvería la duda; los "con condiciones" cuentan como viable solo si la condición es alcanzable y lo dices.

## Errores comunes

| Error | Corrección |
|---|---|
| Jurados lanzados en serie y leyéndose | Lanza los 15 en paralelo, sin compartir votos |
| Alegatos blandos o con cifras inventadas | Exige evidencia y marcar estimaciones |
| Veredicto = promedio ciego | Pondera por calidad del argumento, no solo por conteo |
| Dar la razón al usuario por halagar | El juez reporta el resultado aunque sea "no viable" |
| Jurados idénticos | Cada uno debe recibir su perfil único |
