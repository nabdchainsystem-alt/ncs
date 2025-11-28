export const getApiUrl = (): string => {
    // Prioritize environment variable (injected by Vite Dev) over static config
    return import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window as any).appConfig?.apiUrl) || "http://localhost:3001";
};

export const getCompanyName = (): string => {
    return import.meta.env.VITE_COMPANY_NAME || "Nabd Chain System";
};

export const getLogoUrl = (): string | null => {
    return import.meta.env.VITE_LOGO_URL || null;
};
