from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import shutil
import os
import tempfile

from auth.dependencies import get_current_user
from models import User
from utils.whisper_stt import transcribe_audio

router = APIRouter()

ALLOWED_SUFFIXES = (".wav", ".mp3", ".ogg", ".m4a", ".webm", ".mp4")


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    name = audio_file.filename or ""
    lower = name.lower()
    if not any(lower.endswith(ext) for ext in ALLOWED_SUFFIXES):
        raise HTTPException(status_code=400, detail="Unsupported file format")

    temp_path = None
    try:
        suffix = os.path.splitext(name)[1] or ".wav"
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, "wb") as f:
            shutil.copyfileobj(audio_file.file, f)

        transcript = transcribe_audio(temp_path)
        return {"transcript": transcript}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
