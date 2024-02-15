import AppLayout from "@/components/Layout/AppLayout";
import Script from "next/script";

export default function Layout({ children }: { children: React.ReactNode }) {
  const PUBLISHER_ID = process.env.PUBLISHER_ID;
  return (
    <>
      {PUBLISHER_ID && <Script async crossOrigin="anonymous" strategy="lazyOnload"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${PUBLISHER_ID}`}
      />}
      <AppLayout>
        {children}
      </AppLayout>
    </>
  )
}