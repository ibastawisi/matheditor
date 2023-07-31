"use client"
import { PropsWithChildren, lazy } from 'react';
import SplashScreen from "./SplashScreen";
import { usePathname } from "next/navigation";

const NewDocument = lazy(() => import('@/components/NewDocument'));
const EditDocument = lazy(() => import('@/components/EditDocument'));

const Fallback: React.FC<PropsWithChildren> = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/new")) return <NewDocument />;
  if (pathname.startsWith("/edit")) return <EditDocument />;
  return <SplashScreen title='You are offline' />
}

export default Fallback;