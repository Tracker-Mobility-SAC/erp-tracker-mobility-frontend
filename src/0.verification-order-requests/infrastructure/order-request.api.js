// Order Request API Service
// Infrastructure layer - HTTP client for order requests

import { BaseApi } from '../../shared-v2/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared-v2/infrastructure/base-endpoint.js';

/**
 * Servicio API para gestionar solicitudes de órdenes de verificación.
 * Usa BaseApi y BaseEndpoint para consistencia con shared-v2.
 */
export class OrderRequestApi extends BaseApi {
  #endpoint;
  #companyEmployeesEndpoint;

  constructor() {
    super();
    this.#endpoint = new BaseEndpoint(this, '/web/orders');
    this.#companyEmployeesEndpoint = new BaseEndpoint(this, '/company-employees');
  }

  /**
   * Crea una nueva orden de servicio usando FormData para archivos
   * @param {Object} resource - Resource DTO (de CreateOrderRequestCommandAssembler)
   * @param {Array} files - Array de archivos a adjuntar
   * @returns {Promise} - Promise que resuelve con la respuesta de la orden
   */
  create(resource, files = []) {
    const formData = new FormData();

    // Añadir datos JSON como blob
    formData.append('order', new Blob([JSON.stringify(resource)], { type: 'application/json' }));
    
    // Añadir archivos al FormData
    files.forEach((file) => {
      if (file?.name) {
        formData.append('files', file);
      }
    });

    // NO configurar Content-Type manualmente - axios lo configura con boundary automáticamente
    return this.http.post('/web/orders', formData)
      .then(response => {
        return response;
      })
      .catch(error => {
        console.error('[OrderRequestApi] Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        throw error;
      });
  }

  /**
   * Obtiene los datos de la empresa solicitante por username del empleado
   * @param {string} usernameEmployee - Username del empleado
   * @returns {Promise} - Promise que resuelve con los datos de la empresa
   */
  getApplicantCompanyByUsername(usernameEmployee) {
    return this.http.get(`/company-employees/by-username/${usernameEmployee}`);
  }

  /**
   * Obtiene todas las solicitudes de órdenes
   * @returns {Promise}
   */
  getAll() {
    return this.#endpoint.getAll();
  }

  /**
   * Obtiene una solicitud de orden por ID (endpoint de detalle web)
   * @param {number} id - ID de la solicitud
   * @returns {Promise}
   */
  getById(id) {
    return this.http.get(`/web/orders/${id}`);
  }

  /**
   * Obtiene órdenes por corporateEmail del ejecutivo solicitante
   * @param {string} corporateEmail - Email corporativo del ejecutivo
   * @returns {Promise}
   */
  getByCorporateEmail(corporateEmail) {
    return this.http.get(`/web/orders/corporateEmail/${corporateEmail}`);
  }

  /**
   * Actualiza una solicitud de orden existente
   * @param {number} id - ID de la solicitud
   * @param {Object} resource - Datos actualizados
   * @returns {Promise}
   */
  update(id, resource) {
    return this.http.put(`/web/orders/${id}`, resource);
  }

  /**
   * Elimina una solicitud de orden
   * @param {number} id - ID de la solicitud
   * @returns {Promise}
   */
  delete(id) {
    return this.http.delete(`/web/orders/${id}`);
  }

  /**
   * Actualiza campos específicos de una orden (PATCH)
   * Solo envía los campos que se están modificando
   * @param {number} orderId - ID de la orden
   * @param {Object} fields - Campos a actualizar (solo los necesarios)
   * @returns {Promise}
   */
  async updateOrderFields(orderId, fields) {
    try {
      console.log('[OrderRequestApi] Actualizando campos de orden:', { orderId, fields });
      
      const response = await this.http.patch(`/web/orders/${orderId}`, fields);
      return response;
    } catch (error) {
      console.error('[OrderRequestApi] Error updating order fields:', error);
      throw error;
    }
  }

  /**
   * Actualiza un documento (archivo adjunto) de una orden
   * @param {number} orderId - ID de la orden
   * @param {number} documentId - ID del documento
   * @param {File} file - Archivo nuevo
   * @returns {Promise}
   */
  async updateDocument(orderId, documentId, file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('[OrderRequestApi] Actualizando documento:', { orderId, documentId, fileName: file.name });
      
      const response = await this.http.patch(`/web/orders/${orderId}/documents/${documentId}`, formData);
      return response;
    } catch (error) {
      console.error('[OrderRequestApi] Error updating document:', error);
      throw error;
    }
  }

  /**
   * Obtiene la URL de descarga del reporte de verificación domiciliaria (PDF)
   * @param {number} reportId - ID del reporte
   * @returns {Promise<string>} - Promise que resuelve con la URL de descarga
   */
  async getReportDownloadUrl(reportId) {
    try {
      const response = await this.http.get(`/web/reports/${reportId}/download-url`);
      return response;
    } catch (error) {
      console.error('[OrderRequestApi] Error getting report download URL:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una observación
   * @param {number} orderId - ID de la orden
   * @param {number} observationId - ID de la observación
   * @param {Object} data - Datos de la observación (observationType, description, status)
   * @returns {Promise}
   */
  async updateObservation(orderId, observationId, data) {
    try {
      console.log('[OrderRequestApi] Actualizando observación:', { orderId, observationId, data });
      
      const response = await this.http.patch(`/web/orders/${orderId}/observations/${observationId}`, data);
      return response;
    } catch (error) {
      console.error('[OrderRequestApi] Error updating observation:', error);
      throw error;
    }
  }
}
