"use client"
import HtmlDiff from './Diff';
import { useEffect, useState } from 'react';
import { actions, useDispatch, useSelector } from '@/store';
import { generateHtml } from '@/editor';
import htmr from 'htmr';
import NProgress from 'nprogress';

const DiffView = () => {
  const dispatch = useDispatch();
  const diff = useSelector(state => state.ui.diff);
  const [html, setHtml] = useState<string>('');

  const getEditorDocumentRevision = async (revisionId: string) => {
    const localResponse = await dispatch(actions.getLocalRevision(revisionId));
    if (localResponse.type === actions.getLocalRevision.fulfilled.type) {
      const editorDocumentRevision = localResponse.payload as ReturnType<typeof actions.getLocalRevision.fulfilled>['payload'];
      return editorDocumentRevision;
    } else {
      const cloudResponse = await dispatch(actions.getCloudRevision(revisionId));
      if (cloudResponse.type === actions.getCloudRevision.fulfilled.type) {
        const editorDocumentRevision = cloudResponse.payload as ReturnType<typeof actions.getCloudRevision.fulfilled>['payload'];
        dispatch(actions.createLocalRevision(editorDocumentRevision));
        return editorDocumentRevision;
      }
    }
  }


  useEffect(() => {
    const diffRevisions = async () => {
      NProgress.start();
      const oldRevisionId = diff.old;
      const newRevisionId = diff.new;
      if (!oldRevisionId || !newRevisionId) return;
      const oldRevision = await getEditorDocumentRevision(oldRevisionId);
      const newRevision = await getEditorDocumentRevision(newRevisionId);
      if (!oldRevision || !newRevision) return;
      const oldHtml = await generateHtml(oldRevision.data);
      const newHtml = await generateHtml(newRevision.data);
      const html = HtmlDiff.execute(oldHtml, newHtml);
      setHtml(html);
      NProgress.done();
    }
    diffRevisions();
    return () => {
      NProgress.done();
    }
  }, [diff]);

  if (!diff.open) return null;
  if (!html) return null;
  
  return (
    <div className='diff-container'>{htmr(html)}</div>
  );
}

export default DiffView;