"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { audioBlobToWav16kMono } from '@/lib/blobToWav';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SubmitComplaint() {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'denied' | 'unavailable'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoStatus('ok');
      },
      () => {
        setGeoStatus('denied');
        setLatitude(33.6844);
        setLongitude(73.0479);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 },
    );
  }, []);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
        is_voice_input: false,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      };
      if (category) payload.category = category;
      if (photoUrl.trim()) payload.photo_url = photoUrl.trim();

      const res = await api.post('/complaints/', payload);
      router.push(`/status/${res.data.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: mime });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const ext = mime.includes('webm') ? 'webm' : 'mp4';
        await handleVoiceUpload(blob, `voice_complaint.${ext}`);
      };

      mediaRecorderRef.current.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.requestData();
      rec.stop();
    }
    setIsRecording(false);
  };

  const handleVoiceUpload = async (audioBlob: Blob, _filename: string) => {
    setIsLoading(true);
    try {
      let wavBlob: Blob;
      try {
        wavBlob = await audioBlobToWav16kMono(audioBlob);
      } catch {
        alert(
          'Could not decode this audio in the browser. Try MP3, M4A, WAV, or use the microphone recorder.',
        );
        return;
      }
      const formData = new FormData();
      formData.append('audio_file', wavBlob, 'recording.wav');

      const sttRes = await api.post('/stt/transcribe', formData);

      const transcript = sttRes.data.transcript as string;
      setDescription(transcript);
      const short = transcript.trim().slice(0, 48);
      setTitle(short.length < transcript.trim().length ? `${short}…` : short || 'Voice report');
      setMode('text');
      setIsRecording(false);
    } catch (error: unknown) {
      console.error(error);
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(
        typeof detail === 'string'
          ? detail
          : 'Failed to transcribe voice. If this persists, install ffmpeg on the machine running the API (needed for browser recordings).',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onAudioFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('File is too large. Please use a recording under 25 MB.');
      return;
    }
    await handleVoiceUpload(file, file.name);
  };

  const geoHint = () => {
    switch (geoStatus) {
      case 'loading':
        return 'Detecting your location…';
      case 'ok':
        return `Location captured (${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}).`;
      case 'denied':
        return 'Location permission denied—using Islamabad city center. You can still submit.';
      case 'unavailable':
        return 'Geolocation not available—using default coordinates.';
      default:
        return '';
    }
  };

  const tabClass = (active: boolean) =>
    `text-sm font-medium pb-2 border-b-2 transition-colors ${
      active
        ? 'text-stone-900 border-stone-900'
        : 'text-stone-500 border-transparent hover:text-stone-800'
    }`;

  return (
    <div className="max-w-2xl mx-auto surface-card p-6 md:p-8">
      <p className="mb-4">
        <Link href="/reports" className="text-sm font-medium text-stone-700 hover:text-stone-950">
          ← Back to reports
        </Link>
      </p>
      <p className="label-caps mb-2">New filing</p>
      <h2 className="text-2xl font-semibold text-stone-900 mb-2">Report a civic issue</h2>
      <p className="text-sm text-stone-600 mb-6">{geoHint()}</p>

      <div className="flex gap-8 mb-6 border-b border-stone-200">
        <button type="button" onClick={() => setMode('text')} className={tabClass(mode === 'text')}>
          Text
        </button>
        <button type="button" onClick={() => setMode('voice')} className={tabClass(mode === 'voice')}>
          Voice
        </button>
      </div>

      {mode === 'text' ? (
        <form onSubmit={handleTextSubmit} className="space-y-1">
          <Input
            label="Brief title"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            required
            placeholder="e.g. Sewage overflow near street 42"
          />
          <div className="flex flex-col mb-4">
            <label className="mb-1.5 text-[13px] font-semibold text-stone-700">
              Category (optional)
            </label>
            <select
              className="px-3 py-2.5 border border-stone-300 rounded-sm bg-white text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/15 focus-visible:border-stone-500 w-full"
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            >
              <option value="">Let AI classify from description</option>
              <option value="water">Water supply</option>
              <option value="sewage">Sewage &amp; drainage</option>
              <option value="road">Roads &amp; potholes</option>
              <option value="garbage">Garbage collection</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Input
            label="Detailed description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            required
            placeholder="What happened, where, and for how long?"
            multiline
          />
          <Input
            label="Photo URL (optional)"
            value={photoUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhotoUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
          <div className="pt-3">
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Submitting…' : 'Submit report'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 space-y-6">
          <button
            type="button"
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors border ${
              isRecording
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-stone-50 text-stone-900 border-stone-200 hover:bg-stone-100'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-pressed={isRecording}
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-stone-900">
              {isRecording ? 'Recording…' : 'Tap to record'}
            </p>
            <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Speak clearly in Urdu (or mixed Urdu/English). The transcript is tuned for civic complaints; edit it
              before submitting.
            </p>
          </div>
          {isLoading && <p className="text-sm font-medium text-stone-700">Transcribing audio…</p>}

          <div className="w-full max-w-md border-t border-stone-200 pt-8 mt-4">
            <p className="text-sm font-medium text-stone-800 mb-2 text-center">Or upload audio</p>
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <span className="text-sm text-stone-600 text-center">
                MP3, M4A, WAV, or a voice memo — we convert it and fill the form.
              </span>
              <input
                type="file"
                accept="audio/*,.webm,.weba"
                className="text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-sm file:border file:border-stone-300 file:bg-white file:text-sm file:font-medium hover:file:bg-stone-50"
                onChange={onAudioFileSelected}
                disabled={isLoading}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
