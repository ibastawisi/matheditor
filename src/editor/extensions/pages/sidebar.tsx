"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getExtensionDependencyFromEditor } from "@lexical/extension";
import { $addUpdateTag, type LexicalEditor, SKIP_DOM_SELECTION_TAG } from "lexical";
import { Box, Button, Collapse, FormControlLabel, FormHelperText, MenuItem, Switch, TextField, Typography } from "@mui/material";

import { useSignalValue } from "@/editor/extensions/shared/hooks";
import { PagesExtension } from ".";
import { EDIT_PAGE_SLOT_COMMAND } from "./commands";
import { DEFAULT_PAGE_SETUP, PAGE_SIZE_ORDER, PAGE_SIZES } from "./constants";
import { resolveSlotVariant } from "./geometry";
import { $setPageSetup } from "./states";
import type { Orientation, PageSetup, PageSize, PageSlotKind, PageSlotSetup, PageSlotVariant } from "./types";

type MarginSide = keyof PageSetup["margins"];
const MARGIN_SIDES: { label: string; side: MarginSide }[] = [
  { label: "Top", side: "top" },
  { label: "Bottom", side: "bottom" },
  { label: "Left", side: "left" },
  { label: "Right", side: "right" },
];

function MarginInput({ label, value, disabled, onChange }: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    // reflect outside changes (undo, a restored revision) without clobbering a
    // value that is being typed and already parses to the same number
    setText((prev) => (parseFloat(prev) === value ? prev : String(value)));
  }, [value]);
  return (
    <TextField
      label={label}
      type="number"
      size="small"
      value={text}
      disabled={disabled}
      slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parseFloat(e.target.value);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed !== value) onChange(parsed);
      }}
    />
  );
}

const VARIANT_LABELS: Record<PageSlotVariant, string> = {
  default: "",
  first: "first page ",
  even: "even pages ",
};

/** A page showing `variant` must exist for it to be editable */
function hasPageForVariant(setup: PageSlotSetup, variant: PageSlotVariant, pageCount: number): boolean {
  for (let i = 0; i < pageCount; i++) {
    if (resolveSlotVariant(setup, i) === variant) return true;
  }
  return false;
}

