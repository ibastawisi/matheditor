"use client"
import { $getNodeByKey, NodeKey } from "lexical";
import { useCallback } from "react";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isCodeNode } from "@lexical/code-core";
import { CODE_LANGUAGE_FRIENDLY_NAME_MAP, CODE_LANGUAGE_MAP } from "@lexical/code-prism";
import { useStore } from "@/editor/extensions/store/hooks";
import { restoreFocus } from "@/editor/utils/restoreFocus";
import { AnchoredToolbar } from "@/editor/extensions/shared/components/AnchoredToolbar";

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = [];

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP)) {
    options.push([lang, friendlyName]);
  }

  if (!options.some(([lang]) => lang === 'csharp')) options.splice(3, 0, ['csharp', 'C#']);

  return options;
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

export default function CodeTools({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [language] = useStore("codeLanguage");
  const codeLanguage = language ? CODE_LANGUAGE_MAP[language as keyof typeof CODE_LANGUAGE_MAP] || language : '';

  const onCodeLanguageSelect = useCallback(
    (e: SelectChangeEvent) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!$isCodeNode(node)) return;
        node.setLanguage((e.target as HTMLSelectElement).value);
      });
    },
    [editor, nodeKey],
  );

  const handleClose = useCallback(() => {
    setTimeout(() => restoreFocus(editor), 0);
  }, [editor]);

  return (
    <AnchoredToolbar nodeKey={nodeKey} placement="inside-top-right" className="code-toolbar">
      <Select size='small' onChange={onCodeLanguageSelect} value={codeLanguage}
        onClose={handleClose}
        sx={{
          bgcolor: 'background.default',
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
    </AnchoredToolbar>
  );
}
