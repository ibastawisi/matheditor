"use client"
import { useMemo } from "react";
import { getExtensionDependencyFromEditor } from "@lexical/extension";
import type { LexicalEditor } from "lexical";
import { Box, Checkbox, FormControlLabel, IconButton, InputAdornment, List, ListItemButton, TextField, Typography, useMediaQuery } from "@mui/material";
import { Clear, KeyboardArrowDown, KeyboardArrowUp, Search } from "@mui/icons-material";
import { useSignalValue } from "@/editor/extensions/shared/hooks";
import { SearchExtension } from ".";
import type { SearchController, SearchMatch } from "./core";

function MatchItem({ match, active, onClick }: { match: SearchMatch; active: boolean; onClick: () => void }) {
  return (
    <ListItemButton
      selected={active}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      ref={(el) => { if (active) el?.scrollIntoView({ block: "nearest" }); }}
      sx={{ borderRadius: 1, typography: "body2", color: "text.secondary", display: "block", wordBreak: "break-word" }}
    >
      {match.truncatedLeft && "…"}
      {match.before}
      <Box component="mark" sx={{ bgcolor: "transparent", color: "text.primary", fontWeight: "bold" }}>{match.match}</Box>
      {match.after}
      {match.truncatedRight && "…"}
    </ListItemButton>
  );
}

/**
 * Finds text in the document, highlighting the matches in it. `onNavigate` is
 * called before going to a match picked from the list, when the drawer covers
 * the document.
 */
export function SearchPanel({ search, onNavigate }: { search: SearchController; onNavigate?: () => void }) {
  const { actions } = search;
  const query = useSignalValue(search.query);
  const matchCase = useSignalValue(search.matchCase);
  const matchWholeWord = useSignalValue(search.matchWholeWord);
  const matches = useSignalValue(search.matches);
  const activeIndex = useSignalValue(search.activeIndex);
  const coversDocument = useMediaQuery("(max-width: 600px)");

  const goToMatch = (index: number) => {
    if (!coversDocument || !onNavigate) return actions.goToMatch(index);
    onNavigate();
    requestAnimationFrame(() => actions.goToMatch(index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) actions.previousMatch();
      else actions.nextMatch();
    } else if (event.key === "Escape" && query) {
      // the first escape clears the search, the next closes the drawer
      event.stopPropagation();
      actions.clear();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <TextField
        autoFocus
        size="small"
        placeholder="Search in document"
        value={query}
        onChange={(event) => actions.setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        slotProps={{
          htmlInput: { "aria-label": "Search in document", "data-document-search": true },
          input: {
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: query && <InputAdornment position="end">
              <IconButton size="small" edge="end" aria-label="Clear search" onClick={() => actions.clear()}><Clear fontSize="small" /></IconButton>
            </InputAdornment>,
          },
        }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        <FormControlLabel label="Match case" control={<Checkbox size="small" checked={matchCase} onChange={(event) => actions.setMatchCase(event.target.checked)} />} />
        <FormControlLabel label="Whole word" control={<Checkbox size="small" checked={matchWholeWord} onChange={(event) => actions.setMatchWholeWord(event.target.checked)} />} />
      </Box>
      {query && <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="body2" role="status" sx={{ color: "text.secondary", mr: "auto" }}>
          {matches.length === 0 ? "No results" : `${activeIndex + 1} of ${matches.length}`}
        </Typography>
        <IconButton size="small" aria-label="Previous match" title="Previous match (Shift+Enter)" disabled={matches.length < 2} onClick={() => actions.previousMatch()}>
          <KeyboardArrowUp fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="Next match" title="Next match (Enter)" disabled={matches.length < 2} onClick={() => actions.nextMatch()}>
          <KeyboardArrowDown fontSize="small" />
        </IconButton>
      </Box>}
      {matches.length > 0 && <List aria-label="Search results" dense disablePadding>
        {matches.map((match, index) => (
          <MatchItem key={index} match={match} active={index === activeIndex} onClick={() => goToMatch(index)} />
        ))}
      </List>}
    </Box>
  );
}

/** Searches the document in the editor */
export function EditorSearchPanel({ editor, onNavigate }: { editor: LexicalEditor; onNavigate?: () => void }) {
  const search = useMemo(() => getExtensionDependencyFromEditor(editor, SearchExtension).output, [editor]);
  return <SearchPanel search={search} onNavigate={onNavigate} />;
}

export default SearchPanel;
