<script setup>
import { ref, watch, onMounted } from 'vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import useVerificationReportStore from '../../application/verification-report.store.js';
import { useVerificationReportCrud } from '../composables/use-verification-report-crud.js';
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
const { onViewItem } = useVerificationReportCrud();

// ─── Filtros activos ───────────────────────────────────────────────────────
const globalFilterValue     = ref('');
const selectedStatus        = ref('');
const selectedValidationStatus = ref('');

// ─── Paginación server-side (0-indexed, como espera el backend) ────────────
const serverPage  = ref(reportStore.savedPage);
const serverSize  = ref(reportStore.savedSize);
const serverFirst = ref(reportStore.savedPage * reportStore.savedSize);
let   searchDebounceTimer = null;

// ─── Estado general ────────────────────────────────────────────────────────
const loading = ref(false);

// ─── Configuración ────────────────────────────────────────────────────────
const statusOptions = StatusFilterOptions;
const validationStatusOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Pendientes de confirmación', value: 'pending' },
  { label: 'Validados', value: 'validated' }
];
const title   = VerificationReportUILabels.title;
const columns = [
  { field: 'reportCode',   header: 'Cód. de Reporte',  sortable: true, style: 'width: 150px;' },
  { field: 'orderCode',    header: 'Cód. de Orden',     sortable: true, style: 'width: 200px;' },
  { field: 'clientName',   header: 'Cliente',            sortable: true, style: 'width: 300px;' },
  { field: 'companyName',  header: 'Empresa',            sortable: true, style: 'width: 150px;' },
  { field: 'requestDate',  header: 'Fecha Solicitud',    sortable: true, template: 'requestDate',    style: 'width: 150px;' },
  { field: 'finalResult',  header: 'Resultado',          sortable: true, template: 'status',         style: 'width: 120px;' },
  { field: 'isResultValid',header: 'Confirmación',       sortable: true, template: 'validationStatus',style: 'width: 120px;' },
];

// ─── Fetch ────────────────────────────────────────────────────────────────
async function fetchData() {
  loading.value = true;
  try {
    const isResultValidParam =
      selectedValidationStatus.value === 'validated' ? true  :
      selectedValidationStatus.value === 'pending'   ? false :
      undefined;

    await reportStore.fetchPaginated({
      page:          serverPage.value,
      size:          serverSize.value,
      finalResult:   selectedStatus.value        || undefined,
      isResultValid: isResultValidParam,
      search:        globalFilterValue.value.trim() || undefined
    });
  } finally {
    loading.value = false;
  }
}

// ─── Handlers del DataManager ─────────────────────────────────────────────
function onPageChange({ page, rows }) {
  serverPage.value  = page;
  serverSize.value  = rows;
  serverFirst.value = page * rows;
  fetchData();
}

function onGlobalFilterChange(value) {
  globalFilterValue.value = value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    serverPage.value  = 0;
    serverFirst.value = 0;
    fetchData();
  }, 400);
}

function onClearFilters() {
  globalFilterValue.value        = '';
  selectedStatus.value           = '';
  selectedValidationStatus.value = '';
  serverPage.value               = 0;
  serverFirst.value              = 0;
  fetchData();
}

// Dropdown filters re-fetch on change, reset page
watch([selectedStatus, selectedValidationStatus], () => {
  serverPage.value  = 0;
  serverFirst.value = 0;
  fetchData();
});

// ─── Helpers ──────────────────────────────────────────────────────────────
function getStatusClass(status) {
  return StatusClassMap[status] || 'status-default';
}

function formatDate(date) {
  if (!date) return '-';
  try { return DateFormatter.fromBackend(date); }
  catch { return date; }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────
onMounted(() => {
  reportStore.fetchGlobalCounts();
  fetchData();
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
          :items="reportStore.paginatedReports"
          :global-filter-value="globalFilterValue"
          :columns="columns"
          :title="title"
          :loading="loading"
          :dynamic="true"
          :lazy="true"
          :total-records="reportStore.totalElements"
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
          :first="serverFirst"
          :rows="serverSize"
          :rows-per-page-options="[10, 15, 20, 25]"
          search-placeholder="Buscar por código, candidato o verificador..."
          @view-item-requested-manager="onViewItem"
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
          @page-change="onPageChange"
        >
          <template #filters>
            <!-- Filtro por confirmación -->
            <pv-dropdown
              v-model="selectedValidationStatus"
              :options="validationStatusOptions"
              option-label="label"
              option-value="value"
              placeholder="Filtrar por confirmación"
              class="w-full md:w-auto"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex align-items-center gap-2">
                  <span class="font-semibold">Confirmación:</span>
                  <span v-if="slotProps.value === 'pending'" class="status-tag status-pendiente">Pendientes</span>
                  <span v-else-if="slotProps.value === 'validated'" class="status-tag status-conforme">Validados</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex align-items-center justify-content-between w-full gap-3">
                  <span>{{ slotProps.option.label }}</span>
                  <span v-if="slotProps.option.value === 'pending'" class="filter-count-badge badge-pendiente">
                    {{ reportStore.globalCounts.totalPendientes }}
                  </span>
                  <span v-else-if="slotProps.option.value === 'validated'" class="filter-count-badge badge-validado">
                    {{ reportStore.globalCounts.totalValidados }}
                  </span>
                </div>
              </template>
            </pv-dropdown>

            <!-- Filtro por resultado final -->
            <pv-dropdown
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Filtrar por resultado"
              class="w-full md:w-auto"
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
                <div class="flex align-items-center justify-content-between w-full gap-3">
                  <span>{{ slotProps.option.label }}</span>
                  <span v-if="slotProps.option.value === 'CONFORME'" class="filter-count-badge badge-conforme">
                    {{ reportStore.globalCounts.totalConforme }}
                  </span>
                  <span v-else-if="slotProps.option.value === 'OBSERVADO'" class="filter-count-badge badge-observado">
                    {{ reportStore.globalCounts.totalObservado }}
                  </span>
                  <span v-else-if="slotProps.option.value === 'RECHAZADO'" class="filter-count-badge badge-rechazado">
                    {{ reportStore.globalCounts.totalRechazado }}
                  </span>
                  <span v-else-if="slotProps.option.value === 'ENTREVISTA_ARRENDADOR_FALTANTE'" class="filter-count-badge badge-entrevista">
                    {{ reportStore.globalCounts.totalEntrevistaArrendador }}
                  </span>
                </div>
              </template>
            </pv-dropdown>

            <!-- Limpiar filtros -->
            <pv-button
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              class="p-button-secondary p-button-outlined w-full md:w-auto"
              @click="onClearFilters"
            />
          </template>

          <!-- Columna de resultado final -->
          <template #status="slotProps">
            <span :class="['status-tag', getStatusClass(slotProps.data.finalResult)]">
              {{ StatusTranslations[slotProps.data.finalResult] }}
            </span>
          </template>

          <!-- Columna de estado de validación -->
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

          <!-- Columna de fecha -->
          <template #requestDate="slotProps">
            {{ formatDate(slotProps.data.requestDate) }}
          </template>
        </data-manager>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Badges de conteo en opciones de dropdown ─────────────────────────── */
.filter-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
}

.badge-conforme   { background: #d1fae5; color: #065f46; }
.badge-observado  { background: #fef3c7; color: #92400e; }
.badge-rechazado  { background: #fee2e2; color: #991b1b; }
.badge-entrevista { background: #ede9fe; color: #5b21b6; }
.badge-pendiente  { background: #fef3c7; color: #92400e; }
.badge-validado   { background: #d1fae5; color: #065f46; }
</style>