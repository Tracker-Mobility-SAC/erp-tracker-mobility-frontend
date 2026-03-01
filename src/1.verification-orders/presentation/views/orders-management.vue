<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import useVerificationOrderStore from '../../application/verification-order.store.js';
import { 
  UILabels, 
  TableColumns, 
  StatusIcons,
  StatusClasses,
  StatusFilterOptions,
  OrderStatusTranslations
} from '../constants/verification-order-ui.constants.js';

// Router y Stores
const router = useRouter();
const store  = useVerificationOrderStore();

// Estado — serverPage/serverSize inicializan desde el store para restaurar
// la paginación al volver desde la vista de detalle.
const globalFilterValue = ref('');
const selectedStatus    = ref('');
const serverPage        = ref(store.savedPage);
const serverSize        = ref(store.savedSize);
const serverFirst       = ref(store.savedPage * store.savedSize);
const loading           = ref(false);

// Configuración
const statusOptions = StatusFilterOptions;
const title = { singular: UILabels.singular, plural: UILabels.title };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusClass(status) {
  return StatusClasses[status] || 'status-default';
}

function getStatusLabel(status) {
  return OrderStatusTranslations[status] || status;
}

function handleViewDetails(order) {
  router.push({ name: 'verification-order-detail', query: { id: order.id } });
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true;
  try {
    await store.fetchPaginated({
      page:   serverPage.value,
      size:   serverSize.value,
      status: selectedStatus.value || undefined,
      search: globalFilterValue.value.trim() || undefined,
    });
  } finally {
    loading.value = false;
  }
}

// ─── Event handlers ────────────────────────────────────────────────────────────

let searchDebounceTimer = null;

function onGlobalFilterChange(value) {
  globalFilterValue.value = value;
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    serverPage.value  = 0;
    serverFirst.value = 0;
    fetchData();
  }, 400);
}

function onPageChange({ page, rows }) {
  serverPage.value  = page;
  serverSize.value  = rows;
  serverFirst.value = page * rows;
  fetchData();
}

function onClearFilters() {
  globalFilterValue.value = '';
  selectedStatus.value    = '';
  serverPage.value        = 0;
  serverSize.value        = store.savedSize;
  serverFirst.value       = 0;
  fetchData();
}

// ─── Watchers ──────────────────────────────────────────────────────────────────

watch(selectedStatus, () => {
  serverPage.value  = 0;
  serverFirst.value = 0;
  fetchData();
});

// ─── Helpers (badges) ─────────────────────────────────────────────────────────

const statusCountMap = {
  'PENDIENTE':           () => store.globalCounts.totalPendiente,
  'ASIGNADO':            () => store.globalCounts.totalAsignado,
  'EN_PROCESO':          () => store.globalCounts.totalEnProceso,
  'COMPLETADA':          () => store.globalCounts.totalCompletada,
  'CANCELADA':           () => store.globalCounts.totalCancelada,
  'OBSERVADO':           () => store.globalCounts.totalObservada,
  'SUBSANADA':           () => store.globalCounts.totalSubsanada,
  'ENTREVISTA_FALTANTE': () => store.globalCounts.totalEntrevistaFaltante,
  'EN_VALIDACION':       () => store.globalCounts.totalEnValidacion,
};

function getStatusCount(value) {
  return statusCountMap[value]?.() ?? null;
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  store.fetchGlobalCounts();
  fetchData();
});
</script>

<template>
  <div class="h-full w-full flex flex-column">
    
    <toolbar 
      :title="UILabels.MODULE_TITLE" 
      :description="UILabels.MODULE_DESCRIPTION" 
      :show-back-button="false"
    />

    <div class="flex-1 p-4 overflow-auto">
      <div>
        <data-manager
          :items="store.paginatedOrders"
          :lazy="true"
          :total-records="store.totalElements"
          :first="serverFirst"
          :global-filter-value="globalFilterValue"
          :columns="TableColumns"
          :title="title"
          :loading="loading"
          :dynamic="true"
          :show-new="false"
          :show-delete="false"
          :show-export="false"
          :show-selection="false"
          :show-actions="true"
          :show-view-action="true"
          :view-action-icon-only="true"
          :rows="serverSize"
          :rows-per-page-options="[5, 10, 20, 50]"
          search-placeholder="Buscar por código, cliente o empresa..."
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
          @page-change="onPageChange"
          @view-item-requested-manager="handleViewDetails"
        >
          <!-- Filtros personalizados -->
          <template #filters>
            <pv-dropdown
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Filtrar por estado"
              class="w-full md:w-auto"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex align-items-center gap-2">
                  <span class="font-semibold">Estado:</span>
                  <span :class="['status-tag', getStatusClass(slotProps.value)]">
                    <i :class="StatusIcons[slotProps.value]" class="mr-1"></i>
                    {{ getStatusLabel(slotProps.value) }}
                  </span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              
              <template #option="slotProps">
                <div class="flex align-items-center justify-content-between w-full gap-3">
                  <span>{{ slotProps.option.label }}</span>
                  <span
                    v-if="slotProps.option.value && getStatusCount(slotProps.option.value) !== null"
                    :class="['filter-count-badge', `badge-order-${slotProps.option.value.toLowerCase().replace(/_/g, '-')}`]"
                  >
                    {{ getStatusCount(slotProps.option.value) }}
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

          <!-- Status Column Template -->
          <template #status="slotProps">
            <span :class="['status-tag', getStatusClass(slotProps.data.status)]">
              <i :class="StatusIcons[slotProps.data.status]" class="mr-1"></i>
              {{ getStatusLabel(slotProps.data.status) }}
            </span>
          </template>
        </data-manager>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verification-orders-management {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .verification-orders-management {
    padding: 1rem;
  }
}

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

.badge-order-pendiente           { background: #fef3c7; color: #92400e; }
.badge-order-asignado            { background: #dbeafe; color: #1e40af; }
.badge-order-en-proceso          { background: #e0e7ff; color: #3730a3; }
.badge-order-completada          { background: #d1fae5; color: #065f46; }
.badge-order-cancelada           { background: #fee2e2; color: #991b1b; }
.badge-order-observado           { background: #ffedd5; color: #9a3412; }
.badge-order-subsanada           { background: #ccfbf1; color: #065f46; }
.badge-order-entrevista-faltante { background: #ede9fe; color: #5b21b6; }
.badge-order-en-validacion        { background: #bfdbfe; color: #1e40af; }
</style>
