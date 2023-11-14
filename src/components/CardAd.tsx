"use client";
import useOnlineStatus from '@/hooks/useOnlineStatus';
import { Card } from '@mui/material';
import { useEffect } from 'react';

const CardAd = () => {

  const isProduction = process.env.NODE_ENV === "production";
  const isOnline = useOnlineStatus();
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.log(err);
    }
  }, []);

  if (!isProduction || !isOnline) return null;

  return <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "100%" }}>
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-format="fluid"
      data-ad-layout-key="-h1-1a+45-3f+c"
      data-ad-client="ca-pub-5688177297424594"
      data-ad-slot="6477290777"
    />
  </Card>
};

export default CardAd;