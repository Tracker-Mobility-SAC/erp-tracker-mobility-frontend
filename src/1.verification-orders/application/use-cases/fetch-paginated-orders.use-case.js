/**
 * Caso de uso: Obtener órdenes paginadas.
 * Application Layer — orquesta repositorio y manejo de errores.
 */
export class FetchPaginatedOrdersUseCase {
  #repository;
  #errorHandler;

  /**
   * @param {IOrderRepository} repository
   * @param {VerificationOrderErrorHandler} errorHandler
   */
  constructor(repository, errorHandler) {
    this.#repository    = repository;
    this.#errorHandler  = errorHandler;
  }

  /**
   * Ejecuta la consulta paginada de órdenes.
   * @param {Object} params - { page, size, status?, search? }
   * @returns {Promise<{success: boolean, data?: {items, totalElements, totalPages, currentPage, pageSize}, message?: string, code?: string}>}
   */
  async execute({ page = 0, size = 10, status, search } = {}) {
    try {
      const data = await this.#repository.findPaginated({ page, size, status, search });
      return {
        success: true,
        data,
        message: `${data.totalElements} orden${data.totalElements !== 1 ? 'es' : ''} encontrada${data.totalElements !== 1 ? 's' : ''}`,
        code: 'SUCCESS',
      };
    } catch (error) {
      return this.#errorHandler.handle(error, 'cargar las órdenes');
    }
  }
}
