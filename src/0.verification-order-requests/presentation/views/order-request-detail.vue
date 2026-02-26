<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { useImageViewer } from '../../../shared-v2/composables/use-image-viewer.js';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';
import { OrderRequestStatus, ObservationType } from '../../domain/constants/order-request.constants.js';
import { StatusTranslations, StatusCssClasses, ObservationTypeTranslations, ObservationTypeIcons } from '../constants/order-request-ui.constants.js';
import { OrderRequestApi } from '../../infrastructure/order-request.api.js'; // Importación temporal para métodos específicos de actualización
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import ImageViewerModal from '../../../shared-v2/presentation/components/image-viewer-modal.vue';

const route = useRoute();
const router = useRouter();
const store = useOrderRequestStore();

// API temporal para métodos específicos de actualización (updateDocument, updateObservation, etc.)
// TODO: Mover estos métodos al Store en una refactorización futura
const orderRequestApi = new OrderRequestApi();

const orderDetail = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const loadingStep = ref(0);
const isDownloadingReport = ref(false);

// Loading states for subsanation actions
const isSavingClient = ref(false);
const isSavingAddress = ref(false);
const isSavingDocument = ref(false);
const isSavingObservation = ref(false);

const LOADING_STEPS = [
  { icon: 'pi-file-o', label: 'Datos de la orden' },
  { icon: 'pi-users', label: 'Información del cliente' },
  { icon: 'pi-cog', label: 'Detalles del servicio' }
];

let loadingProgressInterval = null;

// Notification and Image Viewer
const { showSuccess, showError, showWarning, showInfo } = useNotification();
const {
  showModal,
  currentImage,
  zoom,
  openImage,
  closeModal,
  zoomIn,
  zoomOut,
  resetZoom,
  downloadImage,
  downloadCurrentImage,
  handleImageError: handleImageLoadError
} = useImageViewer();

// Document handling
const DOCUMENT_TYPE_MAP = {
  'DNI': 'DNI',
  'CARNET_EXTRANJERIA': 'CE',
  'PTP': 'PTP'
};
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

const showDocumentModal = ref(false);
const selectedDocument = ref(null);
const showDocumentContent = ref(false);

const filteredDocuments = computed(() => {
  if (!orderDetail.value?.attachedDocuments) return [];
  const docs = orderDetail.value.attachedDocuments.map((doc, index) => ({
    ...doc,
    displayName: doc.type || `Documento ${index + 1}`
  }));
  
  console.log('[OrderRequestDetail] Documentos cargados:', docs.map(d => ({ id: d.id, type: d.type, displayName: d.displayName })));
  
  return docs;
});

const canDownloadReport = computed(() => {
  return orderDetail.value?.status === OrderRequestStatus.COMPLETADA && 
         orderDetail.value?.reportId;
});

function simulateLoadingProgress() {
  clearLoadingInterval();
  loadingProgressInterval = setInterval(() => {
    if (loadingStep.value < LOADING_STEPS.length - 1) {
      loadingStep.value++;
    } else {
      clearLoadingInterval();
    }
  }, 200);
  setTimeout(() => clearLoadingInterval(), 4000);
}

function clearLoadingInterval() {
  if (loadingProgressInterval) {
    clearInterval(loadingProgressInterval);
    loadingProgressInterval = null;
  }
}

function goBack() {
  router.push({ name: 'order-requests-list' });
}

const clearData = () => {
  orderDetail.value = null;
  hasError.value = false;
  errorMessage.value = '';
  loadingStep.value = 0;
};

const loadData = async (orderId) => {
  if (!orderId) {
    hasError.value = true;
    errorMessage.value = 'ID de orden no proporcionado';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  loadingStep.value = 0;
  
  simulateLoadingProgress();

  try {
    const orderResult = await store.getOrderById(orderId);
    
    if (orderResult.success) {
      orderDetail.value = orderResult.data;
      
      // Debug: Verificar estructura de orderDetail
      console.log('[OrderRequestDetail] orderDetail después de load:', {
        orderId: orderDetail.value?.orderId,
        id: orderDetail.value?.id,
        orderCode: orderDetail.value?.orderCode,
        allKeys: Object.keys(orderDetail.value || {})
      });
      
      // Filtrar solo observaciones PENDIENTE en memoria
      if (orderDetail.value?.observations) {
        orderDetail.value.observations = orderDetail.value.observations.filter(
          obs => obs.status === 'PENDIENTE'
        );
        console.log('[OrderRequestDetail] Observaciones PENDIENTE cargadas:', orderDetail.value.observations.length);
      }
      
      console.log('[OrderRequestDetail] Datos cargados:', orderDetail.value);
      loadingStep.value = LOADING_STEPS.length;
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      hasError.value = true;
      errorMessage.value = orderResult.error || 'Error al cargar los detalles de la orden';
    }
  } catch (error) {
    console.error('Error al obtener detalles de la orden:', error);
    hasError.value = true;
    errorMessage.value = 'Error al cargar los detalles de la orden. Por favor, intente nuevamente.';
  } finally {
    isLoading.value = false;
    clearLoadingInterval();
  }
};

async function loadOrderDetail() {
  const orderId = route.params.id;
  clearData();
  await loadData(orderId);
}

// Formatting and utility functions
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'No disponible';
  const cleanNumber = String(phoneNumber).replace(/\D/g, '');
  return cleanNumber.replace(/(\d{3})(?=\d)/g, '$1 ');
};

const formatDocumentType = (documentType) => {
  return documentType ? (DOCUMENT_TYPE_MAP[documentType] || documentType) : 'No disponible';
};

const isImageFile = (url) => {
  if (!url) return false;
  return IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));
};

const getFileExtension = (url) => {
  if (!url) return '';
  const matches = url.match(/\.([^.]+)$/);
  return matches ? matches[1].toLowerCase() : '';
};

const getFileIcon = (url) => {
  const FILE_ICONS = {
    'pdf': 'pi-file-pdf',
    'doc': 'pi-file-word',
    'docx': 'pi-file-word',
    'xls': 'pi-file-excel',
    'xlsx': 'pi-file-excel',
    'txt': 'pi-file',
    'jpg': 'pi-image',
    'jpeg': 'pi-image',
    'png': 'pi-image',
    'gif': 'pi-image',
    'bmp': 'pi-image',
    'webp': 'pi-image'
  };
  return FILE_ICONS[getFileExtension(url)] || 'pi-file';
};

const getFileColor = (url) => {
  const FILE_COLORS = {
    'pdf': 'text-red-500',
    'doc': 'text-blue-500',
    'docx': 'text-blue-500',
    'xls': 'text-green-500',
    'xlsx': 'text-green-500',
    'txt': 'text-gray-500',
    'jpg': 'text-purple-500',
    'jpeg': 'text-purple-500',
    'png': 'text-purple-500',
    'gif': 'text-purple-500',
    'bmp': 'text-purple-500',
    'webp': 'text-purple-500'
  };
  return FILE_COLORS[getFileExtension(url)] || 'text-gray-500';
};

const getDocumentLabel = (documentTypeOrDocument) => {
  if (typeof documentTypeOrDocument === 'object' && documentTypeOrDocument?.displayName) {
    return documentTypeOrDocument.displayName;
  }
  const documentType = typeof documentTypeOrDocument === 'string' 
    ? documentTypeOrDocument 
    : documentTypeOrDocument?.type;
  return documentType || 'Documento';
};

