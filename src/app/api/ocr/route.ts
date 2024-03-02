const HUGGING_FACE_ACCESS_TOKEN = process.env.HUGGING_FACE_ACCESS_TOKEN;

export async function POST(req: Request) {
  const body = await req.arrayBuffer();
  const base64 = btoa(new Uint8Array(body).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  const response = await fetch(
    "https://api-inference.huggingface.co/models/Norm/nougat-latex-base",
    {
      headers: { Authorization: `Bearer ${HUGGING_FACE_ACCESS_TOKEN}` },
      method: "POST",
      body: JSON.stringify({ inputs: base64, parameters: { max_new_tokens: 800 } }),
    }
  );

  return response;
}