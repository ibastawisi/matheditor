import UserNotFound from '@/components/User/UserNotFound';
import type { Metadata } from "next";

export const metadata: Metadata = {
  description: 'User not found',
}

const page = () => <UserNotFound />

export default page;