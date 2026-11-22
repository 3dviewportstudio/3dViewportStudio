type Props = { children: string; className?: string };

/** Nombre de la sección: mono en mayúsculas con una línea fina delante (mismo sistema que la sección de IA). */
export function SectionLabel({ children, className = '' }: Props) {
  return (
    <p className={`eyebrow ${className}`} data-reveal>
      {children}
    </p>
  );
}
