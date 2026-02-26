import { OrderMessages } from '../constants/verification-order.constants.js';
import { DateValidator } from '../../../shared-v2/utils/date-validator.js';

/**
 * Command para asignar un verificador a una orden.
 * Self-validating: garantiza que los datos sean válidos al momento de construcción.
 * 
 * @class AssignVerifierCommand
 */
export class AssignVerifierCommand {
  /**
   * Crea una instancia de AssignVerifierCommand con validación obligatoria.
   * @param {Object} params - Parámetros del comando
   * @param {number} params.orderId - ID de la orden
   * @param {number} params.verifierId - ID del verificador a asignar
   * @param {Date|string} params.visitDate - Fecha de visita programada
   * @param {string} [params.visitTime=''] - Hora de visita programada
   * @throws {Error} Si los parámetros son inválidos
   */
  constructor({
    orderId,
    verifierId,
    visitDate,
    visitTime = ''
  }) {
    // Validación obligatoria
    if (!orderId || orderId <= 0) {
      throw new Error(OrderMessages.ID_REQUIRED);
    }
    if (!verifierId || verifierId <= 0) {
      throw new Error('Verificador es requerido');
    }
    if (!visitDate) {
      throw new Error('Fecha de visita es requerida');
    }

    // Validar que la fecha sea igual o posterior a hoy usando utilidad de shared-v2
    if (!DateValidator.isTodayOrFuture(visitDate)) {
      throw new Error('La fecha de visita debe ser igual o posterior a hoy');
    }

    this.orderId = orderId;
    this.verifierId = verifierId;
    this.visitDate = visitDate;
    this.visitTime = visitTime || '';
  }
}
