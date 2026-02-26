<script setup>
import { ref, computed } from 'vue';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { useImageViewer } from '../../../shared-v2/composables/use-image-viewer.js';
import ImageViewerModal from '../../../shared-v2/presentation/components/image-viewer-modal.vue';

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['download-document']);

// Composables
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

// Constantes de configuración
const ALLOWED_DOCUMENT_TYPES = ['FOTO_FACHADA_VIVIENDA', 'RECIBO_SERVICIO', 'DOCUMENTO_IDENTIDAD'];
const DOCUMENT_TYPE_LABELS = {
  'FOTO_FACHADA_VIVIENDA': 'FACHADA DE VIVIENDA',
  'RECIBO_SERVICIO': 'RECIBO DE SERVICIO',
  'DOCUMENTO_IDENTIDAD': 'DOC DE IDENTIDAD'
};
const DOCUMENT_TYPE_MAP = {
  'DNI': 'DNI',
  'CARNET_EXTRANJERIA': 'CE',
  'PTP': 'PTP'
};
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

// Estado reactivo para documentos no-imagen
const showDocumentModal = ref(false);
const selectedDocument = ref(null);
const showDocumentContent = ref(false);

// Computed
const filteredDocuments = computed(() => {
  if (!props.item?.attachedDocuments) return [];
  return props.item.attachedDocuments
    .filter(doc => ALLOWED_DOCUMENT_TYPES.includes(doc.type))
    .map(doc => ({
      ...doc,
      displayName: DOCUMENT_TYPE_LABELS[doc.type] || doc.type
    }));
});

// Métodos
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return 'No disponible';
  const cleanNumber = String(phoneNumber).replace(/\D/g, '');
  return cleanNumber.replace(/(\d{3})(?=\d)/g, '$1 ');
};

const formatDocumentType = (documentType) => {
  return documentType ? (DOCUMENT_TYPE_MAP[documentType] || documentType) : 'No disponible';
};

