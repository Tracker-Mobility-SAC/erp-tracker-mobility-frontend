/**
 * Configuración del módulo de reportes de verificación.
 * Registra todas las dependencias en el DI Container.
 * Este archivo debe ser importado una sola vez al iniciar la aplicación.
 */
import { getContainer } from './di-container.js';
import { ReportHttpRepository } from './repositories/report-http.repository.js';
import { ReportErrorHandler } from '../application/error-handlers/report-error.handler.js';
import {
  FetchAllReportsUseCase,
  FetchReportByIdUseCase,
  UpdateLandlordInterviewUseCase,
  UpdateReportUseCase,
  DeleteReportUseCase
} from '../application/use-cases/index.js';

// Service Keys (constantes para evitar typos)
export const SERVICE_KEYS = Object.freeze({
  // Infrastructure
  REPORT_REPOSITORY: 'reportRepository',
  REPORT_API: 'reportApi',
  
  // Application
  ERROR_HANDLER: 'errorHandler',
  NOTIFICATION_SERVICE: 'notificationService',
  
  // Use Cases
  FETCH_ALL_REPORTS_USE_CASE: 'fetchAllReportsUseCase',
  FETCH_REPORT_BY_ID_USE_CASE: 'fetchReportByIdUseCase',
  UPDATE_LANDLORD_INTERVIEW_USE_CASE: 'updateLandlordInterviewUseCase',
  UPDATE_REPORT_USE_CASE: 'updateReportUseCase',
  DELETE_REPORT_USE_CASE: 'deleteReportUseCase'
});

/**
 * Registra las dependencias del módulo en el container
 * @param {Object} externalDependencies - Dependencias externas (notificationService)
 */
export function registerVerificationReportDependencies(externalDependencies = {}) {
  const container = getContainer();

  // Registrar servicio de notificaciones externo (si se proporciona)
  if (externalDependencies.notificationService) {
    container.registerInstance(
      SERVICE_KEYS.NOTIFICATION_SERVICE,
      externalDependencies.notificationService
    );
  }

  // Registrar Repository (singleton)
  container.register(
    SERVICE_KEYS.REPORT_REPOSITORY,
    () => new ReportHttpRepository(),
    true // singleton
  );

  // Registrar Error Handler (singleton)
  container.register(
    SERVICE_KEYS.ERROR_HANDLER,
    (c) => {
      const notificationService = c.has(SERVICE_KEYS.NOTIFICATION_SERVICE)
        ? c.resolve(SERVICE_KEYS.NOTIFICATION_SERVICE)
        : null;
      return new ReportErrorHandler(notificationService);
    },
    true // singleton
  );

  // Registrar Use Cases (transient - nueva instancia cada vez)
  container.register(
    SERVICE_KEYS.FETCH_ALL_REPORTS_USE_CASE,
    (c) => new FetchAllReportsUseCase(
      c.resolve(SERVICE_KEYS.REPORT_REPOSITORY),
      c.resolve(SERVICE_KEYS.ERROR_HANDLER)
    ),
    false
  );

  container.register(
    SERVICE_KEYS.FETCH_REPORT_BY_ID_USE_CASE,
    (c) => new FetchReportByIdUseCase(
      c.resolve(SERVICE_KEYS.REPORT_REPOSITORY),
      c.resolve(SERVICE_KEYS.ERROR_HANDLER)
    ),
    false
  );

  container.register(
    SERVICE_KEYS.UPDATE_LANDLORD_INTERVIEW_USE_CASE,
    (c) => new UpdateLandlordInterviewUseCase(
      c.resolve(SERVICE_KEYS.REPORT_REPOSITORY),
      c.resolve(SERVICE_KEYS.ERROR_HANDLER)
    ),
    false
  );

  container.register(
    SERVICE_KEYS.UPDATE_REPORT_USE_CASE,
    (c) => new UpdateReportUseCase(
      c.resolve(SERVICE_KEYS.REPORT_REPOSITORY),
      c.resolve(SERVICE_KEYS.ERROR_HANDLER)
    ),
    false
  );

  container.register(
    SERVICE_KEYS.DELETE_REPORT_USE_CASE,
    (c) => new DeleteReportUseCase(
      c.resolve(SERVICE_KEYS.REPORT_REPOSITORY),
      c.resolve(SERVICE_KEYS.ERROR_HANDLER)
    ),
    false
  );
}

