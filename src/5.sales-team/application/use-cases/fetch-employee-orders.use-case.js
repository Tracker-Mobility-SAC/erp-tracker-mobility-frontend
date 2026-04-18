/**
 * Caso de uso: Obtener órdenes paginadas de un vendedor por email corporativo.
 * Application Layer — orquesta repositorio y manejo de errores.
 */
export class FetchEmployeeOrdersUseCase {
  #repository;
  #errorHandler;

  /**
   * @param {ISalesTeamRepository} repository
   * @param {SalesTeamErrorHandler} errorHandler
   */
  constructor(repository, errorHandler) {
    this.#repository   = repository;
    this.#errorHandler = errorHandler;
  }

  /**
   * Ejecuta la consulta paginada de órdenes de un vendedor.
   * @param {Object} params - { corporateEmail, page, size, status?, search? }
   * @returns {Promise<{success: boolean, data?: Object, message?: string, code?: string}>}
   */
  async execute({ corporateEmail, page = 0, size = 10, status, search } = {}) {
    try {
      const data = await this.#repository.findOrdersByCorporateEmailPaginated({
        corporateEmail,
        page,
        size,
        status,
        search,
      });

      return {
        success: true,
        data,
        message: `${data.totalElements} orden${data.totalElements !== 1 ? 'es' : ''} encontrada${data.totalElements !== 1 ? 's' : ''}`,
        code: 'SUCCESS',
      };
    } catch (error) {
      return this.#errorHandler.handle(error, 'cargar las órdenes del vendedor');
    }
  }
}
