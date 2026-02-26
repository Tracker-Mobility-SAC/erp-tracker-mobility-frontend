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
     * Obtiene las órdenes de un empleado específico.
     * TODO: Implementar cuando se defina el endpoint
     * @param {string|number} employeeId - El ID del empleado.
     * @returns {Promise} Una promesa que se resuelve con las órdenes del empleado.
     */
    getEmployeeOrders(employeeId) {
        // TODO: Reemplazar con el endpoint real cuando esté disponible
        console.log('[TODO] Implementar getEmployeeOrders para employeeId:', employeeId);
        return Promise.resolve({ data: [] });
    }

    /**
     * Obtiene el detalle de una orden específica.
     * TODO: Implementar cuando se defina el endpoint
     * @param {string|number} orderId - El ID de la orden.
     * @returns {Promise} Una promesa que se resuelve con el detalle de la orden.
     */
    getOrderDetail(orderId) {
        // TODO: Reemplazar con el endpoint real cuando esté disponible
        console.log('[TODO] Implementar getOrderDetail para orderId:', orderId);
        return Promise.resolve({ data: {} });
    }
}
