import { Report } from '../../domain/models/report-detail.entity.js';

/**
 * Assembler para transformar recursos HTTP de reportes completos a entidades de dominio.
 * Responsabilidad única: mapping bidireccional (resource ↔ entity).
 * NO maneja errores HTTP, NO toma decisiones de negocio.
 */
export class ReportAssembler {
  /**
   * Convierte un recurso de reporte completo a una entidad Report.
   * @param {Object} resource - Los datos del recurso del reporte.
   * @returns {Report} La entidad Report ensamblada.
   * @throws {Error} Si la entidad no puede ser construida
   */
  static toEntity(resource) {
    if (!resource) return null;

    return new Report({
      reportId: resource.reportId,
      reportCode: resource.reportCode,
      orderId: resource.orderId,
      verifierName: resource.verifierName,
      addressLocation: resource.addressLocation,
      visitDate: resource.visitDate,
      finalResult: resource.finalResult,
      isResultValid: resource.isResultValid,
      companyName: resource.companyName,
      companyRuc: resource.companyRuc,
      companyExecutiveName: resource.companyExecutiveName,
      requestDate: resource.requestDate,
      clientName: resource.clientName,
      clientLastName: resource.clientLastName,
      clientDocumentType: resource.clientDocumentType,
      clientDocumentNumber: resource.clientDocumentNumber,
      addressDepartment: resource.addressDepartment,
      addressProvince: resource.addressProvince,
      addressDistrict: resource.addressDistrict,
      addressStreet: resource.addressStreet,
      residence: resource.residence,
      dwelling: resource.dwelling,
      zone: resource.zone,
      garage: resource.garage,
      clientFullName: resource.clientFullName,
      exactClientAddress: resource.exactClientAddress,
      contactReferences: resource.contactReferences,
      landlordName: resource.landlordName,
      landlordPhoneNumber: resource.landlordPhoneNumber,
      interviewDetails: resource.interviewDetails,
      summary: resource.summary,
      observations: resource.observations,
      glossary: resource.glossary,
      casuistics: resource.casuistics,
      attachments: resource.attachments
    });
  }

}


