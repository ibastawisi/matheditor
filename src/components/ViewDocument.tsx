"use client"
import { CloudDocument, User } from '@/types';
import dynamic from "next/dynamic";
import StaticPages from '@/editor/extensions/pages/static';

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<{ cloudDocument: CloudDocument, user?: User, html: string }> = ({ cloudDocument, user, html }) => {
  return <>
    <StaticPages html={html} />
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
  </>
}

export default ViewDocument;