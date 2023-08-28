import puppeteer from "puppeteer";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = new URL(request.url);
    url.pathname = `/embed/${params.id}`;
    await page.goto(url.toString(), { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.4in",
        right: "0.4in",
        bottom: "0.4in",
        left: "0.4in",
      },
    });
    await browser.close();
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${params.id}.pdf"`,
      },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response("Something went wrong", { status: 500 });
  }
}
