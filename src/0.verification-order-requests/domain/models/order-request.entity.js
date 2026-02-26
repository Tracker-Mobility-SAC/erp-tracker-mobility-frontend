import { OrderRequestStatus, ObservationStatus, OrderRequestMessages } from '../constants/order-request.constants.js';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Entidad de detalle completo de solicitud de orden de verificación.
 * Rich Domain Model con comportamiento de negocio encapsulado.
 * Usada para vistas de detalle con información completa.
 * 
 * @class OrderRequest
 */
export class OrderRequest {
  /**
   * Crea una instancia de OrderRequest con validación obligatoria.
   * @param {Object} params - Parámetros de la solicitud
   * @param {number} params.orderId - Identificador único
   * @param {string} params.orderCode - Código de la orden
   * @param {string} params.status - Estado de la solicitud
   * @param {string} params.requestDate - Fecha de solicitud
   * @param {string} params.companyName - Nombre de la empresa solicitante
   * @param {string} params.companyExecutiveName - Nombre del ejecutivo
   * @param {string} params.companyRuc - RUC de la empresa
   * @param {string} params.companyEmail - Email de la empresa
   * @param {string} params.companyPhoneNumber - Teléfono de la empresa
   * @param {string} [params.brandName] - Marca de la empresa
   * @param {string} params.clientName - Nombre del cliente
   * @param {string} params.clientLastName - Apellido del cliente
   * @param {string} params.clientPhoneNumber - Teléfono del cliente
   * @param {string} params.clientDocumentType - Tipo de documento del cliente
   * @param {string} params.clientDocumentNumber - Número de documento del cliente
   * @param {boolean} [params.isTenant=false] - Si el cliente es inquilino
   * @param {string} [params.landlordName] - Nombre del arrendador
   * @param {string} [params.landlordPhoneNumber] - Teléfono del arrendador
   * @param {string} params.addressDepartment - Departamento
   * @param {string} params.addressProvince - Provincia
   * @param {string} params.addressDistrict - Distrito
   * @param {string} params.addressStreet - Dirección completa
   * @param {string} [params.addressLocation] - Ubicación en mapa
   * @param {string} [params.verifierName] - Nombre del verificador asignado
   * @param {string} [params.visitDate] - Fecha de visita programada
   * @param {string} [params.visitTime] - Hora de visita programada
   * @param {number} [params.reportId] - ID del reporte generado
   * @param {Array} [params.attachedDocuments=[]] - Documentos adjuntos
   * @param {Array} [params.observations=[]] - Observaciones
   * @throws {Error} Si los parámetros son inválidos
   */
  constructor({
    orderId,
    orderCode,
    status,
    requestDate,
    companyName,
    companyExecutiveName,
    companyRuc,
    companyEmail,
    companyPhoneNumber,
    brandName = null,
    clientName,
    clientLastName,
    clientPhoneNumber,
    clientDocumentType,
    clientDocumentNumber,
    isTenant = false,
    landlordName = null,
    landlordPhoneNumber = null,
    addressDepartment,
    addressProvince,
    addressDistrict,
    addressStreet,
    addressLocation = null,
    verifierName = null,
    visitDate = null,
    visitTime = null,
    reportId = null,
    attachedDocuments = [],
    observations = []
  }) {
    // Validación obligatoria de campos requeridos
    if (!orderId) throw new Error(OrderRequestMessages.ID_REQUIRED);
    if (!orderCode) throw new Error(OrderRequestMessages.ORDER_CODE_REQUIRED);
    if (!status) throw new Error(OrderRequestMessages.STATUS_REQUIRED);
    if (!clientName) throw new Error(OrderRequestMessages.CLIENT_NAME_REQUIRED);

    // Asignación de propiedades - Orden
    this.orderId = orderId;
    this.orderCode = orderCode;
    this.status = status;
    this.requestDate = requestDate;

    // Company data
    this.companyName = companyName;
    this.companyExecutiveName = companyExecutiveName;
    this.companyRuc = companyRuc;
    this.companyEmail = companyEmail;
    this.companyPhoneNumber = companyPhoneNumber;
    this.brandName = brandName;

    // Client data
    this.clientName = clientName;
    this.clientLastName = clientLastName;
    this.clientPhoneNumber = clientPhoneNumber;
    this.clientDocumentType = clientDocumentType;
    this.clientDocumentNumber = clientDocumentNumber;

    // Tenant/Landlord data
    this.isTenant = Boolean(isTenant);
    this.landlordName = landlordName;
    this.landlordPhoneNumber = landlordPhoneNumber;

    // Address data
    this.addressDepartment = addressDepartment;
    this.addressProvince = addressProvince;
    this.addressDistrict = addressDistrict;
    this.addressStreet = addressStreet;
    this.addressLocation = addressLocation;

    // Verifier data
    this.verifierName = verifierName;

    // Visit data
    this.visitDate = visitDate;
    this.visitTime = visitTime;

    // Report data
    this.reportId = reportId;

    // Related data - Convertir a entidades anidadas
    this.attachedDocuments = Array.isArray(attachedDocuments) 
      ? attachedDocuments.map(doc => new AttachedDocument(doc))
      : [];
    this.observations = Array.isArray(observations) 
      ? observations.map(obs => new Observation(obs))
      : [];
  }

