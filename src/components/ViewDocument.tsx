import "mathlive/static.css"
import '@/editor/theme.css';
import { CloudDocument, User } from '@/types';
import { Fragment } from "react";
import dynamic from "next/dynamic";

const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });
const DisplayAd = dynamic(() => import('@/components/Ads/DisplayAd'), { ssr: false });
const ArticleAd = dynamic(() => import('@/components/Ads/ArticleAd'), { ssr: false });

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument, user?: User }> = ({ cloudDocument, user, children }) => {
  return <>
    {Array.isArray(children) ? children.map((child, i) => <Fragment key={i}>{child}{i > 1 && i % 20 === 0 && <ArticleAd sx={{ my: 2 }} />}</Fragment>) : children}
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default ViewDocument;