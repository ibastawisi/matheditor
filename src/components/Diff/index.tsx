"use client"
import HtmlDiff from './Diff';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { generateDocumentHtml, serializeDocumentHtml, type DocumentHtml } from '@/editor/utils/generateDocumentHtml';
import StaticPages from '@/editor/extensions/pages/static';
import NProgress from 'nprogress';

/**
 * The changes between two revisions, laid out on the pages of the new one.
 * Each header and footer is compared with the one the old revision showed in
 * its place: the same variant, or the default one if it had none.
 */
const diffDocumentHtml = (oldDocument: DocumentHtml, newDocument: DocumentHtml): DocumentHtml => {
  const findOldSlot = (kind: string, variant: string) =>
    oldDocument.slots.find(slot => slot.kind === kind && slot.variant === variant);
  return {
    html: HtmlDiff.execute(oldDocument.html, newDocument.html),
    pageSetup: newDocument.pageSetup,
    slots: newDocument.slots.map(slot => {
      const oldSlot = findOldSlot(slot.kind, slot.variant) ?? findOldSlot(slot.kind, "default");
      return { ...slot, html: HtmlDiff.execute(oldSlot?.html ?? '', slot.html) };
    }),
  };
}

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
      const oldDocument = generateDocumentHtml(oldRevision.data);
      if (oldRevisionId === newRevisionId) return setHtml(serializeDocumentHtml(oldDocument));
      const newRevision = await getEditorDocumentRevision(newRevisionId);
      if (!newRevision) return;
      const newDocument = generateDocumentHtml(newRevision.data);
      setHtml(serializeDocumentHtml(diffDocumentHtml(oldDocument, newDocument)));
    }
    NProgress.start();
    diffRevisions().then(() => NProgress.done());
    return () => { NProgress.done(); }
  }, [diff]);

  if (!diff.open) return null;
  if (!html) return null;

  return (
    <div className='diff-container'>
      <StaticPages html={html} />
    </div>
  );
}

export default DiffView;
