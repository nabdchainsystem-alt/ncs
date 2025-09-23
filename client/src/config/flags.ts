const rawStrictFlag = String(import.meta.env.VITE_STRICT_API_ONLY ?? '0').toLowerCase();
export const STRICT_API_ONLY = rawStrictFlag === '1' || rawStrictFlag === 'true';
