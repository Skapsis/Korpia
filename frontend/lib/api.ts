import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

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

// Handle 401 — limpia la sesión y redirige al login
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('korpia_auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
