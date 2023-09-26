"use client"
import packageJson from '../../package.json';
import { Box, Typography, Link } from '@mui/material';
import RouterLink from "next/link";

const Footer: React.FC = () => {
  const version = packageJson.version;
  const commitHash: string | undefined = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  const href = `https://github.com/ibastawisi/matheditor${commitHash ? '/commit/' + commitHash.substring(0, 7) : '/'}`;
  return (
    <Box component="footer" sx={{ display: "flex", displayPrint: "none", mt: "auto", p: 1, gap: 1 }}>
      <Typography variant="button" component={Link} href={href} target="_blank" sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
        v{version} {commitHash?.substring(0, 7)}
      </Typography>
      <Typography variant="button">
        <Link component={RouterLink} prefetch={false} href="/privacy" sx={{ textDecoration: "none" }}>Privacy Policy</Link>
      </Typography>
    </Box>
  )
}

export default Footer;