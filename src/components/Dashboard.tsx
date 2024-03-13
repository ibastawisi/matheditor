"use client"
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { CloudDocument, LocalDocument } from '@/types';
import { Cloud, Login, Storage } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <UserCard user={user} sessionUser={user} />
      <StorageChart />
    </Box>
  );
}

export default Dashboard;

const StorageChart: React.FC = () => {
  const user = useSelector(state => state.user);
  const documents = useSelector(state => state.documents);
  const initialized = useSelector(state => state.ui.initialized);
  const localDocuments = documents.filter(document => !!document.local).map(document => document.local) as LocalDocument[];
  const cloudDocuments = documents.filter(document => !!document.cloud && document.cloud.author.id === user?.id).map(document => document.cloud) as CloudDocument[];
  const [storageUsage, setStorageUsage] = useState({
    localStorage: {
      usage: 0,
      usageDetails: {} as Record<string, number>,
    },
    indexedDB: {
      usage: 0,
      usageDetails: {} as Record<string, number>,
    },
    cloud: {
      usage: 0,
      usageDetails: {} as Record<string, number>,
    }
  });

  const localStorageEmpty = initialized && !(storageUsage.localStorage.usage || storageUsage.indexedDB.usage);
  const cloudStorageEmpty = initialized && !(storageUsage.cloud.usage);
  const isLoading = !initialized || (localDocuments.length && !storageUsage.localStorage.usage) || (cloudDocuments.length && !storageUsage.cloud.usage);
  const isLoaded = initialized && !isLoading;

  useEffect(() => {
    const calculateStorageUsage = async () => {
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

      const indexedDBUsage = localDocuments.reduce((acc, document) => acc + document.size, 0) / 1024 / 1024;
      const indexedDBUsageDetails: Record<string, number> = {};
      localDocuments.forEach(document => {
        indexedDBUsageDetails[document.name] = document.size / 1024 / 1024;
      });

      const cloudUsage = cloudDocuments.reduce((acc, document) => acc + (document.size ?? 0), 0) / 1024 / 1024;
      const cloudUsageDetails: Record<string, number> = {};
      cloudDocuments.forEach(document => {
        cloudUsageDetails[document.name] = (document.size ?? 0) / 1024 / 1024;
      });

      setStorageUsage({
        localStorage: {
          usage: localStorageUsage,
          usageDetails: localStorageUsageDetails,
        },
        indexedDB: {
          usage: indexedDBUsage,
          usageDetails: indexedDBUsageDetails,
        },
        cloud: {
          usage: cloudUsage,
          usageDetails: cloudUsageDetails,
        }
      });
    }

    calculateStorageUsage();
  }, [initialized]);

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

  const data3 = [
    { id: 'cloud', label: 'Cloud', value: storageUsage.cloud.usage, color: '#FFBB28' }
  ];
  const data4 = [
    ...Object.entries(storageUsage.cloud.usageDetails).map(([label, value]) => {
      return { label, value };
    })
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant='overline' gutterBottom>Local Storage</Typography>
          {isLoading && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
            <CircularProgress disableShrink />
          </Box>}
          {isLoaded && localStorageEmpty && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
            <Storage sx={{ width: 64, height: 64, fontSize: 64 }} />
            <Typography variant="overline" component="p">Local storage is empty</Typography>
          </Box>}
          {isLoaded && !localStorageEmpty && <PieChart
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
                position: { horizontal: 'right', vertical: 'bottom' }
              }
            }}
          />}
        </Grid>
        {<Grid item xs={12} md={6}>
          <Typography variant='overline' gutterBottom>Cloud Storage</Typography>
          {isLoading && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
            <CircularProgress disableShrink />
          </Box>}
          {isLoaded && !user && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
            <Login sx={{ width: 64, height: 64, fontSize: 64 }} />
            <Typography variant="overline" component="p">Please login to use cloud storage</Typography>
          </Box>}
          {isLoaded && user && cloudStorageEmpty && <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
            <Cloud sx={{ width: 64, height: 64, fontSize: 64 }} />
            <Typography variant="overline" component="p">Cloud storage is empty</Typography>
          </Box>}
          {isLoaded && !cloudStorageEmpty && <PieChart
            series={[
              {
                innerRadius: 0,
                outerRadius: 80,
                data: data3,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
              {
                innerRadius: 100,
                outerRadius: 120,
                data: data4,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
            ]}
            height={300}
            slotProps={{
              legend: {
                seriesToDisplay: data3,
                position: { horizontal: 'right', vertical: 'bottom' }
              }
            }}
          />}
        </Grid>}
      </Grid>
    </Paper>
  );
};