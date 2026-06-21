const encoder = new TextEncoder();

function toBase64Url(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface SessionPayload {
  username: string;
  expiresAt: number;
}

/**
 * Generates a signed session token.
 */
export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const payloadStr = toBase64Url(btoa(JSON.stringify(payload)));
  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadStr)
  );
  
  // Convert signature array buffer to base64url string
  const sigBytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < sigBytes.byteLength; i++) {
    binary += String.fromCharCode(sigBytes[i]);
  }
  const sigStr = toBase64Url(btoa(binary));
  
  return `${payloadStr}.${sigStr}`;
}

/**
 * Verifies a signed session token and returns the payload if valid.
 */
export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, sigStr] = parts;
    const key = await getCryptoKey(secret);
    
    // Decode signature
    const sigBinary = atob(fromBase64Url(sigStr));
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(payloadStr)
    );
    
    if (!isValid) return null;
    
    // Decode and parse payload
    const payloadJson = atob(fromBase64Url(payloadStr));
    const payload = JSON.parse(payloadJson) as SessionPayload;
    
    // Verify expiration
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