  /**
   * Verifica si la solicitud está pendiente.
   * @returns {boolean} True si el estado es PENDING
   */
  get isPending() {
    return this.status === OrderRequestStatus.PENDING;
  }

  /**
   * Verifica si la solicitud está en progreso.
   * @returns {boolean} True si el estado es IN_PROGRESS
   */
  get isInProgress() {
    return this.status === OrderRequestStatus.IN_PROGRESS;
  }

  /**
   * Verifica si la solicitud está completada.
   * @returns {boolean} True si el estado es COMPLETED
   */
  get isCompleted() {
    return this.status === OrderRequestStatus.COMPLETED;
  }

  /**
   * Verifica si la solicitud está cancelada.
   * @returns {boolean} True si el estado es CANCELLED
   */
  get isCancelled() {
    return this.status === OrderRequestStatus.CANCELLED;
  }

  /**
   * Obtiene el nombre completo del cliente.
   * @returns {string} Nombre completo concatenado
   */
  get clientFullName() {
    return `${this.clientName} ${this.clientLastName}`.trim();
  }

  /**
   * Obtiene la dirección completa formateada.
   * @returns {string} Dirección completa
   */
  get fullAddress() {
    const parts = [
      this.addressStreet,
      this.addressDistrict,
      this.addressProvince,
      this.addressDepartment
    ].filter(part => part && part.trim());
    
    return parts.join(', ');
  }

  /**
   * Verifica si tiene un reporte generado.
   * @returns {boolean} True si tiene reportId
   */
  get hasReport() {
    return !!this.reportId;
  }

  /**
   * Verifica si tiene verificador asignado.
   * @returns {boolean} True si tiene verifierName
   */
  get hasVerifier() {
    return !!this.verifierName;
  }

  /**
   * Verifica si tiene visita programada.
   * @returns {boolean} True si tiene visitDate
   */
  get hasScheduledVisit() {
    return !!this.visitDate;
  }

  /**
   * Verifica si es un alquiler (inquilino).
   * @returns {boolean} True si isTenant es true
   */
  get isRental() {
    return this.isTenant;
  }

  /**
   * Obtiene el número de documentos adjuntos.
   * @returns {number} Cantidad de documentos
   */
  get documentCount() {
    return this.attachedDocuments.length;
  }

  /**
   * Obtiene el número total de observaciones.
   * @returns {number} Cantidad de observaciones
   */
  get observationCount() {
    return this.observations.length;
  }

  /**
   * Obtiene el número de observaciones pendientes.
   * @returns {number} Cantidad de observaciones abiertas
   */
  get pendingObservationCount() {
    return this.observations.filter(obs => obs.isPending).length;
  }

