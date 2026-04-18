import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Entidad de dominio: EmployeeOrderSummary
 * Representa el resumen de una orden de un vendedor (para listados paginados).
 * Mapeada desde GET /web/orders/corporateEmail/{email}/paginated → content[]
 */
export class EmployeeOrderSummary {
  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.orderCode
   * @param {string} params.status
   * @param {string} params.requestDate
   * @param {string} params.clientName
   * @param {string} [params.phoneNumber]
   * @param {string} [params.companyName]
   * @param {number} [params.verifierId]
   * @param {string} [params.verifierName]
   * @param {string} [params.visitDate]
   * @throws {Error} Si los parámetros obligatorios son inválidos
   */
  constructor({
    id,
    orderCode,
    status,
    requestDate,
    clientName,
    phoneNumber   = null,
    companyName   = null,
    verifierId    = null,
    verifierName  = null,
    visitDate     = null,
  }) {
    if (!id)         throw new Error('EmployeeOrderSummary: id es requerido');
    if (!orderCode)  throw new Error('EmployeeOrderSummary: orderCode es requerido');
    if (!status)     throw new Error('EmployeeOrderSummary: status es requerido');
    if (!clientName) throw new Error('EmployeeOrderSummary: clientName es requerido');

    this.id          = id;
    this.orderCode   = orderCode;
    this.status      = status;
    this.requestDate = requestDate;
    this.clientName  = clientName;
    this.phoneNumber = phoneNumber;
    this.companyName = companyName;
    this.verifierId  = verifierId;
    this.verifierName = verifierName;
    this.visitDate   = visitDate;
  }

  /** @returns {boolean} */
  get hasVerifier() {
    return Boolean(this.verifierId);
  }

  /** @returns {boolean} */
  get hasScheduledVisit() {
    return Boolean(this.visitDate);
  }

  /** @returns {string} */
  get verifierDisplay() {
    return this.verifierName?.trim() || 'Pendiente';
  }

  /** @returns {string} */
  get visitDateDisplay() {
    if (!this.visitDate) return 'Pendiente';
    try {
      return DateFormatter.fromBackend(this.visitDate);
    } catch {
      return this.visitDate;
    }
  }

  /** @returns {string} */
  get requestDateDisplay() {
    if (!this.requestDate) return '-';
    try {
      return DateFormatter.fromBackend(this.requestDate);
    } catch {
      return this.requestDate;
    }
  }
}
