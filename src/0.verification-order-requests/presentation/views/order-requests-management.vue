<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { StatusTranslations, StatusFilterOptions } from '../constants/order-request-ui.constants.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Router y Store
const router = useRouter();
const store = useOrderRequestStore();

// Estados locales
const loading = ref(false);
const globalFilterValue = ref('');
const selectedStatus = ref('');

// Configuración
const title = { singular: 'Solicitud de Orden', plural: 'Mis Solicitudes' };

// Columnas de la tabla
const columns = [
  { field: 'orderCode', header: 'Código', sortable: true, style: 'width: 150px;' },
  { field: 'clientName', header: 'Cliente', sortable: true, style: 'width: 250px;' },
  { field: 'clientPhoneNumber', header: 'Contacto', sortable: true, template: 'clientPhoneNumber', style: 'width: 130px;' },
  { field: 'requestDate', header: 'Fecha de Solicitud', sortable: true, template: 'requestDate', style: 'width: 150px;' },
  { field: 'status', header: 'Estado', sortable: true, template: 'status', style: 'width: 150px;' },
  { field: 'visitDate', header: 'Fecha Visita', sortable: true, template: 'visitDate', style: 'width: 150px;' }
];

// Opciones de estado (incluye todos los 8 estados del ServiceStatusEnum)
const statusOptions = StatusFilterOptions;

// Computed - Órdenes desde el store
const orders = computed(() => {
  console.log('[VIEW COMPUTED] store.orderRequests:', store.orderRequests);
  console.log('[VIEW COMPUTED] First order:', store.orderRequests[0]);
  return store.orderRequests;
});

// Computed - Órdenes procesadas (sin transformaciones adicionales)
const processedOrders = computed(() => {
  return orders.value;
});

// Computed - Órdenes filtradas
const filteredOrders = computed(() => {
  let result = processedOrders.value;

  // Filtro de búsqueda global
  if (globalFilterValue.value) {
    // Normalizar término de búsqueda: minúsculas, eliminar espacios extras
    const searchTerm = globalFilterValue.value.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Helper para normalizar texto: minúsculas + espacios simples
    const normalizeText = (text) => {
      if (!text) return '';
      return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
    result = result.filter(order => {
      // Normalizar cada campo antes de comparar
      const orderCode = normalizeText(order.orderCode);
      const clientName = normalizeText(order.clientName);
      const clientPhoneNumber = normalizeText(order.clientPhoneNumber);
      
      // Buscar coincidencias parciales en cualquiera de los campos
      return orderCode.includes(searchTerm) ||
             clientName.includes(searchTerm) ||
             clientPhoneNumber.includes(searchTerm);
    });
  }

  // Filtro por estado
  if (selectedStatus.value) {
    result = result.filter(order => order.status === selectedStatus.value);
  }

  return result;
});

// Métodos
function formatDate(date) {
  if (!date) return '-';
  try {
    return DateFormatter.fromBackend(date);
  } catch {
    return date;
  }
}

function formatVisitDate(date) {
  if (!date) return 'PENDIENTE';
  try {
    return DateFormatter.fromBackend(date);
  } catch {
    return 'PENDIENTE';
  }
}

function getCountByStatus(status) {
  if (!status) return processedOrders.value.length;
  return processedOrders.value.filter(order => order.status === status).length;
}

function onGlobalFilterChange(value) {
  globalFilterValue.value = value;
}

function onClearFilters() {
  globalFilterValue.value = '';
  selectedStatus.value = '';
}

function handleViewDetails(order) {
  router.push({ 
    name: 'order-request-detail', 
    params: { id: order.id }
  });
}

function handleNewRequest() {
  router.push({ name: 'order-request-form' });
}

async function fetchOrders() {
  console.log('[VIEW] fetchOrders called');
  loading.value = true;
  try {
    // Usar el Store para cargar las órdenes
    const result = await store.fetchAll();
    console.log('[VIEW] fetchAll result:', result);
    console.log('[VIEW] store.orderRequests after fetch:', store.orderRequests);
    if (store.orderRequests.length > 0) {
      console.log('[VIEW] First order after fetch:', store.orderRequests[0]);
    }
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  console.log('[VIEW] Component mounted, fetching orders...');
  await fetchOrders();
  console.log('[VIEW] After mount, orders.value:', orders.value);
});
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
          :items="processedOrders"
          :filtered-items="filteredOrders"
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
          @view-item-requested-manager="handleViewDetails"
          @new-item-requested-manager="handleNewRequest"
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
                  <span :class="['badge-custom', `status-${slotProps.option.value.toLowerCase().replace('_', '-')}`]">
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
            <span v-else>
              {{ formatVisitDate(slotProps.data.visitDate) }}
            </span>
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
