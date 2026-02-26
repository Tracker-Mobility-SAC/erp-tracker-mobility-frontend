import { OrderRequestStatus, ObservationStatus, ObservationType, DocumentType } from '../../domain/constants/order-request.constants.js';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Constantes de presentación para solicitudes de orden.
 */

/**
 * Traducciones de estados a español (ServiceStatusEnum)
 */
export const StatusTranslations = {
  [OrderRequestStatus.PENDIENTE]: 'Pendiente',
  [OrderRequestStatus.ASIGNADO]: 'Asignado',
  [OrderRequestStatus.EN_PROCESO]: 'En Proceso',
  [OrderRequestStatus.COMPLETADA]: 'Completada',
  [OrderRequestStatus.CANCELADA]: 'Cancelada',
  [OrderRequestStatus.OBSERVADO]: 'Observado',
  [OrderRequestStatus.SUBSANADA]: 'Subsanada',
  [OrderRequestStatus.ENTREVISTA_FALTANTE]: 'Entrevista Faltante'
};

/**
 * Clases CSS para estados (workflow-states.css)
 */
export const StatusCssClasses = {
  [OrderRequestStatus.PENDIENTE]: 'status-pendiente',
  [OrderRequestStatus.ASIGNADO]: 'status-asignado',
  [OrderRequestStatus.EN_PROCESO]: 'status-en-proceso',
  [OrderRequestStatus.COMPLETADA]: 'status-completada',
  [OrderRequestStatus.CANCELADA]: 'status-cancelada',
  [OrderRequestStatus.OBSERVADO]: 'status-observado',
  [OrderRequestStatus.SUBSANADA]: 'status-subsanada',
  [OrderRequestStatus.ENTREVISTA_FALTANTE]: 'status-entrevista-arrendador-faltante'
};

/**
 * Traducciones de estados de observación (ObservationStatusEnum)
 */
export const ObservationStatusTranslations = {
  [ObservationStatus.RESUELTA]: 'Resuelta',
  [ObservationStatus.PENDIENTE]: 'Pendiente'
};

/**
 * Clases CSS para estados de observación (workflow-states.css)
 */
export const ObservationStatusCssClasses = {
  [ObservationStatus.RESUELTA]: 'observation-resuelta',
  [ObservationStatus.PENDIENTE]: 'observation-pendiente'
};

/**
 * Traducciones de tipos de observación (ObservationTypeEnum)
 */
export const ObservationTypeTranslations = {
  // Documentación principal
  [ObservationType.DOCUMENTO_IDENTIDAD]: 'Documento de Identidad',
  [ObservationType.RECIBO_SERVICIO]: 'Recibo de Servicio',
  [ObservationType.DATOS_DEL_CLIENTE_NO_COINCIDEN]: 'Datos del Cliente no Coinciden',
  
  // Problemas de calidad
  [ObservationType.DOCUMENTO_IDENTIDAD_BORROSO]: 'Documento de Identidad Borroso',
  [ObservationType.RECIBO_SERVICIO_BORROSO]: 'Recibo de Servicio Borroso',
  [ObservationType.FOTO_FACHADA_BORROSA]: 'Foto de Fachada Borrosa',
  [ObservationType.UBICACION_INCORRECTA]: 'Ubicación Incorrecta',
  
  // Datos incompletos
  [ObservationType.DATOS_CLIENTE_INCOMPLETOS]: 'Datos del Cliente Incompletos',
  [ObservationType.DATOS_ARRENDADOR_INCOMPLETOS]: 'Datos del Arrendador Incompletos',
  
  [ObservationType.OTROS]: 'Otros'
};

/**
 * Iconos para tipos de observación
 */
export const ObservationTypeIcons = {
  [ObservationType.DOCUMENTO_IDENTIDAD]: 'pi-id-card',
  [ObservationType.RECIBO_SERVICIO]: 'pi-file',
  [ObservationType.DATOS_DEL_CLIENTE_NO_COINCIDEN]: 'pi-exclamation-triangle',
  [ObservationType.DOCUMENTO_IDENTIDAD_BORROSO]: 'pi-eye-slash',
  [ObservationType.RECIBO_SERVICIO_BORROSO]: 'pi-eye-slash',
  [ObservationType.FOTO_FACHADA_BORROSA]: 'pi-image',
  [ObservationType.UBICACION_INCORRECTA]: 'pi-map-marker',
  [ObservationType.DATOS_CLIENTE_INCOMPLETOS]: 'pi-user',
  [ObservationType.DATOS_ARRENDADOR_INCOMPLETOS]: 'pi-users',
  [ObservationType.OTROS]: 'pi-question-circle'
};

/**
 * Opciones de filtro por estado (para dropdowns)
 */
export const StatusFilterOptions = Object.freeze([
  { label: 'Todos los estados', value: '' },
  ...Object.entries(StatusTranslations).map(([value, label]) => ({
    label,
    value
  }))
]);

/**
 * Etiquetas de tipos de documento
 */
export const DocumentTypeLabels = {
  [DocumentType.DNI]: 'DNI',
  [DocumentType.CARNET_EXTRANJERIA]: 'Carnet de Extranjería',
  [DocumentType.PTP]: 'PTP'
};

/**
 * Etiquetas de UI
 */
export const OrderRequestUILabels = {
  title: {
    singular: 'solicitud de orden',
    plural: 'solicitudes de orden'
  },
  actions: {
    create: 'Nueva Solicitud',
    edit: 'Editar Solicitud',
    view: 'Ver Detalle',
    delete: 'Eliminar Solicitud',
    cancel: 'Cancelar Solicitud'
  },
  fields: {
    orderCode: 'Código de Orden',
    requestDate: 'Fecha de Solicitud',
    visitDate: 'Fecha de Visita',
    status: 'Estado',
    clientName: 'Cliente',
    observations: 'Observaciones'
  }
};

/**
 * Helper para formatear fechas (usa DateFormatter de shared-v2)
 * @param {string} dateString - Fecha en formato backend (yyyy-MM-dd)
 * @returns {string} Fecha formateada (dd/mm/yyyy)
 */
export const formatDate = (dateString) => {
  return DateFormatter.fromBackend(dateString);
};

/**
 * Helper para formatear fecha en formato legible
 * @param {string} dateString - Fecha en formato backend (yyyy-MM-dd)
 * @returns {string} Fecha en formato legible (ej: "15 de enero de 2024")
 */
export const formatDateReadable = (dateString) => {
  if (!dateString) return '';
  const formatted = DateFormatter.fromBackend(dateString);
  return DateFormatter.toReadableFormat(DateFormatter.toDateObject(formatted));
};
