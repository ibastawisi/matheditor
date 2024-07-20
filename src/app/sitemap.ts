import { findPublishedDocuments } from '@/repositories/document';
import { MetadataRoute } from 'next';

const PUBLIC_URL = process.env.PUBLIC_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedDocuments = await findPublishedDocuments();
  const now = new Date().toISOString();
  return [
    {
      url: `${PUBLIC_URL}/`,
      lastModified: now,
    },
    {
      url: `${PUBLIC_URL}/playground`,
      lastModified: now,
    },
    {
      url: `${PUBLIC_URL}/tutorial`,
      lastModified: now,
    },
    {
      url: `${PUBLIC_URL}/new`,
      lastModified: now,
    },
    {
      url: `${PUBLIC_URL}/dashboard`,
      lastModified: now,
    },
    {
      url: `${PUBLIC_URL}/privacy`,
      lastModified: now,
    },
    ...publishedDocuments.map((document) => ({
      url: `${PUBLIC_URL}/view/${document.handle || document.id}`,
      lastModified: document.updatedAt,
    })),
  ];
}