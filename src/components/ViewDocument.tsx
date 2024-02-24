import "mathlive/static.css"
import '@/editor/theme.css';
import { CloudDocument, User } from '@/types';

import dynamic from "next/dynamic";
import DisplayAd from "./Ads/DisplayAd";
const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument, user?: User }> = ({ cloudDocument, user, children }) => {
  return <>
    {children}
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default ViewDocument;