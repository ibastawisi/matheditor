"use client"
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { Box } from "@mui/material";
import dynamic from "next/dynamic";

const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return <>
    <Box sx={{ flex: 1 }}>
      <UserCard user={user} sessionUser={user} />
    </Box>
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default Dashboard;
