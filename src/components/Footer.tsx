import Box from "@mui/material/Box"
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import packageJson from '../../package.json';

const version = packageJson.version;

const Footer: React.FC = (props: any) => {
  return (
    <Box component="footer" sx={{ displayPrint: "none", mt: "auto", p: 0.5, display: "flex" }}>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ flexGrow: 1 }} {...props}>
        {'Copyright © '}<Link color="inherit" href="./">Math Editor</Link>{' '}{new Date().getFullYear()}{'.'}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary">v{version}</Typography>
    </Box>
  )
}

export default Footer;