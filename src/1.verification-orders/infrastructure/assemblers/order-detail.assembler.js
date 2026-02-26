import { OrderDetail } from '../../domain/models/order-detail.entity.js';

/**
 * Assembler para transformar datos de OrderDetail entre API y Entidades de Dominio.
 * Patrón Assembler: Separa la lógica de transformación de datos de las entidades.
 */
export class OrderDetailAssembler {
  /**
   * Convierte datos API a entidad OrderDetail
   * @param {Object} apiData - Datos desde la API
   * @returns {OrderDetail}
   */
  static toEntity(apiData) {
    if (!apiData) return null;

    return new OrderDetail({
      orderId: apiData.orderId,
      orderCode: apiData.orderCode,
      status: apiData.status,
      requestDate: apiData.requestDate,
      companyName: apiData.companyName,
      companyExecutiveName: apiData.companyExecutiveName,
      companyRuc: apiData.companyRuc,
      companyEmail: apiData.companyEmail,
      companyPhoneNumber: apiData.companyPhoneNumber,
      brandName: apiData.brandName,
      clientName: apiData.clientName,
      clientLastName: apiData.clientLastName,
      clientPhoneNumber: apiData.clientPhoneNumber,
      clientDocumentType: apiData.clientDocumentType,
      clientDocumentNumber: apiData.clientDocumentNumber,
      isTenant: apiData.isTenant,
      landlordName: apiData.landlordName,
      landlordPhoneNumber: apiData.landlordPhoneNumber,
      addressDepartment: apiData.addressDepartment,
      addressProvince: apiData.addressProvince,
      addressDistrict: apiData.addressDistrict,
      addressStreet: apiData.addressStreet,
      addressLocation: apiData.addressLocation,
      verifierName: apiData.verifierName,
      visitDate: apiData.visitDate,
      visitTime: apiData.visitTime,
      reportId: apiData.reportId,
      attachedDocuments: apiData.attachedDocuments,
      observations: apiData.observations
    });
  }

  /**
   * Convierte array de datos API a array de entidades OrderDetail
   * @param {Array<Object>} apiDataArray - Array de datos desde la API
   * @returns {Array<OrderDetail>}
   */
}


