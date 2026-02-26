import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Entidad de dominio: ServiceOrderSummary
 * Representa un resumen de orden de servicio para listados.
 * Rich Domain Model con comportamiento de negocio encapsulado.
 */
export class ServiceOrderSummary {
  /**
   * Crea una instancia de ServiceOrderSummary con validación obligatoria.
   * @param {Object} params - Parámetros del resumen de orden
   * @param {number} params.id - ID de la orden
   * @param {string} params.orderCode - Código de la orden
   * @param {string} params.clientName - Nombre del cliente
   * @param {string} params.status - Estado de la orden
   * @param {string} params.companyName - Nombre de la empresa solicitante
   * @param {number} [params.verifierId] - ID del verificador asignado
   * @param {string} [params.verifierName] - Nombre del verificador
   * @param {Date|string} [params.visitDate] - Fecha de visita programada
   * @throws {Error} Si los parámetros obligatorios son inválidos
   */
  constructor({
    id,
    orderCode,
    clientName,
    status,
    companyName,
    verifierId = null,
    verifierName = null,
    visitDate = null
  }) {
    // Validaciones obligatorias
    if (!id) throw new Error('ID es requerido');
    if (!orderCode) throw new Error('Código de orden es requerido');
    if (!clientName) throw new Error('Nombre de cliente es requerido');
    if (!status) throw new Error('Estado es requerido');
    if (!companyName) throw new Error('Nombre de empresa es requerido');

    this.id = id;
    this.orderCode = orderCode;
    this.clientName = clientName;
    this.status = status;
    this.companyName = companyName;
    this.verifierId = verifierId;
    this.verifierName = verifierName || null;
    this.visitDate = visitDate;
  }

  /**
   * Verifica si la orden tiene verificador asignado
   * @returns {boolean} True si tiene verificador
   */
  get hasVerifier() {
    return Boolean(this.verifierId);
  }

  /**
   * Verifica si la orden tiene visita programada
   * @returns {boolean} True si tiene fecha de visita
   */
  get hasScheduledVisit() {
    return Boolean(this.visitDate);
  }
  
  /**
   * Obtiene el nombre del verificador o "Pendiente" si no hay asignado
   * @returns {string} Nombre del verificador o "Pendiente"
   */
  get verifierNameDisplay() {
    return this.verifierName && this.verifierName.trim() !== '' 
      ? this.verifierName 
      : 'Pendiente';
  }

  /**
   * Obtiene la fecha de visita en formato corto (dd/mm/aaaa) o "Pendiente"
   * @returns {string} Fecha en formato corto o "Pendiente"
   */
  get visitDateShort() {
    if (!this.visitDate) return 'Pendiente';
    
    try {
      // Si es un Date object (caso edge), convertir primero a string backend
      if (this.visitDate instanceof Date) {
        const formatted = DateFormatter.fromDateObject(this.visitDate);
        return formatted || 'Pendiente';
      }
      
      // Si es un string (caso normal), usar fromBackend
      const formatted = DateFormatter.fromBackend(this.visitDate);
      return (formatted && typeof formatted === 'string') ? formatted : 'Pendiente';
    } catch (error) {
      console.error('[ServiceOrderSummary] Error formateando visitDate:', error);
      return 'Pendiente';
    }
  }
}
