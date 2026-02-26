import { BaseApi } from "../../shared-v2/infrastructure/base-api.js";

/**
 * Servicio API para gestionar recursos de Admin.
 * Proporciona métodos para interactuar con el endpoint de administradores.
 * 
 * @class AdminApi
 * @extends {BaseApi}
 */
export class AdminApi extends BaseApi {

    /**
     * Obtiene la información del administrador asociado a un userId.
     * @param {string|number} userId - El ID del usuario.
     * @returns {Promise} Una promesa que se resuelve con la respuesta del admin.
     */
    getAdminByUserId(userId) {
        return this.http.get(`/admins/user/${userId}`);
    }

    /**
     * Obtiene todos los administradores.
     * @returns {Promise} Una promesa que se resuelve con la lista de admins.
     */
    getAllAdmins() {
        return this.http.get('/admins');
    }

    /**
     * Obtiene un administrador por su ID.
     * @param {string|number} adminId - El ID del administrador.
     * @returns {Promise} Una promesa que se resuelve con la respuesta del admin.
     */
    getAdminById(adminId) {
        return this.http.get(`/admins/${adminId}`);
    }
}
