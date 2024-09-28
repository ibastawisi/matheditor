import { Pageview } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import UserCard from "./UserCard";

const UserNotFound: React.FC = () => {
  return (
    <>
      <UserCard />
      <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
        <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
        <Typography variant="overline" component="p">User not found</Typography>
      </Box>
    </>
  );
}

export default UserNotFound;