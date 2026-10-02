import { notFound } from 'next/navigation';
import { getProject } from '@/content/projects';
import { ProjectPage } from '@/components/pages/ProjectPage';
import { projectMetadata, projectStaticParams } from '@/lib/project-route';

type Params = { params: Promise<{ slug: string }> };

export const generateStaticParams = projectStaticParams;

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  return projectMetadata('en', slug);
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <ProjectPage locale="en" project={project} />;
}
