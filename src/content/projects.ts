import type { Locale } from '@/lib/routes';

type L<T = string> = Record<Locale, T>;

export type GalleryItem =
  | { kind: 'image'; id: string; alt: L; caption: L; span?: 'tall' | 'wide' }
  | { kind: 'video'; id: string; alt: L; caption: L; span?: 'tall' | 'wide' };

export type Project = {
  slug: string;
  name: string;
  /** Cliente real o proyecto propio: se indica siempre, sin ambigüedad. */
  kind: 'client' | 'personal';
  kindLabel: L;
  sector: L;
  discipline: L;
  deliverables: L;
  formats: L;
  tools: string[];
  summary: L;
  intro: L;
  approach: L<string[]>;
  /** Medios de la tarjeta en la home. */
  cover: { primary: GalleryItem; secondary?: GalleryItem; layout: 'pair' | 'wide' };
  gallery: GalleryItem[];
  ogImage: string;
};

const fineNiponaFilm: GalleryItem = {
  kind: 'video',
  id: 'fine-nipona-matcha-film',
  alt: {
    es: 'Animación 3D vertical de la bolsa blanca de Matcha de Fine Nipona sobre fondo oscuro.',
    en: 'Vertical 3D animation of the white Fine Nipona Matcha pouch on a dark background.',
  },
  caption: { es: 'Animación vertical · Matcha', en: 'Vertical animation · Matcha' },
  span: 'tall',
};

const fineNiponaDuoFilm: GalleryItem = {
  kind: 'video',
  id: 'fine-nipona-gama-film',
  alt: {
    es: 'Animación 3D vertical de las dos bolsas de Fine Nipona, Matcha y Mulberry Matcha.',
    en: 'Vertical 3D animation of the two Fine Nipona pouches, Matcha and Mulberry Matcha.',
  },
  caption: { es: 'Animación vertical · Gama', en: 'Vertical animation · Range' },
  span: 'tall',
};

const fineNiponaScene: GalleryItem = {
  kind: 'image',
  id: 'fine-nipona-escena',
  alt: {
    es: 'Escena 3D con la bolsa negra de Mulberry Matcha de Fine Nipona sobre piedra oscura, con luz rasante, un cuenco de madera y una rama.',
    en: '3D scene with the black Fine Nipona Mulberry Matcha pouch on dark stone, with raking light, a wooden bowl and a branch.',
  },
  caption: { es: 'Escena lifestyle · Mulberry Matcha', en: 'Lifestyle scene · Mulberry Matcha' },
  span: 'tall',
};

const pphoneFilm: GalleryItem = {
  kind: 'video',
  id: 'pphone-17-film',
  alt: {
    es: 'Película 3D de lanzamiento del pPhone 17, un smartphone de marca ficticia, mostrando sus cinco colores.',
    en: '3D launch film for the pPhone 17, a smartphone from a fictional brand, showing its five colours.',
  },
  caption: { es: 'Película de lanzamiento · 16:9', en: 'Launch film · 16:9' },
  span: 'wide',
};

