/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
export const runtime = 'edge';

export interface OgMetadata {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  user?: {
    name: string;
    image: string;
    email: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const metadata = JSON.parse(decodeURIComponent(searchParams.get('metadata') as string)) as OgMetadata;
    const { title, subtitle, description, user } = metadata;
    return new ImageResponse(
      (
        <div style={{ display: "flex" }} tw="h-full w-full flex bg-white border-blue-500 border-[16px]">
          <div style={{ display: "flex" }} tw="flex flex-col justify-between w-full h-full p-20">
            <div style={{ display: "flex" }} tw="flex justify-between w-full">
              <div style={{ display: "flex" }} tw="flex flex-col w-200">
                <h1 tw="text-[64px]">{title}</h1>
                <p tw="text-[32px]">{subtitle}</p>
                <p tw="text-lg mt-0">{description}</p>
              </div>
              <img
                alt="Math Editor"
                width={200}
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 381.76 259.37'%3E%3Cpath d='M357.74,0c-55.36,.12-111.53,.06-166.9,.06-23.12,0-46.24-.01-69.36,.01-5.86,0-8.43,2.26-9.37,7.96-1.08,6.51-2.19,13.01-3.29,19.52-5.38,31.92-10.77,63.83-16.15,95.75-.71,4.22-1.43,8.43-2.14,12.65-.58,3.4-5.31,3.81-6.46,.56-.31-.87-.61-1.73-.92-2.59-1.55-4.34-4.09-6.26-8.68-6.28-16.87-.05-33.74-.15-50.61,.03v.06c-13.18,.03-23.86,10.72-23.86,23.91s10.71,23.91,23.91,23.91l18.53-.1c3.08-.15,4.32,.93,5.25,3.78,6.65,20.36,13.41,40.67,20.27,60.96,4.38,12.96,15.67,20.12,29.64,19.09,11.93-.88,22.15-10.63,24.36-23.36,1.85-10.67,3.6-21.36,5.42-32.03,8.49-49.85,17.02-99.69,25.42-149.56,.61-3.65,3.79-6.32,7.49-6.26,4.85,.08,9.71-.01,14.57-.01,60.79,0,122.09,.02,182.88,0,.17,0-.17,0,0,0,13.27,0,24.02-10.76,24.02-24.02S371.01,0,357.74,0' style='fill:%23fec929;'/%3E%3Cpath d='M94.99,71.12c-3.87-3.86-7.83-7.62-11.93-11.59,4.26-4.29,8.12-8.16,11.96-12.03,4.88-4.92,4.93-8.96,.09-13.83-6.69-6.72-13.41-13.42-20.14-20.1-5.06-5.03-8.98-5-14.11,.14-3.77,3.78-7.47,7.64-11.49,11.77-4.02-4.13-7.72-7.99-11.49-11.77-5.12-5.14-9.04-5.17-14.11-.14-6.73,6.68-13.45,13.38-20.14,20.1-4.85,4.87-4.8,8.91,.09,13.83,3.85,3.87,7.7,7.74,11.96,12.03-4.09,3.97-8.06,7.73-11.93,11.59-5.03,5.02-4.98,9,.11,14.09,6.7,6.71,13.4,13.42,20.14,20.1,4.72,4.68,8.82,4.67,13.58-.07,3.88-3.87,7.66-7.84,11.79-12.08,4.13,4.24,7.91,8.21,11.79,12.08,4.76,4.74,8.86,4.75,13.58,.07,6.74-6.68,13.44-13.38,20.14-20.1,5.09-5.1,5.14-9.07,.11-14.09Z' style='fill:%23fe5353;'/%3E%3Cpath d='M199.75,120.78c-3,0-5.36,.05-7.73-.01-4.86-.12-8.23-2.97-8.33-7.78-.21-10.72-.23-21.45,0-32.17,.11-5.06,3.62-7.88,9.04-7.92,9.37-.06,18.74-.02,28.12-.02,31.99,0,63.98,0,95.97,0,8.27,0,10.76,2.48,10.76,10.69,0,9.35,.04,18.71-.01,28.06-.03,6.32-2.87,9.11-9.16,9.16-2.6,.02-5.2,0-7.65,0-.93,1.42-.58,2.7-.58,3.9-.02,21.83,.05,43.65-.07,65.48-.02,4.21,1.45,6.99,5.15,9.1,11.92,6.8,15.85,21.19,9.22,32.99-6.59,11.71-20.59,15.79-32.67,9.07-19.02-10.58-29.13-26.96-29.55-48.67-.43-22.44-.1-44.9-.1-67.34,0-1.35,0-2.7,0-4.28h-13.95c-.83,1.45-.44,2.97-.45,4.42-.03,32.55,0,65.1-.03,97.65-.02,13.52-7.96,23.07-20.81,25.26-12.78,2.17-25.99-8.05-27.03-20.96-.16-1.99-.14-3.99-.14-5.98,0-31.93,0-63.85,0-95.78,0-1.47,0-2.93,0-4.85Z' style='fill:%231f88e4;'/%3E%3C/svg%3E" />
            </div>
            {user && <div style={{ display: "flex" }} tw="flex flex-row">
              <img
                src={user.image}
                tw="w-20 h-20 rounded-full"
                alt={user.name}
              />
              <div style={{ display: "flex" }} tw="flex flex-col pl-8">
                <div style={{ display: "flex" }} tw="text-[32px]">{user.name}</div>
                <div style={{ display: "flex" }} tw="text-[24px] text-blue-700">{user.email}</div>
              </div>
            </div>}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}