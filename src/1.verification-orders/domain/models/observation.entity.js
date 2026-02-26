import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

/**
 * Entidad de dominio: Observation
 * Representa una observación de la orden de verificación.
 */
export class Observation {
  constructor({
    id = null,
    orderId = null,
    observationType = null,
    description = null,
    status = null,
    createdDate = null,
    resolvedDate = null
  }) {
    if (!description) throw new Error('Descripción es requerida');

    this.id = id;
    this.orderId = orderId;
    this.observationType = observationType;
    this.description = description;
    this.status = status;
    this.createdDate = createdDate ? new Date(createdDate) : null;
    this.resolvedDate = resolvedDate ? new Date(resolvedDate) : null;
  }

  /**
   * Verifica si la observación está resuelta.
   * @returns {boolean}
   */
  get isResolved() {
    return Boolean(this.resolvedDate);
  }

  /**
   * Obtiene la fecha de creación formateada (dd/mm/aaaa).
   * @returns {string|null}
   */
  get createdDateFormatted() {
    return DateFormatter.fromDateObject(this.createdDate);
  }

  /**
   * Obtiene la fecha de resolución formateada (dd/mm/aaaa).
   * @returns {string|null}
   */
  get resolvedDateFormatted() {
    return DateFormatter.fromDateObject(this.resolvedDate);
  }
}
