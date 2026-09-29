import io

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pix2text import LatexOCR

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

latex_ocr = LatexOCR()


@app.post("/pix2text")
async def pix2text(file: UploadFile = File(...)):
    image = Image.open(io.BytesIO(await file.read())).convert("RGB")
    result = latex_ocr.recognize(image)
    return {"generated_text": result["text"]}
