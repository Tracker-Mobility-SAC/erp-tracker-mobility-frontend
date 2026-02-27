/**
 * Interface del repositorio de órdenes de verificación.
 * Define el contrato sin implementación (Puerto en Arquitectura Hexagonal).
 * La capa de dominio define WHAT, la infraestructura implementa HOW.
 * 
 * @interface IOrderRepository
 */
export class IOrderRepository {
  /**
   * Obtiene todas las órdenes en formato resumido.
   * @returns {Promise<Array<ServiceOrderSummary>>} Lista de resúmenes de órdenes
   * @throws {Error} Method not implemented
   */
  async findAllSummaries() {
    throw new Error('Method not implemented: findAllSummaries');
  }

  /**
   * Busca una orden completa por su ID.
   * @param {number} orderId - ID de la orden
   * @returns {Promise<OrderDetail|null>} Orden completa o null
   * @throws {Error} Method not implemented
   */
  async findById(orderId) {
    throw new Error('Method not implemented: findById');
  }

  /**
   * Asigna un verificador a una orden.
   * @param {AssignVerifierCommand} command - Command con datos de asignación
   * @returns {Promise<void>}
   * @throws {Error} Method not implemented
   */
  async assignVerifier(command) {
    throw new Error('Method not implemented: assignVerifier');
  }

  /**
   * Crea una observación para una orden.
   * @param {CreateObservationCommand} command - Command con datos de observación
   * @returns {Promise<Observation>} Observación creada
   * @throws {Error} Method not implemented
   */
  async createObservation(command) {
    throw new Error('Method not implemented: createObservation');
  }

  /**
   * Obtiene órdenes paginadas con filtros opcionales.
   * @param {Object} params - { page, size, status?, search? }
   * @returns {Promise<{items: ServiceOrderSummary[], totalElements: number, totalPages: number, currentPage: number, pageSize: number}>}
   * @throws {Error} Method not implemented
   */
  async findPaginated(params) {
    throw new Error('Method not implemented: findPaginated');
  }

}
