"use client"
import * as React from 'react';
import { IconButton, Menu } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import DownloadDocument from './Download';
import ForkDocument from './Fork';
import DeleteDocument from './Delete';
import UploadDocument from './Upload';
import { User, UserDocument } from '@/types';
import ShareDocument from './Share';
import EditDocument from './Edit';

function DocumentActionMenu({ userDocument, user }: { userDocument: UserDocument, user?: User }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchorEl(null);
  };

  const localDocument = userDocument?.local;
  const cloudDocument = userDocument?.cloud;
  const isLocal = !!localDocument;
  const isCloud = !!cloudDocument;
  const isUploaded = isLocal && isCloud;
  const isUpToDate = isUploaded && localDocument.updatedAt === cloudDocument.updatedAt;
  const isAuthor = isCloud ? cloudDocument.author.id === user?.id : true
  const isCoauthor = isCloud ? cloudDocument.coauthors.some(u => u.id === user?.id) : false;
  const id = userDocument.id;

  const options = isAuthor ? ['download', 'fork', 'upload', 'delete'] :
    isLocal ? ['download', 'fork', 'delete'] : isCoauthor ? ['download', 'fork'] : ["fork"];

  if (options.length === 0) return null;

  return (
    <>
      {isAuthor && <EditDocument userDocument={userDocument} />}
      <ShareDocument userDocument={userDocument} />
      <IconButton
        id={`${id}-action-button`}
        aria-controls={open ? `${id}-action-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label='Document Actions'
        onClick={openMenu}
        size="small"
      >
        <MoreVert />
      </IconButton>
      <Menu
        id={`${id}-action-menu`}
        aria-labelledby={`${id}-action-button`}
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {options.includes('download') && <DownloadDocument userDocument={userDocument} variant="menuitem" closeMenu={closeMenu} />}
        {options.includes('fork') && <ForkDocument userDocument={userDocument} variant="menuitem" closeMenu={closeMenu} />}
        {options.includes('upload') && isLocal && !isUpToDate && <UploadDocument userDocument={userDocument} variant="menuitem" closeMenu={closeMenu} />}
        {options.includes('delete') && <DeleteDocument userDocument={userDocument} variant="menuitem" closeMenu={closeMenu} />}
      </Menu>
    </>
  );
}

export default DocumentActionMenu;