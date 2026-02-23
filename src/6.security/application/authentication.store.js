import { defineStore } from 'pinia';
import { AuthenticationApi } from '../infrastructure/authentication.api.js';
import { SignInResponse } from '../domain/models/sign-in.response.js';
import {
    AUTHORIZED_ROLES,
    DEFAULT_ROUTES_BY_ROLE,
    ROUTE_ACCESS,
    ROLES,
} from '../domain/constants/security.constants.js';

const authApi = new AuthenticationApi();

/**
 * Authentication Store
 * Application layer — manages authentication state and session lifecycle.
 */
export const useAuthenticationStore = defineStore('authentication', {
    // ─────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────
    state: () => ({
        signedIn:     false,
        userId:       0,
        username:     '',
        roles:        [],
        specificRole: '',
    }),

    // ─────────────────────────────────────────────────────────────────────
    // GETTERS
    // ─────────────────────────────────────────────────────────────────────
    getters: {
        isSignedIn:         (s) => s.signedIn,
        currentUserId:      (s) => s.userId,
        currentUsername:    (s) => s.username,
        currentRoles:       (s) => s.roles,
        /** Primary role — first entry in the roles array. @deprecated Prefer currentRoles. */
        currentRole:        (s) => s.roles[0] || '',
        currentSpecificRole:(s) => s.specificRole || s.roles[0] || '',

        /**
         * Token is stored in localStorage so it survives page reloads.
         * It is NOT kept in Pinia state to avoid accidental logging/serialization.
         */
        currentToken: () => localStorage.getItem('token'),

        hasRole:    (s) => (role)  => s.roles.includes(role),
        hasAnyRole: (s) => (roles) => roles.some((r) => s.roles.includes(r)),
    },

    // ─────────────────────────────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────────────────────────────
    actions: {
        /**
         * Sign in — clears any previous session, calls the API, persists the
         * new session to localStorage, and redirects according to role.
         *
         * @param {import('../domain/models/sign-in.request.js').SignInRequest} signInRequest
         * @param {import('vue-router').Router} router
         * @returns {Promise<SignInResponse>}
         */
        async signIn(signInRequest, router) {
            // 1. Clean up any residual session before starting a new one
            this._clearState();
            this._clearStorage();
            this._resetOtherStores();

            try {
                const response = await authApi.signIn(signInRequest);

                const signInResponse = new SignInResponse(
                    response.data.userId,
                    response.data.username,
                    response.data.token,
                    response.data.roles,
                );

                // 2. Persist to Pinia state
                this.signedIn     = true;
                this.userId       = signInResponse.userId;
                this.username     = signInResponse.username;
                this.roles        = signInResponse.roles;
                this.specificRole = this._resolveSpecificRole(signInResponse.roles);

                // 3. Persist to localStorage
                localStorage.setItem('token',    signInResponse.token);
                localStorage.setItem('userId',   signInResponse.userId);
                localStorage.setItem('username', signInResponse.username);
                localStorage.setItem('roles',    JSON.stringify(signInResponse.roles));
                localStorage.setItem('role',     this.specificRole);

                // 4. Redirect — throws if role is not authorized
                const redirectError = this._redirectAfterLogin(router, signInResponse.roles);
                if (redirectError) throw new Error(redirectError.message);

                return signInResponse;
            } catch (error) {
                this.signedIn = false;
                throw error;
            }
        },

        /**
         * Sign out — clears all state, storage, resets every Pinia store,
         * and navigates to sign-in.
         *
         * @param {import('vue-router').Router} router
         */
        async signOut(router) {
            this._clearState();
            this._clearStorage();
            this._resetOtherStores();
            router.push({ name: 'sign-in' });
        },

        /**
         * Restore session from localStorage (called by the route guard on page reload).
         */
        initialize() {
            const token        = localStorage.getItem('token');
            const userId       = localStorage.getItem('userId');
            const username     = localStorage.getItem('username');
            const rolesStr     = localStorage.getItem('roles');
            const specificRole = localStorage.getItem('role');

            if (token && userId && username) {
                this.signedIn     = true;
                this.userId       = parseInt(userId, 10);
                this.username     = username;
                this.specificRole = specificRole || '';

                try {
                    this.roles = rolesStr ? JSON.parse(rolesStr) : [];
                } catch {
                    this.roles = [];
                }
            }
        },

        // ── Private helpers ──────────────────────────────────────────────

        _clearState() {
            this.signedIn     = false;
            this.userId       = 0;
            this.username     = '';
            this.roles        = [];
            this.specificRole = '';
        },

        _clearStorage() {
            localStorage.clear();
            sessionStorage.clear();
        },

        _resetOtherStores() {
            try {
                const pinia = this.$pinia;
                if (pinia?._s) {
                    pinia._s.forEach((store, name) => {
                        if (name !== 'authentication' && typeof store.$reset === 'function') {
                            store.$reset();
                        }
                    });
                }
            } catch {
                // Non-critical — continue regardless
            }
        },

        _resolveSpecificRole(roles) {
            return roles.find((r) => r !== ROLES.COMPANY_EMPLOYEE) || roles[0] || '';
        },

        /**
         * Redirect logic after a successful sign-in.
         * @returns {{ error: true, message: string } | null}
         */
        _redirectAfterLogin(router, userRoles) {
            const hasAuthorized = userRoles.some((r) => AUTHORIZED_ROLES.includes(r));

            if (!hasAuthorized) {
                this._clearState();
                return {
                    error: true,
                    message: 'Su rol no tiene permisos para acceder al sistema.',
                };
            }

            const savedPath = localStorage.getItem('redirectAfterLogin');

            if (savedPath) {
                localStorage.removeItem('redirectAfterLogin');
                if (this.isRouteAccessibleForRoles(savedPath, userRoles)) {
                    router.push(savedPath);
                    return null;
                }
            }

            // Determine default route
            let targetRole;
            if (userRoles.includes(ROLES.COMPANY_EMPLOYEE)) {
                targetRole = userRoles.find((r) => r !== ROLES.COMPANY_EMPLOYEE) || ROLES.COMPANY_EMPLOYEE;
            } else {
                targetRole = userRoles.find((r) => AUTHORIZED_ROLES.includes(r));
            }

            router.push(DEFAULT_ROUTES_BY_ROLE[targetRole]);
            return null;
        },

        /**
         * Checks whether a given path is accessible for the provided roles.
         * Used by the guard and the redirect logic.
         *
         * @param {string} routePath
         * @param {string[]} userRoles
         * @returns {boolean}
         */
        isRouteAccessibleForRoles(routePath, userRoles) {
            const hasAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.MASTER_ADMIN);

            if (routePath.startsWith(ROUTE_ACCESS.ADMIN_PREFIX)) {
                const adminOnlyRoutes = [
                    ROUTE_ACCESS.ADMIN_PREFIX + 'verification-orders',
                ];
                const companyEmployeeAccess =
                    userRoles.includes(ROLES.COMPANY_EMPLOYEE) &&
                    adminOnlyRoutes.some((r) => routePath.startsWith(r));

                return hasAdmin || companyEmployeeAccess;
            }

            if (routePath.startsWith(ROUTE_ACCESS.APPLICANT_PREFIX)) {
                return (
                    userRoles.includes(ROLES.COMPANY_EMPLOYEE) ||
                    userRoles.includes(ROLES.VENDEDOR) ||
                    hasAdmin
                );
            }

            if (routePath.startsWith(ROUTE_ACCESS.SALES_MANAGER_PREFIX)) {
                return userRoles.includes(ROLES.GERENTE_VENTAS);
            }

            if (routePath.startsWith(ROUTE_ACCESS.SIGN_IN_PREFIX)) {
                return true;
            }

            return false;
        },
    },
});
