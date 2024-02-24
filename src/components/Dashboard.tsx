"use client"
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { Box } from "@mui/material";
import DisplayAd from './Ads/DisplayAd';

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return <Box>
    <UserCard user={user} sessionUser={user} />
    <DisplayAd sx={{ mt: 2 }} />
  </Box>;
}

export default Dashboard;
