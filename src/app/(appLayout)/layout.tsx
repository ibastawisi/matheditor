import AppLayout from "@/components/Layout/AppLayout";
import Script from "next/script";

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;
const PUBLISHER_ID = process.env.PUBLISHER_ID;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {IS_VERCEL && PUBLISHER_ID && <Script async crossOrigin="anonymous" strategy="lazyOnload"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUBLISHER_ID}`}
      />}
      <AppLayout>
        {children}
      </AppLayout>
    </>
  )
}