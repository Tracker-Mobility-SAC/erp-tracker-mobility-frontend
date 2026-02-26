<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import useVerificationOrderStore from '../../application/verification-order.store.js';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { useDateFormatter } from '../../../shared-v2/composables/use-date-formatter.js';
import { 
  OrderStatusClasses as StatusClasses,
  OrderStatusIcons as StatusIcons
} from '../constants/verification-order-ui.constants.js';

// Constantes de estados permitidos
const VERIFIER_EDITABLE_STATUSES = ['PENDIENTE', 'ASIGNADO', 'SUBSANADA'];
const OBSERVATION_EDITABLE_STATUSES = ['PENDIENTE', 'ASIGNADO', 'OBSERVADO', 'SUBSANADA'];

// Props
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  verifiersList: {
    type: Array,
    required: true
  },
  statusOptions: {
    type: Array,
    required: false,
    default: () => []
  }
});

// Store y composables
const store = useVerificationOrderStore();
const { showSuccess, showError, showWarning } = useNotification();
const { formatTimeToBackend: formatTime } = useDateFormatter();

// Estado local
const localHomeVisitDetails = ref({
  verifierId: null,
  visitDate: null,
  visitTime: null
});

const editingStates = ref({
  verifier: false,
  observations: false
});

const originalData = ref({
  verifier: {},
  observations: {}
});

const currentObservation = ref({
  observationType: null,
  description: ''
});

const observationsPagination = ref({
  currentPage: 1,
  itemsPerPage: 5,
  totalPages: 1
});

// Opciones de tipos de observación
const observationTypeOptions = computed(() => {
  const allOptions = [
    { label: '-- Seleccionar tipo --', value: null },
    { label: 'Documento de identidad - Borroso o ilegible', value: 'DOCUMENTO_IDENTIDAD_BORROSO' },
    { label: 'Recibo de servicio - Borroso o ilegible', value: 'RECIBO_SERVICIO_BORROSO' },
    { label: 'Foto fachada vivienda - Borrosa o ilegible', value: 'FOTO_FACHADA_BORROSA' },
    { label: 'Ubicación en mapa - Enlace incorrecto', value: 'UBICACION_INCORRECTA' },
    { label: 'Datos del cliente - Incorrectos', value: 'DATOS_CLIENTE_INCOMPLETOS' },
    { label: 'Datos del arrendador - Incorrectos', value: 'DATOS_ARRENDADOR_INCOMPLETOS' },
    { label: 'Otros', value: 'OTROS' }
  ];

  // Si el cliente NO es inquilino (isTenant === false), filtrar la opción de arrendador
  if (props.item?.isTenant === false) {
    return allOptions.filter(option => option.value !== 'DATOS_ARRENDADOR_INCOMPLETOS');
  }

  return allOptions;
});

// Opciones de estados de observación
const observationStatusOptions = [
  { label: 'Pendiente', value: 'PENDIENTE', class: 'observation-pendiente' },
  { label: 'Resuelta', value: 'RESUELTA', class: 'observation-resuelta' }
];

// Computed properties
const verifiersListFormatted = computed(() => {
  if (!props.verifiersList || props.verifiersList.length === 0) {
    return [];
  }
  
  return props.verifiersList.map(verifier => ({
    id: verifier.id,
    fullName: verifier.fullName || `${verifier.name || ''} ${verifier.lastName || ''}`.trim(),
    name: verifier.name,
    lastName: verifier.lastName
  }));
});

const canEditVerifierAssignment = computed(() => {
  if (!props.item?.status) return false;
  return VERIFIER_EDITABLE_STATUSES.includes(props.item.status);
});

const canEditObservations = computed(() => {
  if (!props.item?.status) return false;
  return OBSERVATION_EDITABLE_STATUSES.includes(props.item.status);
});

const isVerifierAssignmentValid = computed(() => {
  if (!editingStates.value.verifier) return true;
  
  const { verifierId, visitDate, visitTime } = localHomeVisitDetails.value;
  return verifierId && visitDate && visitTime;
});

const isObservationValid = computed(() => {
  if (!editingStates.value.observations) return true;

  return currentObservation.value.observationType &&
         currentObservation.value.description &&
         currentObservation.value.description.trim() !== '';
});

const paginatedObservations = computed(() => {
  if (!props.item.observations || props.item.observations.length === 0) return [];

  const start = (observationsPagination.value.currentPage - 1) * observationsPagination.value.itemsPerPage;
  const end = start + observationsPagination.value.itemsPerPage;

  return props.item.observations.slice(start, end);
});

