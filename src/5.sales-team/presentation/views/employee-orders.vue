<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSalesTeamStore } from '../../application/sales-team.store.js';
import { StatusTranslations, StatusFilterOptions } from '../../../0.verification-order-requests/presentation/constants/order-request-ui.constants.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Router y Store
const route = useRoute();
const router = useRouter();
const salesTeamStore = useSalesTeamStore();

// Estados locales
const loading = ref(false);
const globalFilterValue = ref('');
const selectedStatus = ref('');

// Paginación server-side — se inicializa desde el store para restaurar posición al volver
const serverPage  = ref(salesTeamStore.savedOrderPage);
const serverSize  = ref(salesTeamStore.savedOrderSize);
const serverFirst = ref(salesTeamStore.savedOrderPage * salesTeamStore.savedOrderSize);

// Configuración
const title = { singular: 'Orden', plural: 'Órdenes' };

// Columnas de la tabla
const columns = [
  { field: 'orderCode',    header: 'Código',            sortable: true,                       style: 'width: 150px;' },
  { field: 'clientName',  header: 'Cliente',           sortable: true,                       style: 'width: 220px;' },
  { field: 'phoneNumber', header: 'Contacto',          sortable: true, template: 'phoneNumber',  style: 'width: 130px;' },
  { field: 'requestDate', header: 'Fecha Solicitud',   sortable: true, template: 'requestDate',  style: 'width: 140px;' },
  { field: 'visitDate',   header: 'Fecha Visita',      sortable: true, template: 'visitDate',    style: 'width: 130px;' },
  { field: 'status',      header: 'Estado',            sortable: true, template: 'status',       style: 'width: 150px;' },
];

// Opciones de estado
const statusOptions = StatusFilterOptions;

// Computed — empleado seleccionado y datos del store
const selectedEmployee = computed(() => salesTeamStore.selectedEmployee);
const orders           = computed(() => salesTeamStore.employeeOrders);
const totalRecords     = computed(() => salesTeamStore.totalOrderElements);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  if (!date) return '-';
  try { return DateFormatter.fromBackend(date); } catch { return date; }
}

function formatVisitDate(date) {
  if (!date) return 'PENDIENTE';
  try { return DateFormatter.fromBackend(date); } catch { return 'PENDIENTE'; }
}

function getStatusLabel(status) {
  return StatusTranslations[status] || status;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchData() {
  if (!selectedEmployee.value?.email) return;
  loading.value = true;
  try {
    await salesTeamStore.fetchEmployeeOrders({
      corporateEmail: selectedEmployee.value.email,
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

function clearFilters() {
  globalFilterValue.value = '';
  selectedStatus.value    = '';
  serverPage.value        = 0;
  serverFirst.value       = 0;
  fetchData();
}

watch(selectedStatus, () => {
  serverPage.value  = 0;
  serverFirst.value = 0;
  fetchData();
});

// ─── Navigation ───────────────────────────────────────────────────────────────

async function viewOrderDetails(order) {
  router.push({
    name: 'order-detail-sales',
    params: { orderId: order.id }
  });
}

function goBack() {
  router.push({ name: 'sales-team-list' });
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!selectedEmployee.value) {
    const employeeId = route.params.employeeId;
    const employee = salesTeamStore.salesTeam.find(emp => emp.id === Number(employeeId));
    if (employee) {
      salesTeamStore.selectEmployee(employee);
    } else {
      router.push({ name: 'sales-team-list' });
      return;
    }
  }

  await fetchData();
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
            <!-- Data Manager Component (server-side pagination) -->
            <data-manager
                :items="orders"
                :columns="columns"
                :loading="loading"
                :title="title"
                :dynamic="true"
                :lazy="true"
                :total-records="totalRecords"
                :first="serverFirst"
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
                :rows="serverSize"
                :rows-per-page-options="[10, 15, 20, 25]"
                :global-filter-value="globalFilterValue"
                export-button-label="Exportar"
                search-placeholder="Buscar por código, cliente, contacto..."
                view-button-label="Ver detalles"
                @global-filter-change="onGlobalFilterChange"
                @clear-filters="clearFilters"
                @page-change="onPageChange"
                @view-item-requested-manager="viewOrderDetails"
            >
                <!-- Filtro de estado -->
                <template #filters="{ clearFilters: clearSlotFilters }">
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
                        @click="clearSlotFilters"
                        size="small"
                    />
                </template>

                <!-- Slot para teléfono de contacto -->
                <template #phoneNumber="{ data }">
                    <div class="flex align-items-center gap-2">
                        <span>{{ data.phoneNumber || '-' }}</span>
                    </div>
                </template>

                <!-- Slot para empresa solicitante -->
                <template #companyName="{ data }">
                    <div class="flex align-items-center gap-2">
                        <span>{{ data.companyName || '-' }}</span>
                    </div>
                </template>

                <!-- Slot para verificador asignado -->
                <template #verifierName="{ data }">
                    <div class="flex align-items-center gap-2">
                        <i :class="['pi', data.verifierId ? 'pi-user text-primary' : 'pi-user text-400']"></i>
                        <span :class="{ 'text-400': !data.verifierId }">{{ data.verifierDisplay }}</span>
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
