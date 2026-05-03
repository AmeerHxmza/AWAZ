/**
 * Decode browser-recorded or uploaded audio to mono 16 kHz PCM WAV for Whisper
 * (avoids requiring ffmpeg on the server for WebM/MP4 from the mic).
 */

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);
  return new Blob([buffer], { type: 'audio/wav' });
}

function toMono(audioBuffer: AudioBuffer): Float32Array {
  const n = audioBuffer.numberOfChannels;
  const len = audioBuffer.length;
  const out = new Float32Array(len);
  for (let c = 0; c < n; c++) {
    const ch = audioBuffer.getChannelData(c);
    for (let i = 0; i < len; i++) out[i] += ch[i] / n;
  }
  return out;
}

function resampleLinear(input: Float32Array, inputSr: number, targetSr: number): Float32Array {
  if (inputSr === targetSr) return input;
  const ratio = inputSr / targetSr;
  const outLen = Math.max(1, Math.floor(input.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const x = i * ratio;
    const x0 = Math.floor(x);
    const x1 = Math.min(x0 + 1, input.length - 1);
    const frac = x - x0;
    out[i] = input[x0] * (1 - frac) + input[x1] * frac;
  }
  return out;
}

/** Decode any format the browser can decode; output mono 16 kHz WAV. */
export async function audioBlobToWav16kMono(blob: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  try {
    const audioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    const mono = toMono(audioBuffer);
    const resampled = resampleLinear(mono, audioBuffer.sampleRate, 16000);
    return encodeWav(resampled, 16000);
  } finally {
    await ctx.close();
  }
}
