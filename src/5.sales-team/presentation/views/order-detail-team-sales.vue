<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import ImageViewerModal from '../../../shared-v2/presentation/components/image-viewer-modal.vue';
import useVerificationOrderStore from '../../../1.verification-orders/application/verification-order.store.js';
import { useSalesTeamStore } from '../../application/sales-team.store.js';
import { OrderRequestStatus, ObservationType } from '../../../0.verification-order-requests/domain/constants/order-request.constants.js';
import { ObservationTypeTranslations, ObservationTypeIcons } from '../../../0.verification-order-requests/presentation/constants/order-request-ui.constants.js';
import { OrderRequestApi } from '../../../0.verification-order-requests/infrastructure/order-request.api.js';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { useImageViewer } from '../../../shared-v2/composables/use-image-viewer.js';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Router
const route = useRoute();
const router = useRouter();

// Stores & Services
const store = useVerificationOrderStore();
const salesTeamStore = useSalesTeamStore();
const orderRequestApi = new OrderRequestApi();
const { showSuccess, showError } = useNotification();
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

// State
const orderDetail = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const loadingStep = ref(0);

// Subsanation loading states
const isSavingClient = ref(false);
const isSavingAddress = ref(false);
const isSavingDocument = ref(false);
const isDownloadingReport = ref(false);

// Document modal
const showDocumentModal = ref(false);
const selectedDocument = ref(null);
const showDocumentContent = ref(false);

