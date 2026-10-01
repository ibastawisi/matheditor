"use client"
import HtmlDiff from './Diff';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { generateHtml } from '@/editor/utils/generateHtml';
import NProgress from 'nprogress';

const DiffView = () => {
  const getLocalRevision = useAppStore(state => state.getLocalRevision);
  const getCloudRevision = useAppStore(state => state.getCloudRevision);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const diff = useAppStore(state => state.diff);
  const [html, setHtml] = useState<string>('');

  const getEditorDocumentRevision = async (revisionId: string) => {
    const { data: localRevision } = await getLocalRevision(revisionId);
    if (localRevision) return localRevision;
    const { data: cloudRevision } = await getCloudRevision(revisionId);
    if (!cloudRevision) return;
    createLocalRevision(cloudRevision);
    return cloudRevision;
  }


  useEffect(() => {
    const diffRevisions = async () => {
      const oldRevisionId = diff.old;
      const newRevisionId = diff.new;
      if (!oldRevisionId || !newRevisionId) return;
      const oldRevision = await getEditorDocumentRevision(oldRevisionId);
      if (!oldRevision) return;
      const oldHtml = await generateHtml(oldRevision.data);
      if (oldRevisionId === newRevisionId) return setHtml(oldHtml);
      const newRevision = await getEditorDocumentRevision(newRevisionId);
      if (!newRevision) return;
      const newHtml = await generateHtml(newRevision.data);
      const html = HtmlDiff.execute(oldHtml, newHtml);
      setHtml(html);
    }
    NProgress.start();
    diffRevisions().then(() => NProgress.done());
    return () => { NProgress.done(); }
  }, [diff]);

  if (!diff.open) return null;
  if (!html) return null;

  return (
    <div className='diff-container' dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default DiffView;