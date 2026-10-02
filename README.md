# ViewportStudio3D — web

Web del estudio de render 3D de producto de **Lucas Expósito**. Bilingüe (español en `/`, inglés en `/en`), pensada para convertir visitas de marcas de e-commerce en consultas.

## Tecnología

- **Next.js (App Router) + TypeScript + Tailwind CSS**. Páginas estáticas, sin base de datos.
- **GSAP + ScrollTrigger** para el movimiento ligado al scroll y **Lenis** para el scroll suave en escritorio. Ambos se cargan después de la primera pintura y se desactivan si el usuario tiene activado *reducir movimiento*.
- **Resend** envía el formulario de contacto desde el servidor (la clave nunca llega al navegador).
- Renders en **AVIF 4:4:4 + JPEG 4:4:4** y vídeos **H.264 sin audio** (1080p y 720p), generados con `npm run media`.

## Puesta en marcha

Necesitas Node.js 20.9 o superior.

```bash
npm install
cp .env.example .env.local   # rellena las variables (ver abajo)
npm run dev                  # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Compilación y servidor de producción |
| `npm run typecheck` | Comprueba los tipos de TypeScript |
| `npm run lint` | ESLint (reglas de Next.js y Core Web Vitals) |
| `npm run check` | Las tres comprobaciones anteriores seguidas |
| `npm run media` | Regenera renders y vídeos optimizados (requiere `ffmpeg`) |

## Tipografía

- **Satoshi** (Indian Type Foundry, gratuita para uso comercial en [fontshare.com](https://www.fontshare.com/fonts/satoshi)) para titulares: `src/fonts/Satoshi-Bold.woff2` y `Satoshi-Black.woff2`, recortadas al alfabeto latino (≈18 KB cada una).
- **Geist** y **Geist Mono** (paquete `geist`) para texto y datos técnicos.

## Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `RESEND_API_KEY` | Sí, para que el formulario envíe | Clave de [Resend](https://resend.com). Sin ella, el formulario ofrece enviar el mensaje desde el correo del visitante. |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | Sí, antes de publicar | Domicilio del titular para el aviso legal (también se puede poner directamente en `src/lib/site.ts`). |
| `NEXT_PUBLIC_LEGAL_HOLDER` / `NEXT_PUBLIC_LEGAL_NIF` | No | Sobrescriben el titular y el NIF definidos en `src/lib/site.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Cuando tengas dominio | URL pública, p. ej. `https://viewportstudio3d.com`. En Vercel, si falta, se usa la URL de producción del proyecto. |
| `CONTACT_TO_EMAIL` | No | Destino de las consultas (por defecto, 3dviewportstudio@gmail.com). |
| `CONTACT_FROM_EMAIL` | No | Remitente. Por defecto, el de pruebas de Resend. Si verificas tu dominio en Resend: `ViewportStudio3D <web@tudominio.com>`. |

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (o usa `npx vercel` desde la carpeta).
2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repositorio. Vercel detecta Next.js solo.
3. En **Settings → Environment Variables**, añade las variables de la tabla anterior y vuelve a desplegar.
4. **Dominio:** cuando lo compres, añádelo en **Settings → Domains** y pon su URL en `NEXT_PUBLIC_SITE_URL`.

### Configurar Resend (formulario)

1. Crea una cuenta gratuita en [resend.com](https://resend.com) **con el email 3dviewportstudio@gmail.com**. Sin dominio verificado, Resend solo permite enviar a la dirección de la propia cuenta, que es justo a donde deben llegar las consultas.
2. **API Keys → Create API Key** (permiso *Sending access*) y cópiala en `RESEND_API_KEY`.
3. Cuando tengas dominio, verifícalo en Resend (**Domains**) y define `CONTACT_FROM_EMAIL` con una dirección de ese dominio.

Cada consulta llega con el asunto «Nueva consulta web · Nombre (Marca)»: puedes responder directamente, porque la respuesta va al email del cliente.

## Editar contenido

| Qué | Dónde |
|---|---|
| Textos de la web (ES/EN) | `src/content/copy.ts` |
| Proyectos, galerías y testimonios | `src/content/projects.ts` |
| Aviso legal y privacidad | `src/content/legal.ts` |
| Email, herramientas, años de experiencia | `src/lib/site.ts` |
| Colores, tipografías y estilos base | `src/app/globals.css` |

**Testimonios:** la sección está oculta mientras la lista `testimonials` de `src/content/projects.ts` esté vacía. Cuando Fine Nipona te dé su cita (y permiso para publicarla), añádela ahí y aparecerá sola en la home.

**Añadir un proyecto:**

1. Deja los originales en la carpeta de la web (junto a `Imágenes para la web` y `Videos`).
2. Añádelos a las listas `IMAGES` / `VIDEOS` de `scripts/build-media.mjs` y ejecuta `npm run media`.
3. Crea la ficha en `src/content/projects.ts`. La home, la página del caso, el sitemap y los datos estructurados se generan solos.
4. Crea sus imágenes para redes (1200×630) en `public/og/<slug>-es.jpg` y `-en.jpg`.

## Estructura

```
src/
  app/(es)/…            Páginas en español (raíz)
  app/(en)/en/…         Páginas en inglés
  app/sitemap.ts        Sitemap con alternativas de idioma
  app/robots.ts         Las previsualizaciones de Vercel no se indexan
  components/sections/  Secciones de la home
  components/pages/     Plantillas de home, caso, legales y 404
  components/ui/        Visor "Viewport", <Picture>, vídeo en bucle…
  content/              Textos, proyectos, legales y manifiesto de medios
  lib/                  Rutas, SEO, datos estructurados, formulario
public/media/           Renders y vídeos optimizados (generados)
public/og/              Imágenes para compartir en redes
scripts/build-media.mjs Optimización de renders y vídeos
```

## Antes de publicar

- [ ] `RESEND_API_KEY` configurada y formulario probado de principio a fin.
- [ ] Domicilio del titular añadido al aviso legal.
- [ ] Repositorio de GitHub en modo **privado** (el aviso legal incluye datos personales del titular).
- [ ] Revisados los textos legales, las condiciones de uso de las imágenes (FAQ) y el plazo de conservación de datos (privacidad).
