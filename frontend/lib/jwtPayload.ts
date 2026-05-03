/**
 * Decode JWT payload without verification (client / Edge middleware).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segments = token.split('.');
    if (segments.length < 2) return null;
    let base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
