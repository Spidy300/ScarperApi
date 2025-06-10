import { randomBytes } from 'crypto';

export function generateApiKey(): string {
  const prefix = 'ak';
  const randomPart = randomBytes(24).toString('hex');
  return `${prefix}_${randomPart}`;
}
