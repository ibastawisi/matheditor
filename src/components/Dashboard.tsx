"use client"
import { useSelector } from '@/store';
import UserCard from "./UserCard";
import { Box } from "@mui/material";

const Dashboard: React.FC = () => {
  const user = useSelector(state => state.user);

  return <Box>
    <UserCard user={user} sessionUser={user} />
  </Box>;
}

export default Dashboard;