const viewDocument = (document) => {
  if (isImageFile(document.url)) {
    openImage({
      url: document.url,
      description: document.displayName,
      alt: getDocumentLabel(document.type)
    });
  } else {
    selectedDocument.value = document;
    showDocumentModal.value = true;
  }
};

const downloadDocument = async (type, document = null) => {
  try {
    if (!document?.url) {
      console.warn('No se puede descargar el documento: URL no válida');
      return;
    }
    
    await downloadImage({
      url: document.url,
      description: getDocumentLabel(type),
      alt: document.displayName
    });
  } catch (error) {
    console.error('Error al descargar documento:', error);
    showError('No se pudo descargar el documento. Intente nuevamente.', 'Error de descarga');
  }
};

const downloadReport = async () => {
  if (!orderDetail.value?.reportId) {
    showError('No se puede descargar el reporte: ID de reporte no disponible');
    return;
  }

  isDownloadingReport.value = true;
  
  try {
    // Obtener URL de descarga del reporte
    const response = await orderRequestApi.getReportDownloadUrl(orderDetail.value.reportId);
    
    // El backend retorna { reportId, reportUrl }
    const downloadUrl = response.data?.reportUrl;
    
    if (!downloadUrl) {
      showError('No se pudo obtener la URL de descarga del reporte');
      return;
    }
    
    // Abrir URL en nueva pestaña para descargar
    window.open(downloadUrl, '_blank');
    
    showSuccess('Reporte descargado exitosamente', 'Descarga completada');
  } catch (error) {
    console.error('[OrderRequestDetail] Error al descargar reporte:', error);
    showError('No se pudo descargar el reporte. Intente nuevamente.', 'Error de descarga');
  } finally {
    isDownloadingReport.value = false;
  }
};

const closeDocumentModal = () => {
  showDocumentModal.value = false;
  selectedDocument.value = null;
  showDocumentContent.value = false;
};

const toggleDocumentContent = () => {
  showDocumentContent.value = !showDocumentContent.value;
};

const canShowContent = (url) => {
  return url && ['pdf', 'txt', 'html', 'htm'].includes(getFileExtension(url));
};

const getContentViewerUrl = (url) => {
  return getFileExtension(url) === 'pdf' 
    ? `${url}#toolbar=1&navpanes=1&scrollbar=1` 
    : url;
};

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/150x100?text=Error';
};

// ====================== Observations and Conditional Editing ======================
// Helper to check if there's a pending observation of a specific type
const hasObservationType = (type) => {
  const hasPending = orderDetail.value?.observations?.some(obs => obs.observationType === type && obs.status === 'PENDIENTE') || false;
  if (hasPending) {
    console.log('[OrderRequestDetail] Observación pendiente detectada:', type);
  }
  return hasPending;
};

// Computed properties for conditional editing based on observation types
// Solo se habilita la edición si el estado de la orden es OBSERVADO Y se está subsanando esa observación específica
const canEditIdentityDocument = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  const isObserved = orderDetail.value?.status === OrderRequestStatus.OBSERVADO;
  const isCorrectType = currentObservation.value.observationType === ObservationType.DOCUMENTO_IDENTIDAD_BORROSO;
  return isObserved && isCorrectType;
});
const canEditUtilityBill = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO && 
         currentObservation.value.observationType === ObservationType.RECIBO_SERVICIO_BORROSO;
});
const canEditFacadePhoto = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO && 
         currentObservation.value.observationType === ObservationType.FOTO_FACHADA_BORROSA;
});
const canEditLocation = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO && 
         currentObservation.value.observationType === ObservationType.UBICACION_INCORRECTA;
});
const canEditClientData = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO && 
         currentObservation.value.observationType === ObservationType.DATOS_CLIENTE_INCOMPLETOS;
});
const canEditLandlordData = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO && 
         currentObservation.value.observationType === ObservationType.DATOS_ARRENDADOR_INCOMPLETOS;
});

// Check if any observations exist
const hasObservations = computed(() => {
  return orderDetail.value?.observations && orderDetail.value.observations.length > 0;
});

// Get only pending observations (solo si el estado es OBSERVADO)
// Las observaciones en memoria ya están filtradas por status === 'PENDIENTE'
const pendingObservations = computed(() => {
  if (!orderDetail.value?.observations) return [];
  if (orderDetail.value.status !== OrderRequestStatus.OBSERVADO) return [];
  return orderDetail.value.observations;
});

// Get observation description for a specific document type
// Solo retorna observación si el estado es OBSERVADO
const getObservationForDocument = (documentType) => {
  if (!documentType || !orderDetail.value?.observations) return null;
  if (orderDetail.value.status !== OrderRequestStatus.OBSERVADO) return null;
  
  const normalizedType = documentType.toUpperCase().trim();
  let observationType = null;
  
  // Map document types to observation types
  if (['DNI', 'CE', 'PTP', 'CARNET_EXTRANJERIA', 'DOCUMENTO_IDENTIDAD'].includes(normalizedType)) {
    observationType = ObservationType.DOCUMENTO_IDENTIDAD_BORROSO;
  } else if (normalizedType.includes('RECIBO')) {
    observationType = ObservationType.RECIBO_SERVICIO_BORROSO;
  } else if (normalizedType.includes('FACHADA')) {
    observationType = ObservationType.FOTO_FACHADA_BORROSA;
  }
  
  if (!observationType) return null;
  
  return orderDetail.value.observations.find(
    obs => obs.observationType === observationType && obs.status === 'PENDIENTE'
  );
};

// ====================== Observation Subsanation Flow ======================
// Iniciar subsanación de una observación específica
const startSubsanation = (observation) => {
  currentObservation.value = observation;
  isSubsanationMode.value = true;
  
  console.log('[OrderRequestDetail] Iniciando subsanación de observación:', observation.observationType);
  
  // Inicializar datos editables y activar automáticamente el modo de edición correspondiente
  switch (observation.observationType) {
    case ObservationType.DATOS_CLIENTE_INCOMPLETOS:
      editableClientData.value = {
        clientName: orderDetail.value.clientName || '',
        clientLastName: orderDetail.value.clientLastName || '',
        clientPhoneNumber: orderDetail.value.clientPhoneNumber || '',
        clientDocumentType: orderDetail.value.clientDocumentType || '',
        clientDocumentNumber: orderDetail.value.clientDocumentNumber || ''
      };
      isEditingClient.value = true;
      break;
    case ObservationType.UBICACION_INCORRECTA:
      editableAddressData.value = {
        addressDepartment: orderDetail.value.addressDepartment || '',
        addressProvince: orderDetail.value.addressProvince || '',
        addressDistrict: orderDetail.value.addressDistrict || '',
        addressStreet: orderDetail.value.addressStreet || '',
        addressLocation: orderDetail.value.addressLocation || ''
      };
      isEditingAddress.value = true;
      break;
    case ObservationType.DATOS_ARRENDADOR_INCOMPLETOS:
      editableLandlordData.value = {
        landlordName: orderDetail.value.landlordName || '',
        landlordPhoneNumber: orderDetail.value.landlordPhoneNumber || ''
      };
      isEditingLandlord.value = true;
      break;
    case ObservationType.DOCUMENTO_IDENTIDAD_BORROSO:
    case ObservationType.RECIBO_SERVICIO_BORROSO:
    case ObservationType.FOTO_FACHADA_BORROSA:
      isEditingDocuments.value = true;
      break;
  }
  
  showSuccess(`Modo subsanación activado: ${ObservationTypeTranslations[observation.observationType]}`);
  
  // Scroll to the section
  scrollToSection(observation.observationType);
};

