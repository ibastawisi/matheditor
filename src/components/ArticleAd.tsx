"use client";
import useOnlineStatus from '@/hooks/useOnlineStatus';
import { useEffect } from 'react';

const ArticleAd = () => {
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

  return <ins className="adsbygoogle"
    style={{ display: "block", textAlign: "center" }}
    data-ad-layout="in-article"
    data-ad-format="fluid"
    data-ad-client="ca-pub-5688177297424594"
    data-ad-slot="9827462558"
  />
};

export default ArticleAd;