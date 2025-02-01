import { findRevisionById } from "@/repositories/revision";
import { unstable_cache } from "next/cache";

const PUBLIC_URL = process.env.PUBLIC_URL;

const getRevisionHtml = async (id: string) => {
  const revision = await findRevisionById(id);
  if (!revision) return null;
  const data = revision.data;
  const response = await fetch(`${PUBLIC_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) return null;
  const html = await response.text();
  return html;
}

const findRevisionHtml = unstable_cache(getRevisionHtml, [], { tags: ["html"] });

const getRevisionThumbnail = async (id: string) => {
  return findRevisionById(id).then((revision) => {
    if (!revision) return '';
    const data = revision.data;
    const thumbnailData = { ...data, root: { ...data.root, children: data.root.children.slice(0, 3) } };
    const thumbnail = fetch(`${PUBLIC_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thumbnailData),
    }).then((response) => response.ok ? response.text() : '');
    return thumbnail;
  });
}

const findRevisionThumbnail = unstable_cache(getRevisionThumbnail, [], { tags: ["thumbnail"] });

export {
  findRevisionHtml,
  findRevisionThumbnail,
};