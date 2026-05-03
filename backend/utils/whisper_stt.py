import os
import shutil
import threading
import wave

import numpy as np
import torch
import whisper
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_model = None
_model_lock = threading.Lock()
_loaded_model_name: str | None = None

if not shutil.which("ffmpeg"):
    print(
        "INFO: ffmpeg not on PATH. Browser recordings are sent as WAV from the frontend; "
        "non-WAV uploads still use Whisper's decoder which may require ffmpeg."
    )

# Urdu-heavy civic context helps decoding (Roman Urdu / mixed included)
_WHISPER_PROMPT = (
    "Islamabad civic complaint. Urdu: پانی، نالی، سڑک، کوڑا، سیوریج، شکایت۔ "
    "English: water, sewage, road, garbage, drain, complaint."
)


def _model_name() -> str:
    return (os.getenv("WHISPER_MODEL") or "small").strip() or "small"


def _language_kw() -> str | None:
    """Return Whisper language code, or None for auto-detect."""
    raw = (os.getenv("WHISPER_LANGUAGE") or "ur").strip().lower()
    if raw in ("", "auto", "none", "detect"):
        return None
    return raw


def _get_model():
    global _model, _loaded_model_name
    name = _model_name()
    with _model_lock:
        if _model is None or _loaded_model_name != name:
            print(f"Loading Whisper model '{name}' (first use or model changed)...")
            _model = whisper.load_model(name)
            _loaded_model_name = name
            print("Whisper model loaded.")
        return _model


def _load_wav_mono_float32_16k(path: str) -> np.ndarray:
    """Load WAV without ffmpeg (PCM 8/16/32-bit, mono or stereo)."""
    with wave.open(path, "rb") as wf:
        sr = wf.getframerate()
        nch = wf.getnchannels()
        sw = wf.getsampwidth()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)

    if sw == 2:
        data = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    elif sw == 4:
        data = np.frombuffer(raw, dtype="<i4").astype(np.float32) / 2147483648.0
    elif sw == 1:
        data = (np.frombuffer(raw, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
    else:
        raise RuntimeError(f"Unsupported WAV sample width: {sw} bytes")

    if nch > 1:
        data = data.reshape(-1, nch).mean(axis=1)

    if sr != 16000:
        duration = len(data) / sr
        new_len = max(1, int(duration * 16000))
        x_old = np.linspace(0, len(data) - 1, num=len(data), dtype=np.float64)
        x_new = np.linspace(0, len(data) - 1, num=new_len, dtype=np.float64)
        data = np.interp(x_new, x_old, data).astype(np.float32)

    return data.astype(np.float32)


def _transcribe_kwargs():
    lang = _language_kw()
    use_fp16 = torch.cuda.is_available()
    kw: dict = {
        "task": "transcribe",
        "fp16": use_fp16,
        "initial_prompt": os.getenv("WHISPER_INITIAL_PROMPT", _WHISPER_PROMPT),
    }
    if lang:
        kw["language"] = lang
    return kw


def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio using OpenAI Whisper. WAV files are loaded in-process (no ffmpeg).
    Default: model 'small', language 'ur' (override with WHISPER_MODEL / WHISPER_LANGUAGE in .env).
    Set WHISPER_LANGUAGE=auto for full auto-detect (weaker for Urdu-only speech).
    """
    model = _get_model()
    lower = file_path.lower()
    kw = _transcribe_kwargs()

    try:
        if lower.endswith(".wav"):
            audio = _load_wav_mono_float32_16k(file_path)
            result = model.transcribe(audio, **kw)
        else:
            result = model.transcribe(file_path, **kw)

        text = (result.get("text") or "").strip()
        if not text:
            return "No speech detected. Try speaking closer to the mic or use text mode."
        return text
    except Exception as e:
        msg = str(e).lower()
        print(f"Error during transcription: {e}")
        if "ffmpeg" in msg or "winerror 2" in msg or "no such file" in msg:
            raise RuntimeError(
                "Audio decoding failed. For recordings, use the in-app recorder (sends WAV), "
                "or install ffmpeg: https://ffmpeg.org/download.html"
            ) from e
        raise
