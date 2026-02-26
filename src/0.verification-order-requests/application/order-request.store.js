// Order Request Store
// Application layer - State management for order requests

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { OrderRequestHttpRepository } from '../infrastructure/repositories/order-request-http.repository.js';
import { CreateOrderRequestCommand } from '../domain/commands/create-order-request.command.js';
import { OrderRequestErrorHandler } from './error-handlers/order-request-error.handler.js';
import { useNotification } from '../../shared/composables/use-notification.js';
import { useAuthenticationStore } from '../../6.security/application/authentication.store.js';

/**
 * Crea un objeto cliente inicial vacío
 */
function createEmptyClient() {
  return {
    name: "",
    lastName: "",
    documentType: "",
    documentNumber: "",
    phoneNumber: "",
    homeAddress: "",
    department: "",
    province: "",
    district: "",
    mapLocation: "",
    isTenant: false,
    landlordName: "",
    landlordPhoneNumber: "",
    documents: []
  };
}

/**
 * Crea un objeto de empresa solicitante inicial vacío
 */
function createEmptyApplicantCompany() {
  return {
    applicantCompanyId: null,
    companyName: null,
    executiveName: null,
    ruc: null,
    corporateEmail: null,
    contactPhoneNumber: null,
    brandName: null // Nombre de la marca asociada al empleado
  };
}

