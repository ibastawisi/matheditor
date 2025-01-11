"use client"
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { v4 as uuidv4, validate } from "uuid";
import * as React from 'react';
import { CheckHandleResponse, DocumentCreateInput, User, UserDocument } from '@/types';
import type { SerializedHeadingNode, SerializedParagraphNode, SerializedRootNode, SerializedTextNode } from "@/editor";
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, actions, useSelector } from '@/store';
import DocumentCard from './DocumentCard';
import { Container, Box, Avatar, Typography, TextField, Button, FormControlLabel, FormHelperText, Switch, Checkbox } from '@mui/material';
import { Article, Add } from '@mui/icons-material';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import UsersAutocomplete from './User/UsersAutocomplete';
import { debounce } from '@mui/material/utils';

const getEditorData = (title: string) => {
  const headingText: SerializedTextNode = {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: title,
    type: 'text',
    version: 1,
  }
  const heading: SerializedHeadingNode = {
    children: [headingText],
    direction: "ltr",
    format: "center",
    indent: 0,
    tag: "h2",
    type: "heading",
    version: 1,
  }
  const paragraph: SerializedParagraphNode = {
    children: [],
    direction: "ltr",
    format: 'left',
    textFormat: 0,
    textStyle: '',
    indent: 0,
    type: "paragraph",
    version: 1,
  }
  const root: SerializedRootNode = {
    children: [heading, paragraph],
    direction: "ltr",
    type: "root",
    version: 1,
    format: 'left',
    indent: 0
  }
  return ({ root });
}

