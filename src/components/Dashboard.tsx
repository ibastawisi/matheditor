/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect, memo } from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import UserCard from "./UserCard";
import CardHeader from "@mui/material/CardHeader";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import { AdminDocument, DocumentWithAuthor, User } from "../slices/app";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.app.user);
  const admin = useSelector((state: RootState) => state.app.admin);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useLocalStorage('config', { debug: false })
  const theme = useTheme();

  const [userDocumentCountSeries, setUserDocumentCountSeries] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);
  const [userDocumentCountSeriesLine, setUserDocumentCountSeriesLine] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);

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

  const [adminUserAquisitionSeries, setAdminUserAquisitionSeries] = useState([{ name: 'Users', data: [] as { x: string, y: number }[] }]);
  const [adminUserAquisitionSeriesLine, setAdminUserAquisitionSeriesLine] = useState([{ name: 'Users', data: [] as { x: string, y: number }[] }]);

  useEffect(() => {
    if (!user?.admin) return;
    const fetchAdminData = async () => {
      await dispatch(actions.app.loadAdminAsync());
    }
    !admin && fetchAdminData();
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
            <DocumentsGrid documents={admin.documents} />
            <UserGrid users={admin.users} />
          </Box>
        }
      </Box>
    }
  </Box>;
}

export default Dashboard;

const UserGrid: React.FC<{ users: User[] }> = memo(({ users }) => {
  const [sort, setSort] = useState('created-desc');
  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setSort(value);
  };

  const sortUsers = (users: User[]) => {
    const sortBy = sort.split('-')[0];
    const sortDirection = sort.split('-')[1];
    switch (sortBy) {
      case "updated":
        return sortDirection === 'asc' ?
          [...users].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) :
          [...users].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      case "created":
        return sortDirection === 'asc' ?
          [...users].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)) :
          [...users].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      case "name":
        return sortDirection === 'asc' ?
          [...users].sort((a, b) => a.name.localeCompare(b.name)) :
          [...users].sort((a, b) => b.name.localeCompare(a.name));
      case "documents":
        return sortDirection === 'asc' ?
          [...users].sort((a, b) => a.documents.length - b.documents.length) :
          [...users].sort((a, b) => b.documents.length - a.documents.length);
      default:
        return users;
    }
  }


  return <Accordion disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Users</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({users.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <FormControl size="small">
          <InputLabel id="user-sort-select-label">Sort</InputLabel>
          <Select
            labelId="user-sort-select-label"
            id="user-sort-select"
            name="users"
            value={sort}
            label="Sort"
            onChange={handleSortChange}
            sx={{
              mx: 0.25,
              '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
              '& .MuiListItemIcon-root': { minWidth: 30 },
            }}
          >
            <MenuItem value="updated-desc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Updated</ListItemText>
            </MenuItem>
            <MenuItem value="updated-asc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Updated</ListItemText>
            </MenuItem>
            <MenuItem value="created-desc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Created</ListItemText>
            </MenuItem>
            <MenuItem value="created-asc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Created</ListItemText>
            </MenuItem>
            <MenuItem value="name-asc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Name</ListItemText>
            </MenuItem>
            <MenuItem value="name-desc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Name</ListItemText>
            </MenuItem>
            <MenuItem value="documents-asc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Documents</ListItemText>
            </MenuItem>
            <MenuItem value="documents-desc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Documents</ListItemText>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={2}>
        {sortUsers(users).map(user => <Grid item xs={12} md={6} lg={4} key={user.id}>
          <Card variant='outlined' sx={{ display: 'flex', justifyContent: 'space-between', height: "100%" }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: "space-between" }}>
              <CardContent sx={{ overflow: "hidden", overflowWrap: "anywhere" }}>
                <Typography component="div" variant="subtitle1">{user.name}</Typography>
                <Typography variant="subtitle2" color="text.secondary" component="div">
                  {user.email}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Registered At: {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Typography variant="subtitle2" component="div">
                  No. documents: {user.documents.length}
                </Typography>
              </CardActions>
            </Box>
            <CardMedia
              component="img"
              sx={{ width: 96, flexShrink: 0 }}
              image={user.picture}
              alt={user.name}
            />
          </Card>
        </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion>
});

const DocumentsGrid: React.FC<{ documents: AdminDocument[] }> = memo(({ documents }) => {
  const [sort, setSort] = useState('updated-desc');
  const handleSortChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setSort(value);
  };
  const sortDocuments = (documents: DocumentWithAuthor[]) => {
    const sortBy = sort.split('-')[0];
    const sortDirection = sort.split('-')[1];
    switch (sortBy) {
      case "updated":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) :
          [...documents].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
      case "created":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)) :
          [...documents].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      case "name":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => a.name.localeCompare(b.name)) :
          [...documents].sort((a, b) => b.name.localeCompare(a.name));
      case "author":
        return sortDirection === 'asc' ?
          [...documents].sort((a, b) => a.author.name.localeCompare(b.author.name)) :
          [...documents].sort((a, b) => b.author.name.localeCompare(a.author.name));
      default:
        return documents;
    }
  }

  return <Accordion disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography>Documents</Typography>
      <Typography sx={{ color: 'text.secondary', mx: 1 }}>({documents.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ display: "flex", justifyContent: 'flex-end', alignItems: "center", gap: 1, my: 2 }}>
        <FormControl size="small">
          <InputLabel id="document-sort-select-label">Sort</InputLabel>
          <Select
            labelId="document-sort-select-label"
            id="document-sort-select"
            name="documents"
            value={sort}
            label="Sort"
            onChange={handleSortChange}
            sx={{
              mx: 0.25,
              '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0.5 },
              '& .MuiListItemIcon-root': { minWidth: 30 },
            }}
          >
            <MenuItem value="updated-desc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Updated</ListItemText>
            </MenuItem>
            <MenuItem value="updated-asc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Updated</ListItemText>
            </MenuItem>
            <MenuItem value="created-desc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Created</ListItemText>
            </MenuItem>
            <MenuItem value="created-asc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Created</ListItemText>
            </MenuItem>
            <MenuItem value="name-asc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Name</ListItemText>
            </MenuItem>
            <MenuItem value="name-desc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Name</ListItemText>
            </MenuItem>
            <MenuItem value="author-asc">
              <ListItemIcon>
                <ArrowDownwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Author</ListItemText>
            </MenuItem>
            <MenuItem value="author-desc">
              <ListItemIcon>
                <ArrowUpwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Author</ListItemText>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Grid container spacing={2}>
        {sortDocuments(documents).map(document => <Grid item xs={12} sm={6} md={4} key={document.id}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardActionArea component={RouterLink} to={`/view/${document.id}`} sx={{ height: "100%" }}>
              <CardHeader
                title={document.name}
                subheader={<>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Author: {document.author.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created At: {new Date(document.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated At: {new Date(document.updatedAt).toLocaleString()}
                  </Typography>
                </>}
                avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ArticleIcon /></Avatar>}
              />
            </CardActionArea>
          </Card>
        </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion>
});