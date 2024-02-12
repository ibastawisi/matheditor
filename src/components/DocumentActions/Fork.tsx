"use client"
import { UserDocument } from "@/types";
import { FileCopy } from "@mui/icons-material";
import { IconButton, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

const ForkDocument: React.FC<{ userDocument: UserDocument, variant?: 'menuitem' | 'iconbutton', closeMenu?: () => void }> = ({ userDocument, variant = 'iconbutton', closeMenu }) => {
  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const id = userDocument.id;
  const handle = cloudDocument?.handle ?? localDocument?.handle ?? null;
  const head = localDocument?.head || cloudDocument?.head;
  const searchParams = useSearchParams();
  const revisionId = searchParams.get('v');
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const handleFork = () => {
    if (closeMenu) closeMenu();
    const href = `/new/${handle || id}${revisionId && revisionId !== head ? `?v=${revisionId}` : ''}`;
    navigate(href);
  };

  if (variant === 'menuitem') return (
    <MenuItem onClick={handleFork}>
      <ListItemIcon>
        <FileCopy />
      </ListItemIcon>
      <ListItemText>Fork</ListItemText>
    </MenuItem>
  );
  return <IconButton aria-label="Fork Document" onClick={handleFork} size="small"><FileCopy /></IconButton>
}

export default ForkDocument;
