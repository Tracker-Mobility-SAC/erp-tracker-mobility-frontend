import { IOrderRepository } from '../../domain/repositories/order.repository.interface.js';
import { OrderApi } from '../order.api.js';
import { ServiceOrderSummaryAssembler } from '../assemblers/service-order-summary.assembler.js';
import { OrderDetailAssembler } from '../assemblers/order-detail.assembler.js';
import { AssignVerifierCommandAssembler } from '../assemblers/assign-verifier-command.assembler.js';
import { CreateObservationCommandAssembler } from '../assemblers/create-observation-command.assembler.js';

/**
 * Implementación HTTP del repositorio de órdenes.
 * Adaptador que conecta el dominio con la API REST (Arquitectura Hexagonal).
 * 
 * @class OrderHttpRepository
 * @extends {IOrderRepository}
 */
export class OrderHttpRepository extends IOrderRepository {
  #api;

  constructor() {
    super();
    this.#api = new OrderApi();
  }

  /**
   * Obtiene todas las órdenes en formato resumido desde la API.
   * @returns {Promise<Array<ServiceOrderSummary>>} Lista de resúmenes de órdenes
   */
  async findAllSummaries() {
    const response = await this.#api.getAllSummary();
    return ServiceOrderSummaryAssembler.toEntities(response.data || []);
  }

  /**
   * Busca una orden completa por su ID.
   * @param {number} orderId - ID de la orden
   * @returns {Promise<OrderDetail>} Orden completa
   */
  async findById(orderId) {
    const response = await this.#api.getById(orderId);
    return OrderDetailAssembler.toEntity(response.data);
  }

  /**
   * Asigna un verificador a una orden.
   * @param {AssignVerifierCommand} command - Command con datos de asignación
   * @returns {Promise<void>}
   */
  async assignVerifier(command) {
    const resource = AssignVerifierCommandAssembler.toResourceFromCommand(command);
    await this.#api.assignVerifier(command.orderId, resource);
  }

  /**
   * Crea una observación para una orden.
   * @param {CreateObservationCommand} command - Command con datos de observación
   * @returns {Promise<Object>} Observación creada
   */
  async createObservation(command) {
    const resource = CreateObservationCommandAssembler.toResourceFromCommand(command);
    const response = await this.#api.createObservation(command.orderId, resource);
    return response.data;
  }

}
