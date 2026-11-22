type Props = { children: string; className?: string };

/** Nombre de la sección con el pequeño encuadre de cámara de la marca (sin numeración: las secciones no son una secuencia). */
export function SectionLabel({ children, className = '' }: Props) {
  return (
    <p className={`label section-mark ${className}`} data-reveal>
      {children}
    </p>
  );
}
