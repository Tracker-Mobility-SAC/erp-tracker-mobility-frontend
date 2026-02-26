/**
 * Entidad de dominio para resumen de reporte de verificación.
 * Representa un reporte en formato resumido para listados.
 */
export class ReportSummary {
  constructor({
    reportId,
    reportCode,
    finalResult,
    isResultValid,
    orderCode,
    requestDate,
    clientName,
    companyName
  }) {
    // Validaciones
    if (!reportId) {
      throw new Error('El ID del reporte es requerido');
    }
    if (!reportCode || reportCode.trim() === '') {
      throw new Error('El código del reporte es requerido');
    }

    this.reportId = reportId;
    this.reportCode = reportCode;
    this.finalResult = finalResult; // Estado: FinalResultEnum o string
    this.isResultValid = isResultValid === true; // Boolean: indica si el resultado está validado
    this.orderCode = orderCode;
    this.requestDate = requestDate;
    this.clientName = clientName;
    this.companyName = companyName;
  }

}
