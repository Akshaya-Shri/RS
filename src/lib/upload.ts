import path from 'path';

export interface ValidationResult {
  valid: boolean;
  message?: string;
  sanitizedName?: string;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

const ALLOWED_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp'
];

/**
 * Validates an uploaded file for security criteria.
 */
export function validateUploadFile(file: File): ValidationResult {
  // 1. Check file size
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      message: `File size exceeds the maximum limit of 5MB. Got ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    };
  }

  // 2. Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Invalid file type: ${file.type || 'unknown'}. Only PNG, JPG, JPEG, and WEBP images are allowed.`
    };
  }

  // 3. Validate file extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      message: `Invalid file extension: ${ext}. Only .png, .jpg, .jpeg, and .webp files are allowed.`
    };
  }

  // 4. Detect double extensions (e.g., shell.php.jpg or malicious.js.png)
  const baseName = file.name.slice(0, file.name.length - ext.length);
  const secondExt = path.extname(baseName).toLowerCase();
  if (secondExt !== '' && secondExt !== '.') {
    // If the part before the final extension still has an extension format (e.g., .php, .js)
    return {
      valid: false,
      message: 'Malicious upload attempt: Double extensions are not allowed.'
    };
  }

  // 5. Sanitize the filename to prevent directory traversal and special chars
  // Remove anything except letters, numbers, dots, hyphens, and underscores
  const cleanName = baseName.replace(/[^a-zA-Z0-9.\-_]/g, '').replace(/\s+/g, '-');
  if (!cleanName) {
    return {
      valid: false,
      message: 'Invalid filename after sanitization.'
    };
  }

  const sanitizedName = `${cleanName}${ext}`;

  return {
    valid: true,
    sanitizedName
  };
}
