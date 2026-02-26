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

// Router y Store
const router = useRouter();
const store = useVerificationOrderStore();

const {
  globalFilterValue,
  selectedStatus,
  dateRange,
  filteredOrders,
  clearFilters,
  updateGlobalFilter,
  updateStatusFilter,
  updateDateRangeFilter,
  getCountByStatus
} = useVerificationOrderFilters(() => store.orderSummaries);

// Estados locales
const loading = ref(false);

// Configuración
const statusOptions = StatusFilterOptions;
const title = { singular: UILabels.singular, plural: UILabels.title };

// Métodos
function onGlobalFilterChange(value) {
  updateGlobalFilter(value);
}

function onClearFilters() {
  clearFilters();
}

function getStatusClass(status) {
  return StatusClasses[status] || 'status-default';
}

function getStatusLabel(status) {
  return OrderStatusTranslations[status] || status;
}

function handleViewDetails(order) {
  router.push({ 
    name: 'verification-order-detail', 
    query: { id: order.id } 
  });
}

async function getAllOrders() {
  loading.value = true;
  try {
    await store.fetchAllSummaries();
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  await getAllOrders();
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
          :rows="10"
          :rows-per-page-options="[5, 10, 20, 50]"
          search-placeholder="Buscar por código, cliente, empresa o verificador..."
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
          @view-item-requested-manager="handleViewDetails"
        >
          <!-- Filtros personalizados -->
          <template #filters="{ clearFilters }">
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
                  <span 
                    :class="['badge-custom', getStatusClass(slotProps.option.value)]"
                  >
                    {{ getCountByStatus(slotProps.option.value) }}
                  </span>
                </div>
              </template>
            </pv-dropdown>
            
            <pv-calendar
              v-model="dateRange"
              selection-mode="range"
              :manual-input="false"
              date-format="dd/mm/yy"
              placeholder="Filtrar por fecha"
              class="w-full md:w-auto"
              show-icon
              @update:model-value="updateDateRangeFilter(dateRange)"
            />
            
            <pv-button
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              class="p-button-secondary p-button-outlined w-full md:w-auto"
              @click="onClearFilters"
            />
          </template>

          <!-- Status Column Template -->
          <template #status="slotProps">
            <span 
              :class="['status-tag', getStatusClass(slotProps.data.status)]"
            >
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