const totalObservationPages = computed(() => {
  if (!props.item.observations || props.item.observations.length === 0) return 1;
  return Math.ceil(props.item.observations.length / observationsPagination.value.itemsPerPage);
});

const hasPreviousPage = computed(() => {
  return observationsPagination.value.currentPage > 1;
});

const hasNextPage = computed(() => {
  return observationsPagination.value.currentPage < totalObservationPages.value;
});

// Métodos
function initializeLocalData() {
  localHomeVisitDetails.value = {
    verifierId: props.item.verifierName ? extractVerifierId(props.item.verifierName) : null,
    visitDate: props.item.visitDate || null,
    visitTime: props.item.visitTime || null
  };
}

function extractVerifierId(verifierName) {
  // Buscar el verificador en la lista por nombre
  const verifier = props.verifiersList.find(v => 
    `${v.name} ${v.lastName}`.trim() === verifierName
  );
  return verifier?.id || null;
}

function getStatusLabel(statusValue) {
  if (!props.statusOptions || !statusValue) return 'Sin estado';
  
  const statusOption = props.statusOptions.find(option => option.value === statusValue);
  return statusOption ? statusOption.label : statusValue;
}

function getStatusClass(status) {
  return StatusClasses[status] || 'status-default';
}

function getObservationTypeLabel(value) {
  const option = observationTypeOptions.value.find(opt => opt.value === value);
  return option ? option.label : value;
}

function getObservationStatusInfo(status) {
  const option = observationStatusOptions.find(opt => opt.value === status);
  return option || { label: status, class: 'status-default' };
}

function getObservationStatusClass(status) {
  const info = getObservationStatusInfo(status);
  return info.class || 'status-default';
}

function shouldUseWhiteTextObservation(status) {
  return ['RESUELTA'].includes(status);
}

function navigateToPage(pageNumber) {
  const validPage = Math.max(1, Math.min(pageNumber, totalObservationPages.value));
  observationsPagination.value.currentPage = validPage;
}

function goToPreviousPage() {
  navigateToPage(observationsPagination.value.currentPage - 1);
}

function goToNextPage() {
  navigateToPage(observationsPagination.value.currentPage + 1);
}

function goToPage(pageNumber) {
  navigateToPage(pageNumber);
}

function resetPagination() {
  navigateToPage(1);
}

function enableEditing(section) {
  if (section === 'verifier' && !canEditVerifierAssignment.value) {
    showWarning(
      `Solo se puede asignar verificador cuando el estado es ${VERIFIER_EDITABLE_STATUSES.join(', ')}.`,
      'Acción no permitida'
    );
    return;
  }

  if (section === 'observations' && !canEditObservations.value) {
    showWarning(
      `Solo se pueden agregar observaciones cuando el estado es ${OBSERVATION_EDITABLE_STATUSES.join(', ')}.`,
      'Acción no permitida'
    );
    return;
  }

  // Guardar datos originales antes de editar (para poder cancelar)
  if (section === 'verifier') {
    originalData.value.verifier = {
      verifierId: localHomeVisitDetails.value.verifierId,
      visitDate: localHomeVisitDetails.value.visitDate,
      visitTime: localHomeVisitDetails.value.visitTime
    };
  } else if (section === 'observations') {
    originalData.value.observations = {
      observations: props.item.observations ? [...props.item.observations] : []
    };
  }

  // Activar modo de edición para la sección específica
  editingStates.value[section] = true;
}

function cancelEditing(section) {
  // Restaurar datos originales de la sección específica
  if (section === 'verifier') {
    localHomeVisitDetails.value.verifierId = originalData.value.verifier.verifierId;
    localHomeVisitDetails.value.visitDate = originalData.value.verifier.visitDate;
    localHomeVisitDetails.value.visitTime = originalData.value.verifier.visitTime;
  } else if (section === 'observations') {
    props.item.observations = [...originalData.value.observations.observations];
  }

  editingStates.value[section] = false;
  originalData.value[section] = {};
}

