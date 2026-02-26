import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Assembler para transformar AssignVerifierCommand a recurso HTTP.
 * Responsabilidad única: mapping Command → Resource HTTP.
 * 
 * @class AssignVerifierCommandAssembler
 */
export class AssignVerifierCommandAssembler {
  /**
   * Convierte un AssignVerifierCommand a recurso HTTP para la API.
   * @param {AssignVerifierCommand} command - Comando de asignación de verificador
   * @returns {Object} Recurso HTTP para enviar al backend
   */
  static toResourceFromCommand(command) {
    if (!command) {
      throw new Error('AssignVerifierCommandAssembler: command no puede ser null o undefined');
    }

    // Convertir visitDate a formato backend (yyyy-MM-dd) usando DateFormatter
    let visitDateFormatted = command.visitDate;
    if (command.visitDate instanceof Date) {
      visitDateFormatted = DateFormatter.dateObjectToBackend(command.visitDate);
    }

    return {
      verifierId: command.verifierId,
      visitDate: visitDateFormatted,
      visitTime: command.visitTime
    };
  }
}
