import { NextResponse } from "next/server";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";

const browserWSEndpoint = process.env.BROWSERLESS_URL;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams;
    const handle = url.pathname.split("/").pop();
    if (url.hostname === 'localhost') url.protocol = 'http:'
    url.pathname = `/embed/${handle}`;

    const browser: Browser = browserWSEndpoint
      ? await chromium.connectOverCDP(browserWSEndpoint)
      : await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url.toString(), { waitUntil: "networkidle" });
    await page.waitForFunction('document.fonts.ready');

    const options: Parameters<Page["pdf"]>[0] = {
      scale: Number(search.get("scale") || "1"),
      format: (search.get("format") || "a4"),
      landscape: search.get("landscape") === "true",
      printBackground: true,
      margin: {
        top: "0.4in",
        right: "0.4in",
        bottom: "0.4in",
        left: "0.4in",
      },
    };

    const pdf = await page.pdf(options);
    await browser.close();

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

