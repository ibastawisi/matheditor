import type { Metadata } from "next";
import Privacy from "../../components/Privacy";

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Math Editor Privacy Policy',
}

const page = () => <Privacy />;

export default page;