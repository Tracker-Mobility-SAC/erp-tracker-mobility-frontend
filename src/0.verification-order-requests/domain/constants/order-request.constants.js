/**
 * Constantes del dominio de solicitudes de orden.
 * Solo conceptos de negocio - sin concerns de UI.
 */

/**
 * Estados de la solicitud de orden (ServiceStatusEnum del backend)
 */
export const OrderRequestStatus = Object.freeze({
  PENDIENTE: 'PENDIENTE',                   // Orden creada, sin asignar
  ASIGNADO: 'ASIGNADO',                     // Verificador asignado
  EN_PROCESO: 'EN_PROCESO',                 // En proceso de verificación
  COMPLETADA: 'COMPLETADA',                 // Verificación completada
  CANCELADA: 'CANCELADA',                   // Orden cancelada
  OBSERVADO: 'OBSERVADO',                   // Tiene observaciones pendientes (automático)
  SUBSANADA: 'SUBSANADA',                   // Todas las observaciones resueltas (automático)
  ENTREVISTA_FALTANTE: 'ENTREVISTA_FALTANTE', // Falta entrevista
  EN_VALIDACION: 'EN_VALIDACION'            // Reporte en proceso de validación
});

/**
 * Estados de observación (ObservationStatusEnum del backend)
 */
export const ObservationStatus = Object.freeze({
  RESUELTA: 'RESUELTA',     // Observación resuelta
  PENDIENTE: 'PENDIENTE'    // Observación pendiente
});

/**
 * Tipos de observación (ObservationTypeEnum del backend)
 */
export const ObservationType = Object.freeze({
  // Documentación principal
  DOCUMENTO_IDENTIDAD: 'DOCUMENTO_IDENTIDAD',
  RECIBO_SERVICIO: 'RECIBO_SERVICIO',
  DATOS_DEL_CLIENTE_NO_COINCIDEN: 'DATOS_DEL_CLIENTE_NO_COINCIDEN',
  
  // Problemas de calidad
  DOCUMENTO_IDENTIDAD_BORROSO: 'DOCUMENTO_IDENTIDAD_BORROSO',
  RECIBO_SERVICIO_BORROSO: 'RECIBO_SERVICIO_BORROSO',
  FOTO_FACHADA_BORROSA: 'FOTO_FACHADA_BORROSA',
  UBICACION_INCORRECTA: 'UBICACION_INCORRECTA',
  
  // Datos incompletos
  DATOS_CLIENTE_INCOMPLETOS: 'DATOS_CLIENTE_INCOMPLETOS',
  DATOS_ARRENDADOR_INCOMPLETOS: 'DATOS_ARRENDADOR_INCOMPLETOS',
  
  OTROS: 'OTROS'  // Otros tipos no categorizados
});

/**
 * Tipos de documento
 */
export const DocumentType = Object.freeze({
  DNI: 'DNI',
  CARNET_EXTRANJERIA: 'CARNET_EXTRANJERIA',
  PTP: 'PTP'
});

/**
 * Reglas de negocio del dominio
 */
export const BusinessRules = Object.freeze({
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  DNI_LENGTH: 8,
  CARNET_MIN_LENGTH: 9,
  CARNET_MAX_LENGTH: 12,
  MIN_PHONE_LENGTH: 9,
  MAX_PHONE_LENGTH: 15,
  MAX_ADDRESS_LENGTH: 300,
  RUC_LENGTH: 11
});

/**
 * Mensajes de error del dominio
 */
export const OrderRequestMessages = Object.freeze({
  ID_REQUIRED: 'ID es requerido',
  ORDER_CODE_REQUIRED: 'Código de orden es requerido',
  STATUS_REQUIRED: 'Estado es requerido',
  CLIENT_NAME_REQUIRED: 'Nombre del cliente es requerido',
  INVALID_STATUS: 'Estado no válido',
  INVALID_DOCUMENT_TYPE: 'Tipo de documento inválido',
  INVALID_OBSERVATION_STATUS: 'Estado de observación no válido'
});

