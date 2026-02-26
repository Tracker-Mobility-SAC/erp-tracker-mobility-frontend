/**
 * Caso de uso para obtener reportes paginados con filtros del servidor.
 * Independiente del framework, testeable en aislamiento.
 */
export class FetchPaginatedReportsUseCase {
  #repository;
  #errorHandler;

  constructor(repository, errorHandler) {
    if (!repository) {
      throw new Error('Repository es requerido');
    }
    this.#repository = repository;
    this.#errorHandler = errorHandler;
  }

  /**
   * Ejecuta el caso de uso
   * @param {Object} params
   * @param {number} params.page    - Página (0-indexed)
   * @param {number} params.size    - Tamaño de página
   * @param {string} [params.finalResult]    - Filtro por resultado final
   * @param {boolean} [params.isResultValid] - Filtro por validez del resultado
   * @param {string} [params.search]         - Búsqueda global de texto libre
   * @returns {Promise<Object>} { success, data?: { items, totalElements, totalPages, currentPage, pageSize }, message, code }
   */
  async execute({ page = 0, size = 10, finalResult, isResultValid, search } = {}) {
    try {
      const result = await this.#repository.findPaginated({ page, size, finalResult, isResultValid, search });

      return {
        success: true,
        data: result,
        message: `${result.totalElements} reporte${result.totalElements !== 1 ? 's' : ''} encontrado${result.totalElements !== 1 ? 's' : ''}`,
        code: 'SUCCESS'
      };
    } catch (error) {
      if (this.#errorHandler) {
        return this.#errorHandler.handle(error, 'cargar los reportes paginados');
      }

      return {
        success: false,
        message: error.message || 'Error al cargar los reportes paginados',
        code: 'ERROR'
      };
    }
  }
}
