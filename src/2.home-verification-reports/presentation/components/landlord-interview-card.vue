<script setup>
import { ref, watch, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';

const props = defineProps({
  clientNameAccordingToLandlord: {
    type: String,
    default: ''
  },
  ownHome: {
    type: String,
    default: ''
  },
  servicesPaidByClient: {
    type: String,
    default: ''
  },
  isTheClientPunctualWithPayments: {
    type: String,
    default: ''
  },
  timeLivingAccordingToLandlord: {
    type: String,
    default: ''
  },
  floorOccupiedByClient: {
    type: String,
    default: ''
  },
  interviewObservation: {
    type: String,
    default: ''
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  blockedByFinalResult: {
    type: Boolean,
    default: false
  },
  reportId: {
    type: Number,
    required: true
  },
  interviewAttachments: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-interview-details-requested']);

// Composables
const confirm = useConfirm();
const { showWarning, showSuccess, showError } = useNotification();

// State
const isEditing = ref(false);
const editForm = ref({
  tenantName: '',
  ownHouse: '',
  serviceClientPays: '',
  clientPaysPunctual: '',
  clientRentalTime: '',
  clientFloorNumber: '',
  interviewObservation: ''
});

// Estado para manejo de imagen
const selectedImages = ref([]);
const imagePreviews = ref([]);
const fileInputRef = ref(null);

const maxImages = 2;

// Computed para saber cuántas imágenes totales habrá
const totalImagesCount = computed(() => {
  return props.interviewAttachments.length + selectedImages.value.length;
});

const booleanOptions = [
  { label: 'No especifica', value: 'No especifica' },
  { label: 'Sí', value: 'Sí' },
  { label: 'No', value: 'No' }
];

// Computed
const headerClass = computed(() => {
  return props.canEdit ? 'bg-orange-500' : 'bg-primary';
});

// Watch for props changes
watch(() => [props.clientNameAccordingToLandlord, props.ownHome, props.servicesPaidByClient, 
             props.isTheClientPunctualWithPayments, props.timeLivingAccordingToLandlord, 
             props.floorOccupiedByClient, props.interviewObservation], () => {
  editForm.value = {
    tenantName: props.clientNameAccordingToLandlord || '',
    ownHouse: props.ownHome || '',
    serviceClientPays: props.servicesPaidByClient || '',
    clientPaysPunctual: props.isTheClientPunctualWithPayments || '',
    clientRentalTime: props.timeLivingAccordingToLandlord || '',
    clientFloorNumber: props.floorOccupiedByClient || '',
    interviewObservation: props.interviewObservation || ''
  };
}, { immediate: true });

watch(() => props.canEdit, (newVal) => {
  if (!newVal && isEditing.value) {
    isEditing.value = false;
  }
});

// Methods
const formatValue = (value) => {
  if (!value || value === '' || value === '-' || value === 'null' || value === 'undefined') {
    return 'No especificado';
  }
  return value;
};

const formatBooleanValue = (value) => {
  if (!value || value === '' || value === '-' || value === 'null' || value === 'undefined') {
    return 'No especifica';
  }
  return value;
};

const onEditToggle = () => {
  if (!props.canEdit) return;
  
  isEditing.value = !isEditing.value;
  
  if (!isEditing.value) {
    // Reset form when cancelling edit mode
    editForm.value = {
      tenantName: props.clientNameAccordingToLandlord || '',
      ownHouse: props.ownHome || '',
      serviceClientPays: props.servicesPaidByClient || '',
      clientPaysPunctual: props.isTheClientPunctualWithPayments || '',
      clientRentalTime: props.timeLivingAccordingToLandlord || '',
      clientFloorNumber: props.floorOccupiedByClient || '',
      interviewObservation: props.interviewObservation || ''
    };
  }
};

const validateForm = () => {
  const errors = [];

  // Validar nombre del inquilino
  if (!editForm.value.tenantName || editForm.value.tenantName.trim() === '') {
    errors.push('Nombre del inquilino');
  }

  // Casa propia
  if (!editForm.value.ownHouse || editForm.value.ownHouse === '') {
    errors.push('Casa propia');
  }

  // Servicio que paga el cliente
  if (!editForm.value.serviceClientPays || editForm.value.serviceClientPays.trim() === '') {
    errors.push('Servicio que paga el cliente');
  }

  // ¿Paga puntual?
  if (!editForm.value.clientPaysPunctual || editForm.value.clientPaysPunctual === '') {
    errors.push('¿El cliente paga puntual?');
  }

  // Tiempo de arrendamiento
  if (!editForm.value.clientRentalTime || editForm.value.clientRentalTime.trim() === '') {
    errors.push('Tiempo de arrendamiento del cliente');
  }

  // Número de piso
  if (!editForm.value.clientFloorNumber || editForm.value.clientFloorNumber.trim() === '') {
    errors.push('Número de piso en el que habita el cliente');
  }

  return errors;
};

const onSaveEdit = () => {
  const errors = validateForm();

  if (errors.length > 0) {
    showWarning(
      `Debe completar los siguientes campos: ${errors.join(', ')}.`,
      'Campos incompletos',
      5000
    );
    return;
  }

  // Mostrar diálogo de confirmación antes de aplicar los cambios
  const imageCount = selectedImages.value.length;
  let confirmMessage = '¿Está seguro de que desea guardar los cambios en la entrevista con el arrendador?\n\nEsta acción actualizará la información del reporte.';
  
  if (imageCount > 0) {
    const imageText = imageCount === 1 ? 'la imagen seleccionada' : `las ${imageCount} imágenes seleccionadas`;
    confirmMessage = `¿Está seguro de que desea guardar los cambios en la entrevista con el arrendador?\n\nSe guardará la información y se subirá ${imageText}.`;
  }

  confirm.require({
    message: confirmMessage,
    header: 'Confirmar Actualización',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Confirmar',
    rejectClass: 'p-button-secondary',
    acceptClass: 'p-button-success',
    accept: () => {
      // Emitir evento al padre con datos del formulario e imágenes (si existen)
      const payload = {
        ...editForm.value,
        imageFiles: selectedImages.value // Array de imágenes
      };
      
      emit('update-interview-details-requested', payload);
      
      // Limpiar estado de imágenes después de emitir
      selectedImages.value = [];
      imagePreviews.value = [];
      if (fileInputRef.value) {
        fileInputRef.value.value = null;
      }
      
      // Mantener el componente en modo lectura tras guardar
      isEditing.value = false;
    },
    reject: () => {
      // Usuario canceló la operación, no hacer nada
    }
  });
};

// Métodos para manejo de imagen
const onImageSelect = (event) => {
  const files = event.target.files;
  
  if (!files || files.length === 0) return;

  // Calcular cuántas imágenes se pueden agregar
  const currentTotal = props.interviewAttachments.length + selectedImages.value.length;
  const availableSlots = maxImages - currentTotal;

  if (availableSlots <= 0) {
    showError(
      `Ya se alcanzó el límite máximo de ${maxImages} imágenes`,
      'Límite alcanzado',
      4000
    );
    return;
  }

  // Procesar solo las imágenes que caben en los slots disponibles
  const filesToProcess = Array.from(files).slice(0, availableSlots);

  for (const file of filesToProcess) {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      showError(
        `El archivo "${file.name}" no es una imagen válida`,
        'Tipo de archivo inválido',
        4000
      );
      continue;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showError(
        `La imagen "${file.name}" no puede superar los 5MB`,
        'Archivo muy grande',
        4000
      );
      continue;
    }

    // Agregar al array de imágenes seleccionadas
    selectedImages.value.push(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviews.value.push({
        url: e.target.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  }

  // Limpiar el input para permitir seleccionar las mismas imágenes de nuevo si se eliminan
  if (fileInputRef.value) {
    fileInputRef.value.value = null;
  }

  // Mostrar mensaje si se intentaron agregar más imágenes de las permitidas
  if (files.length > filesToProcess.length) {
    showWarning(
      `Solo se pueden agregar ${availableSlots} imagen(es) más. Se agregaron ${filesToProcess.length} de ${files.length} seleccionadas.`,
      'Límite de imágenes',
      5000
    );
  }
};

const onRemoveImage = (index) => {
  selectedImages.value.splice(index, 1);
  imagePreviews.value.splice(index, 1);
};

const onCancelAllImages = () => {
  selectedImages.value = [];
  imagePreviews.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = null;
  }
};
</script>

<template>
  <pv-card class="w-full">
    <template #header>
      <div class="flex justify-content-between align-items-center" :class="headerClass">
        <h3 class="text-lg font-bold flex align-items-center gap-2 text-white p-3 m-0">
          <i class="pi pi-comments text-white"></i>
          Detalles de la Entrevista con el Arrendador
          <span v-if="canEdit" class="text-sm font-normal">(Pendiente de completar)</span>
        </h3>
        <div v-if="canEdit" class="flex align-items-center gap-2 pr-3">
          <pv-button
            v-if="!isEditing"
            size="small"
            icon="pi pi-pencil"
            label="Editar"
            class="p-button-warning p-button-sm"
            @click="onEditToggle"
          />
          <template v-else>
            <pv-button
              size="small"
              icon="pi pi-times"
              label="Cancelar"
              class="p-button-secondary p-button-sm"
              @click="onEditToggle"
            />
            <pv-button
              size="small"
              icon="pi pi-save"
              label="Guardar"
              class="p-button-success p-button-sm"
              @click="onSaveEdit"
            />
          </template>
        </div>
        <div v-else-if="blockedByFinalResult" class="flex align-items-center gap-2 pr-3">
          <span class="text-sm text-white flex align-items-center gap-2">
            <i class="pi pi-lock"></i>
            Edición bloqueada porque el reporte ya tiene resultado final
          </span>
        </div>
      </div>
    </template>
    <template #content>
      <div class="formgrid grid">
        <!-- Primera fila -->
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-blue-50 h-full">
              <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-user text-blue-600"></i>
                Nombre del inquilino
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatValue(clientNameAccordingToLandlord) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-user text-primary"></i>
              Nombre del inquilino:
            </label>
            <pv-input-text v-model="editForm.tenantName" class="w-full" placeholder="Nombre del inquilino" />
          </template>
        </div>
        
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-indigo-50 h-full">
              <label class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-home text-indigo-600"></i>
                Casa propia
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatBooleanValue(ownHome) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-home text-primary"></i>
              Casa propia
            </label>
            <pv-select v-model="editForm.ownHouse" :options="booleanOptions" option-label="label" option-value="value" class="w-full" placeholder="Seleccione"/>
          </template>
        </div>
        
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-purple-50 h-full">
              <label class="text-xs font-semibold text-purple-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-dollar text-purple-600"></i>
                Servicio que paga el cliente
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatValue(servicesPaidByClient) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-dollar text-primary"></i>
              Servicio que paga el cliente
            </label>
            <pv-input-text v-model="editForm.serviceClientPays" class="w-full" placeholder="Servicios (separados por coma)"/>
          </template>
        </div>
        
        <!-- Segunda fila -->
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-green-50 h-full">
              <label class="text-xs font-semibold text-green-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-check-circle text-green-600"></i>
                ¿El cliente paga puntual?
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatBooleanValue(isTheClientPunctualWithPayments) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-check-circle text-primary"></i>
              ¿El cliente paga puntual?
            </label>
            <pv-select v-model="editForm.clientPaysPunctual" :options="booleanOptions" option-label="label" option-value="value" class="w-full" placeholder="Seleccione"/>
          </template>
        </div>
        
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-orange-50 h-full">
              <label class="text-xs font-semibold text-orange-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-clock text-orange-600"></i>
                Tiempo de arrendamiento
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatValue(timeLivingAccordingToLandlord) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-clock text-primary"></i>
              Tiempo de arrendamiento del cliente:
            </label>
            <pv-input-text v-model="editForm.clientRentalTime" class="w-full" placeholder="Ej: 2 años"/>
          </template>
        </div>
        
        <div class="field col-12 md:col-4">
          <template v-if="!isEditing">
            <div class="p-3 border-round border-2 surface-border bg-pink-50 h-full">
              <label class="text-xs font-semibold text-pink-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-building text-pink-600"></i>
                Piso que habita
              </label>
              <p class="text-base font-bold text-900 m-0">
                {{ formatValue(floorOccupiedByClient) }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-building text-primary"></i>
              Nro de piso en el que habita el cliente:
            </label>
            <pv-input-text v-model="editForm.clientFloorNumber" class="w-full" placeholder="Ej: 3"/>
          </template>
        </div>

        <!-- Tercera fila - Observaciones -->
        <div class="field col-12">
          <template v-if="!isEditing">
            <div v-if="interviewObservation" class="p-3 border-round border-2 surface-border bg-cyan-50 h-full">
              <label class="text-xs font-semibold text-cyan-700 uppercase mb-2 flex align-items-center gap-2">
                <i class="pi pi-file-edit text-cyan-600"></i>
                Observaciones de la entrevista
              </label>
              <p class="text-base font-bold text-900 m-0 white-space-pre-wrap">
                {{ interviewObservation }}
              </p>
            </div>
          </template>
          <template v-else>
            <label class="font-semibold text-color-secondary flex align-items-center gap-2 mb-2">
              <i class="pi pi-file-edit text-primary"></i>
              Observaciones de la entrevista:
            </label>
            <pv-textarea
              v-model="editForm.interviewObservation"
              class="w-full"
              rows="4"
              placeholder="Ingrese observaciones adicionales sobre la entrevista (opcional)"
            />
          </template>
        </div>

        <!-- Cuarta fila - Imagen adjunta -->
        <div class="field col-12">
          <div class="p-3 border-round border-2 surface-border bg-teal-50">
            <label class="text-xs font-semibold text-teal-700 uppercase mb-3 flex align-items-center gap-2">
              <i class="pi pi-image text-teal-600"></i>
              Imágenes de la entrevista (máximo 2)
            </label>

            <!-- Imágenes existentes (modo lectura) -->
            <div v-if="interviewAttachments.length > 0 && !isEditing" class="grid">
              <div 
                v-for="(attachment, index) in interviewAttachments" 
                :key="attachment.id"
                class="col-12 md:col-6 mb-3"
              >
                <div class="relative">
                  <img 
                    :src="attachment.url" 
                    :alt="`Imagen ${index + 1}`"
                    class="border-round shadow-2 w-full"
                    style="max-height: 300px; object-fit: contain;"
                  />
                  <div class="absolute top-0 right-0 m-2 bg-black-alpha-60 text-white px-2 py-1 border-round text-xs">
                    Imagen {{ index + 1 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de subida (solo en modo edición) -->
            <div v-if="isEditing && canEdit">
              <!-- Imágenes existentes en modo edición -->
              <div v-if="interviewAttachments.length > 0" class="mb-3">
                <p class="text-sm text-600 mb-2">Imágenes actuales ({{ interviewAttachments.length }}/{{ maxImages }}):</p>
                <div class="grid">
                  <div 
                    v-for="(attachment, index) in interviewAttachments" 
                    :key="attachment.id"
                    class="col-12 md:col-6"
                  >
                    <div class="relative">
                      <img 
                        :src="attachment.url" 
                        :alt="`Imagen ${index + 1}`"
                        class="border-round shadow-2 w-full"
                        style="max-height: 250px; object-fit: contain;"
                      />
                      <div class="absolute top-0 right-0 m-2 bg-black-alpha-60 text-white px-2 py-1 border-round text-xs">
                        Imagen {{ index + 1 }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Nuevas imágenes seleccionadas -->
              <div v-if="selectedImages.length > 0" class="mb-3">
                <div class="flex justify-content-between align-items-center mb-2">
                  <p class="text-sm font-semibold text-600 m-0">
                    Nuevas imágenes seleccionadas ({{ selectedImages.length }}) - se subirán al guardar:
                  </p>
                  <pv-button
                    icon="pi pi-times"
                    label="Quitar todas"
                    class="p-button-text p-button-danger p-button-sm"
                    v-tooltip.top="'Quitar todas las imágenes seleccionadas'"
                    @click="onCancelAllImages"
                  />
                </div>
                <div class="grid">
                  <div 
                    v-for="(preview, index) in imagePreviews" 
                    :key="index"
                    class="col-12 md:col-6"
                  >
                    <div class="relative">
                      <img 
                        :src="preview.url" 
                        :alt="preview.name"
                        class="border-round shadow-2 w-full"
                        style="max-height: 250px; object-fit: contain;"
                      />
                      <div class="absolute top-0 left-0 m-2 bg-success text-white px-2 py-1 border-round text-xs">
                        Nueva {{ index + 1 }}
                      </div>
                      <pv-button
                        icon="pi pi-trash"
                        class="p-button-danger p-button-rounded p-button-sm absolute top-0 right-0 m-2"
                        v-tooltip.top="'Quitar esta imagen'"
                        @click="onRemoveImage(index)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Input de archivo -->
              <div v-if="totalImagesCount < maxImages" class="flex flex-column gap-2">
                <p class="text-sm text-600 m-0 flex align-items-center gap-2">
                  <i class="pi pi-info-circle"></i>
                  <span>
                    Puede agregar {{ maxImages - totalImagesCount }} imagen(es) más 
                    (Total: {{ totalImagesCount }}/{{ maxImages }})
                  </span>
                </p>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="w-full"
                  @change="onImageSelect"
                />
                <p class="text-xs text-500 m-0">
                  <i class="pi pi-check-circle text-success"></i>
                  Puede seleccionar múltiples imágenes a la vez (máximo 5MB cada una)
                </p>
              </div>

              <div v-else class="text-sm text-600">
                <i class="pi pi-check-circle text-success"></i>
                Se alcanzó el límite máximo de {{ maxImages }} imágenes
              </div>
            </div>

            <!-- Mensaje cuando no hay imagen -->
            <p v-if="interviewAttachments.length === 0 && !isEditing" class="text-sm text-500 m-0">
              No se han agregado imágenes
            </p>
          </div>
        </div>
      </div>
    </template>
  </pv-card>
</template>

<style scoped>
:deep(.p-card-content) {
  padding: 0.5rem;
}

:deep(.p-card-header) {
  border-radius: 0.375rem 0.375rem 0 0;
  overflow: hidden;
}

:deep(.p-card) {
  overflow: hidden;
  border-radius: 0.375rem;
}

.bg-primary {
  background-color: #4A60D0;
}

.bg-orange-500 {
  background-color: #FB8C00;
}
</style>
