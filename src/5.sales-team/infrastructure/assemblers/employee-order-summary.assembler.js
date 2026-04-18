import { EmployeeOrderSummary } from '../../domain/models/employee-order-summary.entity.js';

/**
 * Assembler para transformar recursos HTTP a entidades EmployeeOrderSummary.
 * Mapeado de: GET /web/orders/corporateEmail/{email}/paginated → content[]
 */
export class EmployeeOrderSummaryAssembler {
  /**
   * Convierte un recurso del backend a una entidad EmployeeOrderSummary.
   * @param {Object} resource
   * @returns {EmployeeOrderSummary}
   */
  static toEntity(resource) {
    if (!resource) {
      throw new Error('EmployeeOrderSummaryAssembler.toEntity: resource no puede ser null');
    }

    return new EmployeeOrderSummary({
      id:           resource.id,
      orderCode:    resource.orderCode,
      status:       resource.status,
      requestDate:  resource.requestDate,
      clientName:   resource.clientName,
      phoneNumber:  resource.phoneNumber   || null,
      companyName:  resource.companyName   || null,
      verifierId:   resource.verifierId    ?? null,
      verifierName: resource.verifierName  || null,
      visitDate:    resource.visitDate     || null,
    });
  }

  /**
   * Convierte un array de recursos a entidades EmployeeOrderSummary.
   * @param {Array<Object>} resources
   * @returns {Array<EmployeeOrderSummary>}
   */
  static toEntities(resources) {
    if (!Array.isArray(resources)) {
      throw new Error('EmployeeOrderSummaryAssembler.toEntities: resources debe ser un array');
    }

    return resources
      .map(resource => {
        try {
          return this.toEntity(resource);
        } catch (error) {
          console.warn('[EmployeeOrderSummaryAssembler] Registro inválido omitido:', error.message);
          return null;
        }
      })
      .filter(item => item !== null);
  }
}
