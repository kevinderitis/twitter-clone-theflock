const TOKEN_STORAGE_KEY = 'theflock.auth.token';

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredAuthToken = (token: string) => {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredAuthToken = () => {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
};
