"use client"
import { GitHub } from '@mui/icons-material';
import packageJson from '../../package.json';
import { Box, Typography, Link } from '@mui/material';
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
          <GitHub fontSize="inherit" sx={{ ml: 0.5, verticalAlign: "middle" }} /> {commitHash?.substring(0, 7)}
        </Link>}
      </Typography>
      <Link component={RouterLink} prefetch={false} href="/privacy" sx={{ textDecoration: "none" }}>Privacy Policy</Link>
    </Box>
  )
}

export default Footer;