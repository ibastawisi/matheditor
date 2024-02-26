"use client"
import { useState } from "react";
import UserCard from "./UserCard";
import { User, UserDocument } from '@/types';
import DocumentCard from "./DocumentCard";
import { Box, Grid, Pagination, Typography } from "@mui/material";
import { Pageview } from "@mui/icons-material";
import DocumentSortControl, { sortDocuments } from "./DocumentSortControl";
import dynamic from "next/dynamic";

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });
const TextAd = dynamic(() => import('@/components/Ads/TextAd'), { ssr: false });

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;

const User: React.FC<{ user?: User, sessionUser?: User, documents: UserDocument[] }> = ({ user, sessionUser, documents }) => {
  const [sort, setSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: 'updatedAt', direction: 'desc' });
  const showEmpty = !documents.length;
  const showAds = IS_VERCEL && !!user && !showEmpty;
  const pageSize = 12;
  const pages = Math.ceil(documents.length / pageSize);
  const [page, setPage] = useState(1);
  const handlePageChange = (_: any, value: number) => setPage(value);
  const sortedDocuments = sortDocuments(documents, sort);
  const pageDocuments = sortedDocuments.slice((page - 1) * pageSize, page * pageSize);

  return <>
    <Box sx={{ flex: 1 }}>
      <UserCard user={user} sessionUser={sessionUser} />
      {showAds && <TextAd sx={{ my: 2 }} />}
      {user && <Box sx={{ gap: 1, my: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
          <DocumentSortControl value={sort} setValue={setSort} />
        </Box>
        <Grid container spacing={2}>
          {pageDocuments.map(document => <Grid item key={document.id} xs={12} sm={6} md={4}>
            <DocumentCard userDocument={document} />
          </Grid>)}
        </Grid>
        {pages > 1 && <Pagination count={pages} page={page} onChange={handlePageChange} sx={{ display: "flex", justifyContent: "center", mt: 3 }} />}
        {showEmpty && <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
          <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
          <Typography variant="overline" component="p">No documents found</Typography>
        </Box>}
      </Box>}
    </Box>
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default User;