export const useOrderRequestStore = defineStore('orderRequest', () => {
  // Dependencies
  const repository = new OrderRequestHttpRepository();
  const { showSuccess, showError, showWarning } = useNotification();
  const errorHandler = new OrderRequestErrorHandler({ showSuccess, showError, showWarning });

  // State
  const currentStep = ref(1);
  const totalSteps = ref(4);
  const client = ref(createEmptyClient());
  const applicantCompany = ref(createEmptyApplicantCompany());
  const orderResponse = ref(null);
  const isOrderCreated = ref(false);
  const loading = ref(false);
  const error = ref(null);
  const orderRequests = ref([]); // Lista de órdenes (para management view)

  // Getters
  const progressPercentage = computed(() => {
    return (currentStep.value / totalSteps.value) * 100;
  });

  const stepTitle = computed(() => {
    const titles = {
      1: 'Datos del cliente',
      2: 'Datos de domicilio',
      3: 'Documentación y datos adicionales',
      4: 'Resumen de solicitud'
    };
    return titles[currentStep.value] || '';
  });

  // Actions
  
  /**
   * Obtiene todas las solicitudes (versión resumen para listados)
   * Filtra por el email corporativo del usuario autenticado
   * @returns {Promise<Object>} Resultado { success, data?, message, code }
   */
  async function fetchAll() {
    // Limpiar datos SÍNCRONAMENTE antes de cargar
    orderRequests.value = [];
    
    try {
      loading.value = true;
      error.value = null;
      
      // Obtener usuario autenticado
      const authStore = useAuthenticationStore();
      const corporateEmail = authStore.currentUsername;
      
      console.log('[STORE] Fetching orders for corporateEmail:', corporateEmail);
      
      // Usar repository con filtro por corporateEmail
      const data = await repository.findAllByCorporateEmail(corporateEmail);
      console.log('[STORE] Data from repository:', data);
      console.log('[STORE] First item clientPhoneNumber:', data[0]?.clientPhoneNumber);
      
      orderRequests.value = data;
      
      console.log('[STORE] orderRequests.value after assignment:', orderRequests.value);
      console.log('[STORE] First orderRequest clientPhoneNumber:', orderRequests.value[0]?.clientPhoneNumber);

      return {
        success: true,
        data,
        message: `${data.length} solicitud${data.length !== 1 ? 'es' : ''} cargada${data.length !== 1 ? 's' : ''}`,
        code: 'SUCCESS'
      };
    } catch (error) {
      return errorHandler.handle(error, 'cargar las solicitudes de orden');
    } finally {
      loading.value = false;
    }
  }
  
  /**
   * Obtiene los datos de la empresa solicitante por username
   * @param {string} usernameEmployee - Username del empleado
   * @param {boolean} silent - Si true, no muestra loading
   * @returns {Promise<Object>} Resultado { success, data?, error? }
   */
  async function fetchApplicantCompanyData(usernameEmployee, silent = false) {
    try {
      if (!silent) {
        loading.value = true;
      }
      error.value = null;
      
      // Usar repository en lugar de API directa
      const data = await repository.findApplicantCompanyByUsername(usernameEmployee);
      
      if (data) {
        Object.assign(applicantCompany.value, data);
      }
      
      return { success: true, data };
    } catch (err) {
      return errorHandler.handle(err, 'cargar los datos de la empresa');
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  }

  /**
   * Crea una nueva orden de servicio usando CreateOrderRequestCommand
   * @returns {Promise<Object>} Resultado { success, data?, message, code }
   */
  async function createOrder() {
    try {
      loading.value = true;
      error.value = null;
      
      // IMPORTANTE: Extraer archivos EN EL MISMO ORDEN que documentTypes
      // El backend espera que files[i] corresponda a documentTypes[i]
      const files = client.value.documents
        .filter(doc => doc.file?.name) // Solo documentos con archivo
        .map(doc => doc.file); // Extraer solo el archivo File object
      
      console.log('[Store] Documents order:', client.value.documents.map(d => d.type));
      console.log('[Store] Files order:', files.map(f => f.name));
      
      // Crear Command con validación automática en constructor
      const command = new CreateOrderRequestCommand({
        // Client data
        clientName: client.value.name,
        clientLastName: client.value.lastName,
        clientDocumentType: client.value.documentType,
        clientDocumentNumber: client.value.documentNumber,
        clientPhoneNumber: client.value.phoneNumber,
        clientHomeAddress: client.value.homeAddress,
        clientDepartment: client.value.department,
        clientProvince: client.value.province,
        clientDistrict: client.value.district,
        clientMapLocation: client.value.mapLocation,
        clientIsTenant: client.value.isTenant,
        clientLandlordName: client.value.landlordName,
        clientLandlordPhoneNumber: client.value.landlordPhoneNumber,
        clientDocuments: client.value.documents,
        // Applicant company data
        applicantCompanyId: applicantCompany.value.applicantCompanyId,
        applicantCompanyName: applicantCompany.value.companyName,
        applicantCompanyRuc: applicantCompany.value.ruc,
        applicantCompanyEmail: applicantCompany.value.corporateEmail,
        applicantCompanyPhone: applicantCompany.value.contactPhoneNumber,
        applicantCompanyExecutiveName: applicantCompany.value.executiveName,
        applicantCompanyBrandName: applicantCompany.value.brandName
      });
      
      // Guardar usando repository (Command se valida en constructor)
      const orderEntity = await repository.save(command, files);
      
      if (orderEntity) {
        orderResponse.value = orderEntity;
        isOrderCreated.value = true;
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('orderData', JSON.stringify(orderEntity));
        localStorage.setItem('orderNumber', orderEntity.orderCode || '');
        localStorage.setItem('orderCreated', 'true');
        
        // Notificar éxito
        showSuccess(
          `Orden ${orderEntity.orderCode} creada exitosamente`,
          'Orden creada',
          4000
        );
      }
      
      return { 
        success: true, 
        data: orderEntity,
        message: 'Orden creada exitosamente',
        code: 'CREATED'
      };
    } catch (error) {
      return errorHandler.handle(error, 'crear la orden');
    } finally {
      loading.value = false;
    }
  }

  /**
   * Navega al siguiente paso
   */
  function goToNextStep() {
    if (currentStep.value < totalSteps.value) {
      currentStep.value++;
    }
  }

  /**
   * Navega al paso anterior
   */
  function goToPreviousStep() {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  }

  /**
   * Reinicia el formulario completo
   */
  function resetForm() {
    // Limpiar localStorage
    localStorage.removeItem('client');
    localStorage.removeItem('applicantCompany');
    localStorage.removeItem('orderCreated');
    localStorage.removeItem('orderNumber');
    localStorage.removeItem('orderData');
    
    // Reiniciar client y applicantCompany con objetos planos
    client.value = createEmptyClient();
    applicantCompany.value = createEmptyApplicantCompany();
    
    // Reiniciar orderResponse
    orderResponse.value = null;
    isOrderCreated.value = false;
    
    // Volver al primer paso
    currentStep.value = 1;
    
    // Recargar datos de la empresa (silenciosamente)
    const username = localStorage.getItem('username');
    if (username) {
      fetchApplicantCompanyData(username, true);
    }
  }

  /**
   * Actualiza los datos del cliente
   */
  function updateClientData(data) {
    Object.assign(client.value, data);
  }

  /**
   * Navega directamente a un paso específico
   */
  function goToStep(step) {
    if (step >= 1 && step <= totalSteps.value) {
      currentStep.value = step;
    }
  }

  /**
   * Obtiene una orden completa por ID (siguiendo el mismo patrón que verification-order.store)
   * @param {string|number} orderId - El ID de la orden
   * @returns {Promise<{success: boolean, data?, message?, code?}>}
   */
  async function getOrderById(orderId) {
    try {
      loading.value = true;
      error.value = null;
      
      // Validación del ID
      if (!orderId) {
        return {
          success: false,
          message: 'El ID de la orden es requerido',
          code: 'INVALID_PARAMS'
        };
      }
      
      const data = await repository.findById(orderId);
      
      return { 
        success: true, 
        data,
        message: 'Orden cargada correctamente',
        code: 'SUCCESS'
      };
    } catch (error) {
      return errorHandler.handle(error, 'cargar el detalle de la orden');
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    currentStep,
    totalSteps,
    client,
    applicantCompany,
    orderResponse,
    isOrderCreated,
    loading,
    error,
    orderRequests,
    
    // Getters
    progressPercentage,
    stepTitle,
    
    // Actions
    fetchAll,
    fetchApplicantCompanyData,
    createOrder,
    goToNextStep,
    goToPreviousStep,
    resetForm,
    updateClientData,
    goToStep,
    getOrderById
  };
});
