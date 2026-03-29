import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { ApiErrors } from '@/lib/api/errors';
import { serverEnv } from '@/lib/env';

const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const raw = serverEnv.KIT_SYNC_ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw ApiErrors.internal('KIT Sync ist noch nicht vollständig konfiguriert.');
  }
  return createHash('sha256').update(raw).digest();
}

export function encryptKitSecret(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptKitSecret(payload: string): string {
  const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split('.');
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) {
    throw ApiErrors.internal('KIT Sync Secret ist beschädigt.');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivEncoded, 'base64url');
  const tag = Buffer.from(tagEncoded, 'base64url');
  const encrypted = Buffer.from(encryptedEncoded, 'base64url');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
