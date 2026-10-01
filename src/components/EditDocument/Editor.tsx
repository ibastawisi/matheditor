"use client"
import { useEffect, useState, useRef, useCallback } from "react";
import SplashScreen from "../SplashScreen";
import { Collaborator, CollabSession, CollabStatus, EditorDocument } from '@/types';
import { useAppStore } from '@/store';
import { usePathname } from "next/navigation";
import type { EditorState, LexicalEditor } from "lexical";
import { v4 as uuidv4 } from 'uuid';
import dynamic from "next/dynamic";
import DiffView from "../Diff";
import { Box, debounce } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import Editor from "../Editor";

const EditDocumentInfo = dynamic(() => import('@/components/EditDocument/EditDocumentInfo'), { ssr: false });

/** How long to wait for the live session before editing the copy on this device */
const LIVE_SYNC_TIMEOUT_MS = 10000;

/**
 * The head of this device's copy when it last matched the live session. A copy
 * whose head differs was edited offline, and is kept as a revision before the
 * session replaces it.
 */
const liveHeadKey = (id: string) => `live-head:${id}`;
const readLiveHead = (id: string) => { try { return localStorage.getItem(liveHeadKey(id)); } catch { return null; } };
const writeLiveHead = (id: string, head: string) => { try { localStorage.setItem(liveHeadKey(id), head); } catch { } };

const DocumentEditor: React.FC = () => {
  const [document, setDocument] = useState<EditorDocument>();
  /** The live session, null when the document is edited on this device only, undefined until that is known */
  const [session, setSession] = useState<CollabSession | null>();
  const [error, setError] = useState<{ title: string, subtitle?: string }>();
  const updateLocalDocument = useAppStore(state => state.updateLocalDocument);
  const getLocalDocument = useAppStore(state => state.getLocalDocument);
  const getCloudDocument = useAppStore(state => state.getCloudDocument);
  const createLocalDocument = useAppStore(state => state.createLocalDocument);
  const getLocalRevision = useAppStore(state => state.getLocalRevision);
  const createLocalRevision = useAppStore(state => state.createLocalRevision);
  const getCollabSession = useAppStore(state => state.getCollabSession);
  const setDiff = useAppStore(state => state.setDiff);
  const setLive = useAppStore(state => state.setLive);
  const pathname = usePathname();
  const id = pathname.split('/')[2]?.toLowerCase();
  const editorRef = useRef<LexicalEditor>(null);
  const showDiff = useAppStore(state => state.diff.open);
  /** The live content has arrived, before that the editor is empty */
  const synced = useRef(false);
  const connected = useRef(false);
  /** This device's copy as it was loaded, until the live session first changes it */
  const offlineCopy = useRef<EditorDocument | null>(null);

  const debouncedUpdateLocalDocument = useCallback(debounce((id: string, partial: Partial<EditorDocument>, live: boolean) => {
    updateLocalDocument({ id, partial });
    if (live && partial.head) writeLiveHead(id, partial.head);
  }, 300), [document]);

  const keepOfflineChanges = async (copy: EditorDocument) => {
    if (readLiveHead(copy.id) === copy.head) return;
    const { data: revision } = await getLocalRevision(copy.head);
    if (revision) return;
    await createLocalRevision({ id: copy.head, documentId: copy.id, createdAt: copy.updatedAt, data: copy.data });
    enqueueSnackbar("Your offline changes were kept as a revision", {
      description: "This document was changed in its live session, open the document info to compare them",
    });
  }

  function handleChange(editorState: EditorState, editor: LexicalEditor, tags: Set<string>) {
    if (!document) return;
    if (session && !synced.current) return;
    if (session && offlineCopy.current) {
      void keepOfflineChanges(offlineCopy.current);
      offlineCopy.current = null;
    }
    const data = editorState.toJSON();
    const updatedDocument: Partial<EditorDocument> = { data, updatedAt: new Date().toISOString(), head: uuidv4() };
    try {
      const payload = JSON.parse(tags.values().next().value as string);
      if (payload.id === document.id) { Object.assign(updatedDocument, payload.partial); }
    } catch (e) { }
    debouncedUpdateLocalDocument(document.id, updatedDocument, !!session && connected.current);
  }

  const leaveLiveSession = (title: string, subtitle: string) => {
    enqueueSnackbar(title, { description: subtitle });
    // nothing was shown yet, so the editor can start over from this device's copy
    if (!synced.current) setSession(null);
    else setLive({ status: "disconnected" });
  }

  useEffect(() => {
    const loadDocument = async (id: string) => {
      let { data: editorDocument } = await getLocalDocument(id);
      if (editorDocument) {
        offlineCopy.current = editorDocument;
      } else {
        const { data: cloudResponse, error } = await getCloudDocument(id);
        if (!cloudResponse) return setError(error);
        const { cloudDocument, ...cloudEditorDocument } = cloudResponse;
        editorDocument = cloudEditorDocument;
        createLocalDocument(editorDocument);
        const editorDocumentRevision = { id: editorDocument.head, documentId: editorDocument.id, createdAt: editorDocument.updatedAt, data: editorDocument.data };
        createLocalRevision(editorDocumentRevision);
      }
      // a copy with changes the session may not have can start a session that does not exist yet
      const copy = offlineCopy.current && readLiveHead(editorDocument.id) !== editorDocument.head ? editorDocument : undefined;
      // documents the user cannot edit in the cloud, or that are not there, are edited on this device only
      const { data: liveSession } = navigator.onLine ? await getCollabSession(editorDocument.id, copy) : {};
      if (liveSession?.seededFromCopy) {
        offlineCopy.current = null;
        writeLiveHead(editorDocument.id, editorDocument.head);
      }
      setSession(liveSession ?? null);
      setDocument(editorDocument);
    }
    id ? loadDocument(id) : setError({ title: "Document Not Found" });
    return () => {
      setDiff({ open: false });
      setLive(null);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setLive({ status: "connecting" });
    const timeout = setTimeout(() => {
      if (!synced.current) leaveLiveSession("Couldn't join the live session", "You are editing the copy on this device");
    }, LIVE_SYNC_TIMEOUT_MS);
    return () => {
      clearTimeout(timeout);
      setLive(null);
    };
  }, [session]);

  if (error) return <SplashScreen title={error.title} subtitle={error.subtitle} />;
  if (!document || session === undefined) return <SplashScreen title="Loading Document" />;

  const live = session ? {
    documentId: document.id,
    session,
    refreshToken: async () => (await getCollabSession(document.id)).data?.token ?? null,
    onStatus: (status: CollabStatus) => {
      connected.current = status === "connected";
      // once joined, retrying to connect is being offline
      setLive({ status: synced.current && status === "connecting" ? "disconnected" : status });
    },
    onSync: (isSynced: boolean) => {
      if (isSynced) synced.current = true;
    },
    onClosed: () => leaveLiveSession("You left the live session", "Your changes are saved on this device"),
    onCollaborators: (collaborators: Collaborator[]) => setLive({ collaborators }),
  } : undefined;

  return <>
    <title>{document.name}</title>
    {showDiff && <DiffView />}
    {/* hidden rather than unmounted, so that it keeps its history and selection */}
    <Box sx={{ display: showDiff ? "none" : "contents" }}>
      {/* a new editor when the live session is left before it synced */}
      <Editor key={session ? "live" : "local"} document={document} editorRef={editorRef} onChange={handleChange} live={live} />
    </Box>
    <EditDocumentInfo documentId={document.id} editorRef={editorRef} />
  </>;
}

export default DocumentEditor;
