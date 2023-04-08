import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography";
import packageJson from '../../package.json';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer: React.FC = (props: any) => {
  const version = packageJson.version;
  const commitHash: string | undefined = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA;
  return (
    <Box component="footer" sx={{ displayPrint: "none", mt: "auto", p: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        v{version}{commitHash && <><GitHubIcon fontSize="inherit" sx={{ mx: 0.5 }} /> {commitHash?.substring(0, 7)}</>}
      </Typography>
    </Box>
  )
}

export default Footer;