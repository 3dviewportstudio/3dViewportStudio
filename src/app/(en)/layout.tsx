import type { ReactNode } from 'react';
import '../globals.css';
import { RootShell } from '@/components/layout/RootShell';
import { rootMetadata, rootViewport } from '@/lib/layout-metadata';

export const metadata = rootMetadata('en');
export const viewport = rootViewport;

export default function EnglishLayout({ children }: { children: ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
