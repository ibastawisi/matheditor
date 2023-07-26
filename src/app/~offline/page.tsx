import dynamic from "next/dynamic";
const Fallback = dynamic(() => import('@/components/Fallback'), { ssr: false });
export default Fallback;