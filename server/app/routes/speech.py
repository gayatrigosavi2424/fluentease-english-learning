from fastapi import APIRouter, UploadFile, File
import whisper
import os

router = APIRouter()
model = whisper.load_model("base")  # You can use 'tiny', 'base', 'small'

@router.post("/speech")
async def transcribe_audio(file: UploadFile = File(...)):
    temp_file_path = "temp_audio.wav"
    
    with open(temp_file_path, "wb") as f:
        f.write(await file.read())

    try:
        result = model.transcribe(temp_file_path)
        os.remove(temp_file_path)
        return {"transcript": result["text"]}
    except Exception as e:
        os.remove(temp_file_path)
        return {"transcript": "Could not transcribe audio."}
