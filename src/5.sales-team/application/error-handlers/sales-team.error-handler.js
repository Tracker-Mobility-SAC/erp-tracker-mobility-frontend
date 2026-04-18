/**
 * Manejador centralizado de errores para el módulo Sales Team.
 * Transforma errores técnicos en mensajes de usuario apropiados.
 * Application Layer - Error handling strategy.
 */
export class SalesTeamErrorHandler {
  /**
   * @param {Object} notificationService - { showSuccess, showError, showWarning }
   */
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Maneja un error y devuelve un resultado estructurado.
   * @param {Error} error
   * @param {string} context - Descripción de la operación ('cargar', 'obtener', ...)
   * @returns {{ success: false, message: string, code: string }}
   */
  handle(error, context = 'operación') {
    // Error de red (sin respuesta del servidor)
    if (error.request && !error.response) {
      this.notificationService.showError(
        'No se pudo conectar con el servidor. Verifique su conexión a internet.',
        'Error de conexión',
        5000
      );
      return { success: false, message: 'Error de conexión', code: 'NETWORK_ERROR' };
    }

    // Error HTTP
    if (error.response) {
      return this.#handleHttpError(error, context);
    }

    // Error desconocido
    this.notificationService.showError(
      `Ocurrió un error inesperado al ${context}. Por favor, intente nuevamente.`,
      'Error inesperado',
      4000
    );
    return { success: false, message: 'Error inesperado', code: 'UNKNOWN_ERROR' };
  }

  /**
   * @private
   */
  #handleHttpError(error, context) {
    const status = error.response?.status;
    const data   = error.response?.data;

    if (status === 400) {
      const message = data?.message || `Datos inválidos al ${context}`;
      this.notificationService.showError(message, 'Datos inválidos', 4000);
      return { success: false, message, code: 'BAD_REQUEST' };
    }

    if (status === 401 || status === 403) {
      this.notificationService.showError(
        'No tiene permisos para realizar esta acción.',
        'Acceso denegado',
        4000
      );
      return { success: false, message: 'No autorizado', code: 'UNAUTHORIZED' };
    }

    if (status === 404) {
      this.notificationService.showError(
        `El recurso solicitado no fue encontrado.`,
        'No encontrado',
        4000
      );
      return { success: false, message: 'No encontrado', code: 'NOT_FOUND' };
    }

    if (status >= 500) {
      this.notificationService.showError(
        `Error interno del servidor al ${context}. Por favor, intente más tarde.`,
        'Error del servidor',
        5000
      );
      return { success: false, message: 'Error del servidor', code: 'SERVER_ERROR' };
    }

    this.notificationService.showError(
      `Error inesperado al ${context}.`,
      'Error',
      4000
    );
    return { success: false, message: `Error HTTP ${status}`, code: 'HTTP_ERROR' };
  }
}
