import { notFound } from 'next/navigation';

/** Cualquier ruta desconocida muestra la página 404 con el diseño e idioma de la web. */
export default function CatchAll() {
  notFound();
}
