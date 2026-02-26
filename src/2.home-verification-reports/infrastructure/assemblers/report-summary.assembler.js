import { ReportSummary } from '../../domain/models/report.entity.js';

/**
 * Assembler para transformar DTOs de resumen de reportes a entidades de dominio.
 */
export class ReportSummaryAssembler {
  /**
   * Convierte un DTO del API a una entidad ReportSummary.
   */
  static toEntity(dto) {
    if (!dto) return null;

    return new ReportSummary({
      reportId: dto.reportId,
      reportCode: dto.reportCode,
      finalResult: dto.finalResult,
      isResultValid: dto.isResultValid,
      orderCode: dto.orderCode,
      requestDate: dto.requestDate,
      clientName: dto.clientName,
      companyName: dto.companyName
    });
  }

  /**
   * Convierte un array de DTOs a un array de entidades.
   */
  static toEntities(dtos) {
    if (!Array.isArray(dtos)) return [];
    return dtos.map(dto => this.toEntity(dto)).filter(entity => entity !== null);
  }

}
