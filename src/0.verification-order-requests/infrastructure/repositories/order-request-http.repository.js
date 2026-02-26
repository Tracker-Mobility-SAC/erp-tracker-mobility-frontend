import { IOrderRequestRepository } from '../../domain/repositories/order-request.repository.interface.js';
import { OrderRequestApi } from '../order-request.api.js';
import { OrderRequestAssembler } from '../order-request.assembler.js';
import { CreateOrderRequestCommandAssembler } from '../create-order-request-command.assembler.js';
import { UpdateOrderRequestCommandAssembler } from '../update-order-request-command.assembler.js';

/**
 * Implementación HTTP del repositorio de solicitudes de orden.
 * Adaptador que conecta el dominio con la API REST usando Commands y Assemblers.
 * 
 * @class OrderRequestHttpRepository
 * @extends {IOrderRequestRepository}
 */
export class OrderRequestHttpRepository extends IOrderRequestRepository {
  #api;

  constructor() {
    super();
    this.#api = new OrderRequestApi();
  }

  /**
   * Obtiene solicitudes por email corporativo del ejecutivo
   * @param {string} corporateEmail - Email corporativo
   * @returns {Promise<Array<OrderRequestSummary>>} Lista de resúmenes
   */
  async findAllByCorporateEmail(corporateEmail) {
    const response = await this.#api.getByCorporateEmail(corporateEmail);
    return OrderRequestAssembler.toSummaryEntities(response.data);
  }

  /**
   * Obtiene una solicitud por ID (versión completa para detalle)
   * @param {number} id - ID de la solicitud
   * @returns {Promise<OrderRequest>} Entidad completa
   */
  async findById(id) {
    const response = await this.#api.getById(id);
    return OrderRequestAssembler.toEntity(response.data);
  }

  /**
   * Obtiene los datos de la empresa solicitante por username del empleado
   * @param {string} username - Username del empleado
   * @returns {Promise<Object>} Datos de la empresa solicitante
   */
  async findApplicantCompanyByUsername(username) {
    const response = await this.#api.getApplicantCompanyByUsername(username);
    return response.data;
  }

  /**
   * Guarda una nueva solicitud de orden usando CreateOrderRequestCommand
   * @param {CreateOrderRequestCommand} command - Command validado con datos del formulario
   * @param {Array} files - Array de archivos a adjuntar
   * @returns {Promise<OrderRequest>} Entidad creada
   */
  async save(command, files = []) {
    // Transformar Command a formato API usando Assembler
    const resource = CreateOrderRequestCommandAssembler.toResource(command);
    
    // Enviar a API
    const response = await this.#api.create(resource, files);
    
    // Transformar respuesta a entidad de dominio
    return OrderRequestAssembler.toEntity(response.data);
  }

  /**
   * Actualiza una solicitud de orden usando UpdateOrderRequestCommand
   * @param {UpdateOrderRequestCommand} command - Command validado con datos actualizados
   * @returns {Promise<OrderRequest>} Entidad actualizada
   */
  async update(command) {
    // Transformar Command a formato API usando Assembler
    const resource = UpdateOrderRequestCommandAssembler.toResource(command);
    
    // Enviar a API
    const response = await this.#api.update(command.id, resource);
    
    // Transformar respuesta a entidad de dominio
    return OrderRequestAssembler.toEntity(response.data);
  }

  async delete(id) {
    await this.#api.delete(id);
  }

  /**
   * Obtiene solicitudes paginadas por email corporativo del ejecutivo.
   * @param {Object} params
   * @param {string} params.corporateEmail - Email corporativo
   * @param {number} [params.page=0] - Página (0-indexed)
   * @param {number} [params.size=10] - Elementos por página
   * @param {string} [params.status] - Filtro por estado
   * @param {string} [params.search] - Búsqueda por orderCode, clientName o phoneNumber
   * @returns {Promise<{items: OrderRequestSummary[], totalElements: number, totalPages: number, currentPage: number, pageSize: number}>}
   */
  async findPaginatedByCorporateEmail({ corporateEmail, page = 0, size = 10, status, search } = {}) {
    const response = await this.#api.getPaginatedByCorporateEmail({ corporateEmail, page, size, status, search });
    const data = response.data;
    return {
      items:         OrderRequestAssembler.toSummaryEntities(data.content || []),
      totalElements: data.totalElements ?? 0,
      totalPages:    data.totalPages    ?? 0,
      currentPage:   data.currentPage   ?? page,
      pageSize:      data.pageSize      ?? size,
    };
  }
}
