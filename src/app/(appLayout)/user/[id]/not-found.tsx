import SplashScreen from '@/components/SplashScreen'
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: 'User not found',
}

const page = () => <SplashScreen title="User not found" />;

export default page;