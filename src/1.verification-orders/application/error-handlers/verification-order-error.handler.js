/**
 * Manejador centralizado de errores para el módulo de órdenes de verificación.
 * Responsabilidad: Transformar errores técnicos en mensajes de usuario apropiados.
 * Application Layer - Error handling strategy.
 * 
 * @class VerificationOrderErrorHandler
 */
export class VerificationOrderErrorHandler {
  /**
   * Crea una instancia del manejador de errores.
   * @param {Object} notificationService - Servicio de notificaciones (useNotification)
   */
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Maneja errores de operaciones con órdenes de verificación.
   * @param {Error} error - Error a manejar
   * @param {string} context - Contexto de la operación ('crear', 'actualizar', 'eliminar', 'cargar')
   * @returns {Object} Resultado estructurado { success: false, message, code }
   */
  handle(error, context = 'operación') {
    // Errores de reglas de negocio (del dominio)
    if (this.isBusinessRuleViolation(error)) {
      this.notificationService.showWarning(
        error.message,
        `Error de validación al ${context}`,
        4000
      );
      return {
        success: false,
        message: error.message,
        code: 'BUSINESS_RULE_VIOLATION'
      };
    }

    // Errores de autorización
    if (this.isUnauthorizedError(error)) {
      this.notificationService.showError(
        'No tiene permisos para realizar esta acción',
        'Acceso denegado',
        4000
      );
      return {
        success: false,
        message: 'No autorizado',
        code: 'UNAUTHORIZED'
      };
    }

    // Errores HTTP del servidor
    if (error.response) {
      return this.handleHttpError(error, context);
    }

    // Errores de red
    if (error.request) {
      this.notificationService.showError(
        'No se pudo conectar con el servidor. Verifique su conexión a internet.',
        'Error de conexión',
        5000
      );
      this.logError(error, context);
      return {
        success: false,
        message: 'Error de conexión',
        code: 'NETWORK_ERROR'
      };
    }

    // Error desconocido
    this.notificationService.showError(
      `Ocurrió un error inesperado al ${context}. Por favor, intente nuevamente.`,
      'Error inesperado',
      4000
    );
    this.logError(error, context);
    return {
      success: false,
      message: 'Error inesperado',
      code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * Maneja errores HTTP específicos.
   * @private
   * @param {Error} error - Error HTTP
   * @param {string} context - Contexto de la operación
   * @returns {Object} Resultado estructurado
   */
  handleHttpError(error, context) {
    const status = error.response.status;
    const data = error.response.data;

    // Error 400 - Bad Request
    if (status === 400) {
      const message = data.message || `Datos inválidos al ${context}`;
      this.notificationService.showError(message, 'Datos inválidos', 4000);
      return {
        success: false,
        message,
        code: 'BAD_REQUEST',
        validationErrors: data.errors || {}
      };
    }

    // Error 401 - Unauthorized
    if (status === 401) {
      this.notificationService.showError(
        'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        'Sesión expirada',
        4000
      );
      return {
        success: false,
        message: 'Sesión expirada',
        code: 'SESSION_EXPIRED'
      };
    }

    // Error 403 - Forbidden
    if (status === 403) {
      this.notificationService.showError(
        'No tiene permisos para realizar esta acción',
        'Acceso denegado',
        4000
      );
      return {
        success: false,
        message: 'Acceso denegado',
        code: 'FORBIDDEN'
      };
    }

    // Error 404 - Not Found
    if (status === 404) {
      this.notificationService.showWarning(
        'El recurso solicitado no fue encontrado',
        'No encontrado',
        4000
      );
      return {
        success: false,
        message: 'Recurso no encontrado',
        code: 'NOT_FOUND'
      };
    }

    // Error 409 - Conflict
    if (status === 409) {
      const message = data.message || 'Ya existe una orden con esos datos';
      this.notificationService.showWarning(message, 'Conflicto', 4000);
      return {
        success: false,
        message,
        code: 'CONFLICT'
      };
    }

    // Error 422 - Unprocessable Entity
    if (status === 422) {
      const message = data.message || 'Los datos proporcionados no pudieron ser procesados';
      this.notificationService.showError(message, 'Datos inválidos', 4000);
      return {
        success: false,
        message,
        code: 'UNPROCESSABLE_ENTITY',
        validationErrors: data.errors || {}
      };
    }

    // Error 500+ - Server Error
    if (status >= 500) {
      this.notificationService.showError(
        `Error interno del servidor al ${context}. Por favor, contacte al administrador.`,
        'Error del servidor',
        5000
      );
      this.logError(error, context);
      return {
        success: false,
        message: 'Error del servidor',
        code: 'SERVER_ERROR'
      };
    }

    // Otros errores HTTP
    const message = data.message || `Error al ${context}`;
    this.notificationService.showError(message, 'Error', 4000);
    this.logError(error, context);
    return {
      success: false,
      message,
      code: 'HTTP_ERROR'
    };
  }

  /**
   * Verifica si un error es de regla de negocio.
   * @private
   * @param {Error} error - Error a verificar
   * @returns {boolean} True si es error de regla de negocio
   */
  isBusinessRuleViolation(error) {
    return error.name === 'BusinessRuleViolation' ||
           error.message?.includes('inválido') ||
           error.message?.includes('requerido') ||
           error.message?.includes('debe');
  }

  /**
   * Verifica si un error es de autorización.
   * @private
   * @param {Error} error - Error a verificar
   * @returns {boolean} True si es error de autorización
   */
  isUnauthorizedError(error) {
    return error.name === 'UnauthorizedError' ||
           error.response?.status === 401 ||
           error.response?.status === 403;
  }

  /**
   * Registra un error en consola y servicios de monitoreo.
   * @private
   * @param {Error} error - Error a registrar
   * @param {string} context - Contexto del error
   */
  logError(error, context) {
    console.error(`[VerificationOrderErrorHandler] Error al ${context}:`, {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });

    // TODO: Integrar con servicio de monitoreo (Sentry, LogRocket, etc.)
    // this.monitoringService.captureException(error, { context });
  }

}