// Cancelar subsanación
const cancelSubsanation = () => {
  currentObservation.value = null;
  isSubsanationMode.value = false;
  isEditingClient.value = false;
  isEditingLandlord.value = false;
  isEditingAddress.value = false;
  isEditingDocuments.value = false;
  
  // Limpiar archivo pendiente de documentos
  pendingDocumentUpload.value = {
    documentId: null,
    file: null
  };
  
  showSuccess('Subsanación cancelada');
};

// Scroll to section based on observation type
const scrollToSection = (observationType) => {
  let sectionId = '';
  
  // Map observation types to section IDs
  switch (observationType) {
    case ObservationType.DOCUMENTO_IDENTIDAD_BORROSO:
    case ObservationType.RECIBO_SERVICIO_BORROSO:
    case ObservationType.FOTO_FACHADA_BORROSA:
      sectionId = 'documents-section';
      break;
    case ObservationType.DATOS_CLIENTE_INCOMPLETOS:
      sectionId = 'client-section';
      break;
    case ObservationType.DATOS_ARRENDADOR_INCOMPLETOS:
      sectionId = 'landlord-section';
      break;
    case ObservationType.UBICACION_INCORRECTA:
      sectionId = 'address-section';
      break;
    default:
      console.warn('[OrderRequestDetail] Tipo de observación no mapeada:', observationType);
      return;
  }
  
  console.log('[OrderRequestDetail] Scrolling to section:', sectionId);
  
  // Usar nextTick y setTimeout para asegurar que el DOM está actualizado
  nextTick(() => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      
      if (element) {
        console.log('[OrderRequestDetail] Element found:', element);
        
        // Calcular posición con offset para el header
        const headerOffset = 100; // Espacio para el toolbar
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        console.log('[OrderRequestDetail] Scrolling to position:', offsetPosition);
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Add highlight effect
        element.classList.add('highlight-section');
        setTimeout(() => {
          element.classList.remove('highlight-section');
        }, 2000);
      } else {
        console.error('[OrderRequestDetail] Section element not found:', sectionId);
      }
    }, 100); // Pequeño delay adicional para asegurar que el modo de edición esté activado
  });
};

// Document update handler for observations
const handleDocumentUpdate = async (documentId, file) => {
  if (!orderDetail.value?.orderId || !documentId || !file) {
    showError('Faltan datos para actualizar el documento');
    return;
  }

  try {
    // Encontrar el documento para obtener su tipo
    const document = orderDetail.value.attachedDocuments?.find(doc => doc.id === documentId);
    if (!document) {
      console.error('[OrderRequestDetail] Documento no encontrado. documentId:', documentId, 'attachedDocuments:', orderDetail.value.attachedDocuments);
      showError('Documento no encontrado');
      return;
    }
    
    console.log('[OrderRequestDetail] Documento encontrado:', { id: document.id, type: document.type });

    // Obtener la observación relacionada con este documento
    const observation = getObservationForDocument(document.type);
    
    // Actualizar el documento
    await orderRequestApi.updateDocument(orderDetail.value.orderId, documentId, file);
    
    // Si hay una observación relacionada, marcarla como RESUELTA
    if (observation?.id) {
      console.log('[OrderRequestDetail] Marcando observación como RESUELTA:', observation.id);
      await orderRequestApi.updateObservation(
        orderDetail.value.orderId,
        observation.id,
        {
          observationType: observation.observationType,
          description: observation.description,
          status: 'RESUELTA'
        }
      );
    }
    
    showSuccess('Documento actualizado exitosamente. La observación ha sido resuelta.');
    
    // Limpiar estado de subsanación
    currentObservation.value = null;
    isSubsanationMode.value = false;
    
    // Reload order detail to get updated data
    await loadOrderDetail();
  } catch (error) {
    console.error('[OrderRequestDetail] Error al actualizar documento:', error);
    showError('No se pudo actualizar el documento. Intente nuevamente.', 'Error de actualización');
  }
};

// Handle file selection for document update
const handleFileSelect = async (event, documentId) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type (images and PDFs)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    showError('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP) y PDF');
    return;
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showError('El archivo es demasiado grande. Tamaño máximo: 5MB');
    return;
  }

  // Guardar archivo temporalmente
  pendingDocumentUpload.value = {
    documentId,
    file
  };
  
  showSuccess(`Archivo "${file.name}" seleccionado. Presione "Subsanar" para confirmar.`);
  
  // Clear the input so the same file can be selected again
  event.target.value = '';
};

// Trigger file upload for a specific document
const triggerFileUpload = (documentId) => {
  const fileInput = document.getElementById(`file-upload-${documentId}`);
  if (fileInput) {
    fileInput.click();
  }
};

// Helper to check if a specific document type can be edited
const canEditDocument = (documentType) => {
  if (!documentType) return false;
  
  // Normalize document type to uppercase for comparison
  const normalizedType = documentType.toUpperCase().trim();
  
  console.log('[OrderRequestDetail] Verificando documento:', normalizedType, {
    canEditIdentity: canEditIdentityDocument.value,
    canEditUtilityBill: canEditUtilityBill.value,
    canEditFacade: canEditFacadePhoto.value
  });
  
  // Map document types to their corresponding observation types
  const documentTypeObservationMap = {
    // Documento de identidad (todas las variaciones)
    'DNI': canEditIdentityDocument.value,
    'CE': canEditIdentityDocument.value,
    'PTP': canEditIdentityDocument.value,
    'CARNET_EXTRANJERIA': canEditIdentityDocument.value,
    'CARNET DE EXTRANJERÍA': canEditIdentityDocument.value,
    'DOCUMENTO_IDENTIDAD': canEditIdentityDocument.value,
    'DOCUMENTO DE IDENTIDAD': canEditIdentityDocument.value,
    
    // Recibo de servicio
    'RECIBO_SERVICIO': canEditUtilityBill.value,
    'RECIBO DE SERVICIO': canEditUtilityBill.value,
    
    // Foto de fachada
    'FOTO_FACHADA': canEditFacadePhoto.value,
    'FOTO DE FACHADA': canEditFacadePhoto.value,
    'FOTO_FACHADA_VIVIENDA': canEditFacadePhoto.value,
    'FOTO FACHADA VIVIENDA': canEditFacadePhoto.value
  };
  
  const canEdit = documentTypeObservationMap[normalizedType] || false;
  
  // Log for debugging
  console.log('[OrderRequestDetail] Resultado edición para', documentType, '→', canEdit);
  
  return canEdit;
};

// ====================== Edit Mode for Data Fields ======================
// Edit mode states
const isEditingClient = ref(false);
const isEditingLandlord = ref(false);
const isEditingAddress = ref(false);
const isEditingDocuments = ref(false);

// Observation subsanation state
const currentObservation = ref(null); // Observación que se está subsanando
const isSubsanationMode = ref(false); // Modo de subsanación activado

// Documento pendiente de subir
const pendingDocumentUpload = ref({
  documentId: null,
  file: null
});

// Editable data refs
const editableClientData = ref({
  clientName: '',
  clientLastName: '',
  clientPhoneNumber: '',
  clientDocumentType: '',
  clientDocumentNumber: ''
});

const editableLandlordData = ref({
  landlordName: '',
  landlordPhoneNumber: ''
});

const editableAddressData = ref({
  addressDepartment: '',
  addressProvince: '',
  addressDistrict: '',
  addressStreet: '',
  addressLocation: ''
});

