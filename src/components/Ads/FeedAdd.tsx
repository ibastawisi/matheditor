"use client";
import useOnlineStatus from '@/hooks/useOnlineStatus';
import { Card } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { memo, useEffect } from 'react';

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;

const FeedAd: React.FC<{ sx?: SxProps<Theme> }> = memo(({ sx }) => {
  const isOnline = useOnlineStatus();
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  if (!IS_VERCEL || !isOnline) return null;

  return <Card variant="outlined" sx={{ display: "flex", displayPrint: "none", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "100%", ...sx }}>
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-format="fluid"
      data-ad-layout-key="-fb+5w+4e-db+86"
      data-ad-client="ca-pub-5688177297424594"
      data-ad-slot="3656402262"
    />
  </Card>
});

export default FeedAd;