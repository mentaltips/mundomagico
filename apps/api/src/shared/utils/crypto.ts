import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length is 12 bytes

const getEncryptionKey = (): Buffer => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production.');
    }
    console.warn('[Crypto] Warning: ENCRYPTION_KEY environment variable is not defined. Using fallback weak key in non-production only.');
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }
  
  try {
    const key = Buffer.from(keyHex.trim(), 'hex');
    if (key.length !== 32) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Invalid ENCRYPTION_KEY length: expected 32 bytes (64 hex chars), got ${key.length} bytes.`);
      }
      console.warn(`[Crypto] Invalid ENCRYPTION_KEY length: expected 32 bytes (64 hex chars), got ${key.length} bytes. Using fallback weak key in non-production only.`);
      return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
    }
    return key;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.error('[Crypto] Error parsing ENCRYPTION_KEY. Falling back to default weak key in non-production only.', err);
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }
};

export function encrypt(text: string): string {
  if (!text) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedText
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  // If not in the format iv:authTag:encryptedText, it might be unencrypted legacy data
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    return encryptedText; // Fallback to returning raw text for legacy compatibility
  }
  
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encryptedHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Decryption failed, returning input:', err);
    // If decryption fails, it could be legacy unencrypted data that happens to contain colons
    return encryptedText;
  }
}
