/**
 * Interface del repositorio de reportes.
 * Define el contrato sin implementación (Puerto en Arquitectura Hexagonal).
 * La capa de dominio define WHAT, la infraestructura implementa HOW.
 * 
 * @interface IReportRepository
 */
export class IReportRepository {
  /**
   * Obtiene todos los reportes en formato resumido.
   * @returns {Promise<Array<ReportSummary>>} Lista de reportes resumidos
   * @throws {Error} Method not implemented
   */
  async findAllSummaries() {
    throw new Error('Method not implemented: findAllSummaries');
  }

  /**
   * Busca un reporte completo por su ID.
   * @param {number} id - ID del reporte
   * @returns {Promise<Report|null>} Reporte encontrado o null
   * @throws {Error} Method not implemented
   */
  async findById(id) {
    throw new Error('Method not implemented: findById');
  }

  /**
   * Obtiene reportes paginados y filtrados del servidor.
   * @param {Object} params - { page, size, finalResult?, isResultValid?, search? }
   * @returns {Promise<Object>} { items, totalElements, totalPages, currentPage, pageSize }
   * @throws {Error} Method not implemented
   */
  async findPaginated(params) {
    throw new Error('Method not implemented: findPaginated');
  }

  /**
   * Actualiza la entrevista con el arrendador.
   * @param {UpdateLandlordInterviewCommand} command - Command con datos de la entrevista
   * @returns {Promise<Object>} Respuesta de la actualización
   * @throws {Error} Method not implemented
   */
  async updateLandlordInterview(command) {
    throw new Error('Method not implemented: updateLandlordInterview');
  }
}
