import { useAuthenticationStore } from '../application/authentication.store.js';
import { TOKEN_EXPIRY_WARNING_MS } from '../domain/constants/security.constants.js';

/**
 * REQUEST INTERCEPTOR
 * Attaches the Bearer token to every outgoing request.
 * Also validates JWT expiration client-side BEFORE sending the request.
 * NOTE: This only reads the payload (no signature verification — that is the backend's responsibility).
 *
 * @param {import('axios').InternalAxiosRequestConfig} config
 * @returns {import('axios').InternalAxiosRequestConfig | Promise<never>}
 */
export const authenticationInterceptor = (config) => {
    const authStore = useAuthenticationStore();

    if (!authStore.isSignedIn) {
        return config;
    }

    const token = authStore.currentToken;

    try {
        const base64Url = token.split('.')[1];
        const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload   = JSON.parse(window.atob(base64));
        const expiresAt = payload.exp * 1000;
        const now       = Date.now();

        if (now >= expiresAt) {
            authStore.signOut();
            return Promise.reject(new Error('Token expirado'));
        }

        if (now >= expiresAt - TOKEN_EXPIRY_WARNING_MS) {
            authStore.signOut();
            return Promise.reject(new Error('Token próximo a expirar'));
        }

        config.headers.Authorization = `Bearer ${token}`;
    } catch {
        authStore.signOut();
        return Promise.reject(new Error('Token inválido'));
    }

    return config;
};

/**
 * RESPONSE INTERCEPTOR — success path.
 * Passes through successful responses without modification.
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {import('axios').AxiosResponse}
 */
export const authenticationResponseInterceptor = (response) => response;

/**
 * RESPONSE INTERCEPTOR — error path.
 * Handles 401/403 by signing the user out and redirecting to /sign-in.
 *
 * @param {unknown} error
 * @returns {Promise<never>}
 */
export const authenticationErrorInterceptor = (error) => {
    if (error?.response) {
        const { status } = error.response;
        const authStore  = useAuthenticationStore();

        if ((status === 401 || status === 403) && authStore.isSignedIn) {
            // Clear state directly (avoid calling signOut to prevent circular redirect loops)
            authStore.signedIn    = false;
            authStore.userId      = 0;
            authStore.username    = '';
            authStore.roles       = [];
            authStore.specificRole = '';

            localStorage.clear();
            sessionStorage.clear();

            if (window.location.pathname !== '/sign-in') {
                const message = encodeURIComponent('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = `/sign-in?error=session-expired&message=${message}`;
            }
        }
    }

    return Promise.reject(error);
};