const downloadDocument = async (type, document = null) => {
  try {
    if (!document?.url) {
      console.warn('No se puede descargar el documento: URL no válida');
      return;
    }

    console.log('Iniciando descarga de:', document.url);
    
    emit('download-document', { type, item: props.item, document });
    
    // Usar el composable para descargar
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

const viewDocument = (document) => {
  // Si es imagen, usar el modal compartido
  if (isImageFile(document.url)) {
    openImage({
      url: document.url,
      description: document.displayName,
      alt: getDocumentLabel(document.type)
    });
  } else {
    // Para otros documentos, usar modal específico de documentos
    selectedDocument.value = document;
    showDocumentModal.value = true;
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

const getDocumentLabel = (documentTypeOrDocument) => {
  if (typeof documentTypeOrDocument === 'object' && documentTypeOrDocument?.displayName) {
    return documentTypeOrDocument.displayName;
  }
  const documentType = typeof documentTypeOrDocument === 'string' 
    ? documentTypeOrDocument 
    : documentTypeOrDocument?.type;
  return DOCUMENT_TYPE_LABELS[documentType] || documentType || 'Documento';
};

const isImageFile = (url) => {
  return url && IMAGE_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));
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
</script>

<template>
  <div class="flex flex-column gap-4">

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
          <!-- Fila 1: Razón Social, RUC y Nombre de ejecutivo -->
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
              <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-building text-blue-600"></i>
                Razón social
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.companyName || 'No disponible' }}</p>
            </div>
          </div>

          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
              <label class="text-xs font-semibold text-teal-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-tag text-teal-600"></i>
                Marca
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.brandName || 'No especificado' }}</p>
            </div>
          </div>

          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
              <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-id-card text-indigo-600"></i>
                RUC
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.companyRuc || 'No disponible' }}</p>
            </div>
          </div>

          <!-- Fila 2: Nombre de ejecutivo, Número de contacto y Correo corporativo -->
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
              <label class="text-xs font-semibold text-purple-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-user text-purple-600"></i>
                Nombre de ejecutivo
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.companyExecutiveName || 'No disponible' }}</p>
            </div>
          </div>

          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
              <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-phone text-green-600"></i>
                Número de contacto
              </label>
              <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(item?.companyPhoneNumber) }}</p>
            </div>
          </div>

          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
              <label class="text-xs font-semibold text-orange-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-envelope text-orange-600"></i>
                Correo corporativo
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.companyEmail || 'No disponible' }}</p>
            </div>
          </div>
        </div>
      </template>
    </pv-card>

    <!-- ====================== Card -> Datos del cliente ====================== -->
    <pv-card>
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-user-plus"></i>
          <span class="text-lg font-bold">Datos del cliente</span>
        </div>
      </template>
      <template #content>
        <div class="formgrid grid">
          <!-- Fila 1: Nombres completos y Número de contacto -->
          <div class="field col-12 md:col-8">
            <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
              <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-user text-blue-600"></i>
                Nombres completos
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.clientFullName || 'No disponible' }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
              <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-phone text-green-600"></i>
                Número de contacto
              </label>
              <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(item?.clientPhoneNumber) }}</p>
            </div>
          </div>
          <!-- Fila 2: Tipo de documento y N° de documento -->
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
              <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-credit-card text-indigo-600"></i>
                Tipo de documento
              </label>
              <p class="text-base font-bold text-900 m-0">{{ formatDocumentType(item?.clientDocumentType) }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
              <label class="text-xs font-semibold text-purple-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-hashtag text-purple-600"></i>
                N° de documento
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.clientDocumentNumber || 'No disponible' }}</p>
            </div>
          </div>
          <!-- Fila 3: Departamento, Provincia y Distrito -->
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-cyan-50 h-full">
              <label class="text-xs font-semibold text-cyan-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-map text-cyan-600"></i>
                Departamento
              </label>
              <p class="text-base font-bold text-900 m-0">{{ (item?.addressDepartment || 'No disponible').toUpperCase() }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-teal-50 h-full">
              <label class="text-xs font-semibold text-teal-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-building text-teal-600"></i>
                Provincia
              </label>
              <p class="text-base font-bold text-900 m-0">{{ (item?.addressProvince || 'No disponible').toUpperCase() }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-pink-50 h-full">
              <label class="text-xs font-semibold text-pink-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-flag text-pink-600"></i>
                Distrito
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.addressDistrict || 'No disponible' }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
              <label class="text-xs font-semibold text-orange-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-home text-orange-600"></i>
                Dirección de domicilio
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.fullAddress || 'No disponible' }}</p>
            </div>
          </div>
          <!-- Ubicación en Google Maps -->
          <div class="field col-12 md:col-4" v-if="item?.addressLocation">
            <div class="p-3 border-round border-2 surface-border bg-red-50">
              <label class="text-xs font-semibold text-red-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-map-marker text-red-600"></i>
                Ubicación en google maps
              </label>
              <p class="text-900 m-0">
                <a
                    :href="item.addressLocation"
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
      </template>
    </pv-card>

    <!-- ====================== Card -> Documentos adjuntos ====================== -->
    <pv-card class="w-full">
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-paperclip"></i>
          <span class="text-lg font-bold">Documentos adjuntos</span>
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
            <div class="p-3 border-round border-2 surface-border h-full"
                 :class="{
                   'bg-blue-50': index % 6 === 0,
                   'bg-green-50': index % 6 === 1,
                   'bg-purple-50': index % 6 === 2,
                   'bg-orange-50': index % 6 === 3,
                   'bg-pink-50': index % 6 === 4,
                   'bg-cyan-50': index % 6 === 5
                 }">
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
    <pv-card class="w-full">
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-home"></i>
          <span class="text-lg font-bold">Datos del arrendador</span>
        </div>
      </template>
      <template #content>
        <div class="formgrid grid">
          <div class="field col-12 md:col-8">
            <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
              <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-user text-blue-600"></i>
                Nombre completo
              </label>
              <p class="text-base font-bold text-900 m-0">{{ item?.landlordName || 'No disponible' }}</p>
            </div>
          </div>
          <div class="field col-12 md:col-4">
            <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
              <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-phone text-green-600"></i>
                Número de contacto
              </label>
              <p class="text-base font-bold text-900 m-0">{{ formatPhoneNumber(item?.landlordPhoneNumber) }}</p>
            </div>
          </div>
        </div>
      </template>
    </pv-card>

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
