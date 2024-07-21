import { Pageview } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import UserCard from "./UserCard";

const UserNotFound: React.FC = () => {
  return (
    <>
      <UserCard />
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: 'space-between', alignItems: "center", gap: 1, mb: 1, minHeight: 40 }}>
          <Typography variant="h6" component="h2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Published Documents</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: "column", alignItems: "center", my: 5, gap: 2 }}>
          <Pageview sx={{ width: 64, height: 64, fontSize: 64 }} />
          <Typography variant="overline" component="p">User not found</Typography>
        </Box>
      </Box>
    </>
  );
}

export default UserNotFound;