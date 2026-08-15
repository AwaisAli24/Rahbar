/**
 * api.js — Central API helper for Rahbar
 *
 * In development, VITE_API_URL is empty and Vite's proxy forwards /api/* to localhost:5000.
 * In production (Vercel), VITE_API_URL is set to the Render backend URL so all
 * requests go directly to https://rahbar-api.onrender.com/api/...
 */

const BASE = import.meta.env.VITE_API_URL || '';

/**
 * apiFetch(path, options)
 *
 * Wrapper around the native fetch() that:
 *  - Prepends BASE_URL to the path
 *  - Automatically attaches the stored JWT as an Authorization header
 *  - Accepts the same options as native fetch()
 *
 * @param {string} path  - e.g. '/api/auth/login'
 * @param {object} opts  - standard fetch RequestInit options
 * @returns {Promise<Response>}
 */
export function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('rahbar_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  };

  return fetch(`${BASE}${path}`, { ...opts, headers });
}
