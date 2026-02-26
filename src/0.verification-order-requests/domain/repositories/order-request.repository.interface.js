/**
 * Interface del repositorio de solicitudes de orden.
 * Define el contrato sin implementación (Puerto en Arquitectura Hexagonal).
 * 
 * @interface IOrderRequestRepository
 */
export class IOrderRequestRepository {
  async findAllByCorporateEmail(corporateEmail) {
    throw new Error('Method not implemented: findAllByCorporateEmail');
  }

  async findById(id) {
    throw new Error('Method not implemented: findById');
  }

  async findApplicantCompanyByUsername(username) {
    throw new Error('Method not implemented: findApplicantCompanyByUsername');
  }

  async save(command) {
    throw new Error('Method not implemented: save');
  }

  async update(command) {
    throw new Error('Method not implemented: update');
  }

  async delete(id) {
    throw new Error('Method not implemented: delete');
  }

  /**
   * Obtiene solicitudes paginadas por email corporativo del ejecutivo.
   * @param {Object} params
   * @param {string} params.corporateEmail - Email corporativo
   * @param {number} params.page - Página (0-indexed)
   * @param {number} params.size - Elementos por página
   * @param {string} [params.status] - Filtro por estado
   * @param {string} [params.search] - Búsqueda libre
   * @returns {Promise<{items: OrderRequestSummary[], totalElements: number, totalPages: number, currentPage: number, pageSize: number}>}
   */
  async findPaginatedByCorporateEmail(params) {
    throw new Error('Method not implemented: findPaginatedByCorporateEmail');
  }
}
