# Web publicada (viewportstudio3d.netlify.app)

- `public/` es la carpeta que se sube a Netlify (arrastrar y soltar en el panel del proyecto, o `netlify deploy --dir netlify/public --prod`).
- `src/build.py` genera `public/es/index.html` y `public/en/index.html`. Los textos están en ese archivo (`COPY`, `PROJECTS`).
  Tras cambiar textos: `python3 netlify/src/build.py`.
- Estilos e interacción: `public/assets/site.css` y `public/assets/site.js` (sin dependencias).
- Las páginas legales (`/es/aviso-legal/`, `/es/privacidad/`, `/es/cookies/` y sus versiones en inglés) y `/_next/` se conservan de la versión anterior.
- Medición: Google Tag Manager `GTM-THP7D9FL`, solo tras aceptar cookies (clave `vs3d-cookies`, compartida con las páginas legales).
