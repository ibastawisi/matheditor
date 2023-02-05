/* eslint-disable react-hooks/exhaustive-deps */
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
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

const Dashboard: React.FC = () => {
  const user = useSelector((state: RootState) => state.app.user);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.admin) return;
    const fetchData = async () => {
      const users = await getAllUsers();
      setUsers(users);
      const documets = await getAllDocuments();
      setDocuments(documets);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  return <>
    <Helmet><title>Dashboard</title></Helmet>
    <UserCard user={user} />
    {user?.admin &&
      <Box sx={{ my: 2 }}>
        {loading ? <CircularProgress /> :
          <>
            <Typography variant="h6" component="h2" sx={{ my: 2 }}>
              Documents
            </Typography>
            <Grid container spacing={2}>
              {documents.map((document: any) => <Grid item xs={12} sm={6} md={4} key={document.id}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardActionArea component={RouterLink} to={`/view/${document.id}`} sx={{ height: "100%" }}>
                    <CardHeader
                      title={document.name}
                      subheader={<>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Author: {users.find(user => user.id === document.userId)?.name}
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

            <Typography variant="h6" component="h2" sx={{ my: 2 }}>
              Users
            </Typography>
            <Grid container spacing={2}>
              {users.map(user => <Grid item xs={12} md={6} lg={4} key={user.id}>
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
          </>
        }
      </Box>
    }
  </>;
}

export default Dashboard;