"use client"
import { actions, useDispatch, useSelector } from '@/store';
import UserCard from "./User/UserCard";
import Grid from '@mui/material/Grid2';
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useEffect, useState } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Cloud, Login, Storage } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <UserCard user={user} showActions />
      <StorageChart />
    </Box>
  );
}

export default Dashboard;

type storageUsage = {
  loading: boolean;
  usage: number;
  details: {
    value: number;
    label?: string;
    color?: string;
  }[];
};

const StorageChart: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const initialized = useSelector(state => state.ui.initialized);

  const [localStorageUsage, setLocalStorageUsage] = useState<storageUsage>({ loading: true, usage: 0, details: [] });
  const [cloudStorageUsage, setCloudStorageUsage] = useState<storageUsage>({ loading: true, usage: 0, details: [] });

  useEffect(() => {
    dispatch(actions.getLocalStorageUsage()).then(response => {
      if (response.type === actions.getLocalStorageUsage.fulfilled.type) {
        const localStorageUsage = response.payload as ReturnType<typeof actions.getLocalStorageUsage.fulfilled>['payload'];
        const localUsage = localStorageUsage.reduce((acc, document) => acc + document.size, 0) / 1024 / 1024;
        const localUsageDetails = localStorageUsage.map(document => {
          return { value: document.size / 1024 / 1024, label: document.name };
        });
        setLocalStorageUsage({ loading: false, usage: localUsage, details: localUsageDetails });
      }
    });
    dispatch(actions.getCloudStorageUsage()).then(response => {
      if (response.type === actions.getCloudStorageUsage.fulfilled.type) {
        const cloudStorageUsage = response.payload as ReturnType<typeof actions.getCloudStorageUsage.fulfilled>['payload'];
        const cloudUsage = cloudStorageUsage.reduce((acc, document) => acc + (parseInt(document.size.toString()) ?? 0), 0) / 1024 / 1024;
        const cloudUsageDetails = cloudStorageUsage.map(document => {
          return { value: (document.size ?? 0) / 1024 / 1024, label: document.name };
        });
        setCloudStorageUsage({ loading: false, usage: cloudUsage, details: cloudUsageDetails });
      }
    });
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          <Typography variant='overline' gutterBottom sx={{ alignSelf: 'start', userSelect: 'none' }}>Local Storage</Typography>
          {localStorageUsage.loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
              <CircularProgress disableShrink />
            </Box>
          )}
          {!localStorageUsage.loading && !localStorageUsage.usage && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
              <Storage sx={{ width: 64, height: 64, fontSize: 64 }} />
              <Typography variant="overline" component="p" sx={{ userSelect: 'none' }}>Local storage is empty</Typography>
            </Box>
          )}
          {!!localStorageUsage.usage && <PieChart
            series={[
              {
                innerRadius: 0,
                outerRadius: 80,
                cx: 125,
                data: [{ id: 'local', label: 'Local', value: localStorageUsage.usage, color: '#72CCFF' }],
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
              {
                innerRadius: 100,
                outerRadius: 120,
                cx: 125,
                data: localStorageUsage.details,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
            ]}
            width={256}
            height={300}
            slotProps={{ legend: { hidden: true } }}
            sx={{ mx: 'auto' }}
          />}
        </Paper>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          <Typography variant='overline' gutterBottom sx={{ alignSelf: 'start', userSelect: 'none' }}>Cloud Storage</Typography>
          {(cloudStorageUsage.loading || (!initialized && !cloudStorageUsage.usage)) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
              <CircularProgress disableShrink />
            </Box>
          )}
          {initialized && !user && !cloudStorageUsage.loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
              <Login sx={{ width: 64, height: 64, fontSize: 64 }} />
              <Typography variant="overline" component="p" sx={{ userSelect: 'none' }}>Please login to use cloud storage</Typography>
            </Box>
          )}
          {user && !cloudStorageUsage.loading && !cloudStorageUsage.usage && (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: 300, gap: 2 }}>
              <Cloud sx={{ width: 64, height: 64, fontSize: 64 }} />
              <Typography variant="overline" component="p" sx={{ userSelect: 'none' }}>Cloud storage is empty</Typography>
            </Box>
          )}
          {!!cloudStorageUsage.usage && <PieChart
            series={[
              {
                innerRadius: 0,
                outerRadius: 80,
                cx: 125,
                data: [{ id: 'cloud', label: 'Cloud', value: cloudStorageUsage.usage, color: '#FFBB28' }],
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
              {
                innerRadius: 100,
                outerRadius: 120,
                cx: 125,
                data: cloudStorageUsage.details,
                valueFormatter: item => `${(item.value).toFixed(2)} MB`,
              },
            ]}
            width={256}
            height={300}
            slotProps={{ legend: { hidden: true } }}
          />}
        </Paper>
      </Grid>
    </Grid>
  );
};