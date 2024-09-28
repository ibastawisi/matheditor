import { CloudDocument, User } from '@/types';
import dynamic from "next/dynamic";

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument, user?: User }> = ({ cloudDocument, user, children }) => {
  return <>
    <div className='document-container'>{children}</div>
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
  </>
}

export default ViewDocument;