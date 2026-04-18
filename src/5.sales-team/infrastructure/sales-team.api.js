import { BaseApi } from "../../shared-v2/infrastructure/base-api.js";

const employeeEndpointPath = '/company-employees';

/**
 * Servicio API para gestionar recursos del equipo de ventas.
 * Proporciona operaciones para obtener empleados por usuario y por marca.
 * 
 * @class SalesTeamApi
 * @extends {BaseApi}
 */
export class SalesTeamApi extends BaseApi {

    constructor() {
        super();
    }

    /**
     * Obtiene un empleado de empresa por ID de usuario.
     * @param {string|number} userId - El ID del usuario.
     * @returns {Promise} Una promesa que se resuelve con los datos del empleado.
     */
    getEmployeeByUserId(userId) {
        return this.http.get(`${employeeEndpointPath}/user/${userId}`);
    }

    /**
     * Obtiene todos los empleados de una marca específica.
     * @param {string|number} brandId - El ID de la marca.
     * @returns {Promise} Una promesa que se resuelve con la lista de empleados de la marca.
     */
    getEmployeesByBrandId(brandId) {
        return this.http.get(`${employeeEndpointPath}/brand/${brandId}`);
    }

    /**
     * Obtiene las órdenes paginadas de un ejecutivo por su email corporativo.
     * GET /web/orders/corporateEmail/{corporateEmail}/paginated
     * @param {Object} params
     * @param {string} params.corporateEmail - Email corporativo del ejecutivo (vendedor)
     * @param {number} [params.page=0] - Página (0-indexed)
     * @param {number} [params.size=10] - Elementos por página
     * @param {string} [params.status] - Filtro por estado
     * @param {string} [params.search] - Búsqueda por orderCode, clientName o phoneNumber
     * @returns {Promise}
     */
    getOrdersByCorporateEmailPaginated({ corporateEmail, page = 0, size = 10, status, search } = {}) {
        const params = { page, size };
        if (status) params.status = status;
        if (search?.trim()) params.search = search.trim();
        return this.http.get(
            `/web/orders/corporateEmail/${encodeURIComponent(corporateEmail)}/paginated`,
            { params }
        );
    }
}
