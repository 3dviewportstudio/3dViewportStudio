#!/usr/bin/env python3
"""Genera netlify/public/es/index.html y netlify/public/en/index.html.

Uso:  python3 netlify/src/build.py
Los textos están aquí abajo (COPY). Lo que va entre *asteriscos* se pinta en serif cursiva.
La carpeta netlify/public es la que se sube a Netlify (arrastrar y soltar o CLI).
Las páginas legales (aviso legal, privacidad, cookies) se conservan tal cual de la web anterior.
"""
import html
import json
import re
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / 'public'
SITE = 'https://viewportstudio3d.netlify.app'
EMAIL = '3dviewportstudio@gmail.com'
SOCIALS = [
    ('Instagram', 'https://www.instagram.com/viewportstudio3d/'),
    ('TikTok', 'https://www.tiktok.com/@viewport.studio'),
    ('Upwork', 'https://www.upwork.com/freelancers/viewportstudio3d'),
]

# Proyectos: el orden define el reel del hero; "col" reparte la rejilla (v = vertical, h = horizontal)
PROJECTS = [
    dict(slug='fine-nipona', name='Fine Nipona', client=True, col='v', dims='1080 × 1920', dur={'es': '12 s', 'en': '12 s'},
         videos=['/projects/fine-nipona/pack', '/projects/fine-nipona/blanco', '/projects/fine-nipona/negro'], poster='/posters/pack.webp',
         desc={'es': 'Packaging de matcha y mulberry matcha, animado en sus dos versiones.', 'en': 'Matcha and mulberry matcha packaging, animated in both versions.'}),
    dict(slug='pphone-17', name='pPhone 17', client=False, col='h', dims='1920 × 1080', dur={'es': '12,7 s', 'en': '12.7 s'},
         videos=['/projects/pphone-17/pphone'], poster='/posters/pphone.webp', start=8.5,
         desc={'es': 'Lanzamiento de un smartphone en cinco colores.', 'en': 'A smartphone launch in five colours.'}),
    dict(slug='ps5', name='PlayStation 5', client=False, col='v', dims='1080 × 1920', dur={'es': '19 s', 'en': '19 s'},
         videos=['/projects/ps5/ps5'], poster='/posters/ps5.webp',
         desc={'es': 'Anuncio vertical de la consola y el mando DualSense.', 'en': 'Vertical ad for the console and the DualSense controller.'}),
    dict(slug='logitech-g435', name='Logitech G435', client=False, col='h', dims='1920 × 1080', dur={'es': '15 s', 'en': '15 s'},
         videos=['/projects/logitech-g435/g435'], poster='/posters/g435.webp',
         desc={'es': 'Anuncio de 15 segundos para unos auriculares gaming.', 'en': 'A 15-second ad for a gaming headset.'}),
    dict(slug='rog-ally', name='ASUS ROG Ally', client=False, col='h', dims='1920 × 1080', dur={'es': '15 s', 'en': '15 s'},
         videos=['/projects/rog-ally/rog'], poster='/posters/rog.webp',
         desc={'es': 'Anuncio de 15 segundos para una consola portátil.', 'en': 'A 15-second ad for a handheld console.'}),
]

DETAIL = [
    ('/stills/g-mulberry.webp', 640, 1138, {'es': 'Bolsa negra de Mulberry Matcha de Fine Nipona en 3D', 'en': 'Black Fine Nipona Mulberry Matcha pouch in 3D'}),
    ('/stills/g435-detalle.webp', 1400, 788, {'es': 'Detalle del tejido y los botones de los auriculares Logitech G435', 'en': 'Close-up of the Logitech G435 fabric and buttons'}),
    ('/stills/g-blanco.webp', 560, 700, {'es': 'Bolsa blanca de Matcha de Fine Nipona en 3D', 'en': 'White Fine Nipona Matcha pouch in 3D'}),
    ('/stills/g-verde.webp', 760, 428, {'es': 'Cámaras del pPhone 17 verde en primer plano', 'en': 'Close-up of the green pPhone 17 cameras'}),
    ('/stills/g-negro.webp', 560, 700, {'es': 'Bolsa negra de Fine Nipona sobre piedra', 'en': 'Black Fine Nipona pouch on stone'}),
    ('/stills/g-lila.webp', 560, 560, {'es': 'pPhone 17 en color lila', 'en': 'Lilac pPhone 17'}),
]

