"use client"
import { $getPreviousSelection, $getSelection, $setSelection, ElementFormatType, LexicalEditor, } from "lexical";
import { useCallback, useEffect, useState } from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { CodeNode } from "@lexical/code";
import { $patchStyle } from "@/editor/nodes/utils";
import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP } from "@lexical/code";

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  )) {
    options.push([lang, friendlyName]);
  }

  options.splice(3, 0, ['csharp', 'C#']);

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

export default function CodeTools({ editor, node }: { editor: LexicalEditor, node: CodeNode }) {

  const [codeLanguage, setCodeLanguage] = useState<string>('');


  const onCodeLanguageSelect = useCallback(
    (e: SelectChangeEvent) => {
      editor.update(() => {
        node.setLanguage((e.target as HTMLSelectElement).value);
      });
    },
    [editor, node],
  );

  useEffect(() => {
    const language = editor.getEditorState().read(() => node.getLanguage() as keyof typeof CODE_LANGUAGE_MAP);
    setCodeLanguage(language ? CODE_LANGUAGE_MAP[language] || language : '');
  }, [node]);

  const handleClose = useCallback(() => {
    setTimeout(() => {
      editor.update(() => {
        const selection = $getSelection() || $getPreviousSelection();
        if (!selection) return;
        $setSelection(selection.clone());
      }, { discrete: true, onUpdate() { editor.focus(undefined, { defaultSelection: "rootStart" }) } });
    }, 0);
  }, [editor]);

  return (
    <Select size='small' onChange={onCodeLanguageSelect} value={codeLanguage}
      onClose={handleClose}
      sx={{
        fieldset: { borderColor: 'divider' },
        '& .MuiSelect-select': { display: 'flex !important', alignItems: 'center', pl: 1, pr: '28px !important', py: 1, minHeight: '0 !important', height: '20px !important' },
        '& .MuiSelect-icon': { m: 0, fontSize: 20 },
        '& .MuiListItemIcon-root': { mr: { sm: 0.5 }, minWidth: 20 },
        '& .MuiListItemText-root': { display: { xs: "none", sm: "flex" } },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
      }}
      MenuProps={{
        slotProps: {
          root: { sx: { '& .MuiBackdrop-root': { userSelect: 'none' }, '& .MuiMenuItem-root': { minHeight: 36 }, } }
        }
      }}
    >
      {CODE_LANGUAGE_OPTIONS.map(([option, text]) => <MenuItem key={option} value={option}>{text}</MenuItem>)}
    </Select>

  );
}