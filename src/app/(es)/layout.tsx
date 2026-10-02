import type { ReactNode } from 'react';
import '../globals.css';
import { RootShell } from '@/components/layout/RootShell';
import { rootMetadata, rootViewport } from '@/lib/layout-metadata';

export const metadata = rootMetadata('es');
export const viewport = rootViewport;

export default function SpanishLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="es">{children}</RootShell>;
}