// Save client data
const saveClientData = async () => {
  if (!orderDetail.value?.orderId) return;
  
  isSavingClient.value = true;
  
  try {
    // Preparar DTO según especificación del backend
    const updateDto = {
      companyName: orderDetail.value.companyName,
      companyExecutiveName: orderDetail.value.companyExecutiveName,
      companyRuc: orderDetail.value.companyRuc,
      companyEmail: orderDetail.value.companyEmail,
      companyPhoneNumber: orderDetail.value.companyPhoneNumber,
      // Campos actualizados del cliente
      clientName: editableClientData.value.clientName,
      clientLastName: editableClientData.value.clientLastName,
      clientPhoneNumber: editableClientData.value.clientPhoneNumber,
      clientDocumentType: editableClientData.value.clientDocumentType,
      clientDocumentNumber: editableClientData.value.clientDocumentNumber,
      // Datos de arrendador
      isTenant: orderDetail.value.isTenant,
      landlordName: orderDetail.value.landlordName,
      landlordPhoneNumber: orderDetail.value.landlordPhoneNumber,
      // Dirección
      addressDepartment: orderDetail.value.addressDepartment,
      addressProvince: orderDetail.value.addressProvince,
      addressDistrict: orderDetail.value.addressDistrict,
      addressStreet: orderDetail.value.addressStreet,
      addressLocation: orderDetail.value.addressLocation,
      status: orderDetail.value.status
    };
    
    console.log('[OrderRequestDetail] saveClientData - Enviando DTO:', updateDto);
    console.log('[OrderRequestDetail] saveClientData - orderId:', orderDetail.value.orderId, 'tipo:', typeof orderDetail.value.orderId);
    
    // Actualizar orden usando PATCH
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, updateDto);
    
    // Marcar observación como RESUELTA si existe
    if (currentObservation.value?.id) {
      await orderRequestApi.updateObservation(
        orderDetail.value.orderId,
        currentObservation.value.id,
        {
          observationType: currentObservation.value.observationType,
          description: currentObservation.value.description,
          status: 'RESUELTA'
        }
      );
    }
    
    showSuccess('Datos del cliente actualizados exitosamente.');
    isEditingClient.value = false;
    
    // Limpiar estado de subsanación
    currentObservation.value = null;
    isSubsanationMode.value = false;
    
    await loadOrderDetail();
  } catch (error) {
    console.error('[OrderRequestDetail] Error updating client data:', error);
    showError('No se pudo actualizar los datos del cliente', 'Error de actualización');
  } finally {
    isSavingClient.value = false;
  }
};

// Save landlord data
const saveLandlordData = async () => {
  if (!orderDetail.value?.orderId) return;
  
  try {
    // Preparar DTO según especificación del backend
    const updateDto = {
      companyName: orderDetail.value.companyName,
      companyExecutiveName: orderDetail.value.companyExecutiveName,
      companyRuc: orderDetail.value.companyRuc,
      companyEmail: orderDetail.value.companyEmail,
      companyPhoneNumber: orderDetail.value.companyPhoneNumber,
      // Datos del cliente
      clientName: orderDetail.value.clientName,
      clientLastName: orderDetail.value.clientLastName,
      clientPhoneNumber: orderDetail.value.clientPhoneNumber,
      clientDocumentType: orderDetail.value.clientDocumentType,
      clientDocumentNumber: orderDetail.value.clientDocumentNumber,
      // Campos actualizados de arrendador
      isTenant: orderDetail.value.isTenant,
      landlordName: editableLandlordData.value.landlordName,
      landlordPhoneNumber: editableLandlordData.value.landlordPhoneNumber,
      // Dirección
      addressDepartment: orderDetail.value.addressDepartment,
      addressProvince: orderDetail.value.addressProvince,
      addressDistrict: orderDetail.value.addressDistrict,
      addressStreet: orderDetail.value.addressStreet,
      addressLocation: orderDetail.value.addressLocation,
      status: orderDetail.value.status
    };
    
    console.log('[OrderRequestDetail] saveLandlordData - Enviando DTO:', updateDto);
    console.log('[OrderRequestDetail] saveLandlordData - orderId:', orderDetail.value.orderId, 'tipo:', typeof orderDetail.value.orderId);
    
    // Actualizar orden usando PATCH
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, updateDto);
    
    // Marcar observación como RESUELTA si existe
    if (currentObservation.value?.id) {
      await orderRequestApi.updateObservation(
        orderDetail.value.orderId,
        currentObservation.value.id,
        {
          observationType: currentObservation.value.observationType,
          description: currentObservation.value.description,
          status: 'RESUELTA'
        }
      );
    }
    
    showSuccess('Datos del arrendador actualizados exitosamente.');
    isEditingLandlord.value = false;
    
    // Limpiar estado de subsanación
    currentObservation.value = null;
    isSubsanationMode.value = false;
    
    await loadOrderDetail();
  } catch (error) {
    console.error('[OrderRequestDetail] Error updating landlord data:', error);
    showError('No se pudo actualizar los datos del arrendador', 'Error de actualización');
  }
};

// Save address data
const saveAddressData = async () => {
  if (!orderDetail.value?.orderId) return;
  
  isSavingAddress.value = true;
  
  try {
    // Preparar DTO según especificación del backend
    const updateDto = {
      companyName: orderDetail.value.companyName,
      companyExecutiveName: orderDetail.value.companyExecutiveName,
      companyRuc: orderDetail.value.companyRuc,
      companyEmail: orderDetail.value.companyEmail,
      companyPhoneNumber: orderDetail.value.companyPhoneNumber,
      // Datos del cliente
      clientName: orderDetail.value.clientName,
      clientLastName: orderDetail.value.clientLastName,
      clientPhoneNumber: orderDetail.value.clientPhoneNumber,
      clientDocumentType: orderDetail.value.clientDocumentType,
      clientDocumentNumber: orderDetail.value.clientDocumentNumber,
      // Datos de arrendador
      isTenant: orderDetail.value.isTenant,
      landlordName: orderDetail.value.landlordName,
      landlordPhoneNumber: orderDetail.value.landlordPhoneNumber,
      // Campos actualizados de dirección
      addressDepartment: editableAddressData.value.addressDepartment,
      addressProvince: editableAddressData.value.addressProvince,
      addressDistrict: editableAddressData.value.addressDistrict,
      addressStreet: editableAddressData.value.addressStreet,
      addressLocation: editableAddressData.value.addressLocation,
      status: orderDetail.value.status
    };
    
    console.log('[OrderRequestDetail] saveAddressData - Enviando DTO:', updateDto);
    console.log('[OrderRequestDetail] saveAddressData - orderId:', orderDetail.value.orderId, 'tipo:', typeof orderDetail.value.orderId);
    
    // Actualizar orden usando PATCH
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, updateDto);
    
    // Marcar observación como RESUELTA si existe
    if (currentObservation.value?.id) {
      await orderRequestApi.updateObservation(
        orderDetail.value.orderId,
        currentObservation.value.id,
        {
          observationType: currentObservation.value.observationType,
          description: currentObservation.value.description,
          status: 'RESUELTA'
        }
      );
    }
    
    showSuccess('Datos de dirección actualizados exitosamente.');
    isEditingAddress.value = false;
    
    // Limpiar estado de subsanación
    currentObservation.value = null;
    isSubsanationMode.value = false;
    
    await loadOrderDetail();
  } catch (error) {
    console.error('[OrderRequestDetail] Error updating address data:', error);
    showError('No se pudo actualizar los datos de dirección', 'Error de actualización');
  } finally {
    isSavingAddress.value = false;
  }
};

