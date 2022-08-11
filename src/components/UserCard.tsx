import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { User } from '../slices/app';
import Button from '@mui/material/Button';
import { actions } from '../slices';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import { BACKEND_URL } from '../config';
import GoogleIcon from '@mui/icons-material/Google';

export default function UserCard({ user }: { user?: User | null }) {
  const dispatch = useDispatch<AppDispatch>();

  const login = async () => {
    const googleLoginURL = BACKEND_URL + "/auth/login";
    window.open(googleLoginURL, "_blank", "width=500,height=600");
  };

  const logout = async () => {
    dispatch(actions.app.logoutAsync());
  }

  return (
    <Card variant='outlined' sx={{ display: 'flex', justifyContent: 'space-between'}}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: '1 0 auto' }}>
          <Typography component="div" variant="h5">
            {user ? user.name : <Skeleton variant="text" width={190} />}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" component="div">
            {user ? user.email : <Skeleton variant="text" width={150} />}
          </Typography>
        </CardContent>
        <CardActions>
          {user ? <Button size='small' onClick={logout}>Logout</Button> :
            <Button size='small' startIcon={<GoogleIcon />} onClick={login}>Login with Google</Button>}
        </CardActions>
      </Box>
      {user ?
        <CardMedia
          component="img"
          sx={{ width: 151 }}
          image={user.picture}
          alt={user.name}
        /> :
        <Skeleton variant="rectangular" width={151} height={151} />
      }
    </Card>
  );
}