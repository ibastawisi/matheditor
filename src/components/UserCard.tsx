"use client"
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { AdminUser, User, UserDocument } from '@/types';
import Button from '@mui/material/Button';
import { useDispatch } from 'react-redux';
import { actions, AppDispatch } from '../store';
import CardActions from '@mui/material/CardActions';
import Skeleton from '@mui/material/Skeleton';
import GoogleIcon from '@mui/icons-material/Google';
import IconButton from '@mui/material/IconButton';
import ShareIcon from '@mui/icons-material/Share';
import RouterLink from 'next/link'
import CardActionArea from '@mui/material/CardActionArea';
import ArticleIcon from '@mui/icons-material/Article';
import Chip from "@mui/material/Chip";
import Avatar from '@mui/material/Avatar';
import { memo } from 'react';
import { signIn, signOut } from "next-auth/react";

const UserCard: React.FC<{ user?: User | AdminUser, variant?: 'user' | 'public' | 'admin', status?: 'loading' | 'authenticated' | 'unauthenticated' }> = memo(({ user, variant = 'user', status }) => {
  const dispatch = useDispatch<AppDispatch>();

  const login = () => signIn("google");
  const logout = () => signOut();

  const handleShare = async () => {
    const shareData = {
      title: `${user?.name}'s profile on Math Editor`,
      url: window.location.origin + "/user/" + user?.id
    }
    try {
      await navigator.share(shareData)
    } catch (err) {
      navigator.clipboard.writeText(shareData.url);
      dispatch(actions.announce({ message: "Link copied to clipboard" }));
    }
  };

  const href = user ? `/user/${user.id}` : '/dashboard';
  function isAdminUser(user?: User | AdminUser): user is AdminUser {
    return variant === 'admin';
  }
  const isAdmin = isAdminUser(user);

  return (
    <Card variant='outlined' sx={{ display: 'flex', justifyContent: 'space-between', height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: 0, flex: 1 }}>
        <CardActionArea component={RouterLink} prefetch={false} href={href} sx={{ flex: '1 0 auto' }}>
          <CardContent>
            <Typography variant={variant !== 'admin' ? "h6" : "subtitle1"}>
              {user ? user.name : <Skeleton variant="text" width={190} />}
            </Typography>
            <Typography variant={variant !== 'admin' ? "subtitle1" : "subtitle2"} color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user ? user.email : <Skeleton variant="text" width={150} />}
            </Typography>
            {isAdmin && <Typography variant="subtitle2" color="text.secondary">
              {new Date(user.createdAt).toLocaleString()}
            </Typography>
            }
          </CardContent>
        </CardActionArea>
        {status !== "loading" && <CardActions>
          {variant === 'user' && <>
            {user && <Button size='small' onClick={logout}>Logout</Button>}
            {!user && <Button size='small' startIcon={<GoogleIcon />} onClick={login}>Login with Google</Button>}
          </>}
          {isAdmin && <Chip icon={<ArticleIcon />} label={`${user.documents.length} documents`} />}
          {variant !== 'admin' && <IconButton size="small" aria-label="Share" onClick={handleShare} disabled={!user}><ShareIcon /></IconButton>}
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