"use client"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography";
import packageJson from '../../package.json';
import GitHubIcon from '@mui/icons-material/GitHub';
import Link from "@mui/material/Link";
import RouterLink from "next/link";

const Footer: React.FC = () => {
  const version = packageJson.version;
  const commitHash: string | undefined = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  return (
    <Box component="footer" sx={{ display: "flex", displayPrint: "none", mt: "auto", p: 1, gap: 1 }}>
      <Typography variant="button" color="text.secondary">
        v{version}
        {commitHash && <Link href={`https://github.com/ibastawisi/matheditor/commit/${commitHash?.substring(0, 7)}`} target="_blank"
          sx={{ textDecoration: "none" }}>
          <GitHubIcon fontSize="inherit" sx={{ ml: 0.5, verticalAlign: "middle" }} /> {commitHash?.substring(0, 7)}
        </Link>}
      </Typography>
      <Link component={RouterLink} prefetch={false} href="/privacy" sx={{ textDecoration: "none" }}>Privacy Policy</Link>
    </Box>
  )
}

export default Footer;