import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';

const SALT = Buffer.from('hardcoded-salt-is-actually-correct'); // Needed for reproducible key derivation.
const IV_LENGTH = 12; // For AES-GCM
const KEY_LENGTH = 32; // 256-bit AES

export type Key = Buffer;

export async function generateKeyFromPassword(password:string):Promise<Key> {
  return pbkdf2Sync(password, SALT, 100000, KEY_LENGTH, 'sha256');
}

export async function encryptText(key:Key, plaintext:string):Promise<Uint8Array> {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

export async function decryptText(key:Key, encrypted:Uint8Array):Promise<string> {
  const iv = encrypted.slice(0, IV_LENGTH);
  const tag = encrypted.slice(IV_LENGTH, IV_LENGTH + 16);
  const data = encrypted.slice(IV_LENGTH + 16);

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}