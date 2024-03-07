import "mathlive/static.css"
import '@/editor/theme.css';
import { CloudDocument, User } from '@/types';
import dynamic from "next/dynamic";

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });
const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument, user?: User }> = ({ cloudDocument, user, children }) => {
  return <>
    {children}
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
    <DisplayAd sx={{ mt: 'auto' }} />
  </>
}

export default ViewDocument;