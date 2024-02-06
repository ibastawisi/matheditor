import SplashScreen from '@/components/SplashScreen'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Document not found | Math Editor',
  description: 'Document not found',
}

const page = () => <SplashScreen title="Document not found" />;

export default page;