function validateVerifierAssignment() {
  const { verifierId, visitDate, visitTime } = localHomeVisitDetails.value;
  
  if (!verifierId) {
    return {
      isValid: false,
      message: 'Debe seleccionar un verificador.'
    };
  }
  
  if (!visitDate) {
    return {
      isValid: false,
      message: 'Debe ingresar la fecha de visita.'
    };
  }
  
  if (!visitTime) {
    return {
      isValid: false,
      message: 'Debe ingresar la hora de visita.'
    };
  }

  // Validar que la fecha de visita no sea en el pasado
  if (visitDate instanceof Date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      return {
        isValid: false,
        message: 'La fecha de visita no puede ser en el pasado.'
      };
    }
  }
  
  return {
    isValid: true,
    message: ''
  };
}

async function assignVerifierToOrder() {
  // Validar que se hayan seleccionado todos los campos requeridos
  const validation = validateVerifierAssignment();

  if (!validation.isValid) {
    showError(validation.message, 'Error de validación');
    return;
  }

  // Preparar datos para la actualización
  // IMPORTANTE: No convertir visitDate a string aquí, dejar como Date
  // El Command se encargará de la validación con el objeto Date
  // El Repository/Assembler convertirá a string para el backend
  const updateData = {
    verifierId: localHomeVisitDetails.value.verifierId,
    visitDate: localHomeVisitDetails.value.visitDate, // Mantener como Date
    visitTime: formatTime(localHomeVisitDetails.value.visitTime)
  };

  try {
    const result = await store.assignVerifier(props.item.orderId, updateData);
    
    if (result.success) {
      // Desactivar modo edición y limpiar datos originales
      editingStates.value.verifier = false;
      originalData.value.verifier = {};
      
      // Actualizar los datos locales con los valores asignados
      props.item.verifierName = verifiersListFormatted.value.find(v => v.id === updateData.verifierId)?.fullName || '';
      props.item.visitDate = updateData.visitDate;
      props.item.visitTime = updateData.visitTime;
    }
  } catch (error) {
    console.error('Error al asignar verificador:', error);
  }
}

async function submitOrderObservations() {
  // Validar tipo de observación
  if (!currentObservation.value.observationType) {
    showWarning('Debe seleccionar un tipo de observación.', 'Campo requerido');
    return;
  }

  // Validar descripción
  if (!currentObservation.value.description?.trim()) {
    showWarning('Debe ingresar una descripción para la observación.', 'Campo requerido');
    return;
  }

  const newObservation = {
    observationType: currentObservation.value.observationType,
    description: currentObservation.value.description.trim()
  };

  try {
    const result = await store.createObservation(props.item.orderId, newObservation);
    
    if (result.success) {
      // Agregar la nueva observación a la lista
      if (!props.item.observations) props.item.observations = [];
      props.item.observations.push(result.data);
      
      // Resetear paginación para mostrar la primera página con la nueva observación
      resetPagination();
      
      // Limpiar formulario y desactivar modo edición
      currentObservation.value = { observationType: null, description: '' };
      editingStates.value.observations = false;
    }
  } catch (error) {
    console.error('Error al crear la observación:', error);
  }
}

// Lifecycle hooks
onMounted(() => {
  initializeLocalData();
  
  // Asegurar que observations existe
  if (!props.item.observations) {
    props.item.observations = [];
  }
});

// Watchers
watch(() => props.item, (newItem) => {
  if (newItem) {
    initializeLocalData();
    
    if (!newItem.observations) {
      newItem.observations = [];
    }
  }
}, { immediate: true, deep: true });
</script>

