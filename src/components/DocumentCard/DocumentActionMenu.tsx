"use client"
import { Share, MoreVert } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import dynamic from 'next/dynamic';

const DocumentActionMenu = dynamic(
  () => import('@/components/DocumentActions/ActionMenu'),
  {
    ssr: false,
    loading: () => <>
      <IconButton aria-label="Share Document" size="small"><Share /></IconButton>
      <IconButton aria-label='Document Actions' size="small"><MoreVert /></IconButton>
    </>
  }
);

export default DocumentActionMenu;