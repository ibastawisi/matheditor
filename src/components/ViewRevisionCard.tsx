"use client"
import * as React from 'react';
import { CloudDocument, CloudDocumentRevision } from '@/types';
import { memo } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { Card, CardActionArea, CardHeader, Avatar, CardActions, Chip } from '@mui/material';
import { Cloud, MobileFriendly } from '@mui/icons-material';
import RouterLink from 'next/link'
import { useSearchParams } from 'next/navigation';

const ViewRevisionCard: React.FC<{
  cloudDocument: CloudDocument,
  revision: CloudDocumentRevision,
  sx?: SxProps<Theme> | undefined
}> = memo(({ cloudDocument, revision, sx }) => {
  const searchParams = useSearchParams();
  const currentRevisionId = searchParams.get("v") ?? cloudDocument.head;
  const handle = cloudDocument.handle ?? cloudDocument.id;
  const href = revision.id === cloudDocument.head ? `/view/${handle}` : `/view/${handle}?v=${revision.id}`;
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
      <CardActionArea component={RouterLink} prefetch={false} scroll={false} href={href} sx={{ flexGrow: 1 }}>
        <CardHeader sx={{ alignItems: "start", '& .MuiCardHeader-content': { overflow: "hidden", textOverflow: "ellipsis" } }}
          title={new Date(revision.createdAt).toLocaleString()}
          subheader={revision.author.name}
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }} src={revision.author.image ?? undefined} alt={revision.author.name}></Avatar>}
        />
      </CardActionArea>
      <CardActions sx={{ "& button:first-of-type": { ml: "auto !important" }, '& .MuiChip-root:last-of-type': { mr: 1 } }}>
        <Chip color={cloudDocument.head === revision.id ? "primary" : "default"} sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<Cloud />} label="Cloud" />
        {(currentRevisionId.startsWith(revision.id)) && <Chip color="primary" sx={{ width: 0, flex: 1, maxWidth: "fit-content" }} icon={<MobileFriendly />} label="Current" />}
      </CardActions>
    </Card>
  );
});

export default ViewRevisionCard;