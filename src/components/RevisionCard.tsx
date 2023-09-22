"use client"
import * as React from 'react';
import { DocumentRevision } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip, IconButton } from '@mui/material';
import { CloudDone, Delete } from '@mui/icons-material';

const RevisionCard: React.FC<{
  revision: DocumentRevision,
  isHead: boolean,
  restoreRevision: () => void, deleteRevision: () => void,
  sx?: SxProps<Theme> | undefined
}> = memo(({ revision, isHead, restoreRevision, deleteRevision, sx }) => {

  return (
    <Card variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        maxWidth: "100%",
        ...sx
      }}>
      <CardActionArea sx={{ flexGrow: 1 }} onClick={restoreRevision}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={new Date(revision.createdAt).toLocaleString()}
          subheader={revision.author.name}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={revision.author.image}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        {isHead && <Chip sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<CloudDone />} label="Current" />}
        {!isHead && <>
          <IconButton aria-label="Delete Revision" size="small" disabled={isHead} onClick={deleteRevision}>
            <Delete />
          </IconButton>
        </>}
      </CardActions>
    </Card>
  );
});

export default RevisionCard;