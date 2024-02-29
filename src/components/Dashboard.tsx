"use client"
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { Box, Grid, Paper, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { memo, useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import documentDB, { revisionDB } from '@/indexeddb';

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return <>
    <Box sx={{ flex: 1 }}>
      <UserCard user={user} sessionUser={user} />
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" gutterBottom>
              Local Storage Usage
            </Typography>
            <LocalStorageChart />
          </Paper>
        </Grid>
      </Grid>
    </Box>
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default Dashboard;

const LocalStorageChart: React.FC = memo(() => {
  const [storageUsage, setStorageUsage] = useState({
    localStorage: {
      usage: 0,
      usageDetails: {} as Record<string, number>,
    },
    indexedDB: {
      usage: 0,
      usageDetails: {} as Record<string, number>,
    }
  });

  useEffect(() => {
    const calculateStorageUsage = async () => {
      const editorDocuments = await documentDB.getAll();
      const editorDocumentsRevisions = await revisionDB.getAll();

      const backupDocuments = editorDocuments.map(document => {
        return {
          ...document,
          revisions: editorDocumentsRevisions.filter(revision => revision.documentId === document.id)
        };
      });

      const sketch = localStorage.getItem('excalidraw');
      const sketchLibraries = localStorage.getItem('excalidraw-library');
      let localStorageUsage = 0;
      const localStorageUsageDetails: Record<string, number> = {};
      if (sketch) {
        const size = +(new Blob([sketch]).size / 1024 / 1024).toFixed(2);
        localStorageUsageDetails['Sketch'] = size;
        localStorageUsage += size;
      }
      if (sketchLibraries) {
        const size = +(new Blob([sketchLibraries]).size / 1024 / 1024).toFixed(2);
        localStorageUsageDetails['Sketch Libraries'] = size;
        localStorageUsage += size;
      }

      const indexedDBUsage = +(new Blob([JSON.stringify(backupDocuments)]).size / 1024 / 1024).toFixed(2);
      const indexedDBUsageDetails: Record<string, number> = {};
      backupDocuments.forEach(document => {
        indexedDBUsageDetails[document.name] = +(new Blob([JSON.stringify(document)]).size / 1024 / 1024).toFixed(2);
      });

      setStorageUsage({
        localStorage: {
          usage: localStorageUsage,
          usageDetails: localStorageUsageDetails,
        },
        indexedDB: {
          usage: indexedDBUsage,
          usageDetails: indexedDBUsageDetails,
        }
      });
    }

    calculateStorageUsage();
  }, []);

  const data1 = [
    { id: 'editor', label: 'Editor', value: storageUsage.localStorage.usage, color: '#00C49F' },
    { id: 'documents', label: 'Documents', value: storageUsage.indexedDB.usage, color: '#72CCFF' },
  ];

  const data2 = [
    ...Object.entries(storageUsage.localStorage.usageDetails).map(([label, value]) => {
      return { label, value };
    }),
    ...Object.entries(storageUsage.indexedDB.usageDetails).map(([label, value]) => {
      return { label, value };
    })
  ];



  return (
    <PieChart
      series={[
        {
          innerRadius: 0,
          outerRadius: 80,
          data: data1,
          valueFormatter: item => `${(item.value).toFixed(2)} MB`,
        },
        {
          innerRadius: 100,
          outerRadius: 120,
          data: data2,
          valueFormatter: item => `${(item.value).toFixed(2)} MB`,
        },
      ]}
      height={300}
      slotProps={{
        legend: {
          seriesToDisplay: data1,
          position: { horizontal: 'right', vertical: 'bottom'}
        }
      }}
    />
  );
});