function SlotSection({ kind, setup, pageCount, disabled, onChange, onEdit }: {
  kind: PageSlotKind;
  setup: PageSlotSetup;
  pageCount: number;
  disabled: boolean;
  onChange: (patch: Partial<PageSlotSetup>) => void;
  onEdit: (variant: PageSlotVariant) => void;
}) {
  const title = kind === "header" ? "Headers" : "Footers";
  const variants: PageSlotVariant[] = ["default"];
  if (setup.differentFirstPage) variants.push("first");
  if (setup.differentEvenPages) variants.push("even");
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <FormControlLabel
        label={title}
        disabled={disabled}
        control={<Switch checked={setup.enabled} onChange={() => onChange({ enabled: !setup.enabled })} />}
      />
      <FormHelperText sx={{ mt: 0 }}>Show {kind} on each page</FormHelperText>
      {setup.enabled && (
        <Box sx={{ display: "flex", flexDirection: "column", pl: 2, mt: 1 }}>
          <FormControlLabel
            label="Different first page"
            disabled={disabled}
            control={
              <Switch
                size="small"
                checked={setup.differentFirstPage}
                onChange={() => onChange({ differentFirstPage: !setup.differentFirstPage })}
              />
            }
          />
          <FormControlLabel
            label="Different even pages"
            disabled={disabled}
            control={
              <Switch
                size="small"
                checked={setup.differentEvenPages}
                onChange={() => onChange({ differentEvenPages: !setup.differentEvenPages })}
              />
            }
          />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
            {variants.map((variant) => {
              const available = hasPageForVariant(setup, variant, pageCount);
              return (
                <Button
                  key={variant}
                  size="small"
                  variant="outlined"
                  disabled={disabled || !available}
                  title={available ? undefined : `The document has no page that shows the ${VARIANT_LABELS[variant]}${kind} yet`}
                  onClick={() => onEdit(variant)}
                >
                  Edit {VARIANT_LABELS[variant]}{kind}
                </Button>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

/**
 * Page settings of a document. Every control applies immediately, and the
 * values shown come from the editor, so undo and restored revisions are
 * reflected live. `onClose` is called before a header or footer opens for
 * editing, to get the sidebar out of the way.
 */
export function PageSetupSidebar({ editor, onClose }: { editor: LexicalEditor; onClose?: () => void }) {
  const output = useMemo(() => getExtensionDependencyFromEditor(editor, PagesExtension).output, [editor]);
  const pageSetup = useSignalValue(output.pageSetup);
  const pageCount = useSignalValue(output.pageCount);
  // the last paged setup, so that turning "Paged" off and on restores it
  const lastPagedSetup = useRef<PageSetup>(pageSetup ?? DEFAULT_PAGE_SETUP);
  if (pageSetup !== null) lastPagedSetup.current = pageSetup;
  const paged = pageSetup !== null;
  const shown = pageSetup ?? lastPagedSetup.current;
  const isEditable = editor.isEditable();
  const disabled = !paged || !isEditable;

  const updatePageSetup = useCallback(
    (patch: null | Partial<PageSetup>) => {
      editor.update(() => {
        // the sidebar's controls keep the focus
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
        $setPageSetup(patch === null ? null : (prev) => ({ ...(prev ?? lastPagedSetup.current), ...patch }));
      });
    },
    [editor]
  );

  const updateSlot = useCallback(
    (kind: PageSlotKind, patch: Partial<PageSlotSetup>) => {
      editor.update(() => {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
        $setPageSetup((prev) => {
          const base = prev ?? lastPagedSetup.current;
          return { ...base, [kind]: { ...base[kind], ...patch } };
        });
      });
    },
    [editor]
  );

  const editSlot = useCallback(
    (kind: PageSlotKind, variant: PageSlotVariant) => {
      onClose?.();
      // after the sidebar has handed the focus back to the page
      setTimeout(() => editor.dispatchCommand(EDIT_PAGE_SLOT_COMMAND, { kind, variant }), 0);
    },
    [editor, onClose]
  );

  return (
    <Box>
      <Box>
        <FormControlLabel
          label="Paged"
          disabled={!isEditable}
          control={<Switch checked={paged} onChange={() => updatePageSetup(paged ? null : lastPagedSetup.current)} />}
        />
        <FormHelperText sx={{ mt: 0 }}>
          {paged ? "Document uses pages with a defined size and margins" : "Document is pageless and flows continuously"}
        </FormHelperText>
      </Box>
      {/* the page settings only apply to a paged document */}
      <Collapse in={paged}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            select
            size="small"
            label="Page Size"
            value={shown.pageSize}
            disabled={disabled}
            onChange={(e) => updatePageSetup({ pageSize: e.target.value as PageSize })}
          >
            {PAGE_SIZE_ORDER.map((size) => (
              <MenuItem key={size} value={size}>{PAGE_SIZES[size].label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Orientation"
            value={shown.orientation}
            disabled={disabled}
            onChange={(e) => updatePageSetup({ orientation: e.target.value as Orientation })}
          >
            <MenuItem value="portrait">Portrait</MenuItem>
            <MenuItem value="landscape">Landscape</MenuItem>
          </TextField>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Margins (inches)</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, pt: 1 }}>
              {MARGIN_SIDES.map(({ label, side }) => (
                <MarginInput
                  key={side}
                  label={label}
                  value={shown.margins[side]}
                  disabled={disabled}
                  onChange={(value) => updatePageSetup({ margins: { ...shown.margins, [side]: value } })}
                />
              ))}
            </Box>
          </Box>
          <SlotSection
            kind="header"
            setup={shown.header}
            pageCount={pageCount}
            disabled={disabled}
            onChange={(patch) => updateSlot("header", patch)}
            onEdit={(variant) => editSlot("header", variant)}
          />
          <SlotSection
            kind="footer"
            setup={shown.footer}
            pageCount={pageCount}
            disabled={disabled}
            onChange={(patch) => updateSlot("footer", patch)}
            onEdit={(variant) => editSlot("footer", variant)}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export default PageSetupSidebar;