// ====================== Document Subsanation Functions ======================
// Save document (subsanar)
const saveDocument = async () => {
  if (!pendingDocumentUpload.value.file || !pendingDocumentUpload.value.documentId) {
    showError('Debe seleccionar un archivo primero');
    return;
  }
  
  isSavingDocument.value = true;
  
  try {
    await handleDocumentUpdate(
      pendingDocumentUpload.value.documentId,
      pendingDocumentUpload.value.file
    );
    
    // Limpiar archivo pendiente
    pendingDocumentUpload.value = {
      documentId: null,
      file: null
    };
    
    isEditingDocuments.value = false;
  } finally {
    isSavingDocument.value = false;
  }
};

// Cancel editing documents
const cancelEditingDocuments = () => {
  isEditingDocuments.value = false;
  pendingDocumentUpload.value = {
    documentId: null,
    file: null
  };
};

// Watch para logs
watch(() => orderDetail.value, (newItem) => {
  if (newItem) {
    console.log('[OrderRequestDetail] Datos cargados:', newItem);
    console.log('[OrderRequestDetail] Company Name:', newItem?.companyName);
    console.log('[OrderRequestDetail] Client Name:', newItem?.clientName);
    console.log('[OrderRequestDetail] Documents:', newItem?.attachedDocuments);
  }
}, { immediate: true });

onMounted(() => {
  loadOrderDetail();
});

watch(() => route.params.id, async (newId) => {
  if (newId) {
    clearData();
    await loadData(newId);
  }
});

onBeforeUnmount(() => {
  clearLoadingInterval();
});
</script>

