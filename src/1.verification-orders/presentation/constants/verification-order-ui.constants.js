/**
 * Constantes UI para órdenes de verificación.
 * Responsabilidad: Concerns de presentación (colores, traducciones, iconos).
 * NO deben estar en el dominio.
 */

import { OrderStatus, ObservationStatus, ObservationType } from '../../domain/constants/verification-order.constants.js';

/**
 * Traducciones de estados de orden para UI (ServiceStatusEnum)
 */
export const OrderStatusTranslations = Object.freeze({
  [OrderStatus.PENDIENTE]: 'Pendiente',
  [OrderStatus.ASIGNADO]: 'Asignado',
  [OrderStatus.EN_PROCESO]: 'En Proceso',
  [OrderStatus.COMPLETADA]: 'Completada',
  [OrderStatus.CANCELADA]: 'Cancelada',
  [OrderStatus.OBSERVADO]: 'Observado',
  [OrderStatus.SUBSANADA]: 'Subsanada',
  [OrderStatus.ENTREVISTA_FALTANTE]: 'Entrevista Faltante',
  [OrderStatus.EN_VALIDACION]: 'En Validación'
});

/**
 * Clases CSS personalizadas por estado (desde workflow-states.css)
 * Estas clases sobrescriben los estilos de PrimeVue para mantener consistencia visual
 */
export const OrderStatusClasses = Object.freeze({
  [OrderStatus.PENDIENTE]: 'status-pendiente',
  [OrderStatus.ASIGNADO]: 'status-asignado',
  [OrderStatus.EN_PROCESO]: 'status-en-proceso',
  [OrderStatus.COMPLETADA]: 'status-completada',
  [OrderStatus.CANCELADA]: 'status-cancelada',
  [OrderStatus.OBSERVADO]: 'status-observado',
  [OrderStatus.SUBSANADA]: 'status-subsanada',
  [OrderStatus.ENTREVISTA_FALTANTE]: 'status-entrevista-arrendador-faltante',
  [OrderStatus.EN_VALIDACION]: 'status-en-validacion'
});

/**
 * Iconos por estado (PrimeIcons)
 */
export const OrderStatusIcons = Object.freeze({
  [OrderStatus.PENDIENTE]: 'pi pi-clock',
  [OrderStatus.ASIGNADO]: 'pi pi-user',
  [OrderStatus.EN_PROCESO]: 'pi pi-spinner',
  [OrderStatus.COMPLETADA]: 'pi pi-check-circle',
  [OrderStatus.CANCELADA]: 'pi pi-times-circle',
  [OrderStatus.OBSERVADO]: 'pi pi-exclamation-triangle',
  [OrderStatus.SUBSANADA]: 'pi pi-check',
  [OrderStatus.ENTREVISTA_FALTANTE]: 'pi pi-calendar-times',
  [OrderStatus.EN_VALIDACION]: 'pi pi-shield'
});

/**
 * Traducciones de estados de observación (ObservationStatusEnum)
 */
export const ObservationStatusTranslations = Object.freeze({
  [ObservationStatus.RESUELTA]: 'Resuelta',
  [ObservationStatus.PENDIENTE]: 'Pendiente'
});

/**
 * Clases CSS para estados de observación (workflow-states.css)
 */
export const ObservationStatusClasses = Object.freeze({
  [ObservationStatus.RESUELTA]: 'observation-resuelta',
  [ObservationStatus.PENDIENTE]: 'observation-pendiente'
});

/**
 * Traducciones de tipos de observación (ObservationTypeEnum)
 */
export const ObservationTypeTranslations = Object.freeze({
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
});

/**
 * Iconos para tipos de observación (PrimeIcons)
 */
export const ObservationTypeIcons = Object.freeze({
  [ObservationType.DOCUMENTO_IDENTIDAD]: 'pi pi-id-card',
  [ObservationType.RECIBO_SERVICIO]: 'pi pi-file',
  [ObservationType.DATOS_DEL_CLIENTE_NO_COINCIDEN]: 'pi pi-exclamation-triangle',
  [ObservationType.DOCUMENTO_IDENTIDAD_BORROSO]: 'pi pi-eye-slash',
  [ObservationType.RECIBO_SERVICIO_BORROSO]: 'pi pi-eye-slash',
  [ObservationType.FOTO_FACHADA_BORROSA]: 'pi pi-image',
  [ObservationType.UBICACION_INCORRECTA]: 'pi pi-map-marker',
  [ObservationType.DATOS_CLIENTE_INCOMPLETOS]: 'pi pi-user',
  [ObservationType.DATOS_ARRENDADOR_INCOMPLETOS]: 'pi pi-users',
  [ObservationType.OTROS]: 'pi pi-question-circle'
});

/**
 * Etiquetas UI para el módulo
 */
export const UILabels = Object.freeze({
  MODULE_TITLE: 'Órdenes de Verificación',
  MODULE_DESCRIPTION: 'Gestión y seguimiento de órdenes de verificación',
  title: 'Órdenes de Verificación',
  singular: 'Orden de Verificación',
  createButton: 'Nueva Orden',
  editButton: 'Editar',
  deleteButton: 'Eliminar',
  assignButton: 'Asignar Verificador',
  viewDetails: 'Ver Detalles'
});

/**
 * Columnas para la tabla de órdenes
 */
export const TableColumns = Object.freeze([
  { field: 'orderCode', header: 'Código', sortable: true },
  { field: 'clientName', header: 'Cliente', sortable: true },
  { field: 'status', header: 'Estado', sortable: true, template: 'status' },
  { field: 'companyName', header: 'Empresa', sortable: true },
  { field: 'verifierNameDisplay', header: 'Verificador', sortable: true },
  { field: 'visitDateShort', header: 'Fecha de Visita', sortable: true }
]);

/**
 * Alias para compatibilidad
 */
export const StatusIcons = OrderStatusIcons;
export const StatusClasses = OrderStatusClasses;

/**
 * Opciones de filtro por estado (para dropdowns)
 */
export const StatusFilterOptions = Object.freeze([
  { label: 'Todos los estados', value: '' },
  ...Object.entries(OrderStatusTranslations).map(([value, label]) => ({
    label,
    value
  }))
]);

