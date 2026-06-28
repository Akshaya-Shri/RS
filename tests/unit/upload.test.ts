import { describe, it, expect } from 'vitest';
import { validateUploadFile } from '@/lib/upload';

describe('File Upload Validation Unit Tests', () => {
  it('should successfully validate a valid PNG image within size limits', () => {
    const file = new File([new Uint8Array(1000)], 'screenshot.png', { type: 'image/png' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toBe('screenshot.png');
    expect(result.message).toBeUndefined();
  });

  it('should successfully validate a valid JPG image and sanitize spaces in filename', () => {
    const file = new File([new Uint8Array(1000)], 'my payment proof.jpg', { type: 'image/jpeg' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toBe('mypaymentproof.jpg');
  });

  it('should successfully validate a valid WEBP image and strip malicious path traversal chars', () => {
    const file = new File([new Uint8Array(1000)], '../../../hack.webp', { type: 'image/webp' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(true);
    expect(result.sanitizedName).toBe('......hack.webp');
  });

  it('should fail validation if the file size exceeds the 5MB limit', () => {
    // 6MB buffer
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeBuffer], 'large_image.png', { type: 'image/png' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain('exceeds the maximum limit');
  });

  it('should fail validation if the file has an unsupported MIME type', () => {
    const file = new File([new Uint8Array(100)], 'invoice.pdf', { type: 'application/pdf' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid file type');
  });

  it('should fail validation if the file has an unsupported file extension', () => {
    const file = new File([new Uint8Array(100)], 'image.txt', { type: 'image/png' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid file extension');
  });

  it('should block double extension attacks (e.g. php code disguised as image)', () => {
    const file = new File([new Uint8Array(100)], 'malicious.php.png', { type: 'image/png' });
    const result = validateUploadFile(file);
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Double extensions are not allowed');
  });
});
