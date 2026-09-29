import { NextResponse } from "next/server";
import puppeteer, { PDFOptions } from "puppeteer";

const browserWSEndpoint = process.env.BROWSERLESS_URL;
const PUBLIC_URL = process.env.PUBLIC_URL;

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const search = requestUrl.searchParams;
    const handle = requestUrl.pathname.split("/").pop();
    // browserless runs in its own container, so it can't reach request.url's host (localhost when self-hosted)
    const url = new URL(`/embed/${handle}${requestUrl.search}`, PUBLIC_URL || requestUrl.origin);
    if (url.hostname === 'localhost') url.protocol = 'http:'
    // local browserless runs in docker, where localhost is the container itself
    if (url.hostname === 'localhost' && browserWSEndpoint && new URL(browserWSEndpoint).hostname === 'localhost') url.hostname = 'host.docker.internal'
    const browser = browserWSEndpoint
      ? await puppeteer.connect({ browserWSEndpoint })
      : await puppeteer.launch();
    const page = await browser.newPage()
    await page.goto(url.toString(), { waitUntil: "networkidle0" });
    await page.waitForFunction('document.fonts.ready');
    const options: PDFOptions = {
      scale: Number(search.get("scale") || "1"),
      format: search.get("format") as PDFOptions["format"] || "A4",
      landscape: search.get("landscape") === "true",
      printBackground: true,
      margin: {
        top: "0.4in",
        right: "0.4in",
        bottom: "0.4in",
        left: "0.4in",
      },
    };
    const pdf = await page.pdf(options)
    await browser.close()
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${handle}.pdf"`,
      },
      status: 200
    })
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please try again later" } }, { status: 500 });
  }
}

