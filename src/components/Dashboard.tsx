/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import UserCard from "./UserCard";
import CircularProgress from "@mui/material/CircularProgress";
import { AdminDocument, User, UserDocument } from "../slices/app";
import useLocalStorage from "../hooks/useLocalStorage";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import documentDB from "../db";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import { actions } from "../slices";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DocumentCard from "./DocumentCard";
import { SortOption } from "../hooks/useSort";
import { SortControl } from "./SortControl";

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const admin = useSelector((state: RootState) => state.app.admin);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useLocalStorage('config', { debug: false })
  const theme = useTheme();

  const [userDocumentCountSeries, setUserDocumentCountSeries] = useState<ApexAxisChartSeries>([]);
  const [userDocumentCountSeriesLine, setUserDocumentCountSeriesLine] = useState<ApexAxisChartSeries>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const localDocuments = await documentDB.getAll();
      const cloudOnlyDocuments = user?.documents.filter(doc => !localDocuments.find(localDoc => localDoc.id === doc.id)) ?? [];
      const allUserDocuments = [...localDocuments, ...cloudOnlyDocuments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      let userDocumentCount = 0;
      const userDocumentCountSeriesData = allUserDocuments.map(doc => ({ x: doc.createdAt, y: ++userDocumentCount }));
      userDocumentCountSeriesData.push({ x: new Date().toISOString(), y: userDocumentCount });
      setUserDocumentCountSeries([{ name: 'Documents', data: userDocumentCountSeriesData }]);
      setUserDocumentCountSeriesLine([{ name: 'Documents', data: userDocumentCountSeriesData }]);
    }
    fetchUserData();
  }, [user]);

  const [adminUserAquisitionSeries, setAdminUserAquisitionSeries] = useState<ApexAxisChartSeries>([]);
  const [adminUserAquisitionSeriesLine, setAdminUserAquisitionSeriesLine] = useState<ApexAxisChartSeries>([]);

  useEffect(() => {
    if (!user?.admin) return;
    !admin && dispatch(actions.app.loadAdminAsync());
  }, [user]);

  useEffect(() => {
    if (!admin) return;
    const sortedUsers = [...admin.users].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const firstTimestamp = new Date(sortedUsers[0].createdAt).getTime();
    const lastTimestamp = new Date().getTime();
    const userMap = new Map<string, number>();
    for (let timestamp = firstTimestamp; timestamp < lastTimestamp; timestamp += 86400000) {
      userMap.set(new Date(timestamp).toISOString().split('T')[0], 0);
    }
    sortedUsers.forEach(user => {
      const day = user.createdAt.split('T')[0];
      const count = (userMap.get(day) ?? 0) + 1;
      userMap.set(day, count);
    });
    const data = Array.from(userMap.entries()).map(([day, count]) => ({ x: day, y: count }));
    data.push({ x: new Date(lastTimestamp).toISOString(), y: data[data.length - 1].y });
    setAdminUserAquisitionSeries([{ name: 'Users', data }]);
    setAdminUserAquisitionSeriesLine([{ name: 'Users', data }]);
    setLoading(false);
  }, [admin]);

  const getCountChartOptions = (id: string, title: string) => {
    const countOptions: ApexOptions = {
      chart: {
        id,
        type: 'line',
        height: 230,
        toolbar: {
          autoSelected: 'pan',
          show: false
        }
      },
      title: {
        text: title,
        align: 'left'
      },
      theme: {
        mode: theme.palette.mode,
      },
      stroke: {
        width: 3,
        curve: 'stepline',
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 1,
      },
      markers: {
        size: 0
      },
      xaxis: {
        type: 'datetime'
      },
      yaxis: {
        forceNiceScale: true,
      },
    }

    const countOptionsLine: ApexOptions = {
      chart: {
        height: 130,
        type: 'area',
        brush: {
          target: id,
          enabled: true
        },
        selection: {
          enabled: true,
          xaxis: {
            min: new Date().getTime() - 1000 * 60 * 60 * 24 * 30,
            max: new Date().getTime()
          }
        },
      },
      theme: {
        mode: theme.palette.mode,
      },
      stroke: {
        curve: 'stepline',
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.91,
          opacityTo: 0.1,
        }
      },
      xaxis: {
        type: 'datetime',
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        tickAmount: 2
      }
    };
    return [countOptions, countOptionsLine];
  }

  return <Box>
    <Helmet><title>Dashboard</title></Helmet>
    <UserCard user={user} />
    <Box sx={{ mt: 1 }}>
      <FormControlLabel control={<Switch checked={config.debug} onChange={e => setConfig({ ...config, debug: e.target.checked })} />} label="Show Editor Debug View" />
    </Box>
    <Box sx={{ gap: 1, my: 2 }}>
      <Typography variant="h6" component="h2" sx={{ textAlign: "center" }}>User Insights</Typography>
      <Paper sx={{ p: 1, my: 1 }}>
        <ReactApexChart options={getCountChartOptions("document-count", "Document Count")[0]} series={userDocumentCountSeries} type="line" height={230} />
        <ReactApexChart options={getCountChartOptions("document-count", "Document Count")[1]} series={userDocumentCountSeriesLine} type="area" height={130} />
      </Paper>
      {user && <UserDocumentsGrid documents={user.documents} />}
    </Box>
    {user?.admin &&
      <Box sx={{ my: 3 }}>
        <Typography variant="h6" component="h2" sx={{ textAlign: "center" }}>Admin Insights</Typography>
        {loading ? <Box sx={{ display: "flex", justifyContent: "center", m: 2 }}><CircularProgress disableShrink /></Box> :
          admin && <Box>
            <Paper sx={{ p: 1, my: 1 }}>
              <ReactApexChart options={getCountChartOptions("admin-user-aquisition", "User Aquisition")[0]} series={adminUserAquisitionSeries} type="line" height={230} />
              <ReactApexChart options={getCountChartOptions("admin-user-aquisition", "User Aquisition")[1]} series={adminUserAquisitionSeriesLine} type="area" height={130} />
            </Paper>
            <AdminDocumentsGrid documents={admin.documents} />
            <UserGrid users={admin.users} />
          </Box>
        }
      </Box>
    }
  </Box>;
}

