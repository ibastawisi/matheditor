"use client"
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CloudDocument, User } from '@/types';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RouterLink from 'next/link';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

export default function AdminDashboard({ users, documents }: { users: User[], documents: CloudDocument[] }) {

  const userRows = users.map(user => {
    const documentsCount = documents.filter(document => document.author.id === user.id).length;
    return { ...user, documents: documentsCount };
  });

  const userColumns: GridColDef<User>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'image', headerName: 'Image', width: 60, renderCell: (params) => <Avatar src={params.value as string} alt={params.row.name} sx={{ width: 32, height: 32 }} /> },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 150 },
    { field: 'role', headerName: 'Role', width: 90 },
    { field: 'handle', headerName: 'Handle', width: 150 },
    { field: 'documents', headerName: 'Docs', width: 50 },
    { field: 'createdAt', headerName: 'Created At', width: 150, valueFormatter: (params) => new Date(params.value as string).toLocaleString() },
    { field: 'updatedAt', headerName: 'Updated At', width: 150, valueFormatter: (params) => new Date(params.value as string).toLocaleString() },
  ];

  const documentRows = documents.map(document => {
    const { author, ...rest } = document;
    return { ...rest, author: author.name };
  });

  const documentColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'author', headerName: 'Author', width: 150 },
    { field: 'handle', headerName: 'Handle', width: 150 },
    { field: 'published', headerName: 'Published', width: 90 },
    {
      field: 'actions', headerName: 'Actions', width: 90, renderCell: (params) => {
        const handle = params.row.handle || params.row.id;
        return <IconButton component={RouterLink} href={`/view/${handle}`} aria-label="view">
          <VisibilityIcon />
        </IconButton>
      }
    },
    { field: 'baseId', headerName: 'Base Id', width: 90 },
    { field: 'createdAt', headerName: 'Created At', width: 150, valueFormatter: (params) => new Date(params.value as string).toLocaleString() },
    { field: 'updatedAt', headerName: 'Updated At', width: 150, valueFormatter: (params) => new Date(params.value as string).toLocaleString() },
  ];


  return (
    <>
      <Typography variant="h6" component="h1" sx={{ my: 2 }}>Users</Typography>
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={userRows}
          columns={userColumns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
        />
      </Box>

      <Typography variant="h6" component="h1" sx={{ my: 2 }}>Documents</Typography>
      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={documentRows}
          columns={documentColumns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 5,
              },
            },
          }}
          pageSizeOptions={[5]}
        />
      </Box>
    </>
  );
}