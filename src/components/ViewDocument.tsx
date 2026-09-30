"use client"
import { CloudDocument, User } from '@/types';
import dynamic from "next/dynamic";

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<{ cloudDocument: CloudDocument, user?: User, html: string }> = ({ cloudDocument, user, html }) => {
  return <>
    <div className='document-container' dangerouslySetInnerHTML={{ __html: html }} />
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
  </>
}

export default ViewDocument;