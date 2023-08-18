import { findPublishedDocuments } from '@/repositories/document'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedDocuments = await findPublishedDocuments();
  return [
    {
      url: 'https://matheditor.me/',
    },
    {
      url: 'https://matheditor.me/playground',
    },
    {
      url: 'https://matheditor.me/tutorial',
    },
    {
      url: 'https://matheditor.me/dashboard',
    },
    {
      url: 'https://matheditor.me/new',
    },
    ...publishedDocuments.map((document) => ({
      url: `https://matheditor.me/view/${document.id}`,
      lastModified: document.updatedAt,
    })),
  ]
}