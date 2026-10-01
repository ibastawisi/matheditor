"use client"
import { CloudDocument, User } from '@/types';
import dynamic from "next/dynamic";
import StaticPages from '@/editor/extensions/pages/static';
import { useStaticHashNavigation } from '@/editor/extensions/hash-navigation/static';
import { useState } from 'react';

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<{ cloudDocument: CloudDocument, user?: User, html: string }> = ({ cloudDocument, user, html }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useStaticHashNavigation(container);
  return <>
    <StaticPages html={html} containerRef={setContainer} />
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} container={container} />
  </>
}

export default ViewDocument;