<template>
  <div class="flex flex-column gap-4">

    <!-- ====================== Card -> Asignar a verificador ====================== -->
    <pv-card>
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-user-plus"></i>
          <span class="text-lg font-bold">Asignar a verificador</span>
        </div>
      </template>
      <template #content>

        <div class="field mb-3">
          <label for="verifier" class="font-medium text-600 flex align-items-center gap-2">
            <i class="pi pi-user text-primary"></i>
            Seleccionar verificador
            <span class="text-red-500">*</span>
          </label>
          <pv-select
              id="verifier"
              v-model="localHomeVisitDetails.verifierId"
              :options="verifiersListFormatted"
              optionLabel="fullName"
              optionValue="id"
              placeholder="-- Seleccionar verificador --"
              class="w-full mt-1"
              :class="{ 'p-invalid': editingStates.verifier && !localHomeVisitDetails.verifierId }"
              :disabled="!editingStates.verifier"
              showClear
          />
        </div>

        <div class="formgrid grid mb-4">
          <div class="field col-12 md:col-6">
            <label for="visitDate" class="font-medium text-600 flex align-items-center gap-2">
              <i class="pi pi-calendar text-primary"></i>
              Fecha de visita
              <span class="text-red-500">*</span>
            </label>
            <pv-calendar
                id="visitDate"
                v-model="localHomeVisitDetails.visitDate"
                placeholder="dd/mm/aaaa"
                dateFormat="dd/mm/yy"
                class="w-full mt-1"
                :class="{ 'p-invalid': editingStates.verifier && !localHomeVisitDetails.visitDate }"
                showIcon
                :disabled="!editingStates.verifier"
            />
          </div>
          <div class="field col-12 md:col-6">
            <label for="visitTime" class="font-medium text-600 flex align-items-center gap-2">
              <i class="pi pi-clock text-primary"></i>
              Hora de visita
              <span class="text-red-500">*</span>
            </label>
            <pv-calendar
                id="visitTime"
                v-model="localHomeVisitDetails.visitTime"
                timeOnly
                placeholder="hh:mm"
                class="w-full mt-1"
                :class="{ 'p-invalid': editingStates.verifier && !localHomeVisitDetails.visitTime }"
                showIcon
                :disabled="!editingStates.verifier"
            />
          </div>
        </div>

        <!-- Botones de acción -->
        <div v-if="canEditVerifierAssignment" class="flex gap-2 w-full">
          <!-- Botón de Editar (cuando no está editando) -->
          <pv-button
              v-if="!editingStates.verifier"
              label="Editar"
              icon="pi pi-pencil"
              class="p-button-warning w-full"
              @click="enableEditing('verifier')"
          />

          <!-- Botones de acción (cuando está editando) -->
          <template v-if="editingStates.verifier">
            <pv-button
                label="Asignar"
                icon="pi pi-user-plus"
                class="p-button-primary flex-1"
                :disabled="!isVerifierAssignmentValid"
                @click="assignVerifierToOrder"
            />
            <pv-button
                label="Cancelar"
                icon="pi pi-times"
                class="p-button-secondary flex-1"
                @click="cancelEditing('verifier')"
            />
          </template>
        </div>

        <!-- Mensaje informativo cuando no se puede editar -->
        <div 
            v-if="!canEditVerifierAssignment"
            class="w-full p-3 border-1 border-orange-300 border-round bg-orange-50"
        >
          <div class="flex align-items-center gap-2">
            <i class="pi pi-info-circle text-orange-600"></i>
            <span class="text-sm text-orange-800">
              La asignación de verificador solo está disponible cuando el estado es <strong>PENDIENTE</strong>, <strong>ASIGNADO</strong> o <strong>SUBSANADA</strong>.
            </span>
          </div>
        </div>
      </template>
    </pv-card>

    <!-- ====================== Card -> Estado del Servicio ====================== -->
    <pv-card class="compact-card">
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-flag"></i>
          <span class="text-lg font-bold">Estado del Servicio</span>
        </div>
      </template>
      <template #content>
        <div class="p-3 border-round border-2 surface-border bg-blue-50">
          <label class="text-xs font-semibold text-blue-700 uppercase mb-2 flex align-items-center gap-2">
            <i class="pi pi-info-circle text-blue-600"></i>
            Estado actual
          </label>
          <span :class="['status-tag', getStatusClass(item.status)]">
            <i :class="StatusIcons[item.status]" class="mr-1"></i>
            {{ getStatusLabel(item.status) }}
          </span>
        </div>
      </template>
    </pv-card>

    <!-- ====================== Card -> Observaciones ====================== -->
    <pv-card class="w-full">
      <template #header>
        <div class="flex align-items-center gap-2 px-3 py-2">
          <i class="pi pi-comment"></i>
          <span class="text-lg font-bold">Observaciones</span>
        </div>
      </template>
      <template #content>

        <div class="field mb-3">
          <label for="observationType" class="font-medium text-600 flex align-items-center gap-2">
            <i class="pi pi-file text-primary"></i>
            Tipo de observación
            <span class="text-red-500">*</span>
          </label>
          <pv-select
              id="observationType"
              v-model="currentObservation.observationType"
              :options="observationTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="-- Seleccionar tipo de observación --"
              class="w-full mt-1"
              :class="{ 'p-invalid': editingStates.observations && !currentObservation.observationType }"
              :disabled="!editingStates.observations"
              showClear
          />
        </div>

        <div class="field mb-4">
          <label for="observations" class="font-medium text-600 flex align-items-center gap-2">
            <i class="pi pi-align-left text-primary"></i>
            Descripción
            <span class="text-red-500">*</span>
          </label>
          <pv-textarea
              id="observations"
              v-model="currentObservation.description"
              :rows="3"
              placeholder="Detalla la observación aquí..."
              class="w-full mt-1"
              :class="{ 'p-invalid': editingStates.observations && (!currentObservation.description || currentObservation.description.trim() === '') }"
              :disabled="!editingStates.observations"
          />
        </div>

        <!-- Lista de observaciones existentes -->
        <div v-if="item.observations && item.observations.length > 0" class="field mb-4">
          <label class="font-medium text-600 flex align-items-center gap-2 mb-2">
            <i class="pi pi-list text-primary"></i>
            Observaciones registradas ({{ item.observations.length }})
          </label>
          <div
            class="custom-scrollbar"
            :class="{ 'list-scrollable': paginatedObservations.length > 3 }"
          >
            <div
              v-for="(observation, index) in paginatedObservations"
              :key="observation.id || index"
              class="list-item-hover p-3 mb-2 border-1 border-300 border-round bg-blue-50 cursor-pointer"
            >
              <div class="flex align-items-start gap-2">
                <i class="pi pi-file text-blue-600 mt-1"></i>
                <div class="flex-1">
                  <div class="flex align-items-center justify-content-between mb-1">
                    <p class="font-semibold text-sm text-blue-800 m-0">
                      {{ getObservationTypeLabel(observation.observationType) }}
                    </p>
                    <span
                      v-if="observation.status"
                      :class="['observation-status-tag', getObservationStatusClass(observation.status)]"
                    >
                      {{ getObservationStatusInfo(observation.status).label }}
                    </span>
                  </div>
                  <p class="text-sm text-600 m-0">
                    {{ observation.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Controles de paginación -->
          <div v-if="totalObservationPages > 1" class="flex align-items-center justify-content-between mt-3 p-3 border-1 surface-border border-round bg-gray-50">
            <div class="flex align-items-center gap-2">
              <pv-button
                icon="pi pi-angle-left"
                class="p-button-sm p-button-text"
                :disabled="!hasPreviousPage"
                @click="goToPreviousPage"
                v-tooltip.top="'Página anterior'"
              />
              <span class="text-sm text-600">
                Página <strong>{{ observationsPagination.currentPage }}</strong> de <strong>{{ totalObservationPages }}</strong>
              </span>
              <pv-button
                icon="pi pi-angle-right"
                class="p-button-sm p-button-text"
                :disabled="!hasNextPage"
                @click="goToNextPage"
                v-tooltip.top="'Página siguiente'"
              />
            </div>
            <div class="flex align-items-center gap-1">
              <pv-button
                v-for="page in totalObservationPages"
                :key="page"
                :label="String(page)"
                class="p-button-sm"
                :class="page === observationsPagination.currentPage ? 'p-button-primary' : 'p-button-text'"
                @click="goToPage(page)"
                v-tooltip.top="`Ir a página ${page}`"
              />
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div v-if="canEditObservations" class="flex gap-2 w-full">
          <!-- Botón de Editar (cuando no está editando) -->
          <pv-button
              v-if="!editingStates.observations"
              label="Editar"
              icon="pi pi-pencil"
              class="p-button-warning w-full"
              @click="enableEditing('observations')"
          />

          <!-- Botones de acción (cuando está editando) -->
          <template v-if="editingStates.observations">
            <pv-button
                label="Guardar"
                icon="pi pi-save"
                class="p-button-primary flex-1"
                :disabled="!isObservationValid"
                @click="submitOrderObservations"
            />
            <pv-button
                label="Cancelar"
                icon="pi pi-times"
                class="p-button-secondary flex-1"
                @click="cancelEditing('observations')"
            />
          </template>
        </div>

        <!-- Mensaje informativo cuando no se pueden agregar observaciones -->
        <div 
            v-if="!canEditObservations"
            class="w-full p-3 border-1 border-orange-300 border-round bg-orange-50"
        >
          <div class="flex align-items-center gap-2">
            <i class="pi pi-info-circle text-orange-600"></i>
            <span class="text-sm text-orange-800">
              Solo se pueden agregar observaciones cuando el estado es <strong>PENDIENTE</strong>, <strong>ASIGNADO</strong>, <strong>OBSERVADO</strong> o <strong>SUBSANADA</strong>.
            </span>
          </div>
        </div>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
.compact-card :deep(.p-card-body) {
  padding: 0.75rem;
}

.compact-card :deep(.p-card-content) {
  padding: 0;
}
</style>
