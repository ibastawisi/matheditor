import { generateServerHtml } from "@/editor/utils/generateServerHtml";
import { findRevisionById } from "@/repositories/revision";
import { unstable_cache } from "next/cache";

const getRevisionHtml = async (id: string) => {
  const revision = await findRevisionById(id);
  if (!revision) return '';
  const data = revision.data;
  const html = await generateServerHtml(data);
  return html;
}

const findRevisionHtml = unstable_cache(getRevisionHtml, [], { tags: ["html"] });

const getRevisionThumbnail = async (id: string) => {
  const revision = await findRevisionById(id);
  if (!revision) return '';
  const data = revision.data;
  const thumbnail = await generateServerHtml({ ...data, root: { ...data.root, children: data.root.children.slice(0, 5) } });
  return thumbnail;
}

const findRevisionThumbnail = unstable_cache(getRevisionThumbnail, [], { tags: ["thumbnail"] });

export {
  findRevisionHtml,
  findRevisionThumbnail,
};