import axios from 'axios';

// Same-origin: las APIs viven en este mismo Next.js (sin backend separado)
const API_BASE = typeof window !== 'undefined' ? '' : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

type LogoutHandler = (() => void) | null;
let sessionLogoutHandler: LogoutHandler = null;
let sessionExpired = false;

function markSessionExpired() {
    if (sessionExpired) return;
    sessionExpired = true;
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('korpia_session_msg', 'Su sesión ha expirado');
    }
    if (sessionLogoutHandler) {
        sessionLogoutHandler();
    } else if (typeof window !== 'undefined') {
        localStorage.removeItem('korpia_auth');
        localStorage.removeItem('solvex_token');
    }
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

export function registerSessionExpirationHandler(handler: LogoutHandler) {
    sessionLogoutHandler = handler;
    sessionExpired = false;
}

// Attach JWT token to every request (para rutas autenticadas del backend)
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // El backend legacy usa solvex_token; para el nuevo flujo no hay token Bearer.
        // Si en el futuro se añade JWT al nuevo auth, se enviará aquí.
        const token = localStorage.getItem('solvex_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401/403 — limpiar sesión y redirigir
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response && [401, 403].includes(error.response.status)) {
            markSessionExpired();
        }
        return Promise.reject(error);
    }
);

export default api;
