const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const readEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getApiBaseUrl = () => {
  const apiUrl = readEnv('VITE_API_URL');
  
  // Use explicit API URL if provided
  if (apiUrl) {
    return trimTrailingSlash(apiUrl);
  }
  
  // Fallback for local development
  return '/api';
};

export const getSocketUrl = () => {
  const socketUrl = readEnv('VITE_SOCKET_URL');
  if (socketUrl) {
    return trimTrailingSlash(socketUrl);
  }

  // On Vercel production, use the Render backend directly
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return 'https://dev-collab-platform-eme5.onrender.com';
  }

  const apiUrl = readEnv('VITE_API_URL');
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      return undefined;
    }
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }

  return undefined;
};
