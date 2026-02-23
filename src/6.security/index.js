/**
 * 6.security — public barrel
 * Re-exports the public API of the security bounded context.
 */

// Application
export { useAuthenticationStore } from './application/authentication.store.js';
export { authenticationGuard }    from './application/authentication.guard.js';

// Infrastructure
export {
    authenticationInterceptor,
    authenticationResponseInterceptor,
    authenticationErrorInterceptor,
} from './infrastructure/authentication.interceptor.js';

// Domain
export { SignInRequest }  from './domain/models/sign-in.request.js';
export { SignInResponse } from './domain/models/sign-in.response.js';
export { ROLES, AUTHORIZED_ROLES, DEFAULT_ROUTES_BY_ROLE } from './domain/constants/security.constants.js';

// Presentation
export { default as SignInView }             from './presentation/views/sign-in.vue';
export { default as AuthenticationSection }  from './presentation/components/authentication-section.vue';
