import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { User } from '../slices/app';
import Button from '@mui/material/Button';
import { actions } from '../slices';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import { BACKEND_URL } from '../config';
import GoogleIcon from '@mui/icons-material/Google';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import { Link as RouterLink } from 'react-router-dom';
import CardActionArea from '@mui/material/CardActionArea';
import ArticleIcon from '@mui/icons-material/Article';
import Chip from "@mui/material/Chip";

export default function UserCard({ user, variant = 'user' }: { user?: User | null, variant?: 'user' | 'public' | 'admin' }) {
  const dispatch = useDispatch<AppDispatch>();
  const login = async () => {
    const googleLoginURL = BACKEND_URL + "/auth/login";
    window.open(googleLoginURL, "_blank", "width=500,height=600");
  };

  const logout = async () => {
    dispatch(actions.app.logoutAsync());
  }

  const handleShare = async () => {
    const shareData = {
      title: `${user?.name}'s profile on Math Editor`,
      url: window.location.origin + "/user/" + user?.id
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.app.announce({ message: "Link copied to clipboard" }));
    }
  };

  return (
    <Card variant='outlined' sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CardActionArea component={RouterLink} to={user ? `/user/${user.id}` : '/dashboard'} sx={{ flex: '1 0 auto', w: '100%' }}>
          <CardContent>
            <Typography variant={variant !== 'admin' ? "h5" : "subtitle1"}>
              {user ? user.name : <Skeleton variant="text" width={190} />}
            </Typography>
            <Typography variant={variant !== 'admin' ? "subtitle1" : "subtitle2"} color="text.secondary">
              {user ? user.email : <Skeleton variant="text" width={150} />}
            </Typography>
            {user && variant === 'admin' && <Typography variant="subtitle2" color="text.secondary">
              Registered At: {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
            }
          </CardContent>
        </CardActionArea>
        <CardActions>
          {variant === 'user' && <>
            {user && <Button size='small' onClick={logout}>Logout</Button>}
            {!user && <Button size='small' startIcon={<GoogleIcon />} onClick={login}>Login with Google</Button>}
          </>}
          {user && variant === 'admin' && <Chip icon={<ArticleIcon />} label={`${user.documents.length} documents`} />}
          {user && variant !== 'admin' && <IconButton size="small" aria-label="Share" onClick={handleShare} disabled={!user}>
            <ShareIcon />
          </IconButton>}
        </CardActions>
      </Box>
      {user ?
        <CardMedia
          component="img"
          sx={{ width: variant === 'admin' ? 90 : 151, flexShrink: 0 }}
          image={user.picture}
          alt={user.name}
        /> :
        <Skeleton variant="rectangular" width={variant === 'admin' ? 90 : 151} height={variant === 'admin' ? 90 : 151} />
      }
    </Card>
  );
}