const LOADING_STEPS = [
  { icon: 'pi-file-o',  label: 'Datos de la orden' },
  { icon: 'pi-users',   label: 'Información del cliente' },
  { icon: 'pi-cog',     label: 'Detalles del servicio' },
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

let loadingProgressInterval = null;

// ─── Subsanation state ────────────────────────────────────────────────────────

const isSubsanationMode = ref(false);
const currentObservation = ref(null);
const isEditingClient = ref(false);
const isEditingAddress = ref(false);
const isEditingLandlord = ref(false);
const isEditingDocuments = ref(false);

const pendingDocumentUpload = ref({ documentId: null, file: null });

const editableClientData = ref({
  clientName: '', clientLastName: '', clientPhoneNumber: '',
  clientDocumentType: '', clientDocumentNumber: ''
});
const editableAddressData = ref({
  addressDepartment: '', addressProvince: '', addressDistrict: '',
  addressStreet: '', addressLocation: ''
});
const editableLandlordData = ref({
  landlordName: '', landlordPhoneNumber: ''
});

// ─── Computed ─────────────────────────────────────────────────────────────────

const pendingObservations = computed(() => {
  if (!orderDetail.value?.observations) return [];
  if (orderDetail.value.status !== OrderRequestStatus.OBSERVADO) return [];
  return orderDetail.value.observations.filter(o => o.status === 'PENDIENTE');
});

const canEditIdentityDocument = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO &&
    currentObservation.value.observationType === ObservationType.DOCUMENTO_IDENTIDAD_BORROSO;
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
const canEditLocation = computed(() => {
  if (!isSubsanationMode.value || !currentObservation.value) return false;
  return orderDetail.value?.status === OrderRequestStatus.OBSERVADO &&
    currentObservation.value.observationType === ObservationType.UBICACION_INCORRECTA;
});

const canDownloadReport = computed(() =>
  orderDetail.value?.status === OrderRequestStatus.COMPLETADA && orderDetail.value?.reportId
);

const filteredDocuments = computed(() => {
  if (!orderDetail.value?.attachedDocuments) return [];
  return orderDetail.value.attachedDocuments.map((doc, index) => ({
    ...doc,
    displayName: doc.type || `Documento ${index + 1}`
  }));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simulateLoadingProgress() {
  clearLoadingInterval();
  loadingProgressInterval = setInterval(() => {
    if (loadingStep.value < LOADING_STEPS.length - 1) loadingStep.value++;
    else clearLoadingInterval();
  }, 200);
  setTimeout(() => clearLoadingInterval(), 4000);
}

function clearLoadingInterval() {
  if (loadingProgressInterval) { clearInterval(loadingProgressInterval); loadingProgressInterval = null; }
}

function clearData() {
  orderDetail.value   = null;
  hasError.value      = false;
  errorMessage.value  = '';
  loadingStep.value   = 0;
  cancelSubsanation();
}

const isImageFile = (url) => url && IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));

const getFileExtension = (url) => {
  if (!url) return '';
  const m = url.match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : '';
};

const getFileIcon = (url) => {
  const icons = { pdf:'pi-file-pdf', doc:'pi-file-word', docx:'pi-file-word', xls:'pi-file-excel', xlsx:'pi-file-excel', txt:'pi-file', jpg:'pi-image', jpeg:'pi-image', png:'pi-image', gif:'pi-image', bmp:'pi-image', webp:'pi-image' };
  return icons[getFileExtension(url)] || 'pi-file';
};

const getFileColor = (url) => {
  const colors = { pdf:'text-red-500', doc:'text-blue-500', docx:'text-blue-500', xls:'text-green-500', xlsx:'text-green-500', txt:'text-gray-500', jpg:'text-purple-500', jpeg:'text-purple-500', png:'text-purple-500', gif:'text-purple-500', bmp:'text-purple-500', webp:'text-purple-500' };
  return colors[getFileExtension(url)] || 'text-gray-500';
};

const getDocumentLabel = (doc) => {
  if (typeof doc === 'object' && doc?.displayName) return doc.displayName;
  return (typeof doc === 'string' ? doc : doc?.type) || 'Documento';
};

const viewDocument = (doc) => {
  if (isImageFile(doc.url)) {
    openImage({ url: doc.url, description: doc.displayName, alt: getDocumentLabel(doc.type) });
  } else {
    selectedDocument.value = doc;
    showDocumentModal.value = true;
  }
};

const downloadDocument = async (type, doc = null) => {
  try {
    if (!doc?.url) return;
    await downloadImage({ url: doc.url, description: getDocumentLabel(type), alt: doc.displayName });
  } catch { showError('No se pudo descargar el documento. Intente nuevamente.'); }
};

const downloadReport = async () => {
  if (!orderDetail.value?.reportId) { showError('ID de reporte no disponible.'); return; }
  isDownloadingReport.value = true;
  try {
    const response = await orderRequestApi.getReportDownloadUrl(orderDetail.value.reportId);
    const downloadUrl = response.data?.reportUrl;
    if (!downloadUrl) { showError('No se pudo obtener la URL del reporte.'); return; }
    window.open(downloadUrl, '_blank');
    showSuccess('Reporte descargado exitosamente.');
  } catch { showError('No se pudo descargar el reporte. Intente nuevamente.'); }
  finally { isDownloadingReport.value = false; }
};

const closeDocumentModal = () => {
  showDocumentModal.value = false;
  selectedDocument.value = null;
  showDocumentContent.value = false;
};

const toggleDocumentContent = () => { showDocumentContent.value = !showDocumentContent.value; };

const canShowContent = (url) => url && ['pdf','txt','html','htm'].includes(getFileExtension(url));

const getContentViewerUrl = (url) =>
  getFileExtension(url) === 'pdf' ? `${url}#toolbar=1&navpanes=1&scrollbar=1` : url;

const handleImageError = (event) => { event.target.src = 'https://via.placeholder.com/150x100?text=Error'; };

function canEditDocument(documentType) {
  if (!documentType) return false;
  const t = documentType.toUpperCase().trim();
  const identityTypes = ['DNI','CE','PTP','CARNET_EXTRANJERIA','DOCUMENTO_IDENTIDAD'];
  if (identityTypes.includes(t)) return canEditIdentityDocument.value;
  if (t.includes('RECIBO')) return canEditUtilityBill.value;
  if (t.includes('FACHADA')) return canEditFacadePhoto.value;
  return false;
}

function getObservationForDocument(documentType) {
  if (!documentType || !orderDetail.value?.observations) return null;
  if (orderDetail.value.status !== OrderRequestStatus.OBSERVADO) return null;
  const t = documentType.toUpperCase().trim();
  let observationType = null;
  if (['DNI','CE','PTP','CARNET_EXTRANJERIA','DOCUMENTO_IDENTIDAD'].includes(t))
    observationType = ObservationType.DOCUMENTO_IDENTIDAD_BORROSO;
  else if (t.includes('RECIBO')) observationType = ObservationType.RECIBO_SERVICIO_BORROSO;
  else if (t.includes('FACHADA')) observationType = ObservationType.FOTO_FACHADA_BORROSA;
  if (!observationType) return null;
  return orderDetail.value.observations.find(o => o.observationType === observationType && o.status === 'PENDIENTE');
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function goBack() {
  const emp = salesTeamStore.selectedEmployee;
  if (emp) router.push({ name: 'employee-orders', params: { employeeId: emp.id } });
  else router.push({ name: 'sales-team-list' });
}

// ─── Subsanation flow ─────────────────────────────────────────────────────────

function startSubsanation(observation) {
  currentObservation.value = observation;
  isSubsanationMode.value  = true;

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
  scrollToSection(observation.observationType);
}

function cancelSubsanation() {
  currentObservation.value  = null;
  isSubsanationMode.value   = false;
  isEditingClient.value     = false;
  isEditingAddress.value    = false;
  isEditingLandlord.value   = false;
  isEditingDocuments.value  = false;
  pendingDocumentUpload.value = { documentId: null, file: null };
}

function scrollToSection(observationType) {
  const map = {
    [ObservationType.DOCUMENTO_IDENTIDAD_BORROSO]: 'sales-documents-section',
    [ObservationType.RECIBO_SERVICIO_BORROSO]:      'sales-documents-section',
    [ObservationType.FOTO_FACHADA_BORROSA]:         'sales-documents-section',
    [ObservationType.DATOS_CLIENTE_INCOMPLETOS]:    'sales-client-section',
    [ObservationType.DATOS_ARRENDADOR_INCOMPLETOS]: 'sales-landlord-section',
    [ObservationType.UBICACION_INCORRECTA]:         'sales-address-section',
  };
  const sectionId = map[observationType];
  if (!sectionId) return;
  nextTick(() => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      el.classList.add('highlight-section');
      setTimeout(() => el.classList.remove('highlight-section'), 2000);
    }, 100);
  });
}