  /**
   * Verifica si tiene observaciones pendientes.
   * @returns {boolean} True si hay observaciones sin resolver
   */
  get hasPendingObservations() {
    return this.pendingObservationCount > 0;
  }

  /**
   * Verifica si tiene documentos adjuntos.
   * @returns {boolean} True si hay documentos
   */
  get hasDocuments() {
    return this.documentCount > 0;
  }

  /**
   * Verifica si la orden está lista para ser procesada.
   * (Tiene verificador, tiene visita programada, no está cancelada)
   * @returns {boolean} True si está lista
   */
  get isReadyForProcessing() {
    return this.hasVerifier && this.hasScheduledVisit && !this.isCancelled;
  }

  /**
   * Verifica si la orden puede generar un reporte.
   * (Está completada y no tiene reporte aún)
   * @returns {boolean} True si puede generar reporte
   */
  get canGenerateReport() {
    return this.isCompleted && !this.hasReport;
  }
}

/**
 * Entidad anidada para documentos adjuntos.
 * @class AttachedDocument
 */
export class AttachedDocument {
  constructor({
    id,
    url,
    type
  }) {
    this.id = id;
    this.url = url;
    this.type = type;
  }

  /**
   * Verifica si el documento tiene URL válida.
   * @returns {boolean} True si tiene URL
   */
  get hasUrl() {
    return !!this.url;
  }

  /**
   * Obtiene la extensión del archivo desde la URL.
   * @returns {string} Extensión del archivo
   */
  get fileExtension() {
    if (!this.url) return '';
    const parts = this.url.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Verifica si es una imagen.
   * @returns {boolean} True si es jpg, jpeg, png, gif
   */
  get isImage() {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return imageExtensions.includes(this.fileExtension);
  }

  /**
   * Verifica si es un PDF.
   * @returns {boolean} True si es pdf
   */
  get isPdf() {
    return this.fileExtension === 'pdf';
  }
}

/**
 * Entidad anidada para observaciones.
 * @class Observation
 */
export class Observation {
  constructor({
    id,
    orderId,
    observationType,
    description,
    status,
    createdDate,
    resolvedDate = null
  }) {
    this.id = id;
    this.orderId = orderId;
    this.observationType = observationType;
    this.description = description;
    this.status = status;
    this.createdDate = createdDate;
    this.resolvedDate = resolvedDate;
  }

  /**
   * Verifica si la observación está pendiente.
   * @returns {boolean} True si está pendiente
   */
  get isPending() {
    return this.status === ObservationStatus.PENDIENTE;
  }

  /**
   * Verifica si la observación está resuelta.
   * @returns {boolean} True si está resuelta
   */
  get isResolved() {
    return this.status === ObservationStatus.RESUELTA;
  }

  /**
   * Verifica si tiene fecha de resolución.
   * @returns {boolean} True si tiene resolvedDate
   */
  get hasResolutionDate() {
    return !!this.resolvedDate;
  }

  /**
   * Obtiene la descripción truncada.
   * @param {number} maxLength - Longitud máxima
   * @returns {string} Descripción truncada
   */
  truncateDescription(maxLength = 100) {
    if (!this.description) return '';
    return this.description.length > maxLength
      ? `${this.description.substring(0, maxLength)}...`
      : this.description;
  }

  /**
   * Obtiene la fecha de creación formateada (dd/mm/yyyy).
   * @returns {string} Fecha formateada
   */
  get formattedCreatedDate() {
    return this.createdDate ? DateFormatter.fromBackend(this.createdDate) : '';
  }

  /**
   * Obtiene la fecha de resolución formateada (dd/mm/yyyy).
   * @returns {string} Fecha formateada o string vacío
   */
  get formattedResolvedDate() {
    return this.resolvedDate ? DateFormatter.fromBackend(this.resolvedDate) : '';
  }
}
