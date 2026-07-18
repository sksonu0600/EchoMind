from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
import uvicorn

# -----------------------------
# App Setup
# -----------------------------
app = FastAPI(title="AI Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# OpenAI / GPT Setup
# -----------------------------
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")  # make sure you export this
)

# -----------------------------
# Auth (Mock for now)
# -----------------------------
class AuthRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
async def login(req: AuthRequest):
    if req.username and req.password:
        return {"token": "mock-jwt-token-123"}
    return {"error": "Invalid credentials"}

# -----------------------------
# SIMPLE GPT TEXT ENDPOINT (USED NOW)
# -----------------------------
# -------- TEXT REQUEST MODEL --------
from pydantic import BaseModel

class TextRequest(BaseModel):
    text: str


# -------- TEXT ANALYSIS API --------
@app.post("/analyze-text")
async def analyze_text(req: TextRequest):
    try:
        user_text = req.text

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Explain in simple and short way."},
                {"role": "user", "content": user_text}
            ]
        )

        return {
            "status": "success",
            "answer": response.choices[0].message.content
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# -----------------------------
# MULTIMODAL ENDPOINT (FOR LATER)
# -----------------------------
@app.post("/analyze")
async def analyze_context(
    image: UploadFile = File(None),
    audio: UploadFile = File(None),
    text_prompt: str = Form(None)
):
    image_data = await image.read() if image else None
    audio_data = await audio.read() if audio else None

    # Placeholder for future (Gemini / multimodal)
    return {
        "status": "success",
        "response": "Multimodal endpoint ready. Integrate image/audio processing next."
    }
from fastapi import UploadFile, File
#-------------------------------
#trancript 
from fastapi import UploadFile, File
import tempfile
import os

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # ✅ Save incoming audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # ✅ Send file (not bytes)
        with open(tmp_path, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file
            )

        os.remove(tmp_path)

        return {"text": response.text}

    except Exception as e:
        print("TRANSCRIBE ERROR:", e)
        return {"error": str(e)}
# -----------------------------
# Root check
# -----------------------------
@app.get("/")
def root():
    return {"message": "AI Assistant API is running"}

# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)