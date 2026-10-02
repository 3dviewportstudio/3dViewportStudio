import { ViewTransition, type ReactNode } from 'react';

/**
 * Transiciones entre páginas con la View Transitions API del navegador, a través de React (0 KB de librería).
 * Las navegaciones de Next son transiciones, así que se activan solas; sin soporte, la página cambia como siempre.
 * `default="none"`: no animan en transiciones ajenas a la navegación (p. ej., el envío del formulario).
 */

/**
 * Activa la transición en cada cambio de página sin capturar la página entera: un marcador de 1 px entra y sale
 * con la página, React inicia la transición y lo que se anima es la captura raíz (del tamaño de la ventana):
 * la página saliente se funde rápido y la nueva llega con un leve ascenso (CSS: ::view-transition-*(root)).
 * Nombrar el contenedor de la página obligaría a capturar como textura un elemento de miles de píxeles de alto.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <>
      <ViewTransition enter="page" exit="page" default="none">
        <div aria-hidden="true" className="vt-sentinel" />
      </ViewTransition>
      {children}
    </>
  );
}

/**
 * Elemento compartido: la misma pieza en la portada (Trabajo) y en la página del caso.
 * El navegador la traslada y escala de un sitio a otro: el usuario ve un objeto que se mueve, no dos que se sustituyen.
 */
export function SharedMedia({ id, children }: { id: string; children: ReactNode }) {
  return (
    <ViewTransition name={`media-${id}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
