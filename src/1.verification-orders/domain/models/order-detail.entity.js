import { AttachedDocument } from './attached-document.entity.js';
import { Observation } from './observation.entity.js';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Entidad de dominio: OrderDetail
 * Representa el detalle completo de una orden de verificación.
 */
export class OrderDetail {
  constructor({
    orderId = null,
    orderCode = null,
    status = null,
    requestDate = null,
    companyName = null,
    companyExecutiveName = null,
    companyRuc = null,
    companyEmail = null,
    companyPhoneNumber = null,
    brandName = null,
    clientName = null,
    clientLastName = null,
    clientPhoneNumber = null,
    clientDocumentType = null,
    clientDocumentNumber = null,
    isTenant = false,
    landlordName = null,
    landlordPhoneNumber = null,
    addressDepartment = null,
    addressProvince = null,
    addressDistrict = null,
    addressStreet = null,
    addressLocation = null,
    verifierName = null,
    visitDate = null,
    visitTime = null,
    reportId = null,
    attachedDocuments = [],
    observations = []
  }) {
    this.orderId = orderId;
    this.orderCode = orderCode;
    this.status = status;
    this.requestDate = requestDate;
    this.companyName = companyName;
    this.companyExecutiveName = companyExecutiveName;
    this.companyRuc = companyRuc;
    this.companyEmail = companyEmail;
    this.companyPhoneNumber = companyPhoneNumber;
    this.brandName = brandName;
    this.clientName = clientName;
    this.clientLastName = clientLastName;
    this.clientPhoneNumber = clientPhoneNumber;
    this.clientDocumentType = clientDocumentType;
    this.clientDocumentNumber = clientDocumentNumber;
    this.isTenant = isTenant;
    this.landlordName = landlordName;
    this.landlordPhoneNumber = landlordPhoneNumber;
    this.addressDepartment = addressDepartment;
    this.addressProvince = addressProvince;
    this.addressDistrict = addressDistrict;
    this.addressStreet = addressStreet;
    this.addressLocation = addressLocation;
    this.verifierName = verifierName;
    this.visitDate = visitDate;
    this.visitTime = visitTime;
    this.reportId = reportId;
    
    // Arrays de objetos anidados
    this.attachedDocuments = (attachedDocuments || []).map(doc => new AttachedDocument(doc));
    this.observations = (observations || []).map(obs => new Observation(obs));
  }

  /**
   * Obtiene el nombre completo del cliente.
   * @returns {string}
   */
  get clientFullName() {
    return `${this.clientName} ${this.clientLastName}`.trim();
  }

  /**
   * Obtiene la dirección completa.
   * @returns {string}
   */
  get fullAddress() {
    const parts = [
      this.addressStreet,
      this.addressDistrict,
      this.addressProvince,
      this.addressDepartment
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Obtiene la fecha de solicitud formateada (dd/mm/aaaa).
   * @returns {string|null}
   */
  get requestDateFormatted() {
    if (!this.requestDate) return '';
    
    try {
      // Si es un Date object (caso edge), convertir a string
      if (this.requestDate instanceof Date) {
        return DateFormatter.fromDateObject(this.requestDate);
      }
      // Si es un string (caso normal)
      return DateFormatter.fromBackend(this.requestDate);
    } catch (error) {
      console.error('[OrderDetail] Error formateando requestDate:', error);
      return '';
    }
  }

  /**
   * Obtiene la fecha de visita formateada (dd/mm/aaaa).
   * @returns {string|null}
   */
  get visitDateFormatted() {
    if (!this.visitDate) return '';
    
    try {
      // Si es un Date object (caso edge), convertir a string
      if (this.visitDate instanceof Date) {
        return DateFormatter.fromDateObject(this.visitDate);
      }
      // Si es un string (caso normal)
      return DateFormatter.fromBackend(this.visitDate);
    } catch (error) {
      console.error('[OrderDetail] Error formateando visitDate:', error);
      return '';
    }
  }

  /**
   * Verifica si tiene verificador asignado.
   * @returns {boolean}
   */
  get hasVerifier() {
    return Boolean(this.verifierName);
  }

  /**
   * Verifica si tiene fecha de visita.
   * @returns {boolean}
   */
  get hasVisitDate() {
    return Boolean(this.visitDate);
  }

  /**
   * Verifica si es arrendatario.
   * @returns {boolean}
   */
  get isTenantClient() {
    return this.isTenant === true;
  }

  /**
   * Verifica si tiene información del arrendador.
   * @returns {boolean}
   */
  get hasLandlordInfo() {
    return Boolean(this.landlordName && this.landlordPhoneNumber);
  }

  /**
   * Verifica si tiene documentos adjuntos.
   * @returns {boolean}
   */
  get hasAttachedDocuments() {
    return this.attachedDocuments.length > 0;
  }

  /**
   * Verifica si tiene observaciones.
   * @returns {boolean}
   */
  get hasObservations() {
    return this.observations.length > 0;
  }

  /**
   * Obtiene las observaciones no resueltas.
   * @returns {Array<Observation>}
   */
  get pendingObservations() {
    return this.observations.filter(obs => !obs.isResolved);
  }

  /**
   * Obtiene las observaciones resueltas.
   * @returns {Array<Observation>}
   */
  get resolvedObservations() {
    return this.observations.filter(obs => obs.isResolved);
  }

  /**
   * Obtiene solo los documentos de tipo imagen.
   * @returns {Array<AttachedDocument>}
   */
  get imageDocuments() {
    return this.attachedDocuments.filter(doc => doc.isImage);
  }

  /**
   * Obtiene solo los documentos de tipo PDF.
   * @returns {Array<AttachedDocument>}
   */
  get pdfDocuments() {
    return this.attachedDocuments.filter(doc => doc.isPdf);
  }

  /**
   * Verifica si tiene reporte generado.
   * @returns {boolean}
   */
  get hasReport() {
    return this.reportId !== null && this.reportId !== undefined;
  }
}
