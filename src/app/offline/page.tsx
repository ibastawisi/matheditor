import SplashScreen from "@/components/SplashScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: 'You are offline',
}

const page = () => <SplashScreen title="You are offline" subtitle="Please check your connection" />;

export default page;