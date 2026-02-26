<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import useVerificationOrderStore from '../../application/verification-order.store.js';
import { useVerificationOrderFilters } from '../composables/use-verification-order-filters.js';
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

// Composable de filtros (client-side)
const {
  filteredOrders,
  globalFilterValue,
  selectedStatus,
  updateGlobalFilter,
  updateStatusFilter,
  clearFilters,
} = useVerificationOrderFilters(() => store.orderSummaries);

// Estado
const loading = ref(false);

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
    await store.fetchAllSummaries();
  } finally {
    loading.value = false;
  }
}

// ─── Event handlers ────────────────────────────────────────────────────────────

function onGlobalFilterChange(value) {
  updateGlobalFilter(value);
}

function onClearFilters() {
  clearFilters();
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(fetchData);
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
          :items="store.orderSummaries"
          :filtered-items="filteredOrders"
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
          :rows-per-page-options="[5, 10, 20, 50]"
          search-placeholder="Buscar por código, cliente o teléfono..."
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
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
              @change="updateStatusFilter(selectedStatus)"
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
                <div class="flex align-items-center justify-content-between w-full gap-2">
                  <span>{{ slotProps.option.label }}</span>
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
</style>
