"use client"
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { User } from '@/types';
import Button from '@mui/material/Button';
import { useSelector, useDispatch, actions } from '@/store';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import GoogleIcon from '@mui/icons-material/Google';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import RouterLink from 'next/link'
import CardActionArea from '@mui/material/CardActionArea';
import Avatar from '@mui/material/Avatar';
import { memo } from 'react';
import { signIn, signOut} from "next-auth/react";
import UserActionMenu from './UserActionMenu';

const UserCard: React.FC<{ user?: User }> = memo(({ user }) => {
  const dispatch = useDispatch();
  const login = () => signIn("google", undefined, { prompt: "select_account" });
  const logout = () => signOut();
  const initialized = useSelector(state => state.initialized);
  const sessionUser = useSelector(state => state.user);
  const showActions = user?.id === sessionUser?.id;

  const handleShare = async () => {
    const shareData = {
      title: `${user?.name}'s profile on Math Editor`,
      url: window.location.origin + "/user/" + (user?.handle || user?.id)
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.announce({ message: "Link copied to clipboard" }));
    }
  };

  const href = user ? `/user/${user.handle || user.id}` : '/dashboard';

  return (
    <Card variant='outlined' sx={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: 0, flex: 1 }}>
        <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ flex: '1 0 auto' }}>
          <CardContent>
            <Typography component="span" variant="h6" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user ? user.name : <Skeleton variant="text" width={190} />}
            </Typography>
            <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ display: "block", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user ? user.email : <Skeleton variant="text" width={150} />}
            </Typography>
          </CardContent>
        </CardActionArea>
        {initialized &&
          <CardActions sx={{ height: 48, "& button:nth-of-type(2)": { ml: "auto !important" } }}>
            {showActions && sessionUser && <Button size='small' onClick={logout}>Logout</Button>}
            {showActions && !sessionUser && <Button size='small' startIcon={<GoogleIcon />} onClick={login}>
              <Typography variant="button" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Login with Google</Typography>
            </Button>}
            {showActions && user && <UserActionMenu user={user} />}
            {user && <IconButton size="small" aria-label="Share" onClick={handleShare}><ShareIcon /></IconButton>}
          </CardActions>}
      </Box>
      <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ display: 'flex', width: 'auto' }}>
        {user ?
          <Avatar
            sx={{ width: 112, height: 112, m: 2, alignSelf: 'center', flexShrink: 0 }}
            src={user.image ?? undefined}
            alt={user.name}
          /> :
          <Skeleton variant="circular" width={112} height={112} sx={{ m: 2, alignSelf: 'center', flexShrink: 0 }} />
        }
      </CardActionArea>
    </Card>
  );
});

export default UserCard;