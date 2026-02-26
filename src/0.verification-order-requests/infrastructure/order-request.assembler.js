import { OrderRequest } from '../domain/models/order-request.entity.js';
import { OrderRequestSummary } from '../domain/models/order-request-summary.entity.js';

/**
 * Assembler para convertir recursos API a entidades de dominio.
 * Infrastructure layer - DTO to Domain Entity mapper.
 */
export class OrderRequestAssembler {
  /**
   * Convierte un resource de la API a una entidad OrderRequest (detalle completo)
   * @param {Object} resource - Recurso de la API
   * @returns {OrderRequest} Entidad de dominio
   */
  static toEntity(resource) {
    if (!resource) return null;
    
    return new OrderRequest({
      orderId: resource.orderId || resource.id,
      orderCode: resource.orderCode,
      status: resource.status,
      requestDate: resource.requestDate,
      // Company data
      companyName: resource.companyName,
      companyExecutiveName: resource.companyExecutiveName,
      companyRuc: resource.companyRuc,
      companyEmail: resource.companyEmail,
      companyPhoneNumber: resource.companyPhoneNumber,
      brandName: resource.brandName,
      // Client data
      clientName: resource.clientName,
      clientLastName: resource.clientLastName,
      clientPhoneNumber: resource.clientPhoneNumber,
      clientDocumentType: resource.clientDocumentType,
      clientDocumentNumber: resource.clientDocumentNumber,
      // Tenant/Landlord data
      isTenant: resource.isTenant,
      landlordName: resource.landlordName,
      landlordPhoneNumber: resource.landlordPhoneNumber,
      // Address data
      addressDepartment: resource.addressDepartment,
      addressProvince: resource.addressProvince,
      addressDistrict: resource.addressDistrict,
      addressStreet: resource.addressStreet,
      addressLocation: resource.addressLocation,
      // Verifier data
      verifierName: resource.verifierName,
      // Visit data
      visitDate: resource.visitDate,
      visitTime: resource.visitTime,
      // Report data
      reportId: resource.reportId,
      // Attached documents
      attachedDocuments: resource.attachedDocuments || [],
      // Observations
      observations: resource.observations || []
    });
  }
  
  /**
   * Convierte un array de resources a un array de entidades OrderRequest
   * @param {Array} resources - Array de recursos de la API
   * @returns {Array<OrderRequest>} Array de entidades de dominio
   */
  static toEntities(resources) {
    if (!Array.isArray(resources)) return [];
    return resources.map(resource => this.toEntity(resource));
  }

  /**
   * Convierte un resource de la API a una entidad OrderRequestSummary (para listados)
   * @param {Object} resource - Recurso de la API
   * @returns {OrderRequestSummary} Entidad de resumen
   */
  static toSummaryEntity(resource) {
    if (!resource) return null;

    console.log('[ASSEMBLER] Raw API resource:', resource);
    console.log('[ASSEMBLER] clientPhoneNumber from API:', resource.clientPhoneNumber);

    const summaryEntity = new OrderRequestSummary({
      id: resource.id,
      orderCode: resource.orderCode,
      requestDate: resource.requestDate,
      status: resource.status,
      obsPendientes: resource.obsPendientes || 0,
      visitDate: resource.visitDate,
      clientName: resource.clientName,
      // El endpoint paginado devuelve 'phoneNumber'; el no-paginado devuelve 'clientPhoneNumber'
      clientPhoneNumber: resource.clientPhoneNumber || resource.phoneNumber || '-'
    });
    
    console.log('[ASSEMBLER] Created entity:', summaryEntity);
    console.log('[ASSEMBLER] Entity clientPhoneNumber:', summaryEntity.clientPhoneNumber);
    
    return summaryEntity;
  }

  /**
   * Convierte un array de resources a un array de entidades OrderRequestSummary
   * @param {Array} resources - Array de recursos de la API
   * @returns {Array<OrderRequestSummary>} Array de entidades de resumen
   */
  static toSummaryEntities(resources) {
    if (!Array.isArray(resources)) return [];
    return resources.map(resource => this.toSummaryEntity(resource));
  }
}


