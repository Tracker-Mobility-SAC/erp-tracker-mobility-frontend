import { IReportRepository } from '../../domain/repositories/report.repository.interface.js';
import { ReportApi } from '../report.api.js';
import { ReportSummaryAssembler } from '../assemblers/report-summary.assembler.js';
import { ReportAssembler } from '../assemblers/report.assembler.js';
import { UpdateLandlordInterviewCommandAssembler } from '../assemblers/update-landlord-interview-command.assembler.js';
import { UpdateReportCommandAssembler } from '../assemblers/update-report-command.assembler.js';

/**
 * Implementación HTTP del repositorio de reportes.
 * Adaptador que conecta el dominio con la API REST (Arquitectura Hexagonal).
 * 
 * @class ReportHttpRepository
 * @extends {IReportRepository}
 */
export class ReportHttpRepository extends IReportRepository {
  #api;

  constructor() {
    super();
    this.#api = new ReportApi();
  }

  /**
   * Obtiene todos los reportes resumidos.
   * @returns {Promise<Array<ReportSummary>>} Lista de reportes resumidos
   */
  async findAllSummaries() {
    const response = await this.#api.getAllSummaries();
    return ReportSummaryAssembler.toEntities(response.data);
  }

  /**
   * Obtiene reportes paginados con filtros opcionales del servidor.
   * @param {Object} params - { page, size, finalResult?, isResultValid?, search? }
   * @returns {Promise<Object>} { items, totalElements, totalPages, currentPage, pageSize }
   */
  async findPaginated({ page = 0, size = 10, finalResult, isResultValid, search } = {}) {
    const response = await this.#api.getPaginatedFiltered({ page, size, finalResult, isResultValid, search });
    const data = response.data;
    return {
      items:                    ReportSummaryAssembler.toEntities(data.content || []),
      totalElements:            data.totalElements             ?? 0,
      totalPages:               data.totalPages                ?? 0,
      currentPage:              data.currentPage               ?? page,
      pageSize:                 data.pageSize                  ?? size,
      totalPendientes:          data.totalPendientes           ?? 0,
      totalValidados:           data.totalValidados            ?? 0,
      totalConforme:            data.totalConforme             ?? 0,
      totalObservado:           data.totalObservado            ?? 0,
      totalRechazado:           data.totalRechazado            ?? 0,
      totalEntrevistaArrendador: data.totalEntrevistaArrendador ?? 0
    };
  }

  /**
   * Obtiene un reporte completo por ID.
   * @param {number} id - ID del reporte
   * @returns {Promise<Report>} Reporte encontrado
   */
  async findById(id) {
    const response = await this.#api.getById(id);
    return ReportAssembler.toEntity(response.data);
  }

  /**
   * Actualiza la entrevista con el arrendador.
   * @param {UpdateLandlordInterviewCommand} command - Command con datos de la entrevista
   * @returns {Promise<Object>} La respuesta de la actualización
   */
  async updateLandlordInterview(command) {
    console.log('[ReportHttpRepository] updateLandlordInterview - Command:', {
      orderId: command.orderId,
      command
    });
    
    const resource = UpdateLandlordInterviewCommandAssembler.toResource(command);
    console.log('[ReportHttpRepository] Resource transformado:', resource);
    
    const response = await this.#api.updateLandlordInterview(command.orderId, resource);
    return response.data;
  }

  /**
   * Actualiza un reporte de verificación (resultado, resumen, observaciones, etc.).
   * @param {UpdateReportCommand} command - Command con datos del reporte
   * @returns {Promise<Object>} La respuesta de la actualización
   */
  async updateReport(command) {
    const resource = UpdateReportCommandAssembler.toResource(command);
    const response = await this.#api.updateReport(command.reportId, resource);
    return response.data;
  }
}