async function resolveObservation(observation) {
  if (!observation?.id) return;
  await orderRequestApi.updateObservation(orderDetail.value.orderId, observation.id, {
    observationType: observation.observationType,
    description: observation.description,
    status: 'RESUELTA'
  });
}

// ─── Save handlers ────────────────────────────────────────────────────────────

async function saveClientData() {
  if (!orderDetail.value?.orderId) return;
  isSavingClient.value = true;
  try {
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, {
      ...buildBaseDto(),
      clientName: editableClientData.value.clientName,
      clientLastName: editableClientData.value.clientLastName,
      clientPhoneNumber: editableClientData.value.clientPhoneNumber,
      clientDocumentType: editableClientData.value.clientDocumentType,
      clientDocumentNumber: editableClientData.value.clientDocumentNumber,
    });
    await resolveObservation(currentObservation.value);
    showSuccess('Datos del cliente actualizados y observación resuelta.');
    cancelSubsanation();
    await loadOrderDetail();
  } catch { showError('No se pudo actualizar los datos del cliente.'); }
  finally { isSavingClient.value = false; }
}

async function saveAddressData() {
  if (!orderDetail.value?.orderId) return;
  isSavingAddress.value = true;
  try {
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, {
      ...buildBaseDto(),
      addressDepartment: editableAddressData.value.addressDepartment,
      addressProvince: editableAddressData.value.addressProvince,
      addressDistrict: editableAddressData.value.addressDistrict,
      addressStreet: editableAddressData.value.addressStreet,
      addressLocation: editableAddressData.value.addressLocation,
    });
    await resolveObservation(currentObservation.value);
    showSuccess('Dirección actualizada y observación resuelta.');
    cancelSubsanation();
    await loadOrderDetail();
  } catch { showError('No se pudo actualizar la dirección.'); }
  finally { isSavingAddress.value = false; }
}

async function saveLandlordData() {
  if (!orderDetail.value?.orderId) return;
  try {
    await orderRequestApi.updateOrderFields(orderDetail.value.orderId, {
      ...buildBaseDto(),
      landlordName: editableLandlordData.value.landlordName,
      landlordPhoneNumber: editableLandlordData.value.landlordPhoneNumber,
    });
    await resolveObservation(currentObservation.value);
    showSuccess('Datos del arrendador actualizados y observación resuelta.');
    cancelSubsanation();
    await loadOrderDetail();
  } catch { showError('No se pudo actualizar los datos del arrendador.'); }
}

async function saveDocument() {
  if (!pendingDocumentUpload.value.file || !pendingDocumentUpload.value.documentId) {
    showError('Debe seleccionar un archivo primero.');
    return;
  }
  isSavingDocument.value = true;
  try {
    const { documentId, file } = pendingDocumentUpload.value;
    const doc = orderDetail.value.attachedDocuments?.find(d => d.id === documentId);
    if (!doc) { showError('Documento no encontrado.'); return; }

    await orderRequestApi.updateDocument(orderDetail.value.orderId, documentId, file);

    const obs = getObservationForDocument(doc.type);
    if (obs?.id) await resolveObservation(obs);

    showSuccess('Documento actualizado y observación resuelta.');
    cancelSubsanation();
    await loadOrderDetail();
  } catch { showError('No se pudo actualizar el documento.'); }
  finally { isSavingDocument.value = false; }
}

