import { NextResponse } from "next/server";
import puppeteer, { PDFOptions } from "puppeteer";

const PUBLIC_URL = process.env.PUBLIC_URL;

export async function GET(request: Request) {
  try {
    if (!PUBLIC_URL) return NextResponse.json({ error: { title: "Something went wrong", subtitle: "Please set up the environment variable PUBLIC_URL" }, }, { status: 500 });
    const url = new URL(request.url);
    const search = url.searchParams;
    const handle = url.pathname.split("/").pop();
    url.hostname = PUBLIC_URL;
    url.pathname = `/embed/${handle}`;
    const browser = await puppeteer.launch();
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