export default Dashboard;

const UserGrid: React.FC<{ users: User[] }> = memo(({ users }) => {
  const [sortedUsers, setSortedUsers] = useState(users);
  const usersortOptions: SortOption<User>[] = [
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
    { label: 'NO. Documents', value: 'documents' },
  ];


  return <Accordion disableGutters TransitionProps={{ unmountOnExit: true }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Users</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({users.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<User> data={users} onSortChange={setSortedUsers} sortOptions={usersortOptions} initialSortDirection="desc" />
      </Box>
      <Grid container spacing={2}>
        {sortedUsers.map(user => <Grid item xs={12} md={6} lg={4} key={user.id}>
          <UserCard user={user} variant='admin' />
        </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion>
});

const AdminDocumentsGrid: React.FC<{ documents: AdminDocument[] }> = memo(({ documents }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<AdminDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
    { label: 'Author', value: 'author' },
    { label: 'Published', value: 'isPublic' },
  ];
  return <Accordion disableGutters TransitionProps={{ unmountOnExit: true }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<AdminDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <Grid container spacing={2}>
        {sortedDocuments.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
          <DocumentCard document={document} variant="admin" />
        </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion>
});

const UserDocumentsGrid: React.FC<{ documents: UserDocument[] }> = memo(({ documents }) => {
  const [sortedDocuments, setSortedDocuments] = useState(documents);
  const documentSortOptions: SortOption<UserDocument>[] = [
    { label: 'Updated', value: 'updatedAt' },
    { label: 'Created', value: 'createdAt' },
    { label: 'Name', value: 'name' },
  ];
  return <Accordion disableGutters TransitionProps={{ unmountOnExit: true }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Cloud Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <SortControl<UserDocument> data={documents} onSortChange={setSortedDocuments} sortOptions={documentSortOptions} initialSortDirection="desc" />
      </Box>
      <Grid container spacing={2}>
        {sortedDocuments.map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
          <DocumentCard document={document} variant="cloud" />
        </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion >
});