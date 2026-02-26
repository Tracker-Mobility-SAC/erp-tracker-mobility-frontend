<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSalesTeamStore } from '../../application/sales-team.store.js';
import { useOrderRequestStore } from '../../../0.verification-order-requests/application/order-request.store.js';
import { StatusTranslations, StatusFilterOptions } from '../../../0.verification-order-requests/presentation/constants/order-request-ui.constants.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Router y Store
const route = useRoute();
const router = useRouter();
const salesTeamStore = useSalesTeamStore();
const orderRequestStore = useOrderRequestStore();

// Estados locales
const loading = ref(false);
const globalFilterValue = ref('');
const selectedStatus = ref('');

// Configuración
const title = { singular: 'Orden', plural: 'Órdenes' };

// Columnas de la tabla
const columns = [
  { field: 'orderCode', header: 'Código', sortable: true, style: 'width: 150px;' },
  { field: 'clientName', header: 'Cliente', sortable: true, style: 'width: 250px;' },
  { field: 'clientPhoneNumber', header: 'Contacto', sortable: true, template: 'clientPhoneNumber', style: 'width: 130px;' },
  { field: 'requestDate', header: 'Fecha de Solicitud', sortable: true, template: 'requestDate', style: 'width: 150px;' },
  { field: 'status', header: 'Estado', sortable: true, template: 'status', style: 'width: 150px;' },
  { field: 'visitDate', header: 'Fecha Visita', sortable: true, template: 'visitDate', style: 'width: 150px;' }
];

// Opciones de estado
const statusOptions = StatusFilterOptions;

// Computed - Empleado seleccionado
const selectedEmployee = computed(() => salesTeamStore.selectedEmployee);

// Computed - Órdenes del empleado
const orders = computed(() => {
  // Filtrar órdenes por el email del empleado
  if (!selectedEmployee.value?.email) return [];
  
  return orderRequestStore.orderRequests.filter(order => 
    order.corporateEmail === selectedEmployee.value.email
  );
});

// Computed - Órdenes filtradas
const filteredOrders = computed(() => {
  let result = orders.value;

  // Filtro de búsqueda global
  if (globalFilterValue.value) {
    const searchTerm = globalFilterValue.value.toLowerCase().trim().replace(/\s+/g, ' ');
    
    const normalizeText = (text) => {
      if (!text) return '';
      return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
    result = result.filter(order => {
      const orderCode = normalizeText(order.orderCode);
      const clientName = normalizeText(order.clientName);
      const clientPhoneNumber = normalizeText(order.clientPhoneNumber);
      
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

function getStatusLabel(status) {
  return StatusTranslations[status] || status;
}

function clearFilters() {
  globalFilterValue.value = '';
  selectedStatus.value = '';
}

async function viewOrderDetails(order) {
  router.push({
    name: 'order-detail-sales',
    params: { orderId: order.id }
  });
}

function goBack() {
  router.push({ name: 'sales-team-list' });
}

// Lifecycle
onMounted(async () => {
  loading.value = true;
  
  // Verificar que hay un empleado seleccionado
  if (!selectedEmployee.value) {
    const employeeId = route.params.employeeId;
    // Intentar encontrar el empleado en la lista
    const employee = salesTeamStore.salesTeam.find(emp => emp.id === Number(employeeId));
    if (employee) {
      salesTeamStore.selectEmployee(employee);
    } else {
      // Si no se encuentra, volver a la lista
      router.push({ name: 'sales-team-list' });
      return;
    }
  }
  
  // Cargar órdenes
  await orderRequestStore.fetchAll();
  
  loading.value = false;
});
</script>

<template>
    <div class="employee-orders-view">
        <!-- Toolbar Header -->
        <Toolbar 
            :title="`Órdenes de ${selectedEmployee?.fullName || 'Vendedor'}`" 
            :description="`Gestiona las órdenes asignadas al vendedor`"
            :icon="'pi-shopping-cart'"
            :show-back="true"
            @back="goBack"
        />

        <div class="container-fluid px-4 py-4">
            <!-- Data Manager Component -->
            <data-manager
                :items="orders"
                :columns="columns"
                :loading="loading"
                :title="title"
                :dynamic="true"
                :show-new="false"
                :show-delete="false"
                :show-export="true"
                :show-selection="false"
                :show-actions="true"
                :show-action-buttons="false"
                :show-view-action="true"
                :show-edit-action="false"
                :show-delete-action="false"
                :view-action-icon-only="true"
                :rows="10"
                :rows-per-page-options="[10, 15, 20, 25]"
                :filtered-items="filteredOrders"
                :global-filter-value="globalFilterValue"
                export-button-label="Exportar"
                search-placeholder="Buscar por código, cliente, contacto..."
                view-button-label="Ver detalles"
                @global-filter-change="(val) => globalFilterValue = val"
                @clear-filters="clearFilters"
                @view-item-requested-manager="viewOrderDetails"
            >
                <!-- Filtro de estado -->
                <template #filters="{ clearFilters }">
                    <pv-select
                        v-model="selectedStatus"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Todos los estados"
                        class="w-full md:w-15rem"
                        size="small"
                        :showClear="true"
                    />
                    <pv-button
                        icon="pi pi-filter-slash"
                        label="Limpiar"
                        outlined
                        @click="clearFilters"
                        size="small"
                    />
                </template>

                <!-- Slot para teléfono de contacto -->
                <template #clientPhoneNumber="{ data }">
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-phone text-primary"></i>
                        <span>{{ data.clientPhoneNumber || '-' }}</span>
                    </div>
                </template>

                <!-- Slot para fecha de solicitud -->
                <template #requestDate="{ data }">
                    {{ formatDate(data.requestDate) }}
                </template>

                <!-- Slot para fecha de visita -->
                <template #visitDate="{ data }">
                    <span :class="{ 'text-500': !data.visitDate }">
                        {{ formatVisitDate(data.visitDate) }}
                    </span>
                </template>

                <!-- Slot para estado -->
                <template #status="{ data }">
                    <pv-tag 
                        :value="getStatusLabel(data.status)" 
                        :severity="data.status === 'COMPLETADA' ? 'success' : data.status === 'RECHAZADA' ? 'danger' : 'warning'"
                    />
                </template>
            </data-manager>
        </div>
    </div>
</template>

<style scoped>
.employee-orders-view {
    background-color: var(--color-background);
    min-height: 100vh;
}
</style>
