<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { useAuthenticationStore } from '../../../6.security/application/authentication.store.js';
import { StatusTranslations, StatusFilterOptions } from '../constants/order-request-ui.constants.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Router y Stores
const router    = useRouter();
const store     = useOrderRequestStore();
const authStore = useAuthenticationStore();

// Estado
const loading           = ref(false);
const globalFilterValue = ref('');
const selectedStatus    = ref('');
const serverPage        = ref(0);
const serverSize        = ref(10);

// Configuración
const title = { singular: 'Solicitud de Orden', plural: 'Mis Solicitudes' };

// Columnas de la tabla
const columns = [
  { field: 'orderCode',         header: 'Código',             sortable: true, style: 'width: 150px;' },
  { field: 'clientName',        header: 'Cliente',             sortable: true, style: 'width: 250px;' },
  { field: 'clientPhoneNumber', header: 'Contacto',            sortable: true, template: 'clientPhoneNumber', style: 'width: 130px;' },
  { field: 'requestDate',       header: 'Fecha de Solicitud',  sortable: true, template: 'requestDate',       style: 'width: 150px;' },
  { field: 'status',            header: 'Estado',              sortable: true, template: 'status',            style: 'width: 150px;' },
  { field: 'visitDate',         header: 'Fecha Visita',        sortable: true, template: 'visitDate',         style: 'width: 150px;' }
];

const statusOptions = StatusFilterOptions;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  if (!date) return '-';
  try { return DateFormatter.fromBackend(date); } catch { return date; }
}

function formatVisitDate(date) {
  if (!date) return 'PENDIENTE';
  try { return DateFormatter.fromBackend(date); } catch { return 'PENDIENTE'; }
}

function handleViewDetails(order) {
  router.push({ name: 'order-request-detail', params: { id: order.id } });
}

function handleNewRequest() {
  router.push({ name: 'order-request-form' });
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function fetchData() {
  loading.value = true;
  try {
    await store.fetchPaginated({
      corporateEmail: authStore.currentUsername,
      page:   serverPage.value,
      size:   serverSize.value,
      status: selectedStatus.value  || undefined,
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
    serverPage.value = 0;
    fetchData();
  }, 400);
}

function onPageChange({ page, rows }) {
  serverPage.value = page;
  serverSize.value = rows;
  fetchData();
}

function onClearFilters() {
  globalFilterValue.value = '';
  selectedStatus.value    = '';
  serverPage.value        = 0;
  fetchData();
}

// ─── Watchers ──────────────────────────────────────────────────────────────────

watch(selectedStatus, () => {
  serverPage.value = 0;
  fetchData();
});

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(fetchData);
</script>

<template>
  <div class="h-full w-full flex flex-column">
    
    <toolbar 
      title="Mis Solicitudes" 
      description="Consulta y gestiona tus solicitudes de verificación domiciliaria" 
      :show-back-button="false"
    />

    <div class="flex-1 p-4 overflow-auto">
      <div>
        <data-manager
          :items="store.paginatedOrderRequests"
          :lazy="true"
          :total-records="store.totalElements"
          :global-filter-value="globalFilterValue"
          :columns="columns"
          :title="title"
          :loading="loading"
          :dynamic="true"
          :show-new="true"
          :show-delete="false"
          :show-export="false"
          :show-selection="false"
          :show-actions="true"
          :show-view-action="true"
          :view-action-icon-only="true"
          :rows="10"
          :rows-per-page-options="[5, 10, 20, 50]"
          search-placeholder="Buscar por código, cliente o contacto..."
          new-button-label="Nueva Solicitud"
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
          @page-change="onPageChange"
          @view-item-requested-manager="handleViewDetails"
          @new-item-requested-manager="handleNewRequest"
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
                  <span :class="['status-tag', `status-${slotProps.value.toLowerCase().replace('_', '-')}`]">
                    {{ StatusTranslations[slotProps.value] || slotProps.value }}
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

          <!-- Template para columna de estado -->
          <template #status="slotProps">
            <span :class="['status-tag', `status-${slotProps.data.status.toLowerCase().replace('_', '-')}`]">
              {{ StatusTranslations[slotProps.data.status] || slotProps.data.status }}
            </span>
          </template>

          <!-- Template para columna de contacto -->
          <template #clientPhoneNumber="slotProps">
            <span>{{ slotProps.data.clientPhoneNumber || '-' }}</span>
          </template>

          <!-- Template para columna de fecha de solicitud -->
          <template #requestDate="slotProps">
            {{ formatDate(slotProps.data.requestDate) }}
          </template>

          <!-- Template para columna de fecha de visita -->
          <template #visitDate="slotProps">
            <span v-if="!slotProps.data.visitDate" class="status-tag status-pendiente">
              PENDIENTE
            </span>
            <span v-else>{{ formatVisitDate(slotProps.data.visitDate) }}</span>
          </template>
        </data-manager>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-requests-management {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .order-requests-management {
    padding: 1rem;
  }
}
</style>