function handleFileSelect(event, documentId) {
  const file = event.target.files?.[0];
  if (!file) return;
  const validTypes = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf'];
  if (!validTypes.includes(file.type)) { showError('Solo se permiten imágenes (JPG, PNG, WEBP) y PDF.'); return; }
  if (file.size > 5 * 1024 * 1024) { showError('Tamaño máximo: 5MB.'); return; }
  pendingDocumentUpload.value = { documentId, file };
  showSuccess(`Archivo "${file.name}" seleccionado. Presione "Guardar" para confirmar.`);
  event.target.value = '';
}

function triggerFileUpload(documentId) {
  document.getElementById(`sales-file-upload-${documentId}`)?.click();
}

/** Construye el DTO base con los campos de solo lectura de la orden */
function buildBaseDto() {
  const o = orderDetail.value;
  return {
    companyName: o.companyName, companyExecutiveName: o.companyExecutiveName,
    companyRuc: o.companyRuc, companyEmail: o.companyEmail, companyPhoneNumber: o.companyPhoneNumber,
    clientName: o.clientName, clientLastName: o.clientLastName,
    clientPhoneNumber: o.clientPhoneNumber, clientDocumentType: o.clientDocumentType,
    clientDocumentNumber: o.clientDocumentNumber,
    isTenant: o.isTenant, landlordName: o.landlordName, landlordPhoneNumber: o.landlordPhoneNumber,
    addressDepartment: o.addressDepartment, addressProvince: o.addressProvince,
    addressDistrict: o.addressDistrict, addressStreet: o.addressStreet, addressLocation: o.addressLocation,
    status: o.status
  };
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadData(orderId) {
  if (!orderId) {
    hasError.value = true; errorMessage.value = 'ID de orden no proporcionado';
    isLoading.value = false; return;
  }
  isLoading.value = true; hasError.value = false; loadingStep.value = 0;
  simulateLoadingProgress();
  try {
    const orderResult = await store.fetchById(orderId);
    if (orderResult.success) {
      orderDetail.value = orderResult.data;
      loadingStep.value = LOADING_STEPS.length;
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      hasError.value = true;
      errorMessage.value = orderResult.message || 'Error al cargar los detalles de la orden';
    }
  } catch {
    hasError.value = true;
    errorMessage.value = 'Error al cargar los detalles de la orden. Por favor, intente nuevamente.';
  } finally {
    isLoading.value = false;
    clearLoadingInterval();
  }
}

async function loadOrderDetail() {
  clearData();
  await loadData(route.params.orderId);
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => loadOrderDetail());

watch(() => route.params.orderId, async (newId) => {
  if (newId) { clearData(); await loadData(newId); }
});

onBeforeUnmount(() => clearLoadingInterval());
</script>

<template>
  <div class="h-full w-full flex flex-column">

    <toolbar
      :title="'Detalle de Orden'"
      :description="orderDetail?.orderCode ? `Orden: ${orderDetail.orderCode}` : 'Cargando...'"
      :show-back-button="true"
      @back="goBack"
    >
      <template #actions>
        <div class="flex align-items-center gap-2 px-3 py-2 border-round-md border-2 surface-border bg-blue-50">
          <i class="pi pi-calendar text-blue-600 text-lg"></i>
          <div class="flex flex-column">
            <span class="text-xs font-semibold text-blue-700 uppercase mb-1">Fecha de solicitud</span>
            <span v-if="orderDetail" class="text-base font-bold text-900">
              {{ orderDetail.requestDateFormatted || 'No disponible' }}
            </span>
            <span v-else class="text-sm text-600">Cargando...</span>
          </div>
        </div>
      </template>
    </toolbar>

    <div class="flex-1 p-4 overflow-auto">

      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex justify-content-center align-items-center surface-ground border-round my-3" style="min-height: 50vh;">
        <div class="flex flex-column align-items-center text-center gap-3">
          <pv-progress-spinner size="48" stroke-width="4" animation-duration="1.2s" style="opacity: 0.8;" />
          <div style="max-width: 300px;">
            <h3 class="text-xl font-medium text-900 m-0">Cargando orden de servicio</h3>
            <p class="text-sm text-600 m-0 mt-2">{{ LOADING_STEPS[loadingStep]?.label || 'Preparando datos...' }}</p>
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
              <pv-button label="Reintentar" icon="pi pi-refresh" class="mt-3" @click="loadOrderDetail" />
            </div>
          </template>
        </pv-message>
      </div>

      <!-- Contenido principal -->
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

        <!-- ====================== Modo Subsanación: Banner ====================== -->
        <pv-message v-if="isSubsanationMode && currentObservation" severity="info" :closable="false">
          <div class="flex align-items-center justify-content-between w-full gap-3">
            <div class="flex align-items-start gap-3 flex-1">
              <i class="pi pi-pencil text-xl"></i>
              <div class="flex flex-column gap-1">
                <span class="font-semibold">Modo Subsanación Activado</span>
                <span class="text-sm">Subsanando: {{ ObservationTypeTranslations[currentObservation.observationType] }}</span>
              </div>
            </div>
            <pv-button label="Cancelar" icon="pi pi-times" class="p-button-sm p-button-secondary" @click="cancelSubsanation" />
          </div>
        </pv-message>

        <!-- ====================== Observaciones Pendientes ====================== -->
        <div v-if="pendingObservations.length > 0 && !isSubsanationMode" class="flex flex-column gap-3">
          <pv-card
            v-for="obs in pendingObservations"
            :key="obs.id"
            class="border-2 border-orange-300 shadow-3"
          >
            <template #content>
              <div class="flex align-items-center justify-content-between gap-4">
                <div class="flex align-items-start gap-3 flex-1">
                  <div class="flex align-items-center justify-content-center w-3rem h-3rem border-circle bg-orange-100">
                    <i :class="`pi ${ObservationTypeIcons[obs.observationType] || 'pi-exclamation-triangle'} text-orange-600 text-xl`"></i>
                  </div>
                  <div class="flex flex-column gap-2 flex-1">
                    <div class="flex align-items-center gap-2">
                      <span class="font-bold text-900">{{ ObservationTypeTranslations[obs.observationType] || obs.observationType }}</span>
                      <pv-tag value="PENDIENTE" severity="warn" />
                    </div>
                    <p class="text-600 m-0 line-height-3">{{ obs.description }}</p>
                  </div>
                </div>
                <pv-button
                  label="Subsanar Observación"
                  icon="pi pi-check-circle"
                  class="p-button-warning p-button-lg"
                  @click="startSubsanation(obs)"
                />
              </div>
            </template>
          </pv-card>
        </div>

        <!-- ====================== Secciones de detalle ====================== -->
        <div class="flex flex-column gap-3">

            <!-- Card: Datos del solicitante -->
            <pv-card>
              <template #header>
                <div class="flex align-items-center gap-2 px-3 pt-3 pb-2">
                  <i class="pi pi-briefcase text-blue-600"></i>
                  <span class="text-lg font-bold">Datos del solicitante</span>
                </div>
              </template>
              <template #content>
                <div class="formgrid grid">
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Razón Social</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.companyName || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
                      <label class="text-xs font-semibold text-teal-700 uppercase mb-2 block">Marca</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.brandName || 'No especificado' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
                      <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 block">RUC</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.companyRuc || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
                      <label class="text-xs font-semibold text-purple-700 uppercase mb-2 block">Ejecutivo</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.companyExecutiveName || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                      <label class="text-xs font-semibold text-green-700 uppercase mb-2 block">Teléfono</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.companyPhoneNumber || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
                      <label class="text-xs font-semibold text-orange-700 uppercase mb-2 block">Correo</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.companyEmail || 'No disponible' }}</p>
                    </div>
                  </div>
                </div>
              </template>
            </pv-card>

            <!-- Card: Datos del cliente -->
            <pv-card id="sales-client-section">
              <template #header>
                <div
                  class="flex align-items-center justify-content-between px-3 pt-3 pb-2 border-round-top"
                  :class="{ 'bg-orange-500 text-white': canEditClientData }"
                >
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-user"></i>
                    <span class="text-lg font-bold">Datos del cliente</span>
                    <i v-if="canEditClientData" class="pi pi-exclamation-triangle ml-2"></i>
                  </div>
                  <div v-if="canEditClientData && isEditingClient" class="flex gap-2">
                    <pv-button
                      label="Guardar"
                      icon="pi pi-check"
                      class="p-button-sm p-button-success"
                      :loading="isSavingClient"
                      @click="saveClientData"
                    />
                    <pv-button
                      label="Cancelar"
                      icon="pi pi-times"
                      class="p-button-sm p-button-secondary"
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
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Nombre</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.clientName || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Apellido</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.clientLastName || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                      <label class="text-xs font-semibold text-green-700 uppercase mb-2 block">Teléfono</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.clientPhoneNumber || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
                      <label class="text-xs font-semibold text-purple-700 uppercase mb-2 block">Tipo de Documento</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.clientDocumentType || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
                      <label class="text-xs font-semibold text-purple-700 uppercase mb-2 block">Número de Documento</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.clientDocumentNumber || 'No disponible' }}</p>
                    </div>
                  </div>
                </div>
                <!-- Modo edición -->
                <div v-else class="formgrid grid">
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Nombre *</label>
                    <pv-input-text v-model="editableClientData.clientName" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Apellido *</label>
                    <pv-input-text v-model="editableClientData.clientLastName" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Teléfono</label>
                    <pv-input-text v-model="editableClientData.clientPhoneNumber" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Tipo de Documento</label>
                    <pv-select
                      v-model="editableClientData.clientDocumentType"
                      :options="[{label:'DNI',value:'DNI'},{label:'Carnet de Extranjería',value:'CARNET_EXTRANJERIA'},{label:'PTP',value:'PTP'}]"
                      option-label="label"
                      option-value="value"
                      class="w-full"
                    />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Número de Documento</label>
                    <pv-input-text v-model="editableClientData.clientDocumentNumber" class="w-full" />
                  </div>
                </div>
              </template>
            </pv-card>

            <!-- Card: Dirección -->
            <pv-card id="sales-address-section">
              <template #header>
                <div
                  class="flex align-items-center justify-content-between px-3 pt-3 pb-2 border-round-top"
                  :class="{ 'bg-orange-500 text-white': canEditLocation }"
                >
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-map-marker"></i>
                    <span class="text-lg font-bold">Dirección</span>
                    <i v-if="canEditLocation" class="pi pi-exclamation-triangle ml-2"></i>
                  </div>
                  <div v-if="canEditLocation && isEditingAddress" class="flex gap-2">
                    <pv-button
                      label="Guardar"
                      icon="pi pi-check"
                      class="p-button-sm p-button-success"
                      :loading="isSavingAddress"
                      @click="saveAddressData"
                    />
                    <pv-button
                      label="Cancelar"
                      icon="pi pi-times"
                      class="p-button-sm p-button-secondary"
                      @click="cancelSubsanation"
                    />
                  </div>
                </div>
              </template>
              <template #content>
                <!-- Modo lectura -->
                <div v-if="!isEditingAddress" class="formgrid grid">
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Departamento</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.addressDepartment || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Provincia</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.addressProvince || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-4">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Distrito</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.addressDistrict || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-6">
                    <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
                      <label class="text-xs font-semibold text-teal-700 uppercase mb-2 block">Dirección</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.addressStreet || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-6">
                    <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
                      <label class="text-xs font-semibold text-teal-700 uppercase mb-2 block">Referencia / Ubicación</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.addressLocation || 'No disponible' }}</p>
                    </div>
                  </div>
                </div>
                <!-- Modo edición -->
                <div v-else class="formgrid grid">
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Departamento *</label>
                    <pv-input-text v-model="editableAddressData.addressDepartment" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Provincia *</label>
                    <pv-input-text v-model="editableAddressData.addressProvince" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label class="font-semibold mb-2 block">Distrito *</label>
                    <pv-input-text v-model="editableAddressData.addressDistrict" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Dirección *</label>
                    <pv-input-text v-model="editableAddressData.addressStreet" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Referencia / Ubicación</label>
                    <pv-input-text v-model="editableAddressData.addressLocation" class="w-full" />
                  </div>
                </div>
              </template>
            </pv-card>

            <!-- Card: Arrendador (si aplica) -->
            <pv-card v-if="orderDetail.isTenant" id="sales-landlord-section">
              <template #header>
                <div
                  class="flex align-items-center justify-content-between px-3 pt-3 pb-2 border-round-top"
                  :class="{ 'bg-orange-500 text-white': canEditLandlordData }"
                >
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-users"></i>
                    <span class="text-lg font-bold">Datos del Arrendador</span>
                    <i v-if="canEditLandlordData" class="pi pi-exclamation-triangle ml-2"></i>
                  </div>
                  <div v-if="canEditLandlordData && isEditingLandlord" class="flex gap-2">
                    <pv-button
                      label="Guardar"
                      icon="pi pi-check"
                      class="p-button-sm p-button-success"
                      @click="saveLandlordData"
                    />
                    <pv-button
                      label="Cancelar"
                      icon="pi pi-times"
                      class="p-button-sm p-button-secondary"
                      @click="cancelSubsanation"
                    />
                  </div>
                </div>
              </template>
              <template #content>
                <!-- Modo lectura -->
                <div v-if="!isEditingLandlord" class="formgrid grid">
                  <div class="field col-12 md:col-6">
                    <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
                      <label class="text-xs font-semibold text-blue-700 uppercase mb-2 block">Nombre del Arrendador</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.landlordName || 'No disponible' }}</p>
                    </div>
                  </div>
                  <div class="field col-12 md:col-6">
                    <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
                      <label class="text-xs font-semibold text-green-700 uppercase mb-2 block">Teléfono del Arrendador</label>
                      <p class="text-base font-bold text-900 m-0">{{ orderDetail.landlordPhoneNumber || 'No disponible' }}</p>
                    </div>
                  </div>
                </div>
                <!-- Modo edición -->
                <div v-else class="formgrid grid">
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Nombre del Arrendador *</label>
                    <pv-input-text v-model="editableLandlordData.landlordName" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label class="font-semibold mb-2 block">Teléfono del Arrendador</label>
                    <pv-input-text v-model="editableLandlordData.landlordPhoneNumber" class="w-full" />
                  </div>
                </div>
              </template>
            </pv-card>

            <!-- Card: Documentos -->
            <pv-card id="sales-documents-section">
              <template #header>
                <div
                  class="flex align-items-center justify-content-between px-3 pt-3 pb-2 border-round-top"
                  :class="{ 'bg-orange-500 text-white': isEditingDocuments }"
                >
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-paperclip"></i>
                    <span class="text-lg font-bold">Documentos adjuntos</span>
                    <i v-if="isEditingDocuments" class="pi pi-exclamation-triangle ml-2"></i>
                  </div>
                  <div v-if="isEditingDocuments" class="flex gap-2">
                    <pv-button
                      v-if="pendingDocumentUpload.file"
                      label="Subsanar"
                      icon="pi pi-check"
                      class="p-button-sm p-button-success"
                      :loading="isSavingDocument"
                      @click="saveDocument"
                    />
                    <pv-button
                      label="Cancelar"
                      icon="pi pi-times"
                      class="p-button-sm p-button-secondary"
                      @click="cancelSubsanation"
                    />
                  </div>
                </div>
              </template>
              <template #content>
                <div v-if="filteredDocuments.length === 0" class="text-center py-4">
                  <i class="pi pi-file-excel text-4xl text-600"></i>
                  <p class="text-600 mt-2 mb-0">No hay documentos adjuntos disponibles</p>
                </div>
                <div v-else class="formgrid grid">
                  <div
                    v-for="(doc, index) in filteredDocuments"
                    :key="doc.id"
                    class="field col-12 md:col-4"
                  >
                    <div
                      class="p-3 border-round border-2 surface-border h-full position-relative"
                      :class="{
                        'bg-blue-50': index % 6 === 0,
                        'bg-green-50': index % 6 === 1,
                        'bg-purple-50': index % 6 === 2,
                        'bg-orange-50': index % 6 === 3,
                        'bg-pink-50': index % 6 === 4,
                        'bg-cyan-50': index % 6 === 5,
                        'border-orange-500 border-3': canEditDocument(doc.type)
                      }"
                    >
                      <!-- Badge observación pendiente -->
                      <div
                        v-if="canEditDocument(doc.type)"
                        class="absolute top-0 right-0 m-2 px-2 py-1 border-round bg-orange-500 text-white text-xs font-bold flex align-items-center gap-1"
                        style="z-index: 1;"
                      >
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>REQUIERE ACTUALIZACIÓN</span>
                      </div>

                      <label
                        class="text-xs font-semibold uppercase mb-2 flex align-items-center gap-2"
                        :class="{
                          'text-blue-700': index % 6 === 0, 'text-green-700': index % 6 === 1,
                          'text-purple-700': index % 6 === 2, 'text-orange-700': index % 6 === 3,
                          'text-pink-700': index % 6 === 4, 'text-cyan-700': index % 6 === 5
                        }"
                      >
                        <i :class="`pi ${getFileIcon(doc.url)}`"></i>
                        {{ doc.displayName }}
                      </label>

                      <!-- Mensaje de observación -->
                      <div
                        v-if="getObservationForDocument(doc.type)"
                        class="mb-3 p-2 border-round bg-orange-100 border-1 border-orange-300"
                      >
                        <div class="flex align-items-start gap-2">
                          <i class="pi pi-info-circle text-orange-600 mt-1"></i>
                          <div class="flex-1">
                            <p class="text-xs font-semibold text-orange-900 m-0 mb-1">
                              {{ ObservationTypeTranslations[getObservationForDocument(doc.type).observationType] }}
                            </p>
                            <p class="text-xs text-orange-800 m-0">{{ getObservationForDocument(doc.type).description }}</p>
                          </div>
                        </div>
                      </div>

                      <div class="flex flex-column align-items-center mt-2">
                        <!-- Miniatura imagen -->
                        <div v-if="isImageFile(doc.url)" class="w-full flex justify-content-center mb-3">
                          <img
                            :src="doc.url"
                            :alt="getDocumentLabel(doc.type)"
                            class="w-full max-w-10rem h-6rem object-fit-cover border-round shadow-2"
                            @error="handleImageError"
                          />
                        </div>
                        <!-- Icono para no-imagen -->
                        <div v-else class="w-full flex flex-column align-items-center mb-3">
                          <i :class="`pi ${getFileIcon(doc.url)} ${getFileColor(doc.url)} text-6xl mb-2`"></i>
                          <span class="text-sm text-600 font-medium uppercase">{{ getFileExtension(doc.url) || 'Archivo' }}</span>
                        </div>

                        <!-- Botones Ver / Descargar -->
                        <div class="flex flex-column gap-2 w-full">
                          <pv-button
                            icon="pi pi-eye"
                            label="Ver"
                            class="p-button-sm p-button-primary w-full"
                            :disabled="!doc.url"
                            @click="viewDocument(doc)"
                          />
                          <pv-button
                            icon="pi pi-download"
                            label="Descargar"
                            class="p-button-sm p-button-outlined w-full"
                            :disabled="!doc.url"
                            @click="downloadDocument(doc.type, doc)"
                          />
                          <!-- Reemplazar documento (subsanación) -->
                          <div v-if="canEditDocument(doc.type) && isEditingDocuments" class="w-full">
                            <input
                              :id="`sales-file-upload-${doc.id}`"
                              type="file"
                              style="display: none;"
                              accept="image/*,application/pdf"
                              @change="handleFileSelect($event, doc.id)"
                            />
                            <pv-button
                              icon="pi pi-upload"
                              :label="pendingDocumentUpload.documentId === doc.id && pendingDocumentUpload.file ? 'Archivo seleccionado ✓' : 'Seleccionar archivo'"
                              :class="['p-button-sm w-full', pendingDocumentUpload.documentId === doc.id && pendingDocumentUpload.file ? 'p-button-success' : 'p-button-warning']"
                              @click="triggerFileUpload(doc.id)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </pv-card>

        </div>
      </div>

    </div>
  </div>

  <!-- Modal visor de imágenes -->
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

  <!-- Modal visor de documentos no-imagen -->
  <pv-dialog
    v-model:visible="showDocumentModal"
    :modal="true"
    :closable="true"
    :draggable="false"
    :resizable="false"
    class="w-full"
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

    <div v-if="selectedDocument">
      <div v-if="!showDocumentContent" class="text-center py-6">
        <div class="flex flex-column align-items-center gap-4">
          <i :class="`pi ${getFileIcon(selectedDocument.url)} ${getFileColor(selectedDocument.url)} text-8xl`"></i>
          <div class="flex flex-column align-items-center gap-2">
            <h4 class="m-0">{{ selectedDocument.displayName || getDocumentLabel(selectedDocument.type) }}</h4>
            <span class="text-lg font-medium text-color-secondary uppercase">{{ getFileExtension(selectedDocument.url) }}</span>
            <p class="text-color-secondary m-0">
              {{ canShowContent(selectedDocument.url) ? 'Haz clic en "Ver contenido" para visualizar el documento' : 'Este tipo de archivo no se puede previsualizar' }}
            </p>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="mb-3 flex justify-content-between align-items-center">
          <h5 class="m-0 flex align-items-center gap-2">
            <i :class="`pi ${getFileIcon(selectedDocument.url)} ${getFileColor(selectedDocument.url)}`"></i>
            Contenido del documento
          </h5>
          <pv-button icon="pi pi-eye-slash" label="Ocultar" class="p-button-sm p-button-text" @click="toggleDocumentContent" />
        </div>
        <iframe
          :src="getContentViewerUrl(selectedDocument.url)"
          style="width:100%; height:60vh; min-height:400px; border:1px solid var(--surface-border); border-radius:var(--border-radius);"
          frameborder="0"
        ></iframe>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-content-between w-full">
        <div class="flex gap-2">
          <pv-button icon="pi pi-download" label="Descargar" class="p-button-outlined" :disabled="!selectedDocument?.url" @click="downloadDocument(selectedDocument?.type, selectedDocument)" />
          <pv-button v-if="canShowContent(selectedDocument?.url)" :icon="showDocumentContent ? 'pi pi-eye-slash' : 'pi pi-eye'" :label="showDocumentContent ? 'Ocultar contenido' : 'Ver contenido'" class="p-button-primary" @click="toggleDocumentContent" />
        </div>
        <pv-button icon="pi pi-times" label="Cerrar" class="p-button-text" @click="closeDocumentModal" />
      </div>
    </template>
  </pv-dialog>
</template>

<style scoped>
.highlight-section {
  animation: highlightPulse 2s ease-in-out;
  border-radius: 8px;
}

@keyframes highlightPulse {
  0%   { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  50%  { box-shadow: 0 0 0 12px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}
</style>

