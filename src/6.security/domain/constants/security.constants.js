/**
 * Security constants — centralized role definitions and default routes.
 * Single source of truth for all role-based logic across the application.
 */

/** All roles recognized by the system */
export const ROLES = Object.freeze({
    ADMIN: 'ADMIN',
    MASTER_ADMIN: 'MASTER_ADMIN',
    COMPANY_EMPLOYEE: 'COMPANY_EMPLOYEE',
    GERENTE_VENTAS: 'GERENTE_VENTAS',
    VENDEDOR: 'VENDEDOR',
});

/** Roles that are allowed to log in */
export const AUTHORIZED_ROLES = Object.freeze([
    ROLES.ADMIN,
    ROLES.MASTER_ADMIN,
    ROLES.COMPANY_EMPLOYEE,
    ROLES.GERENTE_VENTAS,
    ROLES.VENDEDOR,
]);

/** Default landing route per role after login */
export const DEFAULT_ROUTES_BY_ROLE = Object.freeze({
    [ROLES.ADMIN]:            '/app/admin/verification-orders',
    [ROLES.MASTER_ADMIN]:     '/app/admin/verification-orders',
    [ROLES.COMPANY_EMPLOYEE]: '/app/applicant-company/order-requests',
    [ROLES.GERENTE_VENTAS]:   '/app/sales-manager/sales-team',
    [ROLES.VENDEDOR]:         '/app/applicant-company/order-requests',
});

/** Route prefixes accessible per role segment */
export const ROUTE_ACCESS = Object.freeze({
    ADMIN_PREFIX:             '/app/admin/',
    APPLICANT_PREFIX:         '/app/applicant-company/',
    SALES_MANAGER_PREFIX:     '/app/sales-manager/',
    SIGN_IN_PREFIX:           '/sign-in',
});

/** JWT expiration warning threshold in milliseconds (5 minutes) */
export const TOKEN_EXPIRY_WARNING_MS = 5 * 60 * 1000;
