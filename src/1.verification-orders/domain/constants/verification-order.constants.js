/**
 * Constantes del dominio de órdenes de verificación.
 * Define reglas de negocio, enums y mensajes del dominio.
 * Solo conceptos de negocio - sin concerns de UI.
 */

/**
 * Estados de la orden (ServiceStatusEnum del backend)
 */
export const OrderStatus = Object.freeze({
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
  CE: 'CE',
  PASSPORT: 'PASSPORT'
});

/**
 * Mensajes de error del dominio
 */
export const OrderMessages = Object.freeze({
  ID_REQUIRED: 'ID de orden es requerido',
  ORDER_CODE_REQUIRED: 'Código de orden es requerido',
  STATUS_REQUIRED: 'Estado es requerido',
  INVALID_STATUS: 'Estado inválido',
  CLIENT_REQUIRED: 'Cliente es requerido'
});


