import axios from 'axios';

const LOCAL_IP = '10.239.167.139';
const BASE_DOMAIN = 'play1.tnhappykids.in';

const IS_LOCAL = false;

const API_URL = IS_LOCAL
  ? `http://${LOCAL_IP}:8000/api`
  : `https://${BASE_DOMAIN}/api`;


export const DEFAULT_AVATAR = IS_LOCAL
  ? `http://${LOCAL_IP}:8000/icon.png`
  : `https://${BASE_DOMAIN}/icon.png`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Resolves a media path to a full URL.
 * Handles:
 * - Full URLs (http/https)
 * - Base64 strings
 * - Relative paths (announcements/img.jpg)
 * - Paths with storage/ prefix
 */
export const getMediaUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Normalize: remove leading slashes and handle backslashes
  const clean = path.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  
  const baseStorageUrl = IS_LOCAL
    ? `http://${LOCAL_IP}:8000/storage`
    : `https://${BASE_DOMAIN}/storage`;

  return `${baseStorageUrl}/${clean.replace(/^storage\//i, '')}`;
};

/**
 * Prepares a FormData object for file uploads.
 */
export const getFormData = (uri: string, name: string = 'file', type: string = 'image/jpeg') => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'upload.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';
  
  // @ts-ignore
  formData.append(name, {
    uri,
    name: filename,
    type: type.includes('/') ? type : `image/${ext}`,
  });
  
  return formData;
};

let onUnauthorized: (() => void) | null = null;
let unauthorizedFired = false;

export const setOnUnauthorized = (cb: (() => void) | null) => {
  onUnauthorized = cb;
  if (!cb) unauthorizedFired = false;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !unauthorizedFired) {
      unauthorizedFired = true;
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
