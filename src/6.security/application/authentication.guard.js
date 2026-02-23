import { useAuthenticationStore } from '../application/authentication.store.js';
import { AUTHORIZED_ROLES, ROLES } from '../domain/constants/security.constants.js';

/**
 * Authentication route guard.
 * Registered globally via router.beforeEach in router/index.js.
 *
 * Flow:
 *  1. Public routes (/sign-in) → allow immediately.
 *  2. Restore session from localStorage if Pinia state is empty.
 *  3. Not signed in → redirect to /sign-in (save intended path).
 *  4. No authorized role → sign out and redirect.
 *  5. Route requires specific roles → verify membership.
 *  6. COMPANY_EMPLOYEE without admin roles → block /app/admin/* except allowed paths.
 *  7. Allow navigation.
 *
 * @param {import('vue-router').RouteLocationNormalized} to
 * @param {import('vue-router').RouteLocationNormalized} _from
 * @param {import('vue-router').NavigationGuardNext} next
 */
export const authenticationGuard = (to, _from, next) => {
    // 1. Public routes — allow without authentication
    if (to.path.startsWith('/sign-in')) {
        return next();
    }

    try {
        const store = useAuthenticationStore();

        // 2. Restore session from localStorage on page reload
        if (!store.isSignedIn && localStorage.getItem('token')) {
            store.initialize();
        }

        // 3. Not authenticated → save intended path and redirect to login
        if (!store.isSignedIn) {
            localStorage.setItem('redirectAfterLogin', to.fullPath);
            return next({ name: 'sign-in' });
        }

        // 4. Authenticated but no authorized role → sign out
        const hasAuthorizedRole = store.currentRoles.some((r) => AUTHORIZED_ROLES.includes(r));
        if (!hasAuthorizedRole) {
            store.signOut({ push: () => {} }); // minimal router mock; redirect handled below
            return next({
                name: 'sign-in',
                query: {
                    error: 'unauthorized-role',
                    message: 'Usted no tiene permisos para acceder al sistema',
                },
            });
        }

        // 5. Route-level role check (checks all matched routes including parents)
        for (const matched of to.matched) {
            if (matched.meta?.roles?.length) {
                const allowed = matched.meta.roles.some((r) => store.currentRoles.includes(r));
                if (!allowed) {
                    return next({
                        name: 'sign-in',
                        query: {
                            error: 'access-denied',
                            message: 'No tienes permisos suficientes para acceder a esta sección',
                        },
                    });
                }
            }
        }

        // 6. COMPANY_EMPLOYEE (without admin) cannot access /app/admin/* paths
        const isCompanyEmployeeOnly =
            store.currentRoles.includes(ROLES.COMPANY_EMPLOYEE) &&
            !store.currentRoles.includes(ROLES.ADMIN) &&
            !store.currentRoles.includes(ROLES.MASTER_ADMIN);

        if (isCompanyEmployeeOnly && to.path.startsWith('/app/admin')) {
            return next({ name: 'order-requests-list' });
        }

        // 7. Allow
        return next();
    } catch {
        return next({ name: 'sign-in' });
    }
};
