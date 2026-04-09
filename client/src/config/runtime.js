const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const readEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getApiBaseUrl = () => {
  const apiUrl = readEnv('VITE_API_URL');
  return apiUrl ? trimTrailingSlash(apiUrl) : '/api';
};

export const getSocketUrl = () => {
  const socketUrl = readEnv('VITE_SOCKET_URL');
  if (socketUrl) {
    return trimTrailingSlash(socketUrl);
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
