<script setup>
import { ref } from 'vue';
import { useImageViewer } from '../../../shared-v2/composables/use-image-viewer.js';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import ImageViewerModal from '../../../shared-v2/presentation/components/image-viewer-modal.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'pi-images'
  },
  description: {
    type: String,
    default: ''
  },
  descriptionLabel: {
    type: String,
    default: 'Descripción'
  },
  photos: {
    type: Array,
    default: () => []
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  replaceOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['viewPhoto', 'add-photo', 'replace-photo', 'delete-photo']);

const { showWarning } = useNotification();
const fileInputRef = ref(null);
const replacePhotoIndex = ref(null);

// Use shared image viewer composable
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
  handleImageError
} = useImageViewer();

// Métodos de edición
const handleAddPhoto = () => {
  replacePhotoIndex.value = null;
  fileInputRef.value?.click();
};

const handleReplacePhoto = (index) => {
  replacePhotoIndex.value = index;
  fileInputRef.value?.click();
};

const handleDeletePhoto = (index) => {
  emit('delete-photo', index);
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validar que sea una imagen
  if (!file.type.startsWith('image/')) {
    showWarning('El archivo debe ser una imagen', 'Tipo de archivo inválido');
    return;
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    showWarning('El archivo no debe superar los 5MB', 'Archivo muy grande');
    return;
  }

  if (replacePhotoIndex.value !== null) {
    // Reemplazar foto existente
    emit('replace-photo', { index: replacePhotoIndex.value, file });
  } else {
    // Agregar nueva foto
    emit('add-photo', file);
  }

  // Limpiar input
  event.target.value = '';
  replacePhotoIndex.value = null;
};
</script>

<template>
  <pv-card class="w-full" :class="{ 'editable-card': canEdit }">
    <template #header>
      <div class="flex justify-content-between align-items-center p-3" :class="{ 'editable-header': canEdit }">
        <h3 class="text-lg font-bold flex align-items-center gap-2 m-0" :class="canEdit ? 'text-900' : 'text-white'">
          <i :class="`pi ${icon}`" :style="canEdit ? 'color: #000' : 'color: white'"></i>
          {{ title }}
          <span v-if="canEdit" class="text-xs font-bold px-2 py-1 border-round bg-orange-600 text-white ml-2 animate-pulse">
            <i class="pi pi-pencil mr-1"></i>EDITABLE
          </span>
        </h3>
        <div v-if="canEdit && !replaceOnly">
          <pv-button
            icon="pi pi-plus"
            label="Agregar Foto"
            class="p-button-success p-button-sm"
            @click="handleAddPhoto"
          />
        </div>
      </div>
    </template>
    <template #content>
      <div class="formgrid grid">
        <!-- Descripción (opcional) -->
        <div v-if="description" class="field col-12">
          <label class="font-semibold text-color-secondary flex align-items-center gap-2">
            <i class="pi pi-info-circle text-primary"></i>
            {{ descriptionLabel }}
          </label>
          <p class="font-semibold text-dark m-0 white-space-pre-wrap">
            {{ description }}
          </p>
        </div>

        <!-- Fotos -->
        <div class="field col-12">
          <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-3">
            <i class="pi pi-images text-primary"></i>
            Fotografías ({{ photos.length }})
          </label>
          <div v-if="photos.length > 0" class="grid">
            <div 
              v-for="(photo, index) in photos" 
              :key="photo.url || photo.id || index"
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="image-container p-2">
                <div class="image-wrapper border-1 surface-border border-round overflow-hidden">
                  <img
                    :src="photo.url"
                    :alt="photo.description || 'Fotografía'"
                    class="w-full h-12rem object-fit-cover cursor-pointer transition-all transition-duration-300 hover:scale-105"
                    @click="openImage(photo)"
                  />
                </div>
                <div class="image-actions mt-2 flex flex-column gap-2">
                  <pv-button
                    icon="pi pi-eye" 
                    label="Ver"
                    class="p-button-sm p-button-primary w-full"
                    v-tooltip.top="'Ver imagen en grande'"
                    @click="openImage(photo)"
                  />
                  <pv-button 
                    icon="pi pi-download" 
                    label="Descargar"
                    class="p-button-sm p-button-outlined w-full"
                    v-tooltip.top="'Descargar imagen'"
                    @click="downloadImage(photo)"
                  />
                  <!-- Botones de edición (solo si canEdit) -->
                  <template v-if="canEdit">
                    <pv-button 
                      icon="pi pi-refresh" 
                      label="Reemplazar"
                      class="p-button-sm p-button-warning w-full"
                      v-tooltip.top="'Reemplazar imagen'"
                      @click="handleReplacePhoto(index)"
                    />
                    <pv-button 
                      v-if="!replaceOnly"
                      icon="pi pi-trash" 
                      label="Eliminar"
                      class="p-button-sm p-button-danger w-full"
                      v-tooltip.top="'Eliminar imagen'"
                      @click="handleDeletePhoto(index)"
                    />
                  </template>
                </div>
                <p v-if="photo.description" class="text-sm text-center text-color mt-1 m-0">
                  {{ photo.description }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center p-4 surface-ground border-round">
            <i class="pi pi-info-circle text-4xl text-color-secondary mb-3"></i>
            <p class="text-color-secondary m-0">No hay fotografías disponibles</p>
            <pv-button 
              v-if="canEdit && !replaceOnly"
              icon="pi pi-plus"
              label="Agregar Primera Foto"
              class="p-button-success mt-3"
              @click="handleAddPhoto"
            />
          </div>
        </div>
      </div>
    </template>
  </pv-card>

  <!-- Input file oculto -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    style="display: none"
    @change="handleFileSelect"
  />

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
    @error="handleImageError"
  />
</template>

<style scoped>
:deep(.p-card-content) {
  padding: 0.5rem;
}

:deep(.p-card-header) {
  background-color: #4A60D0;
  border-radius: 0.375rem 0.375rem 0 0;
  overflow: hidden;
}

:deep(.p-card-header .bg-orange-500) {
  background-color: #f97316 !important;
}

:deep(.p-card) {
  overflow: hidden;
  border-radius: 0.375rem;
}

.image-container {
  text-align: center;
}

.image-wrapper {
  position: relative;
  overflow: hidden;
}

.image-wrapper:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.transition-all {
  transition: all 0.3s ease;
}

.hover\:scale-105:hover {
  transform: scale(1.05);
}

.editable-card {
  border: 3px solid #ffc107;
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.3);
}

.editable-header {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
  border-bottom: 2px solid #ffc107 !important;
}
</style>

