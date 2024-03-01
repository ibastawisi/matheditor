import { AdminPanelSettings, Cached } from '@mui/icons-material';
import packageJson from '../../../package.json';
import { Box, Typography, Link, IconButton } from '@mui/material';
import RouterLink from "next/link";
import Script from 'next/script';

const Footer: React.FC = () => {
  const version = packageJson.version;
  const commitHash: string | undefined = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
  const href = `https://github.com/ibastawisi/matheditor${commitHash ? '/commit/' + commitHash.substring(0, 7) : '/'}`;
  return (
    <Box component="footer" sx={{ display: "flex", displayPrint: "none", mt: "auto", p: 1, gap: 1 }}>
      <Typography variant="button" component={Link} href={href} target="_blank" sx={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
        v{version} {commitHash?.substring(0, 7)}
      </Typography>
      <IconButton size="small" sx={{ width: 24, height: 24 }} aria-label="Check for updates" LinkComponent="a"
        href="javascript: if ('serviceWorker' in navigator && navigator.onLine) { navigator.serviceWorker.getRegistrations().then(registrations => { registrations.forEach(registration => registration.unregister()) }).then(() => window.location.reload());}">
        <Cached />
      </IconButton>
      <Typography variant="button">
        <Link component={RouterLink} prefetch={false} href="/privacy" sx={{ textDecoration: "none" }}>Privacy Policy</Link>
      </Typography>
      <IconButton size="small" sx={{ width: 24, height: 24 }} aria-label="Manage consent" LinkComponent="a"
        href="javascript:googlefc.callbackQueue.push(googlefc.showRevocationMessage)">
        <AdminPanelSettings />
      </IconButton>
      <Script
        id="_next-ga-init"
        dangerouslySetInnerHTML={{
          __html: `new MutationObserver(() => { document.querySelector(".google-revocation-link-placeholder")?.remove(); }).observe(document.body, { childList: true, });`
        }}
      />
    </Box>
  )
}

export default Footer;