<template>
  <div class="h-full w-full flex flex-column">

    <toolbar 
      :title="'Detalle de Solicitud'" 
      :description="orderDetail?.orderCode ? `Orden: ${orderDetail.orderCode}` : 'Cargando...'" 
      :show-back-button="true"
      @back="goBack"
    >
      <template #actions>
        <div class="flex align-items-center gap-2">

          <!-- Fecha de solicitud -->
          <div class="flex align-items-center gap-2 px-3 py-2 border-round-md border-2 surface-border bg-blue-50">
            <i class="pi pi-calendar text-blue-600 text-lg"></i>
            <div class="flex flex-column">
              <span class="text-xs font-semibold text-blue-700 uppercase mb-1">Fecha de solicitud</span>
              <span v-if="orderDetail" class="text-base font-bold text-900">
                {{ DateFormatter.fromBackend(orderDetail.requestDate) || 'No disponible' }}
              </span>
              <span v-else class="text-sm text-600">Cargando...</span>
            </div>
          </div>
        </div>
      </template>
    </toolbar>

    <div class="flex-1 p-4 overflow-auto">
      
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex justify-content-center align-items-center surface-ground border-round my-3" style="min-height: 50vh;">
        <div class="flex flex-column align-items-center text-center gap-3">
          <pv-progress-spinner 
            size="48" 
            stroke-width="4" 
            animation-duration="1.2s" 
            style="opacity: 0.8;"
          />
          
          <div style="max-width: 300px;">
            <h3 class="text-xl font-medium text-900 m-0" style="letter-spacing: -0.025em;">Cargando orden de servicio</h3>
            <p class="text-sm text-600 m-0 mt-2" style="transition: opacity 0.3s ease;">{{ LOADING_STEPS[loadingStep]?.label || 'Preparando datos...' }}</p>
          </div>
        </div>
      </div>

      <!-- Estado de error -->
      <div v-else-if="hasError" class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <pv-message severity="error" :closable="false">
          <template #default>
            <div class="flex flex-column align-items-center">
              <i class="pi pi-exclamation-triangle text-4xl mb-3"></i>
              <span>{{ errorMessage }}</span>
              <pv-button 
                label="Reintentar" 
                icon="pi pi-refresh" 
                class="mt-3"
                @click="loadOrderDetail"
              />
            </div>
          </template>
        </pv-message>
      </div>

      <!-- Detalles de la orden -->
      <div v-else-if="orderDetail" class="flex flex-column gap-4">

        <!-- Botón de descarga de reporte (solo si está COMPLETADA) -->
          <pv-button
            v-if="canDownloadReport"
            label="Descargar Reporte"
            icon="pi pi-download"
            class="p-button-success"
            :loading="isDownloadingReport"
            :disabled="isDownloadingReport"
            @click="downloadReport"
          />

        <!-- ====================== Mensaje de Modo Subsanación Activo ====================== -->
        <pv-message
          v-if="isSubsanationMode && currentObservation"
          severity="info"
          :closable="false"
        >
          <div class="flex align-items-center justify-content-between w-full gap-3">
            <div class="flex align-items-start gap-3 flex-1">
              <i class="pi pi-pencil text-xl"></i>
              <div class="flex flex-column gap-1">
                <span class="font-semibold">Modo Subsanación Activado</span>
                <span class="text-sm">Subsanando: {{ ObservationTypeTranslations[currentObservation.observationType] }}</span>
              </div>
            </div>
            <pv-button
              label="Cancelar Subsanación"
              icon="pi pi-times"
              class="p-button-sm p-button-secondary"
              @click="cancelSubsanation"
            />
          </div>
        </pv-message>

        <!-- ====================== Tarjetas de Observaciones Pendientes ====================== -->
        <div v-if="pendingObservations.length > 0 && !isSubsanationMode" class="flex flex-column gap-3">
          <pv-card
            v-for="observation in pendingObservations"
            :key="observation.id"
            class="border-2 border-orange-300 shadow-3"
          >
            <template #content>
              <div class="flex align-items-center justify-content-between gap-4">
                <!-- Icono y detalles de la observación -->
                <div class="flex align-items-start gap-3 flex-1">
                  <div class="flex align-items-center justify-content-center w-3rem h-3rem border-circle bg-orange-100">
                    <i :class="`pi ${ObservationTypeIcons[observation.observationType]} text-orange-600 text-xl`"></i>
                  </div>
                  <div class="flex flex-column gap-2 flex-1">
                    <div class="flex align-items-center gap-2">
                      <span class="font-bold text-lg text-900">{{ ObservationTypeTranslations[observation.observationType] }}</span>
                      <pv-badge value="PENDIENTE" severity="warning" />
                    </div>
                    <p class="text-600 m-0 line-height-3">{{ observation.description }}</p>
                  </div>
                </div>
                
                <!-- Botón de subsanar -->
                <pv-button
                  label="Subsanar Observación"
                  icon="pi pi-check-circle"
                  class="p-button-warning p-button-lg"
                  @click="startSubsanation(observation)"
                />
              </div>
            </template>
          </pv-card>
        </div>

        <!-- ====================== Card -> Datos del solicitante ====================== -->
        <pv-card>
          <template #header>
            <div class="flex align-items-center gap-2 px-3 py-2">
              <i class="pi pi-briefcase"></i>
              <span class="text-lg font-bold">Datos del solicitante</span>
            </div>
          </template>
          <template #content>
            <div class="formgrid grid">
              <!-- Fila 1: Razón Social, Marca y RUC -->
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                  <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-building text-blue-600"></i>
                    Razón social
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.companyName || 'No disponible' }}</p>
                </div>
              </div>

              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
                  <label class="text-xs font-semibold text-teal-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-tag text-teal-600"></i>
                    Marca
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.brandName || 'No especificado' }}</p>
                </div>
              </div>

              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
                  <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-id-card text-indigo-600"></i>
                    RUC
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.companyRuc || 'No disponible' }}</p>
                </div>
              </div>

              <!-- Fila 2: Nombre de ejecutivo, Número de contacto y Correo corporativo -->
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
                  <label class="text-xs font-semibold text-purple-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-user text-purple-600"></i>
                    Nombre de ejecutivo
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.companyExecutiveName || 'No disponible' }}</p>
                </div>
              </div>

              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                  <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-phone text-green-600"></i>
                    Número de contacto
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(orderDetail?.companyPhoneNumber) }}</p>
                </div>
              </div>

              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
                  <label class="text-xs font-semibold text-orange-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-envelope text-orange-600"></i>
                    Correo corporativo
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.companyEmail || 'No disponible' }}</p>
                </div>
              </div>
            </div>
          </template>
        </pv-card>

        <!-- ====================== Card -> Datos del cliente ====================== -->
        <pv-card id="client-section">
          <template #header>
            <div class="flex align-items-center justify-content-between px-3 py-2"
                 :class="{
                   'bg-orange-500 text-white': canEditClientData
                 }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-user-plus"></i>
                <span class="text-lg font-bold">Datos del cliente</span>
                <i v-if="canEditClientData" class="pi pi-exclamation-triangle ml-2"></i>
              </div>
              <!-- Botón de Subsanar (solo si hay observación activa y está editando) -->
              <div v-if="canEditClientData && isEditingClient" class="flex gap-2">
                <pv-button
                  :icon="isSavingClient ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
                  label="Subsanar"
                  class="p-button-sm p-button-success"
                  :loading="isSavingClient"
                  :disabled="isSavingClient"
                  @click="saveClientData"
                />
                <pv-button
                  icon="pi pi-times"
                  label="Cancelar"
                  class="p-button-sm p-button-secondary"
                  :disabled="isSavingClient"
                  @click="cancelSubsanation"
                />
              </div>
            </div>
          </template>
          <template #content>
            <!-- Modo lectura -->
            <div v-if="!isEditingClient" class="formgrid grid">
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                  <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-user text-blue-600"></i>
                    Nombres
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.clientName || 'No disponible' }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-cyan-50 h-full">
                  <label class="text-xs font-semibold text-cyan-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-user text-cyan-600"></i>
                    Apellidos
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.clientLastName || 'No disponible' }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                  <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-phone text-green-600"></i>
                    Número de contacto
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(orderDetail?.clientPhoneNumber) }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
                  <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-credit-card text-indigo-600"></i>
                    Tipo de documento
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ formatDocumentType(orderDetail?.clientDocumentType) }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
                  <label class="text-xs font-semibold text-purple-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-hashtag text-purple-600"></i>
                    Número de documento
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.clientDocumentNumber || 'No disponible' }}</p>
                </div>
              </div>
            </div>

            <!-- Modo edición -->
            <div v-else class="formgrid grid">
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Nombres *</label>
                <pv-input-text
                  v-model="editableClientData.clientName"
                  class="w-full"
                  placeholder="Ingrese nombres"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Apellidos *</label>
                <pv-input-text
                  v-model="editableClientData.clientLastName"
                  class="w-full"
                  placeholder="Ingrese apellidos"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Número de contacto *</label>
                <pv-input-text
                  v-model="editableClientData.clientPhoneNumber"
                  class="w-full"
                  placeholder="Ingrese teléfono"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Tipo de documento *</label>
                <pv-dropdown
                  v-model="editableClientData.clientDocumentType"
                  :options="[
                    { label: 'DNI', value: 'DNI' },
                    { label: 'Carnet de Extranjería', value: 'CARNET_EXTRANJERIA' },
                    { label: 'PTP', value: 'PTP' }
                  ]"
                  option-label="label"
                  option-value="value"
                  placeholder="Seleccione tipo"
                  class="w-full"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Número de documento *</label>
                <pv-input-text
                  v-model="editableClientData.clientDocumentNumber"
                  class="w-full"
                  placeholder="Ingrese número"
                />
              </div>
            </div>
          </template>
        </pv-card>

        <!-- ====================== Card -> Dirección ====================== -->
        <pv-card id="address-section">
          <template #header>
            <div class="flex align-items-center justify-content-between px-3 py-2"
                 :class="{
                   'bg-orange-500 text-white': canEditLocation
                 }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-map-marker"></i>
                <span class="text-lg font-bold">Dirección</span>
                <i v-if="canEditLocation" class="pi pi-exclamation-triangle ml-2"></i>
              </div>
              <!-- Botón de Subsanar -->
              <div v-if="canEditLocation && isEditingAddress" class="flex gap-2">
                <pv-button
                  :icon="isSavingAddress ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
                  label="Subsanar"
                  class="p-button-sm p-button-success"
                  :loading="isSavingAddress"
                  :disabled="isSavingAddress"
                  @click="saveAddressData"
                />
                <pv-button
                  icon="pi pi-times"
                  label="Cancelar"
                  class="p-button-sm p-button-secondary"
                  :disabled="isSavingAddress"
                  @click="cancelSubsanation"
                />
              </div>
            </div>
          </template>
          <template #content>
            <!-- Modo lectura -->
            <div v-if="!isEditingAddress" class="formgrid grid">
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-cyan-50 h-full">
                  <label class="text-xs font-semibold text-cyan-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-map text-cyan-600"></i>
                    Departamento
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ (orderDetail?.addressDepartment || 'No disponible').toUpperCase() }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
                  <label class="text-xs font-semibold text-teal-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-building text-teal-600"></i>
                    Provincia
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ (orderDetail?.addressProvince || 'No disponible').toUpperCase() }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-pink-50 h-full">
                  <label class="text-xs font-semibold text-pink-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-flag text-pink-600"></i>
                    Distrito
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.addressDistrict || 'No disponible' }}</p>
                </div>
              </div>
              
              <div class="field col-12 md:col-8">
                <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
                  <label class="text-xs font-semibold text-orange-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-home text-orange-600"></i>
                    Dirección de domicilio
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.addressStreet || 'No disponible' }}</p>
                </div>
              </div>
              
              <!-- Ubicación en Google Maps -->
              <div class="field col-12 md:col-4" v-if="orderDetail?.addressLocation">
                <div class="p-3 border-round border-2 surface-border bg-red-50">
                  <label class="text-xs font-semibold text-red-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-map-marker text-red-600"></i>
                    Ubicación en google maps
                  </label>
                  <p class="text-900 m-0">
                    <a
                      :href="orderDetail.addressLocation"
                      target="_blank"
                      class="text-primary no-underline hover:underline flex align-items-center gap-2 font-bold"
                    >
                      <i class="pi pi-external-link text-sm"></i>
                      Ver Ubicación
                    </a>
                  </p>
                </div>
              </div>
              <div class="field col-12 md:col-4" v-else>
                <div class="p-3 border-round border-2 surface-border bg-red-50">
                  <label class="text-xs font-semibold text-red-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-map-marker text-red-600"></i>
                    Ubicación en google maps
                  </label>
                  <p class="text-base font-bold text-900 m-0">No disponible</p>
                </div>
              </div>
            </div>

            <!-- Modo edición -->
            <div v-else class="formgrid grid">
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Departamento *</label>
                <pv-input-text
                  v-model="editableAddressData.addressDepartment"
                  class="w-full"
                  placeholder="Ej: Lima"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Provincia *</label>
                <pv-input-text
                  v-model="editableAddressData.addressProvince"
                  class="w-full"
                  placeholder="Ej: Lima"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Distrito *</label>
                <pv-input-text
                  v-model="editableAddressData.addressDistrict"
                  class="w-full"
                  placeholder="Ej: San Isidro"
                />
              </div>
              
              <div class="field col-12">
                <label class="text-sm font-semibold text-700 mb-2 block">Dirección de domicilio *</label>
                <pv-input-text
                  v-model="editableAddressData.addressStreet"
                  class="w-full"
                  placeholder="Ej: Av. Javier Prado 123, Dpto. 501"
                />
              </div>
              
              <div class="field col-12">
                <label class="text-sm font-semibold text-700 mb-2 block">Ubicación en Google Maps *</label>
                <pv-input-text
                  v-model="editableAddressData.addressLocation"
                  class="w-full"
                  placeholder="https://maps.google.com/?q=..."
                />
                <small class="text-600">Ingrese la URL completa de Google Maps</small>
              </div>
            </div>
          </template>
        </pv-card>

        <!-- ====================== Card -> Documentos adjuntos ====================== -->
        <pv-card class="w-full" id="documents-section">
          <template #header>
            <div class="flex align-items-center justify-content-between px-3 py-2"
                 :class="{
                   'bg-orange-500 text-white': canEditIdentityDocument || canEditUtilityBill || canEditFacadePhoto
                 }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-paperclip"></i>
                <span class="text-lg font-bold">Documentos adjuntos</span>
                <i v-if="canEditIdentityDocument || canEditUtilityBill || canEditFacadePhoto" 
                   class="pi pi-exclamation-triangle ml-2"></i>
              </div>
              
              <!-- Botones de Subsanar/Cancelar -->
              <div class="flex gap-2">
                <!-- Botón Subsanar (cuando está editando y hay archivo seleccionado) -->
                <pv-button 
                  v-if="isEditingDocuments && pendingDocumentUpload.file"
                  label="Subsanar"
                  :icon="isSavingDocument ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                  class="p-button-sm p-button-success"
                  :loading="isSavingDocument"
                  :disabled="isSavingDocument"
                  @click="saveDocument"
                />
                
                <!-- Botón Cancelar (cuando está editando) -->
                <pv-button 
                  v-if="isEditingDocuments"
                  label="Cancelar"
                  icon="pi pi-times"
                  class="p-button-sm p-button-secondary"
                  :disabled="isSavingDocument"
                  @click="cancelSubsanation"
                />
              </div>
            </div>
          </template>
          <template #content>
            <div v-if="filteredDocuments && filteredDocuments.length > 0" class="formgrid grid">
              <!-- Mostrar documentos disponibles dinámicamente en 3 columnas -->
              <div
                v-for="(document, index) in filteredDocuments"
                :key="document.id"
                class="field col-12 md:col-4"
              >
                <div class="p-3 border-round border-2 surface-border h-full position-relative"
                  :class="{
                    'bg-blue-50': index % 6 === 0,
                    'bg-green-50': index % 6 === 1,
                    'bg-purple-50': index % 6 === 2,
                    'bg-orange-50': index % 6 === 3,
                    'bg-pink-50': index % 6 === 4,
                    'bg-cyan-50': index % 6 === 5,
                    'border-orange-500 border-3': canEditDocument(document.type)
                  }">
                  
                  <!-- Badge de observación pendiente -->
                  <div v-if="canEditDocument(document.type)" 
                       class="absolute top-0 right-0 m-2 px-2 py-1 border-round bg-orange-500 text-white text-xs font-bold flex align-items-center gap-1"
                       style="z-index: 1;">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>REQUIERE ACTUALIZACIÓN</span>
                  </div>
                  
                  <label class="text-xs font-semibold uppercase mb-2 flex align-items-center gap-2"
                    :class="{
                      'text-blue-700': index % 6 === 0,
                      'text-green-700': index % 6 === 1,
                      'text-purple-700': index % 6 === 2,
                      'text-orange-700': index % 6 === 3,
                      'text-pink-700': index % 6 === 4,
                      'text-cyan-700': index % 6 === 5
                    }">
                    <i :class="[`pi ${getFileIcon(document.url)}`, {
                      'text-blue-600': index % 6 === 0,
                      'text-green-600': index % 6 === 1,
                      'text-purple-600': index % 6 === 2,
                      'text-orange-600': index % 6 === 3,
                      'text-pink-600': index % 6 === 4,
                      'text-cyan-600': index % 6 === 5
                    }]"></i>
                    {{ document.displayName }}
                  </label>
                  
                  <!-- Mensaje de observación dentro de la card -->
                  <div v-if="getObservationForDocument(document.type)" 
                       class="mb-3 p-2 border-round bg-orange-100 border-1 border-orange-300">
                    <div class="flex align-items-start gap-2">
                      <i class="pi pi-info-circle text-orange-600 mt-1"></i>
                      <div class="flex-1">
                        <p class="text-xs font-semibold text-orange-900 m-0 mb-1">
                          {{ ObservationTypeTranslations[getObservationForDocument(document.type).observationType] }}
                        </p>
                        <p class="text-xs text-orange-800 m-0">
                          {{ getObservationForDocument(document.type).description }}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex flex-column align-items-center mt-2">
                    <!-- Mostrar imagen si es un archivo de imagen -->
                    <div v-if="isImageFile(document.url)" class="w-full flex justify-content-center mb-3">
                      <img
                        :src="document.url || 'https://via.placeholder.com/150x100'"
                        :alt="getDocumentLabel(document.type)"
                        class="w-full max-w-10rem h-6rem object-fit-cover border-round shadow-2 transition-all transition-duration-200"
                        @error="handleImageError"
                      />
                    </div>
                    <!-- Mostrar icono para archivos no imagen -->
                    <div v-else class="w-full flex flex-column align-items-center mb-3">
                      <i :class="`pi ${getFileIcon(document.url)} ${getFileColor(document.url)} text-6xl mb-2 transition-all transition-duration-200`"></i>
                      <span class="text-sm text-600 font-medium uppercase">{{ getFileExtension(document.url) || 'Archivo' }}</span>
                    </div>
                    <!-- Botones de acción -->
                    <div class="flex flex-column gap-2 w-full">
                      <pv-button
                        icon="pi pi-eye"
                        label="Ver"
                        class="p-button-sm p-button-primary w-full"
                        @click="viewDocument(document)"
                        :disabled="!document.url"
                      />
                      <pv-button
                        icon="pi pi-download"
                        label="Descargar"
                        class="p-button-sm p-button-outlined w-full"
                        @click="downloadDocument(document.type, document)"
                        :disabled="!document.url"
                      />
                      <!-- Botón de reemplazar documento (solo si hay observación pendiente y está editando) -->
                      <div v-if="canEditDocument(document.type) && isEditingDocuments" class="w-full">
                        <input
                          type="file"
                          :id="`file-upload-${document.id}`"
                          style="display: none;"
                          accept="image/*,application/pdf"
                          @change="handleFileSelect($event, document.id)"
                        />
                        <pv-button
                          icon="pi pi-upload"
                          :label="pendingDocumentUpload.documentId === document.id && pendingDocumentUpload.file ? 'Archivo seleccionado ✓' : 'Seleccionar archivo'"
                          :class="[
                            'p-button-sm w-full',
                            pendingDocumentUpload.documentId === document.id && pendingDocumentUpload.file ? 'p-button-success' : 'p-button-warning'
                          ]"
                          @click="triggerFileUpload(document.id)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mensaje cuando no hay documentos -->
            <div v-else class="text-center py-4">
              <i class="pi pi-file-excel text-4xl text-600"></i>
              <p class="text-600 mt-2 mb-0">No hay documentos adjuntos disponibles</p>
            </div>
          </template>
        </pv-card>

        <!-- ====================== Card -> Datos del arrendador ====================== -->
        <pv-card class="w-full" v-if="orderDetail?.isTenant" id="landlord-section">
          <template #header>
            <div class="flex align-items-center justify-content-between px-3 py-2"
                 :class="{
                   'bg-orange-500 text-white': canEditLandlordData
                 }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-home"></i>
                <span class="text-lg font-bold">Datos del arrendador</span>
                <i v-if="canEditLandlordData" class="pi pi-exclamation-triangle ml-2"></i>
              </div>
              <!-- Botón de Subsanar -->
              <div v-if="canEditLandlordData && isEditingLandlord" class="flex gap-2">
                <pv-button
                  icon="pi pi-check-circle"
                  label="Subsanar"
                  class="p-button-sm p-button-success"
                  @click="saveLandlordData"
                />
                <pv-button
                  icon="pi pi-times"
                  label="Cancelar"
                  class="p-button-sm p-button-secondary"
                  @click="cancelSubsanation"
                />
              </div>
            </div>
          </template>
          <template #content>
            <!-- Modo lectura -->
            <div v-if="!isEditingLandlord" class="formgrid grid">
              <div class="field col-12 md:col-8">
                <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                  <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-user text-blue-600"></i>
                    Nombre completo
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ orderDetail?.landlordName || 'No disponible' }}</p>
                </div>
              </div>
              <div class="field col-12 md:col-4">
                <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                  <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                    <i class="pi pi-phone text-green-600"></i>
                    Número de contacto
                  </label>
                  <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(orderDetail?.landlordPhoneNumber) }}</p>
                </div>
              </div>
            </div>

            <!-- Modo edición -->
            <div v-else class="formgrid grid">
              <div class="field col-12 md:col-8">
                <label class="text-sm font-semibold text-700 mb-2 block">Nombre completo *</label>
                <pv-input-text
                  v-model="editableLandlordData.landlordName"
                  class="w-full"
                  placeholder="Ingrese nombre completo del arrendador"
                />
              </div>
              
              <div class="field col-12 md:col-4">
                <label class="text-sm font-semibold text-700 mb-2 block">Número de contacto *</label>
                <pv-input-text
                  v-model="editableLandlordData.landlordPhoneNumber"
                  class="w-full"
                  placeholder="Ingrese teléfono"
                />
              </div>
            </div>
          </template>
        </pv-card>

      </div>

    </div>
  </div>

  <!-- Modal compartido para visualizar imágenes -->
  <image-viewer-modal
    v-model:visible="showModal"
    :image-url="currentImage?.url"
    :image-name="currentImage?.name"
    :image-alt="currentImage?.alt"
    :zoom="zoom"
    @zoom-in="zoomIn"
    @zoom-out="zoomOut"
    @reset-zoom="resetZoom"
    @download="downloadCurrentImage"
    @error="handleImageLoadError"
  />

  <!-- Modal para visualizar documentos NO-imagen (PDFs, etc.) -->
  <pv-dialog 
    v-model:visible="showDocumentModal" 
    :modal="true" 
    :closable="true"
    :draggable="false"
    :resizable="false"
    class="document-viewer-modal w-full"
    :breakpoints="{'960px': '90vw', '640px': '95vw'}"
    :style="{ maxWidth: '800px' }"
    @hide="closeDocumentModal"
  >
    <template #header>
      <div class="flex align-items-center gap-2">
        <i :class="`pi ${getFileIcon(selectedDocument?.url)} ${getFileColor(selectedDocument?.url)}`"></i>
        <span class="font-semibold">{{ selectedDocument?.displayName || getDocumentLabel(selectedDocument?.type) }}</span>
      </div>
    </template>

    <div class="document-viewer-content" v-if="selectedDocument">
      <!-- Visualizador para documentos no imagen -->
      <div class="document-preview">
        <!-- Vista previa con icono (cuando no se muestra contenido) -->
        <div v-if="!showDocumentContent" class="text-center py-6">
          <div class="flex flex-column align-items-center gap-4">
            <i :class="`pi ${getFileIcon(selectedDocument.url)} ${getFileColor(selectedDocument.url)} text-8xl`"></i>
            <div class="flex flex-column align-items-center gap-2">
              <h4 class="m-0">{{ selectedDocument?.displayName || getDocumentLabel(selectedDocument.type) }}</h4>
              <span class="text-lg font-medium text-color-secondary uppercase">{{ getFileExtension(selectedDocument.url) }}</span>
              <p class="text-color-secondary m-0" v-if="!canShowContent(selectedDocument.url)">
                Este tipo de archivo no se puede previsualizar
              </p>
              <p class="text-color-secondary m-0" v-else>
                Haz clic en "Ver contenido" para visualizar el documento
              </p>
            </div>
          </div>
        </div>

        <!-- Visualización del contenido del documento -->
        <div v-else class="document-content-viewer">
          <div class="content-header mb-3 flex justify-content-between align-items-center">
            <h5 class="m-0 flex align-items-center gap-2">
              <i :class="`pi ${getFileIcon(selectedDocument.url)} ${getFileColor(selectedDocument.url)}`"></i>
              Contenido del documento
            </h5>
            <pv-button 
              icon="pi pi-eye-slash" 
              label="Ocultar"
              class="p-button-sm p-button-text"
              @click="toggleDocumentContent"
            />
          </div>
          <div class="content-frame-container">
            <iframe 
              :src="getContentViewerUrl(selectedDocument.url)"
              class="document-content-frame"
              frameborder="0"
              @load="$event.target.style.opacity = '1'"
              @error="$event.target.style.display = 'none'"
            ></iframe>
            <!-- Mensaje de carga -->
            <div class="loading-message text-center py-4 text-color-secondary">
              <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
              <p class="m-0">Cargando documento...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-container">
        <!-- Sección izquierda: Acciones del documento -->
        <div class="footer-actions-left">
          <pv-button 
            icon="pi pi-download" 
            label="Descargar"
            class="p-button-outlined"
            @click="downloadDocument(selectedDocument?.type, selectedDocument)"
            :disabled="!selectedDocument?.url"
          />
          <pv-button 
            v-if="canShowContent(selectedDocument?.url)"
            :icon="showDocumentContent ? 'pi pi-eye-slash' : 'pi pi-eye'"
            :label="showDocumentContent ? 'Ocultar contenido' : 'Ver contenido'"
            class="p-button-primary"
            @click="toggleDocumentContent"
          />
        </div>
        
        <!-- Sección derecha: Acción de cerrar -->
        <div class="footer-actions-right">
          <pv-button 
            icon="pi pi-times" 
            label="Cerrar"
            class="p-button-text"
            @click="closeDocumentModal"
          />
        </div>
      </div>
    </template>
  </pv-dialog>
</template>

<style scoped>
.document-content-frame {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.loading-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.content-frame-container {
  position: relative;
}

.modal-footer-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.footer-actions-left {
  display: flex;
  gap: 0.5rem;
}

.footer-actions-right {
  display: flex;
  gap: 0.5rem;
}

/* Highlight effect for scroll navigation */
.highlight-section {
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
  0%, 100% {
    box-shadow: none;
  }
  50% {
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.4);
    transform: scale(1.01);
  }
}
</style>
