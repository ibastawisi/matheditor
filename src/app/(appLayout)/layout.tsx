import AppLayout from "@/components/Layout/AppLayout";
import Script from "next/script";

const PUBLISHER_ID = process.env.NEXT_PUBLIC_PUBLISHER_ID;

export default function Layout({ children }: { children: React.ReactNode }) {
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