import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography";
import packageJson from '../../package.json';

const version = packageJson.version;

const Footer: React.FC = (props: any) => {
  return (
    <Box component="footer" sx={{ displayPrint: "none", mt: "auto", p: 0.5 }}>
      <Typography variant="body2" color="text.secondary" align="right">v{version}</Typography>
    </Box>
  )
}

export default Footer;