"use client"
import { User } from '@/types';
import { useDispatch, actions, useSelector } from '@/store';
import RouterLink from 'next/link'
import { memo } from 'react';
import { signIn, signOut } from "next-auth/react";
import UserActionMenu from './UserActionMenu';
import { Card, Box, CardActionArea, CardContent, Typography, Skeleton, CardActions, Button, IconButton, Avatar } from '@mui/material';
import { Google, Share } from '@mui/icons-material';

const UserCard: React.FC<{ user?: User, sessionUser?: User }> = memo(({ user, sessionUser }) => {
  const dispatch = useDispatch();
  const login = () => signIn("google", undefined, { prompt: "select_account" });
  const logout = () => signOut();
  const initialized = useSelector(state => state.initialized);
  const showLogout = user && sessionUser && user.id === sessionUser.id;
  const showLogin = initialized && !user && !sessionUser;
  const showActions = user && sessionUser && user.id === sessionUser.id;

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
        <CardActionArea component={RouterLink} prefetch={false} scroll={false} href={href} sx={{ flex: '1 0 auto' }}>
          <CardContent>
            <Typography component="span" variant="h6" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user ? user.name : <Skeleton variant="text" width={190} />}
            </Typography>
            <Typography component="span" variant="subtitle1" color="text.secondary" sx={{ display: "block", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user ? user.email : <Skeleton variant="text" width={150} />}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions sx={{ height: 48 }}>
          {showLogout && <Button size='small' onClick={logout}>Logout</Button>}
          {showLogin && <Button size='small' startIcon={<Google />} onClick={login}>
            <Typography variant="button" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Login with Google</Typography>
          </Button>}
          <Box sx={{ ml: 'auto' }}>
            {showActions && <UserActionMenu user={user} />}
            {user && <IconButton size="small" aria-label="Share" onClick={handleShare}><Share /></IconButton>}
          </Box>
        </CardActions>
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