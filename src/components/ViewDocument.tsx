import "mathlive/static.css"
import '@/editor/theme.css';
import { CloudDocument, User } from '@/types';

import dynamic from "next/dynamic";
import DisplayAd from "./Ads/DisplayAd";
import ArticleAd from "./Ads/ArticleAd";
import { Fragment } from "react";
const ViewDocumentInfo = dynamic(() => import('@/components/ViewDocumentInfo'), { ssr: false });

const ViewDocument: React.FC<React.PropsWithChildren & { cloudDocument: CloudDocument, user?: User }> = ({ cloudDocument, user, children }) => {
  return <>
    {Array.isArray(children) ? children.map((child, i) => <Fragment key={i}>{child}{i > 1 && i % 20 === 0 && <ArticleAd sx={{ my: 2 }} />}</Fragment>) : children}
    <ViewDocumentInfo cloudDocument={cloudDocument} user={user} />
    <DisplayAd sx={{ mt: 2 }} />
  </>
}

export default ViewDocument;