COPY = {
    'es': dict(
        locale='es_ES', other='en', title='Viewport Studio 3D | Renders y animaciones 3D de producto',
        description='Renders, vídeos y animaciones 3D de producto hechos en Blender, también con IA. Para marcas y agencias que quieren destacar.',
        skip='Saltar al contenido', menu='Menú',
        nav=[('proyectos', 'Proyectos'), ('servicios', 'Servicios'), ('ia', 'IA'), ('proceso', 'Proceso'), ('sobre', 'Estudio')],
        contact_id='contacto', cta='Pedir presupuesto',
        legal=[('Aviso legal', '/es/aviso-legal/'), ('Política de privacidad', '/es/privacidad/'), ('Política de cookies', '/es/cookies/')],
        hero=dict(
            live='Abierto a nuevos proyectos', tags='CGI · Producto · Motion · IA',
            lines=['Tu producto', 'en *3D*,', 'listo para vender.'],
            lead='Renders y animaciones 3D de tu producto, hechos en Blender. También uso IA cuando suma, sin cambiar la forma real de tu producto.',
            primary='Pedir presupuesto', secondary='Ver proyectos',
            who='Lucas', who_role='Artista 3D · Blender, de principio a fin',
            reel='Reel de proyectos. Pulsa a la izquierda o a la derecha para cambiar.', client='Cliente', fan='Fan Art',
        ),
        marquee=['Renders de producto', 'Animación 3D', 'Packaging y campañas', 'CGI publicitario', 'Contenido con IA', 'Líquidos y materiales'],
        work=dict(label='Nuestro trabajo', title='Proyectos *seleccionados*.', lead='Algunos de mis trabajos. Pulsa en uno para verlo a pantalla completa.', open='Ampliar'),
        manifesto='Modelo, ilumino y animo tu producto yo solo, en Blender, de principio a fin. Materiales que parecen reales, líquidos que se mueven bien y respuestas rápidas.',
        services=dict(label='Servicios', title='Qué hago, *de principio a fin*.', lead='Tres cosas que hago más a menudo.', items=[
            ('Renders de producto', 'Imágenes fotorrealistas de tu producto, listas para tienda online, catálogo o redes.', '/stills/renders.webp', 'Render 3D del pPhone 17 en sus cinco colores'),
            ('Animación 3D', 'Piezas de vídeo cortas que enseñan el producto en movimiento, pensadas para lanzamientos y anuncios.', '/stills/animacion-g435.webp', 'Fotograma de la animación de los auriculares Logitech G435'),
            ('Visuales para packaging y campañas', 'Tu packaging en 3D antes de imprimirlo y visuales de campaña sin necesidad de sesión de fotos.', '/stills/packaging.webp', 'Bolsa blanca de Matcha de Fine Nipona en 3D'),
        ]),
        ai=dict(
            label='IA + 3D', title=['Tu producto, siempre exacto.', 'La IA hace *el resto*.'],
            lead='Primero modelo tu producto en Blender, con su envase, logo y proporciones. Después uso IA para lo que va alrededor: fondos, variantes y pruebas. El producto nunca sale de la IA.',
            flow=['Modelo 3D exacto', 'La IA crea el entorno', 'Retoque y entrega'],
            items=[
                ('Escenarios sin límite', 'Pruebo fondos y ambientes alrededor de tu producto antes de montar la escena final. Así eliges viendo imágenes, no descripciones.'),
                ('De render a vídeo', 'Saco clips cortos para redes y anuncios a partir de un render. Más piezas, mismo presupuesto.'),
                ('Variantes a escala', 'Colores, sabores, idiomas o tamaños de anuncio, en tanda. La etiqueta siempre igual que el diseño original.'),
                ('Producto en uso', 'Tu producto en una mesa, en una mano o en un salón, con personas y espacios generados. Sin casting ni localizaciones.'),
                ('Conceptos en horas', 'Tableros de referencia y direcciones visuales en pocas horas. Eliges el estilo antes de gastar en el render final.'),
                ('Reescalado y retoque', 'Imágenes a 4K o más y limpieza de detalles para impresión, pantallas grandes o marketplaces.'),
            ],
            note='La IA no inventa tu producto. Todo parte del modelo 3D, así que lo que ve tu cliente es lo que recibe.',
            cta='Hablemos de tu idea',
        ),
        detail=dict(label='Detalle', title='Materiales, luz y líquidos *de cerca*.', lead='Detalles de renders reales: acabados, reflejos y etiquetas que aguantan de cerca.'),
        process=dict(label='Cómo trabajo', title='Proceso, *paso a paso*.', lead='Cinco pasos, del primer correo al archivo final.', img_alt='Fotograma de una animación de producto en proceso', steps=[
            ('Briefing', 'Me cuentas el producto, el uso y la fecha. Te paso presupuesto y plazos.'),
            ('Modelado', 'Modelo el producto en Blender a partir de planos, fotos o la pieza real.'),
            ('Materiales e iluminación', 'Ajusto acabados, etiquetas y luz hasta que se parece al objeto de verdad.'),
            ('Animación y render', 'Movimiento de cámara y producto, y render final en la resolución que necesites.'),
            ('Entrega', 'Imágenes y vídeos en los formatos de cada canal, con una ronda de cambios incluida.'),
        ]),
        studio=dict(label='Estudio', title='Detrás del *render*.', avatar='Foto de Lucas, el artista detrás de Viewport Studio 3D',
                    text='Soy Lucas y llevo Viewport Studio 3D yo solo. Me especializo en producto: modelo, materiales, luz, animación y render, todo en Blender. Eso quiere decir que hablas siempre conmigo y que cuido mucho los materiales y los líquidos.',
                    facts=[('1', 'persona, de principio a fin'), ('30 €/h', 'desde, + IVA')], human='Persona real, no un robot. Esta es mi cara.', tools_label='Herramientas', tools=['Blender', 'Cycles', 'EEVEE', 'Geometry Nodes']),
        faq=dict(label='FAQ', title='Preguntas, *antes de empezar*.', items=[
            ('¿Cuánto cuesta un proyecto?', 'Desde 30 €/h + IVA (36,30 €/h IVA incluido). Cada proyecto se presupuesta a medida según el producto, el número de imágenes o vídeos y su complejidad.'),
            ('¿Cuánto tardas en entregarlo?', 'No hay plazos fijos: depende de cada proyecto. Junto con el presupuesto te doy una fecha estimada de entrega.'),
            ('¿Quién hace el trabajo?', 'Yo, de principio a fin: modelado, materiales, iluminación, animación y render. Hablas siempre con la misma persona.'),
            ('¿Para quién es este servicio?', 'Para marcas y agencias que necesiten un render o una animación 3D de su producto.'),
            ('¿Qué necesitas de mí para empezar?', 'Fotos, planos o medidas del producto, logos y etiquetas, y para qué vas a usar las imágenes. Si puedes, mejor envíame el producto físico: lo prefiero, y me permite reproducir materiales y acabados con más fidelidad.'),
            ('¿Cuántas rondas de cambios incluye?', 'Una ronda de cambios está incluida en la entrega. Los cambios adicionales se cobran a 30 €/h + IVA.'),
            ('¿En qué formatos entregas?', 'Imágenes en PNG o JPG y vídeos en MP4, en los tamaños de cada canal: web, tienda online, redes o anuncios. Los archivos de Blender no van incluidos: se entregan aparte, con coste adicional, si los necesitas.'),
            ('¿Usas inteligencia artificial?', 'Sí, como herramienta y siempre a la vista: para explorar estilos, generar fondos, crear variantes o convertir renders en vídeo. El producto siempre sale del modelo 3D en Blender, así que el envase, el logo y las proporciones son exactos. Si prefieres un proyecto 100 % 3D, sin IA, también lo hago.'),
        ]),
        contact=dict(label='Contacto', title='¿Tienes un producto que lanzar? *Hagámoslo en 3D.*', lead='Para marcas, agencias y emprendedores. Cuéntame qué necesitas y te respondo con una propuesta y un presupuesto.',
                     direct='O escríbeme directamente a', form='Hoja de pedido', name='Nombre', email='Email', message='Mensaje',
                     placeholder='Qué producto es, qué necesitas (imágenes, vídeo, IA) y para cuándo.', submit='Pedir presupuesto',
                     price='Desde 30 €/h + IVA (36,30 €/h IVA incluido)', note='Al enviar se abrirá tu aplicación de correo con el mensaje preparado. Tus datos solo se usan para responderte. Más en la',
                     privacy='Política de privacidad', privacy_href='/es/privacidad/'),
        footer=dict(nav='Navegación', legal='Legal', social='Redes', cookies='Configurar cookies', rights='Todos los derechos reservados.', top='Volver arriba'),
        cookies=dict(body='Usamos cookies de medición (Google Analytics) para entender cómo se usa la web. Solo se activan si las aceptas.', more='Política de cookies', accept='Aceptar', reject='Rechazar'),
        lb=dict(close='Cerrar', prev='Anterior', next='Siguiente'),
    ),
    'en': dict(
        locale='en_US', other='es', title='Viewport Studio 3D | 3D product renders and animations',
        description='3D product renders, videos and animations made in Blender, with AI where it helps. For brands and agencies that want to stand out.',
        skip='Skip to content', menu='Menu',
        nav=[('proyectos', 'Projects'), ('servicios', 'Services'), ('ia', 'AI'), ('proceso', 'Process'), ('sobre', 'Studio')],
        contact_id='contacto', cta='Get a quote',
        legal=[('Legal notice', '/en/legal-notice/'), ('Privacy policy', '/en/privacy/'), ('Cookie policy', '/en/cookies/')],
        hero=dict(
            live='Open to new projects', tags='CGI · Product · Motion · AI',
            lines=['Your product', 'in *3D*,', 'ready to sell.'],
            lead='Renders and 3D animations of your product, made in Blender. I use AI too when it helps, without changing how your product really looks.',
            primary='Get a quote', secondary='See projects',
            who='Lucas', who_role='3D artist · Blender, start to finish',
            reel='Project reel. Tap left or right to switch.', client='Client', fan='Fan Art',
        ),
        marquee=['Product renders', '3D animation', 'Packaging & campaigns', 'Advertising CGI', 'AI content', 'Liquids & materials'],
        work=dict(label='Our work', title='Selected *projects*.', lead='Some of my recent work. Click one to watch it full screen.', open='Expand'),
        manifesto='I model, light and animate your product myself, in Blender, from start to finish. Materials that look real, liquids that move properly, and quick replies.',
        services=dict(label='Services', title='What I do, *start to finish*.', lead='Three things I do most often.', items=[
            ('Product renders', 'Photoreal images of your product, ready for your online store, catalogue or social feeds.', '/stills/renders.webp', '3D render of the pPhone 17 in its five colours'),
            ('3D animation', 'Short videos that show the product in motion, made for launches and ads.', '/stills/animacion-g435.webp', 'Frame from the Logitech G435 headset animation'),
            ('Packaging and campaign visuals', 'See your packaging in 3D before it goes to print, and get campaign visuals without a photo shoot.', '/stills/packaging.webp', 'White Fine Nipona Matcha pouch in 3D'),
        ]),
        ai=dict(
            label='AI + 3D', title=['Your product, always exact.', 'AI does *the rest*.'],
            lead='First I model your product in Blender, with its packaging, logo and proportions. Then I use AI for what goes around it: backdrops, variants and tests. The product itself never comes from AI.',
            flow=['Exact 3D model', 'AI builds the setting', 'Retouch & delivery'],
            items=[
                ('Endless settings', 'I test backdrops and environments around your product before building the final scene. You pick by looking at images, not descriptions.'),
                ('From render to video', 'I cut short clips for social and ads from a single render. More assets, same budget.'),
                ('Variants at scale', 'Colours, flavours, languages or ad sizes, in batches. The label always matches the original design.'),
                ('Product in use', 'Your product on a table, in a hand or in a living room, with generated people and spaces. No casting, no locations.'),
                ('Concepts in hours', 'Mood boards and visual directions in a few hours. You choose the style before paying for the final render.'),
                ('Upscaling & retouch', 'Images at 4K and beyond, with clean details for print, big screens or marketplaces.'),
            ],
            note='AI does not invent your product. Everything starts from the 3D model, so what your customer sees is what they get.',
            cta='Let’s talk about your idea',
        ),
        detail=dict(label='Detail', title='Materials, light and liquids *up close*.', lead='Details from real renders: finishes, reflections and labels that hold up up close.'),
        process=dict(label='How I work', title='Process, *step by step*.', lead='Five steps, from the first email to the final file.', img_alt='Frame from a product animation in progress', steps=[
            ('Briefing', 'You tell me about the product, where it will be used and the deadline. I send a quote and a timeline.'),
            ('Modelling', 'I model the product in Blender from drawings, photos or the real thing.'),
            ('Materials and lighting', 'I tune finishes, labels and light until it looks like the real object.'),
            ('Animation and render', 'Camera and product motion, and a final render at the resolution you need.'),
            ('Delivery', 'Images and videos in the formats each channel needs, with one round of changes included.'),
        ]),
        studio=dict(label='Studio', title='Behind the *render*.', avatar='Foto de Lucas, el artista detrás de Viewport Studio 3D',
                    text='I’m Lucas, and I run Viewport Studio 3D on my own. I specialise in products: modelling, materials, light, animation and render, all in Blender. You always talk to me, and I take special care with materials and liquids.',
                    facts=[('1', 'person, start to finish'), ('€30/h', 'from, + VAT')], human='A real person, not a robot. This is my face.', tools_label='Tools', tools=['Blender', 'Cycles', 'EEVEE', 'Geometry Nodes']),
        faq=dict(label='FAQ', title='Questions, *before we start*.', items=[
            ('How much does a project cost?', 'From €30/hour + VAT (€36.30 including VAT). Every project is quoted individually, based on the product, the number of images or videos and their complexity.'),
            ('How long does it take?', 'There are no fixed lead times: it depends on each project. Along with the quote I give you an estimated delivery date.'),
            ('Who does the work?', 'I do, from start to finish: modelling, materials, lighting, animation and render. You always talk to the same person.'),
            ('Who is this service for?', 'For brands and agencies that need a 3D render or animation of their product.'),
            ('What do you need from me to start?', 'Photos, drawings or measurements of the product, logos and labels, and what the images will be used for. If you can, send me the physical product: I prefer it, and it lets me reproduce materials and finishes more faithfully.'),
            ('How many rounds of changes are included?', 'One round of changes is included with the delivery. Extra changes are charged at €30/hour + VAT.'),
            ('What formats do you deliver?', 'Images as PNG or JPG and videos as MP4, in the sizes each channel needs: website, online store, social media or ads. Blender files are not included: they are delivered separately, at an extra cost, if you need them.'),
            ('Do you use AI?', 'Yes — as a tool, and always openly: to explore styles, generate backdrops, create variants or turn renders into video. The product always comes from the 3D model in Blender, so packaging, logo and proportions are exact. If you prefer a 100% 3D project with no AI, I do that too.'),
        ]),
        contact=dict(label='Contact', title='Got a product to launch? *Let’s make it 3D.*', lead='For brands, agencies and entrepreneurs. Tell me what you need and I will get back to you with a proposal and a quote.',
                     direct='Or email me directly at', form='Order sheet', name='Name', email='Email', message='Message',
                     placeholder='What the product is, what you need (images, video, AI) and by when.', submit='Get a quote',
                     price='From €30/hour + VAT (€36.30 including VAT)', note='Sending opens your email app with the message ready to go. Your details are only used to reply to you. See the',
                     privacy='Privacy policy', privacy_href='/en/privacy/'),
        footer=dict(nav='Navigation', legal='Legal', social='Social', cookies='Cookie settings', rights='All rights reserved.', top='Back to top'),
        cookies=dict(body='We use measurement cookies (Google Analytics) to understand how the site is used. They only run if you accept.', more='Cookie policy', accept='Accept', reject='Reject'),
        lb=dict(close='Close', prev='Previous', next='Next'),
    ),
}

ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
EXPAND = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>'
STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z"/></svg>'
PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
S = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
AI_ICONS = [
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><path d="M3 19 9.5 10l4 5.5L16 12l5 7H3Z"/><circle cx="17" cy="6" r="2"/></svg>',
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5v-5Z"/></svg>',
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-2a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5V13a1.5 1.5 0 0 1 3 0"/></svg>',
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><path d="M12 3c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7Z"/><path d="M19 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z"/></svg>',
    f'<svg width="22" height="22" viewBox="0 0 24 24" {S} aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
]