const NewDocument: React.FC = () => {
  const initialized = useSelector(state => state.ui.initialized);
  const user = useSelector(state => state.user);
  const unauthenticated = initialized && !user;
  const isOnline = useOnlineStatus();
  const [base, setBase] = useState<UserDocument>();
  const [input, setInput] = useState<Partial<DocumentCreateInput>>({});
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.keys(validationErrors).length > 0;
  const [saveToCloud, setSaveToCloud] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const baseId = pathname.split('/')[2]?.toLowerCase();
  const searchParams = useSearchParams();
  const revisionId = searchParams.get('v');

  useEffect(() => {
    const loadDocument = async (id: string) => {
      const localResponse = await dispatch(actions.forkLocalDocument({ id, revisionId }));
      if (localResponse.type === actions.forkLocalDocument.fulfilled.type) {
        const editorDocument = localResponse.payload as ReturnType<typeof actions.forkLocalDocument.fulfilled>["payload"];
        const { data, ...rest } = editorDocument;
        const editorDocumentSize = new Blob([JSON.stringify(editorDocument)]).size;
        const localDocument = { ...rest, revisions: [], size: editorDocumentSize, thumbnail: null };
        setBase({ id: editorDocument.id, local: localDocument });
        setInput({ ...input, data, baseId: editorDocument.id });
      } else {
        const cloudResponse = await dispatch(actions.forkCloudDocument({ id, revisionId }));
        if (cloudResponse.type === actions.forkCloudDocument.fulfilled.type) {
          const { data, ...userDocument } = cloudResponse.payload as ReturnType<typeof actions.forkCloudDocument.fulfilled>["payload"];
          setBase(userDocument);
          setInput({ ...input, data, baseId: userDocument.id });
        }
      }
    }
    baseId && loadDocument(baseId);
  }, []);

  const router = useRouter();
  const navigate = (path: string) => router.push(path, { scroll: false });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = input.name || "Untitled Document";
    const data = input.data || getEditorData(name);
    const createdAt = new Date().toISOString();
    const payload: DocumentCreateInput = {
      ...input,
      id: uuidv4(),
      head: uuidv4(),
      name,
      data,
      createdAt,
      updatedAt: createdAt,
    };
    const response = await dispatch(actions.createLocalDocument(payload));
    if (response.type === actions.createLocalDocument.fulfilled.type) {
      if (saveToCloud) dispatch(actions.createCloudDocument(payload));
      const href = `/edit/${payload.handle || payload.id}`;
      navigate(href);
    }
  };

  const updateInput = (partial: Partial<DocumentCreateInput>) => {
    setInput(input => ({ ...input, ...partial }));
  }

  const updateCoauthors = (users: (User | string)[]) => {
    const coauthors = users.map(u => typeof u === "string" ? u : u.email);
    updateInput({ coauthors });
  }

  const updateHandle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const handle = event.target.value.toLowerCase().replaceAll(' ', '-');
    updateInput({ handle });
    if (!handle) return setValidationErrors({});
    if (handle.length < 3) {
      return setValidationErrors({ handle: "Handle is too short: Handle must be at least 3 characters long" });
    }
    if (!/^[a-zA-Z0-9-]+$/.test(handle)) {
      return setValidationErrors({ handle: "Invalid Handle: Handle must only contain letters, numbers, and hyphens" });
    }
    if (validate(handle)) {
      return setValidationErrors({ handle: "Invalid Handle: Handle must not be a UUID" });
    }
    setValidating(true);
    checkHandle(handle);
  };

  const checkHandle = useCallback(debounce(async (handle: string) => {
    try {
      const response = await fetch(`/api/documents/check?handle=${handle}`);
      const { error } = await response.json() as CheckHandleResponse;
      if (error) setValidationErrors({ handle: `${error.title}: ${error.subtitle}` });
      else setValidationErrors({});
    } catch (error) {
      setValidationErrors({ handle: `Something went wrong: Please try again later` });
    }
    setValidating(false);
  }, 500), []);

  return (
    <Container maxWidth="xs" sx={{ flex: 1 }}>
      <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ my: 2, bgcolor: 'primary.main' }}><Article /></Avatar>
        <Typography component="h1" variant="h5">{baseId ? "Fork a document" : "Create a new document"}</Typography>
        {baseId && <>
          <Typography variant="overline" sx={{ color: 'text.secondary', my: 1 }}>Based on</Typography>
          <DocumentCard userDocument={base} sx={{ width: 396 }} />
        </>}
        <Box component="form" onSubmit={handleSubmit} noValidate autoComplete="off" spellCheck="false" sx={{ mt: 1 }}>
          <TextField margin="normal" size="small" fullWidth autoFocus
            label="Document Name"
            value={input.name || ""}
            onChange={e => updateInput({ name: e.target.value })}
            sx={{ '& .MuiInputBase-root': { height: 40 } }}
          />
          <TextField margin="normal" size="small" fullWidth
            label="Document Handle"
            disabled={!isOnline}
            value={input.handle || ""}
            onChange={updateHandle}
            error={!validating && !!validationErrors.handle}
            helperText={
              validating ? "Validating..."
                : validationErrors.handle ? validationErrors.handle
                  : input.handle ? `https://matheditor.me/view/${input.handle}`
                    : "This will be used in the URL of your document"
            }
          />
          <FormControlLabel
            control={<Switch checked={saveToCloud} onChange={() => setSaveToCloud(!saveToCloud)} disabled={!isOnline || !user} />}
            label="Save to Cloud"
          />
          <FormHelperText>
            {!isOnline ? "You are offline: Please connect to the internet to use this feature"
              : unauthenticated ? "You are not signed in: Please sign in to use this feature"
                : "Save to cloud to access your documents from anywhere"
            }
          </FormHelperText>
          {saveToCloud && <>
            <UsersAutocomplete label='Coauthors' placeholder='Email' value={input.coauthors ?? []} onChange={updateCoauthors} sx={{ my: 2 }} disabled={!isOnline} />
            <FormControlLabel label="Private"
              control={<Checkbox checked={input.private} disabled={!isOnline} onChange={() => updateInput({ private: !input.private, published: input.published && input.private, collab: input.collab && input.private })} />}
            />
            <FormHelperText>
              Private documents are only accessible to authors and coauthors.
            </FormHelperText>
            <FormControlLabel label="Collab"
              control={<Checkbox checked={input.collab} disabled={!isOnline || input.private} onChange={() => updateInput({ collab: !input.collab })} />}
            />
            <FormHelperText>
              Collab documents are open for anyone to edit.
            </FormHelperText>
          </>}
          <Button type="submit" disabled={!!(baseId && !base) || validating || hasErrors} fullWidth variant="contained" startIcon={<Add />} sx={{ my: 2 }}>Create</Button>
        </Box>

      </Box>
    </Container>
  );
}

export default NewDocument;