export const projects: Project[] = [
  {
    slug: 'fine-nipona',
    name: 'Fine Nipona',
    kind: 'client',
    kindLabel: { es: 'Cliente', en: 'Client' },
    sector: { es: 'Alimentación premium', en: 'Premium food & drink' },
    discipline: { es: 'Packaging · Escenas · Animación', en: 'Packaging · Scenes · Animation' },
    deliverables: { es: '4 renders · 2 animaciones verticales', en: '4 renders · 2 vertical animations' },
    formats: { es: 'Imagen 9:16 · Vídeo 9:16', en: 'Image 9:16 · Video 9:16' },
    tools: ['Blender'],
    summary: {
      es: 'Renders y animaciones para la gama de matcha orgánico de Fine Nipona: packshots de cada envase, una escena de ambiente y dos animaciones verticales.',
      en: 'Renders and animations for Fine Nipona’s organic matcha range: packshots of each pouch, a lifestyle scene and two vertical animations.',
    },
    intro: {
      es: 'Fine Nipona es una marca de matcha orgánico ultra premium con dos referencias: Matcha, de té verde, y Mulberry Matcha, de mora. Creé las imágenes y animaciones con las que presenta su gama.',
      en: 'Fine Nipona is an ultra-premium organic matcha brand with two products: Matcha, made from green tea, and Mulberry Matcha. I created the images and animations it uses to present its range.',
    },
    approach: {
      es: [
        'Los packshots sobre fondo oscuro dejan todo el protagonismo al diseño del envase: el mapa de Japón en puntos rojos, la tipografía y el contraste entre la bolsa blanca y la negra.',
        'La escena combina piedra, madera y luz rasante para situar el producto en un contexto natural y cálido, pensado para campaña y redes.',
        'Las dos animaciones verticales reutilizan los mismos modelos: un solo trabajo de modelado y materiales da para fichas de tienda, campaña y vídeo.',
      ],
      en: [
        'The packshots on a dark background put the packaging design centre stage: the map of Japan in red dots, the typography and the contrast between the white and black pouches.',
        'The scene combines stone, wood and raking light to place the product in a warm, natural setting, designed for campaigns and social media.',
        'Both vertical animations reuse the same models: one round of modelling and materials covers product pages, campaign and video.',
      ],
    },
    cover: { primary: fineNiponaFilm, secondary: fineNiponaScene, layout: 'pair' },
    gallery: [
      fineNiponaScene,
      fineNiponaFilm,
      {
        kind: 'image',
        id: 'fine-nipona-gama',
        alt: {
          es: 'Las dos bolsas de Fine Nipona, Matcha blanca y Mulberry Matcha negra, juntas sobre fondo oscuro.',
          en: 'The two Fine Nipona pouches, white Matcha and black Mulberry Matcha, side by side on a dark background.',
        },
        caption: { es: 'Packshot · Gama completa', en: 'Packshot · Full range' },
        span: 'tall',
      },
      fineNiponaDuoFilm,
      {
        kind: 'image',
        id: 'fine-nipona-matcha',
        alt: {
          es: 'Packshot 3D de la bolsa blanca de Matcha de Fine Nipona, en tres cuartos sobre fondo oscuro de estudio.',
          en: '3D packshot of the white Fine Nipona Matcha pouch, three-quarter view on a dark studio background.',
        },
        caption: { es: 'Packshot · Matcha', en: 'Packshot · Matcha' },
        span: 'tall',
      },
      {
        kind: 'image',
        id: 'fine-nipona-mulberry',
        alt: {
          es: 'Primer plano 3D de la bolsa negra de Mulberry Matcha de Fine Nipona, con reflejos sobre el acabado brillante.',
          en: '3D close-up of the black Fine Nipona Mulberry Matcha pouch, with reflections on its glossy finish.',
        },
        caption: { es: 'Detalle · Mulberry Matcha', en: 'Detail · Mulberry Matcha' },
        span: 'tall',
      },
    ],
    ogImage: 'fine-nipona',
  },
  {
    slug: 'pphone-17',
    name: 'pPhone 17',
    kind: 'personal',
    kindLabel: { es: 'Proyecto propio', en: 'Personal project' },
    sector: { es: 'Tecnología', en: 'Technology' },
    discipline: { es: 'Animación de lanzamiento', en: 'Launch animation' },
    deliverables: { es: 'Película de 14 s · 2 renders', en: '14 s film · 2 renders' },
    formats: { es: 'Vídeo 16:9 · Imagen 9:16 y 16:9', en: 'Video 16:9 · Image 9:16 and 16:9' },
    tools: ['Blender'],
    summary: {
      es: 'Película de lanzamiento de 14 segundos para un smartphone de marca ficticia, con presentación de sus cinco colores.',
      en: 'A 14-second launch film for a smartphone from a fictional brand, presenting its five colours.',
    },
    intro: {
      es: 'El pPhone 17 es un smartphone inventado para este proyecto propio: una marca ficticia, con su pera como logotipo, que me sirve para mostrar cómo planteo el lanzamiento de un producto tecnológico.',
      en: 'The pPhone 17 is a smartphone invented for this personal project: a fictional brand, with a pear as its logo, that lets me show how I approach a tech product launch.',
    },
    approach: {
      es: [
        'La película arranca con primeros planos del módulo de cámaras y termina con la gama completa en cinco colores: lila, azul, grafito, verde y plata.',
        'Fondo negro y luz de estudio para que el color y los reflejos del metal sean los protagonistas.',
        'De la misma escena salen también los renders fijos, en vertical y en horizontal.',
      ],
      en: [
        'The film opens on close-ups of the camera module and ends with the full range in five colours: lilac, blue, graphite, green and silver.',
        'A black background and studio lighting keep the focus on colour and the reflections on the metal.',
        'The still renders, in vertical and landscape, come from the same scene.',
      ],
    },
    cover: { primary: pphoneFilm, layout: 'wide' },
    gallery: [
      pphoneFilm,
      {
        kind: 'image',
        id: 'pphone-verde',
        alt: {
          es: 'Render 3D en primer plano del módulo de cámaras de un pPhone 17 verde sobre fondo negro.',
          en: '3D close-up render of the camera module of a green pPhone 17 on a black background.',
        },
        caption: { es: 'Render · Verde · 16:9', en: 'Render · Green · 16:9' },
        span: 'wide',
      },
      {
        kind: 'image',
        id: 'pphone-lila',
        alt: {
          es: 'Render 3D de un pPhone 17 lila flotando en diagonal sobre fondo negro.',
          en: '3D render of a lilac pPhone 17 floating diagonally on a black background.',
        },
        caption: { es: 'Render · Lila · 9:16', en: 'Render · Lilac · 9:16' },
        span: 'tall',
      },
    ],
    ogImage: 'pphone-17',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function nextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length] as Project;
}

/**
 * Testimonios reales. La sección no se muestra mientras la lista esté vacía.
 * Añade aquí la cita de Fine Nipona cuando tengas su permiso para publicarla.
 */
export type Testimonial = { quote: Record<Locale, string>; author: string; role: Record<Locale, string>; projectSlug?: string };
export const testimonials: Testimonial[] = [];
