<script setup>
import { ref, onMounted } from 'vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import useVerificationReportStore from '../../application/verification-report.store.js';
import { useVerificationReportCrud } from '../composables/use-verification-report-crud.js';
import { useVerificationReportFilters } from '../composables/use-verification-report-filters.js';
import {
  StatusTranslations,
  StatusFilterOptions,
  StatusClassMap,
  VerificationReportUILabels
} from '../constants/verification-report-ui.constants.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Store
const reportStore = useVerificationReportStore();

// Composables
const {
  onViewItem,
  onDeleteItem
} = useVerificationReportCrud();

const {
  globalFilterValue,
  selectedStatus,
  selectedValidationStatus,
  filteredReports,
  clearFilters,
  updateGlobalFilter,
  updateStatusFilter,
  updateValidationStatusFilter,
  getCountByStatus,
  getCountByValidationStatus
} = useVerificationReportFilters(() => reportStore.verificationReports);

// Local state
const loading = ref(false);
const selectedItems = ref([]);

// Configuración
const statusOptions = StatusFilterOptions;
const validationStatusOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendientes de confirmación', value: 'pending' },
  { label: 'Validados', value: 'validated' }
];
const title = VerificationReportUILabels.title;

// Columnas de la tabla
const columns = [
  { field: 'reportCode', header: 'Cód. de Reporte', sortable: true, style: 'width: 150px;' },
  { field: 'orderCode', header: 'Cód. de Orden', sortable: true, style: 'width: 200px;' },
  { field: 'clientName', header: 'Cliente', sortable: true, style: 'width: 300px;' },
  { field: 'companyName', header: 'Empresa', sortable: true, style: 'width: 150px;' },
  { field: 'requestDate', header: 'Fecha Solicitud', sortable: true, template: 'requestDate', style: 'width: 150px;' },
  { field: 'finalResult', header: 'Resultado', sortable: true, template: 'status', style: 'width: 120px;' },
  { field: 'isResultValid', header: 'Confirmación', sortable: true, template: 'validationStatus', style: 'width: 120px;' },
];

// Métodos
function onGlobalFilterChange(value) {
  updateGlobalFilter(value);
}

function onClearFilters() {
  clearFilters();
}

function getStatusClass(status) {
  return StatusClassMap[status] || 'status-default';
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return DateFormatter.fromBackend(date);
  } catch {
    return date;
  }
}

async function onDeleteSelectedItems(items) {
  // TODO: Implementar eliminación en batch si es necesario
  console.log('Eliminando items:', items);
}

async function getAllReports() {
  loading.value = true;
  try {
    await reportStore.fetchAll();
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  await getAllReports();
});
</script>

<template>
  <div class="h-full w-full flex flex-column">
    <!-- Toolbar -->
    <toolbar
      :title="'Gestión de Reportes de Verificación'"
      :description="'Administra y visualiza los reportes de verificación domiciliaria'"
      :show-back-button="false"
    />

    <!-- Content -->
    <div class="flex-1 p-4 overflow-auto">
      <div>
 <data-manager
        :items="reportStore.verificationReports"
        :filtered-items="filteredReports"
        :global-filter-value="globalFilterValue"
        :columns="columns"
        :title="title"
        :loading="loading"
        :dynamic="true"
        :show-new="false"
        :show-delete="false"
        :show-export="false"
        :show-selection="false"
        :show-actions="true"
        :show-action-buttons="true"
        :show-view-action="true"
        :show-edit-action="false"
        :show-delete-action="false"
        :view-action-icon-only="true"
        :rows="10"
        :rows-per-page-options="[10, 15, 20, 25]"
        export-button-label="Exportar"
        search-placeholder="Buscar por código, candidato o verificador..."
        @view-item-requested-manager="onViewItem"
        @global-filter-change="onGlobalFilterChange"
        @clear-filters="onClearFilters"
      >
        <!-- Filtro personalizado para el estado -->
        <template #filters="{ clearFilters }">
          <pv-dropdown
            v-model="selectedValidationStatus"
            :options="validationStatusOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por confirmación"
            class="w-full md:w-auto"
            @change="updateValidationStatusFilter(selectedValidationStatus)"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center gap-2">
                <span class="font-semibold">Confirmación:</span>
                <span v-if="slotProps.value === 'pending'" class="status-tag status-pendiente">
                  Pendientes
                </span>
                <span v-else-if="slotProps.value === 'validated'" class="status-tag status-conforme">
                  Validados
                </span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center justify-content-between w-full">
                <span>{{ slotProps.option.label }}</span>
                <span
                  v-if="slotProps.option.value === 'pending'"
                  class="badge-custom status-pendiente"
                >
                  {{ getCountByValidationStatus(false) }}
                </span>
                <span
                  v-else-if="slotProps.option.value === 'validated'"
                  class="badge-custom status-conforme"
                >
                  {{ getCountByValidationStatus(true) }}
                </span>
              </div>
            </template>
          </pv-dropdown>
          <pv-dropdown
            v-model="selectedStatus"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Filtrar por resultado"
            class="w-full md:w-auto"
            @change="updateStatusFilter(selectedStatus)"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center gap-2">
                <span class="font-semibold">Estado:</span>
                <span :class="['status-tag', getStatusClass(slotProps.value)]">
                  {{ StatusTranslations[slotProps.value] }}
                </span>
              </div>
              <span v-else>{{ slotProps.placeholder }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex align-items-center justify-content-between w-full">
                <span>{{ slotProps.option.label }}</span>
                <span
                  v-if="slotProps.option.value"
                  :class="['badge-custom', getStatusClass(slotProps.option.value)]"
                >
                  {{ getCountByStatus(slotProps.option.value) }}
                </span>
              </div>
            </template>
          </pv-dropdown>
          <pv-button
            label="Limpiar filtros"
            icon="pi pi-filter-slash"
            class="p-button-secondary p-button-outlined w-full md:w-auto"
            @click="onClearFilters"
          />
        </template>

        <!-- Template para columna de estado -->
        <template #status="slotProps">
          <span :class="['status-tag', getStatusClass(slotProps.data.finalResult)]">
            {{ StatusTranslations[slotProps.data.finalResult] }}
          </span>
        </template>

        <!-- Template para columna de estado de validación -->
        <template #validationStatus="slotProps">
          <span v-if="slotProps.data.isResultValid === true" class="status-tag status-conforme">
            <i class="pi pi-check-circle mr-1"></i>
            Validado
          </span>
          <span v-else class="status-tag status-pendiente">
            <i class="pi pi-clock mr-1"></i>
            Pendiente
          </span>
        </template>

        <!-- Template para columna de fecha -->
        <template #requestDate="slotProps">
          {{ formatDate(slotProps.data.requestDate) }}
        </template>
      </data-manager>
      </div>
     
    </div>
  </div>
</template>
