/**
 * Interface del repositorio de Sales Team.
 * Define el contrato sin implementación (Puerto en Arquitectura Hexagonal).
 *
 * @interface ISalesTeamRepository
 */
export class ISalesTeamRepository {
  /**
   * Obtiene un empleado por el ID del usuario autenticado.
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getEmployeeByUserId(userId) {
    throw new Error('Method not implemented: getEmployeeByUserId');
  }

  /**
   * Obtiene todos los empleados de una marca.
   * @param {number} brandId
   * @returns {Promise<Array>}
   */
  async getEmployeesByBrandId(brandId) {
    throw new Error('Method not implemented: getEmployeesByBrandId');
  }

  /**
   * Obtiene las órdenes paginadas de un vendedor por email corporativo.
   * @param {Object} params - { corporateEmail, page, size, status?, search? }
   * @returns {Promise<{items: EmployeeOrderSummary[], totalElements: number, totalPages: number, currentPage: number, pageSize: number, totalPendiente: number, ...}>}
   */
  async findOrdersByCorporateEmailPaginated(params) {
    throw new Error('Method not implemented: findOrdersByCorporateEmailPaginated');
  }
}
