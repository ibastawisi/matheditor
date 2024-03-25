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
    local: {
      usage: 0,
      usageDetails: [] as {
        value: number;
        label?: string;
        color?: string;
      }[]
    },
    cloud: {
      usage: 0,
      usageDetails: [] as {
        value: number;
        label?: string;
        color?: string;
      }[]
    }
  });

  const localStorageEmpty = initialized && !storageUsage.local.usage;
  const cloudStorageEmpty = initialized && !storageUsage.cloud.usage;
  const isLoading = !initialized || !!((localDocuments.length && !storageUsage.local.usage) || (cloudDocuments.length && !storageUsage.cloud.usage));
  const isLoaded = initialized && !isLoading;

  useEffect(() => {
    const calculateStorageUsage = async () => {
      const localUsage = localDocuments.reduce((acc, document) => acc + document.size, 0) / 1024 / 1024;
      const localUsageDetails = localDocuments.map(document => {
        return { value: document.size / 1024 / 1024, label: document.name };
      });
      const cloudUsage = cloudDocuments.reduce((acc, document) => acc + (document.size ?? 0), 0) / 1024 / 1024;
      const cloudUsageDetails = cloudDocuments.map(document => {
        return { value: (document.size ?? 0) / 1024 / 1024, label: document.name };
      });

      setStorageUsage({
        local: {
          usage: localUsage,
          usageDetails: localUsageDetails,
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
    { id: 'local', label: 'Local', value: storageUsage.local.usage, color: '#72CCFF' },
  ];

  const data2 = [
    { id: 'cloud', label: 'Cloud', value: storageUsage.cloud.usage, color: '#FFBB28' }
  ];

  return (
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant='overline' gutterBottom sx={{ alignSelf: 'start' }}>Local Storage</Typography>
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
                cx: 125,
                data: data1,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
              {
                innerRadius: 100,
                outerRadius: 120,
                cx: 125,
                data: storageUsage.local.usageDetails,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
            ]}
            width={256}
            height={300}
            slotProps={{ legend: { hidden: true } }}
          />}
        </Grid>
        {<Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant='overline' gutterBottom sx={{ alignSelf: 'start' }}>Cloud Storage</Typography>
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
                cx: 125,
                data: data2,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
              {
                innerRadius: 100,
                outerRadius: 120,
                cx: 125,
                data: storageUsage.cloud.usageDetails,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
            ]}
            width={256}
            height={300}
            slotProps={{ legend: { hidden: true } }}
          />}
        </Grid>}
      </Grid>
    </Paper>
  );
};