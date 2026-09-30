"use client"
import { $getSelection, $setSelection, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, CLEAR_HISTORY_COMMAND, COMMAND_PRIORITY_BEFORE_CRITICAL, COMMAND_PRIORITY_CRITICAL, REDO_COMMAND, SELECTION_CHANGE_COMMAND, UNDO_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { IS_APPLE, mergeRegister } from '@lexical/utils';
import { useHash } from 'react-use';
import { useEffect, useRef } from 'react';
import { useScrollTrigger, AppBar, Toolbar, Box, IconButton, Container } from '@mui/material';
import { Redo, Undo } from '@mui/icons-material';
import { useStore } from '@/editor/extensions/store/hooks';
import { BlockFormatSelect } from './BlockFormatSelect';
import InsertToolMenu from './InsertToolMenu';
import TextFormatToggles from './TextFormatToggles';
import AlignTextMenu from './AlignTextMenu';
import FontSelect from './FontSelect';
import MathTools from '@/editor/extensions/math/toolbar';
import ImageTools from '@/editor/extensions/image/toolbar';
import CodeTools from '@/editor/extensions/code/toolbar';
import TableTools from '@/editor/extensions/table/toolbar';
import NoteTools from '@/editor/extensions/sticky/toolbar';
import AITools from '@/editor/extensions/ai/toolbar';
import ImageDialog from '@/editor/extensions/image/dialog';
import GraphDialog from '@/editor/extensions/graph/dialog';
import SketchDialog from '@/editor/extensions/sketch/dialog';
import TableDialog from '@/editor/extensions/table/dialog';
import IFrameDialog from '@/editor/extensions/iframe/dialog';
import LinkDialog from '@/editor/extensions/link/dialog';
import LayoutDialog from '@/editor/extensions/layout/dialog';
import OCRDialog from '@/editor/extensions/ocr/dialog';
import AIDialog from '@/editor/extensions/ai/dialog';

export function ToolbarComponent() {
  const [editor] = useLexicalComposerContext();
  const [canUndo] = useStore("canUndo");
  const [canRedo] = useStore("canRedo");
  const [openDialog] = useStore("openDialog");
  const [selectedNodeKey] = useStore("selectedNodeKey");
  const [selectedLinkNodeKey] = useStore("selectedLinkNodeKey");
  const [isMath] = useStore("isMath");
  const [isImage] = useStore("isImage");
  const [imageType] = useStore("imageType");
  const [isCodeBlock] = useStore("isCodeBlock");
  const [tableNodeKey] = useStore("tableNodeKey");
  const [noteNodeKey] = useStore("noteNodeKey");
  const isTouched = useRef<boolean>(false);
  const [hash] = useHash();

  // history created before the user touches the document (e.g. restoring a revision) should not be undoable
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          isTouched.current = true;
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerUpdateListener(({ tags }) => {
        try {
          const revision = JSON.parse(tags.values().next().value as string);
          if (revision.id) {
            isTouched.current = false;
          }
        } catch { }
      }),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          if (payload && !isTouched.current) {
            editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_BEFORE_CRITICAL,
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          if (payload && !isTouched.current) {
            editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_BEFORE_CRITICAL,
      ),
    );
  }, [editor]);

  const toolbarTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 32,
  });

  useEffect(() => {
    const lightThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    const darkThemeMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    if (lightThemeMeta && darkThemeMeta) {
      lightThemeMeta.setAttribute('content', toolbarTrigger ? '#ffffff' : '#1976d2');
      darkThemeMeta.setAttribute('content', toolbarTrigger ? '#121212' : '#272727');
    }
  }, [toolbarTrigger]);

  useEffect(() => {
    if (!hash) return;
    const scrollIntoView = (behavior?: ScrollBehavior) => {
      const target = document.getElementById(hash.slice(1));
      if (target) return target.scrollIntoView({ block: 'start', behavior });
      const decodedHash = decodeURIComponent(hash.slice(1));
      const anchor = Array.from(document.querySelectorAll('a')).find(a => a.getAttribute('href') === `#${decodedHash}` && a.getAttribute('target') === '_self');
      anchor?.scrollIntoView({ block: 'start', behavior });
    };
    scrollIntoView();
    setTimeout(() => scrollIntoView('smooth'), 0);
  }, [hash]);

  useEffect(() => {
    if (openDialog !== null) return;
    const selection = editor.getEditorState().read($getSelection);
    if (!selection) return;
    setTimeout(() => {
      editor.update(() => { $setSelection(selection.clone()); });
      editor.getRootElement()?.focus({ preventScroll: true });
    }, 0);
  }, [editor, openDialog]);

  const showMathTools = isMath && !!selectedNodeKey;
  const showImageTools = isImage && !!selectedNodeKey;
  const showCodeTools = isCodeBlock && !!selectedNodeKey;
  const showTableTools = !!tableNodeKey;
  const showNoteTools = !!noteNodeKey;
  const showTextTools = !isMath;
  const showTextFormatTools = showTextTools && !showCodeTools;
  const imageNodeKey = isImage ? selectedNodeKey : "";

  return (
    <>
      <AppBar elevation={toolbarTrigger ? 4 : 0} position={toolbarTrigger ? 'fixed' : 'static'}
        sx={{ background: 'var(--mui-palette-background-default) !important', transition: 'none', }}>
        <Toolbar className="editor-toolbar" sx={{ position: "relative", displayPrint: 'none', alignItems: "center", px: '0 !important', py: 1, }}>
          <Container sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: toolbarTrigger ? '' : '0 !important', }}>
            <Box sx={{ display: "flex", alignSelf: 'start', my: { xs: 0, sm: 0.5 } }}>
              <IconButton title={IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'} aria-label="Undo" disabled={!canUndo}
                onClick={() => { editor.dispatchCommand(UNDO_COMMAND, undefined); }}>
                <Undo fontSize='small' />
              </IconButton>
              <IconButton title={IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)'} aria-label="Redo" disabled={!canRedo}
                onClick={() => { editor.dispatchCommand(REDO_COMMAND, undefined); }}>
                <Redo fontSize='small' />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, mx: 'auto', flexWrap: "wrap", justifyContent: "center" }}>
              {showTextTools && <>
                <BlockFormatSelect />
                {showTextFormatTools && <FontSelect />}
                <AITools />
                {showTextFormatTools && <TextFormatToggles sx={{
                  display: { xs: "flex", sm: "none", md: "none", lg: "flex" },
                  position: ['fixed', 'static'],
                  justifyContent: ['center', 'start'],
                  inset: 'auto auto calc(var(--keyboard-inset-height) + 4px)',
                  zIndex: 1000,
                  bgcolor: 'background.default',
                }} />}
              </>}
            </Box>
            <Box sx={{ display: "flex", alignSelf: 'start', my: { xs: 0, sm: 0.5 } }}>
              <InsertToolMenu />
              <AlignTextMenu />
            </Box>
          </Container>
        </Toolbar >
      </AppBar>
      {toolbarTrigger && <Box sx={(theme) => ({ ...theme.mixins.toolbar, displayPrint: "none" })} />}
      {showMathTools && <MathTools nodeKey={selectedNodeKey} />}
      {showImageTools && <ImageTools nodeKey={selectedNodeKey} />}
      {showCodeTools && <CodeTools nodeKey={selectedNodeKey} />}
      {showTableTools && <TableTools nodeKey={tableNodeKey} />}
      {showNoteTools && <NoteTools nodeKey={noteNodeKey} />}
      {openDialog === "image" && <ImageDialog nodeKey={imageType === "image" ? imageNodeKey : ""} />}
      {openDialog === "graph" && <GraphDialog nodeKey={imageType === "graph" ? imageNodeKey : ""} />}
      {openDialog === "sketch" && <SketchDialog nodeKey={imageNodeKey} />}
      {openDialog === "table" && <TableDialog />}
      {openDialog === "iframe" && <IFrameDialog nodeKey={imageType === "iframe" ? imageNodeKey : ""} />}
      {openDialog === "link" && <LinkDialog nodeKey={selectedLinkNodeKey} />}
      {openDialog === "layout" && <LayoutDialog />}
      {openDialog === "ocr" && <OCRDialog />}
      {openDialog === "ai" && <AIDialog />}
    </>
  );
}

export default ToolbarComponent;
