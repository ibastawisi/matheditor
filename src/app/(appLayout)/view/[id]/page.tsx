import { OgMetadata } from "@/app/api/og/route";
import { findUserDocument } from "@/repositories/document";
import ViewDocument from "@/components/ViewDocument";
import htmr from 'htmr';
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SplashScreen from "@/components/SplashScreen";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const metadata: OgMetadata = { id: params.id, title: 'Math Editor' };
  try {
    const document = await findUserDocument(params.id);
    if (!document) {
      return notFound();
    }
    if (document.private) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        metadata.title = 'Private Document | Math Editor';
        metadata.subtitle = 'if you have access, please sign in to view it';
        return metadata;
      }
      const isAuthor = session.user.id === document.author.id;
      const isCoauthor = document.coauthors.some(coauthor => coauthor.id === session.user.id);
      if (!isAuthor && !isCoauthor) {
        metadata.title = 'Private Document | Math Editor';
        metadata.subtitle = 'You are not authorized to view this document';
        return metadata;
      }
    }
    metadata.title = `${document.name} | Math Editor`;
    metadata.subtitle = new Date(document.createdAt).toDateString()
    metadata.description = `${document.name} | Math Editor`;
    metadata.user = { name: document.author.name, image: document.author.image!, email: document.author.email };
  } catch (error) {
    metadata.subtitle = 'Internal Server Error';
  }

  const { title, subtitle, description } = metadata;
  const image = `/api/og?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;

  return {
    title: `${title}`,
    description: description ?? subtitle,
    openGraph: {
      images: [image],
    },
  }
}

export default async function Page({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  const document = await findUserDocument(params.id);
  if (!document) notFound();
  if (document.private) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return <SplashScreen title="This document is private" subtitle="if you have access, please sign in to view it" />
    }
    const isAuthor = session.user.id === document.author.id;
    const isCoauthor = document.coauthors.some(coauthor => coauthor.id === session.user.id);
    if (!isAuthor && !isCoauthor) {
      return <SplashScreen title="This document is private" subtitle="You are not authorized to view this document" />
    }
  }
  const revision = searchParams["v"] ?? document.head
  const response = await fetch(`${process.env.PUBLIC_URL}/api/embed/${revision}`);
  if (!response.ok) throw new Error('Failed to generate HTML');
  const html = await response.text();
  const session = await getServerSession(authOptions);
  return <ViewDocument cloudDocument={document} user={session?.user}>{htmr(html)}</ViewDocument>;
}