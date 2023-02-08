/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useSelector } from "react-redux";
import { getAllDocuments, getAllUsers } from "../services";
import { RootState } from "../store";
import Avatar from '@mui/material/Avatar';
import { Link as RouterLink } from 'react-router-dom';
import ArticleIcon from '@mui/icons-material/Article';
import UserCard from "./UserCard";
import CardHeader from "@mui/material/CardHeader";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import { User, UserDocument } from "../slices/app";
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

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.app.user);
  const [users, setUsers] = useState<User[]>([]);
  type DocumentWithUserId = UserDocument & { userId: string };
  type DocumentWithAuthor = UserDocument & { author: User };
  const [documents, setDocuments] = useState<DocumentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useLocalStorage('config', { debug: false })
  const theme = useTheme();

  const countOptions: ApexOptions = {
    chart: {
      id: 'chart2',
      type: 'line',
      height: 230,
      toolbar: {
        autoSelected: 'pan',
        show: false
      }
    },
    theme: {
      mode: theme.palette.mode,
    },
    stroke: {
      width: 3
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
    }
  }

  const countOptionsLine: ApexOptions = {
    chart: {
      id: 'chart1',
      height: 130,
      type: 'area',
      brush: {
        target: 'chart2',
        enabled: true
      },
      selection: {
        enabled: true,
      },
    },
    theme: {
      mode: theme.palette.mode,
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

  const [userDocumentCountSeries, setUserDocumentCountSeries] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);
  const [userDocumentCountSeriesLine, setUserDocumentCountSeriesLine] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);

  useEffect(() => {
    const fetchData = async () => {
      const localDocuments = await documentDB.getAll();
      const cloudOnlyDocuments = user?.documents.filter(doc => !localDocuments.find(localDoc => localDoc.id === doc.id)) ?? [];
      const allUserDocuments = [...localDocuments, ...cloudOnlyDocuments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      let userDocumentCount = 0;
      const userDocumentCountSeriesData = allUserDocuments.map(doc => ({ x: doc.createdAt, y: ++userDocumentCount }));
      setUserDocumentCountSeries([{ name: 'Documents', data: userDocumentCountSeriesData }]);
      setUserDocumentCountSeriesLine([{ name: 'Documents', data: userDocumentCountSeriesData }]);
    }
    fetchData();
  }, [user]);

  const [adminUserCountSeries, setAdminUserCountSeries] = useState([{ name: 'Users', data: [] as { x: string, y: number }[] }]);
  const [adminUserCountSeriesLine, setAdminUserCountSeriesLine] = useState([{ name: 'Users', data: [] as { x: string, y: number }[] }]);
  const [adminDocumentCountSeries, setAdminDocumentCountSeries] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);
  const [adminDocumentCountSeriesLine, setAdminDocumentCountSeriesLine] = useState([{ name: 'Documents', data: [] as { x: string, y: number }[] }]);

  useEffect(() => {
    if (!user?.admin) return;
    const fetchData = async () => {
      const users: User[] = await getAllUsers();
      setUsers(users);
      const documets: DocumentWithUserId[] = await getAllDocuments();
      setDocuments(documets.map(doc => ({ ...doc, author: users.find(user => user.id === doc.userId)! })));
      setLoading(false);

      let userCount = 0;
      const sortedUsers = [...users].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const userCountSeriesData = sortedUsers.map(user => ({ x: user.createdAt, y: ++userCount }));
      setAdminUserCountSeries([{ name: 'Users', data: userCountSeriesData }]);
      setAdminUserCountSeriesLine([{ name: 'Users', data: userCountSeriesData }]);
      let documentCount = 0;
      const sortedDocuments = [...documets].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const documentCountSeriesData = sortedDocuments.map(doc => ({ x: doc.createdAt, y: ++documentCount }));
      setAdminDocumentCountSeries([{ name: 'Documents', data: documentCountSeriesData }]);
      setAdminDocumentCountSeriesLine([{ name: 'Documents', data: documentCountSeriesData }]);
    }
    fetchData();
  }, [user]);

  const [sort, setSort] = useState({ documents: 'updated-desc', users: 'created-desc' });
  const handleSortChange = (event: SelectChangeEvent) => {
    const name = event.target.name as string;
    const value = event.target.value as string;
    setSort({ ...sort, [name]: value });
  };

  const sortDocuments = (documents: DocumentWithAuthor[]) => {
    const sortBy = sort.documents.split('-')[0];
    const sortDirection = sort.documents.split('-')[1];
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

  const sortUsers = (users: User[]) => {
    const sortBy = sort.users.split('-')[0];
    const sortDirection = sort.users.split('-')[1];
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

  return <>
    <Helmet><title>Dashboard</title></Helmet>
    <UserCard user={user} />
    <Box sx={{ mt: 1 }}>
      <FormControlLabel control={<Switch checked={config.debug} onChange={e => setConfig({ ...config, debug: e.target.checked })} />} label="Show Editor Debug View" />
    </Box>
    <Typography variant="h6" component="h2" sx={{ my: 2 }}>Document Count</Typography>
    <Paper sx={{ p: 1 }}>
      <ReactApexChart options={countOptions} series={userDocumentCountSeries} type="line" height={230} />
      <ReactApexChart options={countOptionsLine} series={userDocumentCountSeriesLine} type="area" height={130} />
    </Paper>


    {user?.admin &&
      <Box sx={{ my: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" component="h2">Admin Insights</Typography>
          {loading ? <CircularProgress /> :
            <Box>
              <Typography variant="h6" component="h2" sx={{ my: 2 }}>User Count</Typography>
              <Paper sx={{ p: 1 }}>
                <ReactApexChart options={countOptions} series={adminUserCountSeries} type="line" height={230} />
                <ReactApexChart options={countOptionsLine} series={adminUserCountSeriesLine} type="area" height={130} />
              </Paper>
              <Typography variant="h6" component="h2" sx={{ my: 2 }}>Document Count</Typography>
              <Paper sx={{ p: 1 }}>
                <ReactApexChart options={countOptions} series={adminDocumentCountSeries} type="line" height={230} />
                <ReactApexChart options={countOptionsLine} series={adminDocumentCountSeriesLine} type="area" height={130} />
              </Paper>
              <Box sx={{ display: "flex", flexWrap: "wrap-reverse", justifyContent: 'space-between', alignItems: "center", gap: 1, my: 2 }}>
                <Typography variant="h6" component="h2">Documents</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <FormControl size="small">
                    <InputLabel id="document-sort-select-label">Sort</InputLabel>
                    <Select
                      labelId="document-sort-select-label"
                      id="document-sort-select"
                      name="documents"
                      value={sort.documents}
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

              <Box sx={{ display: "flex", flexWrap: "wrap-reverse", justifyContent: 'space-between', alignItems: "center", gap: 1, my: 2 }}>
                <Typography variant="h6" component="h2">Users</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <FormControl size="small">
                    <InputLabel id="user-sort-select-label">Sort</InputLabel>
                    <Select
                      labelId="user-sort-select-label"
                      id="user-sort-select"
                      name="users"
                      value={sort.users}
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
            </Box>
          }
        </Box>
      </Box>
    }
  </>;
}

export default Dashboard;