def e(s):
    return html.escape(s, quote=True)


def rich(s):
    """Escapa y convierte *texto* en acento serif cursiva."""
    return re.sub(r'\*([^*]+)\*', r'<span class="serif">\1</span>', e(s))


def sources(base):
    return f'<source src="{base}.webm" type="video/webm"><source src="{base}.mp4" type="video/mp4">'


def head(lang, c):
    url = f'{SITE}/{lang}/'
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(c["title"])}</title>
<meta name="description" content="{e(c["description"])}">
<meta name="theme-color" content="#050607">
<link rel="canonical" href="{url}">
<link rel="alternate" hreflang="es" href="{SITE}/es/">
<link rel="alternate" hreflang="en" href="{SITE}/en/">
<link rel="alternate" hreflang="x-default" href="{SITE}/es/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Viewport Studio 3D">
<meta property="og:title" content="{e(c["title"])}">
<meta property="og:description" content="{e(c["description"])}">
<meta property="og:url" content="{url}">
<meta property="og:locale" content="{c["locale"]}">
<meta property="og:image" content="{SITE}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(c["title"])}">
<meta name="twitter:description" content="{e(c["description"])}">
<meta name="twitter:image" content="{SITE}/og.jpg">
<link rel="icon" href="/icon.png" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-icon.png">
<link rel="preload" href="/fonts/InterTight.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/InstrumentSerif-Italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=2">
<script>(function(){{var d=document.documentElement;d.classList.add(matchMedia('(prefers-reduced-motion: reduce)').matches?'r':'m')}})();
window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}window.gtag=gtag;gtag('consent','default',{{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}});window.vsLoadGTM=function(){{if(window.vsGTM)return;window.vsGTM=1;var w=window,d=document;w.dataLayer.push({{'gtm.start':new Date().getTime(),event:'gtm.js'}});var j=d.createElement('script');j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=GTM-THP7D9FL';d.head.appendChild(j);}};</script>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"ProfessionalService","name":"Viewport Studio 3D","url":"{url}","logo":"{SITE}/brand/logo-vs.webp","image":"{SITE}/og.jpg","description":{json.dumps(c["description"], ensure_ascii=False)},"email":"{EMAIL}","inLanguage":"{lang}","priceRange":"€€","sameAs":[{",".join('"%s"' % u for _, u in SOCIALS)}]}}</script>
</head>'''


def nav(lang, c):
    other = c['other']
    links = ''.join(f'<a href="#{i}">{e(t)}</a>' for i, t in c['nav'])
    big = ''.join(f'<a class="big" href="#{i}">{e(t)}</a>' for i, t in c['nav'] + [(c['contact_id'], c['contact']['label'])])
    lang_sw = (f'<div class="lang" role="group" aria-label="Idioma / Language">'
               f'<a href="/es/" hreflang="es" lang="es"{" aria-current=\"true\"" if lang == "es" else ""}>ES</a>'
               f'<a href="/en/" hreflang="en" lang="en"{" aria-current=\"true\"" if lang == "en" else ""}>EN</a></div>')
    return f'''<a class="skip" href="#main">{e(c["skip"])}</a>
<header class="nav"><div class="wrap"><div class="nav-shell glass">
  <a class="brand" href="/{lang}/" aria-label="Viewport Studio 3D"><img src="/brand/logo-vs.webp" alt="" width="34" height="23">Viewport Studio 3D</a>
  <nav class="nav-links" aria-label="{e(c["menu"])}">{links}</nav>
  <div class="nav-right">{lang_sw}
    <a class="btn btn-primary btn-sm nav-cta" href="#{c["contact_id"]}" style="padding-right:18px">{e(c["cta"])}</a>
    <button class="burger" type="button" aria-controls="menu" aria-expanded="false" aria-label="{e(c["menu"])}"><span></span></button>
  </div>
</div></div></header>
<div class="menu" id="menu" aria-hidden="true"><nav aria-label="{e(c["menu"])}">{big}</nav>
  <div><a class="btn btn-primary" href="#{c["contact_id"]}">{e(c["cta"])}<span class="chip">{ARROW}</span></a><p class="mono" style="margin-top:18px">{EMAIL}</p></div>
</div>'''


def hero(lang, c):
    h = c['hero']
    i = 0
    lines = []
    for line in h['lines']:
        out = []
        for part in re.split(r'(\*[^*]+\*)', line):
            if not part:
                continue
            accent = part.startswith('*')
            for w in (part[1:-1] if accent else part).split(' '):
                if not w:
                    continue
                out.append(f'<span class="w{" serif" if accent else ""}" style="--i:{i}">{e(w)}</span>')
                i += 1
        lines.append(f'<span class="line">{" ".join(out)}</span>')
    plain = ' '.join(re.sub(r'\*', '', l) for l in h['lines'])
    vids = ''.join(
        f'<video muted playsinline preload="{"auto" if k == 0 else "none"}" poster="{p["poster"]}" data-name="{e(p["name"])}" data-tag="{e(h["client"] if p["client"] else h["fan"])}" aria-hidden="true">{sources(p["videos"][0])}</video>'
        for k, p in enumerate(PROJECTS))
    bars = ''.join('<i><b></b></i>' for _ in PROJECTS)
    return f'''<section class="hero" aria-labelledby="hero-title"><div class="hero-frame">
  <div class="hero-light"></div><div class="hero-grid"></div>
  <div class="hero-top"><p class="live glass fade" style="--d:0"><span class="dot" aria-hidden="true"></span>{e(h["live"])}</p><p class="mono fade" style="--d:1">{e(h["tags"])}</p></div>
  <div>
    <h1 id="hero-title"><span class="sr-only">Viewport Studio 3D — {e(plain)}</span><span aria-hidden="true">{"".join(lines)}</span></h1>
    <p class="hero-lead fade" style="--d:3">{e(h["lead"])}</p>
    <div class="hero-ctas fade" style="--d:4">
      <a class="btn btn-primary" href="#{c["contact_id"]}">{e(h["primary"])}<span class="chip">{ARROW}</span></a>
      <a class="btn btn-ghost glass" href="#proyectos">{e(h["secondary"])}</a>
    </div>
    <div class="who fade" style="--d:5"><img src="/brand/lucas-sm.webp" alt="" width="42" height="42"><p><strong>{e(h["who"])}</strong>{e(h["who_role"])}</p></div>
  </div>
  <div class="reel" role="region" aria-label="{e(h["reel"])}">
    {vids}
    <div class="reel-bars" aria-hidden="true">{bars}</div>
    <div class="reel-cap glass" aria-live="polite"><div><strong data-cap>{e(PROJECTS[0]["name"])}</strong><span data-cap-tag>{e(h["client"])}</span></div><span class="mono" data-cap-idx>01 / {len(PROJECTS):02d}</span></div>
  </div>
</div></section>'''


def marquee(c):
    row = lambda hidden: f'<ul{" aria-hidden=\"true\"" if hidden else ""}>' + ''.join(f'<li><span>{e(t)}</span>{STAR}</li>' for t in c['marquee']) + '</ul>'
    return f'<div class="marquee" role="presentation"><div class="marquee-track">{row(False)}{row(True)}</div></div>'


def section_head(label, title, lead, hid, extra=''):
    return f'''<div class="head"><div><p class="eyebrow" data-reveal>{e(label)}</p><h2 id="{hid}" class="h2" style="margin-top:22px" data-reveal>{rich(title)}</h2></div>
<div data-reveal style="--d:1"><p class="lead">{e(lead)}</p>{extra}</div></div>'''


def card(lang, c, p, idx):
    h = c['hero']
    tag = f'<span class="card-tag {"client" if p["client"] else "glass"}">{e(h["client"] if p["client"] else h["fan"])}</span>'
    return f'''<button type="button" id="p-{p["slug"]}" class="card {p["col"]}" data-reveal style="--d:{idx % 2}" data-videos="{",".join(p["videos"])}" data-title="{e(p["name"])}" aria-label="{e(c["work"]["open"])}: {e(p["name"])}">
  <div class="media"><video muted loop playsinline preload="none" poster="{p["poster"]}"{f' data-start="{p["start"]}"' if p.get("start") else ""} aria-hidden="true">{sources(p["videos"][0])}</video></div>
  {tag}<span class="card-open glass">{EXPAND}<em>{e(c["work"]["open"])}</em></span>
  <div class="card-info"><div><span class="mono">{idx + 1:02d} / {len(PROJECTS):02d}</span><h3>{e(p["name"])}</h3><p>{e(p["desc"][lang])}</p></div><span class="mono">{p["dims"]} · {p["dur"][lang]}</span></div>
</button>'''


def work(lang, c):
    w = c['work']
    left = ''.join(card(lang, c, p, i) for i, p in enumerate(PROJECTS) if p['col'] == 'v')
    right = ''.join(card(lang, c, p, i) for i, p in enumerate(PROJECTS) if p['col'] == 'h')
    return f'''<section id="proyectos" class="section" aria-labelledby="work-title"><div class="wrap">
{section_head(w["label"], w["title"], w["lead"], "work-title")}
<div class="work"><div class="work-col">{left}</div><div class="work-col">{right}</div></div>
</div></section>'''


def manifesto(c):
    words = ' '.join(f'<span class="mw">{e(w)}</span>' for w in c['manifesto'].split())
    return f'<section class="section" aria-label="Manifiesto"><div class="wrap"><p class="manifesto">{words}</p></div></section>'


def services(c):
    s = c['services']
    items = ''.join(f'''<article class="svc glass" data-reveal style="--d:{i}"><div class="ph"><img src="{img}" alt="{e(alt)}" loading="lazy" decoding="async"></div>
<div class="body"><span class="num">{i + 1:02d}</span><h3 style="margin-top:14px">{e(t)}</h3><p>{e(x)}</p></div></article>''' for i, (t, x, img, alt) in enumerate(s['items']))
    return f'''<section id="servicios" class="section" aria-labelledby="svc-title"><div class="wrap">
{section_head(s["label"], s["title"], s["lead"], "svc-title")}
<div class="services">{items}</div></div></section>'''


def ai(c):
    a = c['ai']
    flow = ''.join(f'<li><span class="step glass"><b>0{i + 1}</b>{e(t)}</span>{"<span class=\"arr\" aria-hidden=\"true\">→</span>" if i < len(a["flow"]) - 1 else ""}</li>' for i, t in enumerate(a['flow']))
    title = ''.join(f'<span style="display:block{";color:var(--fg2)" if i else ""}">{rich(t)}</span>' for i, t in enumerate(a['title']))
    items = ''.join(f'''<li class="ai-card glass" data-reveal style="--d:{i}"><div class="top"><span class="ai-ico">{AI_ICONS[i]}</span><span class="mono">{i + 1:02d}</span></div>
<h3>{e(t)}</h3><p>{e(x)}</p></li>''' for i, (t, x) in enumerate(a['items']))
    return f'''<section id="ia" class="section ai" aria-labelledby="ai-title"><div class="wrap">
<div class="head"><div><p class="eyebrow" data-reveal>{e(a["label"])}</p><h2 id="ai-title" class="h2" style="margin-top:22px" data-reveal>{title}</h2></div>
<div data-reveal style="--d:1"><p class="lead">{e(a["lead"])}</p><ol class="flow">{flow}</ol></div></div>
<ul class="ai-grid">{items}</ul>
<div class="ai-note glass" data-reveal><p><span class="q">“</span>{e(a["note"])}</p><a class="btn btn-primary" href="#{c["contact_id"]}">{e(a["cta"])}<span class="chip">{ARROW}</span></a></div>
</div></section>'''


def detail(lang, c):
    d = c['detail']
    figs = ''.join(f'<figure><img src="{src}" alt="{e(alt[lang])}" width="{w}" height="{h}" loading="lazy" decoding="async"></figure>' for src, w, h, alt in DETAIL)
    return f'''<section class="section" aria-labelledby="detail-title"><div class="wrap">{section_head(d["label"], d["title"], d["lead"], "detail-title")}</div>
<div class="rail" tabindex="0" aria-label="{e(d["label"])}">{figs}</div></section>'''


def process(c):
    p = c['process']
    steps = ''.join(f'<li data-reveal><span class="n">{i + 1:02d}/{len(p["steps"]):02d}</span><div><h3>{e(t)}</h3><p>{e(x)}</p></div></li>' for i, (t, x) in enumerate(p['steps']))
    return f'''<section id="proceso" class="section" aria-labelledby="process-title"><div class="wrap process">
<div class="sticky"><p class="eyebrow" data-reveal>{e(p["label"])}</p><h2 id="process-title" class="h2" style="margin-top:22px" data-reveal>{rich(p["title"])}</h2>
<p class="lead" style="margin-top:22px" data-reveal>{e(p["lead"])}</p>
<div class="process-img" data-reveal><img src="/stills/animacion.webp" alt="{e(p["img_alt"])}" loading="lazy" decoding="async"></div></div>
<ol class="steps">{steps}</ol></div></section>'''


def studio(c):
    s = c['studio']
    facts = ''.join(f'<div class="fact glass"><strong>{e(n)}</strong><span>{e(t)}</span></div>' for n, t in s['facts'])
    tools = ''.join(f'<li>{e(t)}</li>' for t in s['tools'])
    return f'''<section id="sobre" class="section" aria-labelledby="studio-title"><div class="wrap studio">
<div class="avatar" data-reveal><img src="/brand/lucas.webp" alt="{e(s["avatar"])}" loading="lazy" decoding="async" width="640" height="640"></div>
<div><p class="eyebrow" data-reveal>{e(s["label"])}</p><h2 id="studio-title" class="h2" style="margin-top:22px" data-reveal>{rich(s["title"])}</h2>
<p class="lead" style="margin-top:24px;max-width:40rem" data-reveal>{e(s["text"])}</p>
<div class="facts" data-reveal>{facts}</div>
<p class="human" data-reveal>{e(s["human"])}</p>
<p class="mono" style="margin-top:28px" data-reveal>{e(s["tools_label"])}</p><ul class="tools" style="margin-top:12px" data-reveal>{tools}</ul></div>
</div></section>'''


def faq(c):
    f = c['faq']
    items = ''.join(f'<details><summary><span class="n">{i + 1:02d}</span>{e(q)}<span class="pm">{PLUS}</span></summary><p>{e(a)}</p></details>' for i, (q, a) in enumerate(f['items']))
    return f'''<section id="faq" class="section" aria-labelledby="faq-title"><div class="wrap faq">
<div><p class="eyebrow" data-reveal>{e(f["label"])}</p><h2 id="faq-title" class="h2" style="margin-top:22px" data-reveal>{rich(f["title"])}</h2></div>
<div data-reveal>{items}</div></div></section>'''


def contact(c):
    k = c['contact']
    socials = ''.join(f'<a class="glass" href="{u}" target="_blank" rel="noopener">{e(n)} ↗</a>' for n, u in SOCIALS)
    return f'''<section id="contacto" class="section" aria-labelledby="contact-title"><div class="wrap contact">
<div><p class="eyebrow" data-reveal>{e(k["label"])}</p><h2 id="contact-title" class="h2" style="margin-top:22px" data-reveal>{rich(k["title"])}</h2>
<p class="lead" style="margin-top:24px;max-width:34rem" data-reveal>{e(k["lead"])}</p>
<p style="margin-top:32px;color:var(--fg3);font-size:14px" data-reveal>{e(k["direct"])}</p><a class="mail" href="mailto:{EMAIL}" data-reveal>{EMAIL}</a>
<div class="socials" data-reveal>{socials}</div>
<p class="price glass" data-reveal><span class="dot" aria-hidden="true" style="background:var(--accent2)"></span>{e(k["price"])}</p></div>
<form id="order" class="form glass" data-to="{EMAIL}" data-reveal novalidate>
<h3>{e(k["form"])}</h3>
<div class="field"><label for="f-name">{e(k["name"])}</label><input id="f-name" name="name" autocomplete="name" required maxlength="120"></div>
<div class="field"><label for="f-email">{e(k["email"])}</label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200"></div>
<div class="field"><label for="f-msg">{e(k["message"])}</label><textarea id="f-msg" name="message" required minlength="10" maxlength="4000" placeholder="{e(k["placeholder"])}"></textarea></div>
<button class="btn btn-primary" type="submit">{e(k["submit"])}<span class="chip">{ARROW}</span></button>
<small>{e(k["note"])} <a href="{k["privacy_href"]}">{e(k["privacy"])}</a>.</small>
</form></div></section>'''


def footer(lang, c):
    f = c['footer']
    navl = ''.join(f'<li><a href="#{i}">{e(t)}</a></li>' for i, t in c['nav'] + [(c['contact_id'], c['contact']['label'])])
    legal = ''.join(f'<li><a href="{u}">{e(t)}</a></li>' for t, u in c['legal']) + f'<li><button type="button" data-cookie-settings>{e(f["cookies"])}</button></li>'
    soc = ''.join(f'<li><a href="{u}" target="_blank" rel="noopener">{e(n)}</a></li>' for n, u in SOCIALS)
    return f'''<footer class="footer"><div class="wrap">
<div class="footer-top"><div><a class="brand" href="/{lang}/"><img src="/brand/logo-vs.webp" alt="" width="34" height="23">Viewport Studio 3D</a>
<p style="margin-top:14px;max-width:26rem;color:var(--fg2);font-size:14px">{e(c["description"])}</p><a class="mail" style="font-size:1.125rem" href="mailto:{EMAIL}">{EMAIL}</a></div>
<div><h4>{e(f["nav"])}</h4><ul>{navl}</ul></div>
<div><h4>{e(f["legal"])}</h4><ul>{legal}</ul><h4 style="margin-top:24px">{e(f["social"])}</h4><ul>{soc}</ul></div></div>
<p class="wordmark" aria-hidden="true">Viewport Studio</p>
<div class="footer-bottom"><p>© <span data-year>2026</span> Viewport Studio 3D. {e(f["rights"])}</p><a href="#top">{e(f["top"])} ↑</a></div>
</div></footer>'''


def overlays(lang, c):
    k, lb = c['cookies'], c['lb']
    cookie_href = c['legal'][2][1]
    return f'''<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Video" aria-hidden="true">
<div class="lb-bar"><span class="t"></span><div class="lb-ctrl">
<button class="icon-btn glass" type="button" data-prev aria-label="{e(lb["prev"])}">‹</button><button class="icon-btn glass" type="button" data-next aria-label="{e(lb["next"])}">›</button>
<button class="icon-btn glass" type="button" data-close aria-label="{e(lb["close"])}">✕</button></div></div>
<video controls playsinline></video></div>
<div class="cookies glass" id="cookies" role="region" aria-label="Cookies"><p>{e(k["body"])} <a href="{cookie_href}">{e(k["more"])}</a></p>
<div class="row"><button class="btn btn-ghost glass" type="button" data-reject>{e(k["reject"])}</button><button class="btn btn-primary" type="button" data-accept>{e(k["accept"])}</button></div></div>'''


def page(lang):
    c = COPY[lang]
    body = ''.join([
        hero(lang, c), marquee(c), work(lang, c), manifesto(c), services(c), ai(c),
        detail(lang, c), process(c), studio(c), faq(c), contact(c),
    ])
    return f'''{head(lang, c)}
<body id="top">
{nav(lang, c)}
<main id="main">{body}</main>
{footer(lang, c)}
{overlays(lang, c)}
<script src="/assets/site.js?v=2" defer></script>
</body>
</html>
'''


if __name__ == '__main__':
    for lang in ('es', 'en'):
        out = PUBLIC / lang / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page(lang), encoding='utf-8')
        print('ok', out.relative_to(PUBLIC.parent.parent), f'{out.stat().st_size / 1024:.1f} KB')
