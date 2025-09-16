import type { AuthUser } from '../context/AuthContext';

const WELCOME_STORAGE_PREFIX = 'ncs_welcome_seen_';

export function welcomeStorageKey(userId: number): string {
  return `${WELCOME_STORAGE_PREFIX}${userId}`;
}

export function resolveWelcomeMessage(user: Pick<AuthUser, 'name' | 'email'>): string {
  const rawName = (user.name || '').trim();
  if (rawName) {
    const primary = rawName.split(/\s+/)[0];
    if (primary) return `Welcome, ${primary}`;
  }
  const email = (user.email || '').trim();
  if (email) {
    const prefix = email.split('@')[0];
    if (prefix) return `Welcome, ${prefix}`;
  }
  return 'Welcome!';
}
