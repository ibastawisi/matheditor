"use client"
import { PropsWithChildren, lazy } from 'react';
import SplashScreen from "./SplashScreen";
import { usePathname } from "next/navigation";

const Home = lazy(() => import('@/components/Home'));
const NewDocument = lazy(() => import('@/components/NewDocument'));
const Privacy = lazy(() => import('@/components/Privacy'));
const Playground = lazy(() => import('@/components/Playground'));
const Tutorial = lazy(() => import('@/components/Tutorial'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const EditDocument = lazy(() => import('@/components/EditDocument'));

const Fallback: React.FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const online = (typeof navigator === "undefined" ? true : navigator.onLine) || process.env.NODE_ENV === "development";
  if (online) return children;
  if (pathname === "/new") return <NewDocument />;
  if (pathname === "/edit") return <EditDocument />;
  if (pathname === "/playground") return <Playground />;
  if (pathname === "/tutorial") return <Tutorial />;
  if (pathname === "/dashboard") return <Dashboard />;
  if (pathname === "/privacy") return <Privacy />;
  if (pathname === "/") return <Home />;
  return <SplashScreen title="You are offline" />;
}

export default Fallback;