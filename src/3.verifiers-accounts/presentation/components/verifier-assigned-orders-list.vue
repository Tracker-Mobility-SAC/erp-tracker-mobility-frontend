<script setup>
import { ref, computed } from 'vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

const props = defineProps({
  orders: {
    type: Array,
    required: true,
    default: () => []
  },
});

const emit = defineEmits(['remove-order']);

// State
const search = ref('');
const selectedStatus = ref('Todos');
const selectedDate = ref(null);

const statusOptions = [
  { label: 'Todos', value: 'Todos' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Asignado', value: 'ASIGNADO' },
  { label: 'En Proceso', value: 'EN_PROCESO' },
  { label: 'Finalizado', value: 'FINALIZADO' },
];

// Computed
const filteredOrders = computed(() => {
  // Helper para normalizar texto: minúsculas + espacios simples
  const normalizeText = (text) => {
    if (!text) return '';
    return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
  };
  
  return props.orders.filter((order) => {
    // Filtro por texto - buscar en código de orden y dirección
    const matchesSearch = !search.value || search.value.trim().length === 0 || (() => {
      const searchTerm = normalizeText(search.value);
      const orderCode = normalizeText(order.orderCode);
      const addressStreet = normalizeText(order.addressStreet);
      
      return orderCode.includes(searchTerm) || addressStreet.includes(searchTerm);
    })();

    // Filtro por estado
    const matchesStatus = selectedStatus.value === 'Todos' || order.status === selectedStatus.value;

    // Filtro por fecha
    const matchesDate = !selectedDate.value || isSameDate(order.visitDate, selectedDate.value);

    return matchesSearch && matchesStatus && matchesDate;
  });
});

// Methods
function formatDate(date) {
  if (!date) return 'Sin fecha';
  
  try {
    // Si es ISO 8601 con timestamp (yyyy-MM-ddTHH:mm:ss)
    if (typeof date === 'string' && date.includes('T')) {
      const datePart = date.split('T')[0];
      return DateFormatter.fromBackend(datePart) || 'Fecha inválida';
    }
    
    // Si es formato backend (yyyy-MM-dd)
    if (typeof date === 'string' && date.includes('-') && date.split('-').length === 3) {
      return DateFormatter.fromBackend(date) || 'Fecha inválida';
    }
    
    // Si es objeto Date
    if (date instanceof Date) {
      return DateFormatter.fromDateObject(date) || 'Fecha inválida';
    }
    
    return 'Formato no soportado';
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
}

function getFormattedDateTime(date) {
  if (!date) return 'No asignada';
  
  try {
    // Formato: YYYY-MM-DD
    const [year, month, day] = date.split('-');
    return `${day} de ${getMonthName(parseInt(month))}, ${year} - 10:00 AM`;
  } catch (error) {
    console.error('Error formateando fecha y hora:', error);
    return formatDate(date);
  }
}

function getMonthName(month) {
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return months[month - 1] || '';
}

function getStatusLabel(status) {
  const statusMap = {
    'PENDIENTE': 'Pendiente',
    'ASIGNADO': 'Asignado',
    'EN_PROCESO': 'En Proceso',
    'COMPLETADA': 'Completada',
    'CANCELADA': 'Cancelada',
    'OBSERVADO': 'Observado',
    'SUBSANADA': 'Subsanada'
  };
  return statusMap[status] || status;
}

function getStatusClass(status) {
  return `status-${status.toLowerCase()}`;
}

function isSameDate(date1, date2) {
  if (!date1 || !date2) return false;
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch (error) {
    console.error('Error comparando fechas:', error);
    return false;
  }
}

function clearFilters() {
  search.value = '';
  selectedStatus.value = 'Todos';
  selectedDate.value = null;
}

function removeOrder(order) {
  if (order.status === 'FINALIZADO' || order.status === 'EN_PROCESO') {
    return; // No permitir remover órdenes finalizadas o en proceso
  }
  emit('remove-order', order);
}
</script>

<template>
  <div class="w-full flex-1 flex-column gap-3">
    <!-- Filtros -->
    <div class="flex w-full gap-3 mb-4 align-items-center flex-wrap">
      <!-- Search -->
      <div class="flex-grow-1" style="min-width: 250px;">
        <pv-icon-field>
          <pv-input-icon class="pi pi-search" />
          <pv-input-text
            v-model="search"
            placeholder="Busca por código de orden o dirección..."
            class="w-full"
          />
        </pv-icon-field>
      </div>

      <!-- Status Filter -->
      <div style="min-width: 200px;">
        <pv-dropdown
          v-model="selectedStatus"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          placeholder="Estado: Todos"
          class="w-full"
        />
      </div>

      <!-- Date Filter -->
      <div style="min-width: 200px;">
        <pv-calendar
          v-model="selectedDate"
          date-format="dd/mm/yy"
          placeholder="dd/mm/aaaa"
          show-icon
          class="w-full"
        />
      </div>

      <!-- Clear Button -->
      <div>
        <pv-button
          label="Limpiar filtros"
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Lista de órdenes como tarjetas -->
    <div
      v-for="order in filteredOrders"
      :key="order.id"
      class="order-card surface-card border-round p-4 mb-3 shadow-1"
    >
      <div class="grid align-items-center">
        <!-- ID de Orden -->
        <div class="col-12 md:col-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-hashtag text-primary"></i>
            <div class="flex flex-column">
              <span class="text-500 text-xs font-medium">ID de Orden</span>
              <span class="text-900 font-bold text-lg">{{ order.orderCode }}</span>
            </div>
          </div>
        </div>

        <!-- Dirección -->
        <div class="col-12 md:col-4">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-map-marker text-primary"></i>
            <div class="flex flex-column">
              <span class="text-500 text-xs font-medium">Dirección</span>
              <span class="text-900 font-semibold">{{ order.addressStreet || 'Sin dirección' }}</span>
            </div>
          </div>
        </div>

        <!-- Fecha y Hora -->
        <div class="col-12 md:col-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-calendar text-primary"></i>
            <div class="flex flex-column">
              <span class="text-500 text-xs font-medium">Fecha y Hora</span>
              <span class="text-900 font-semibold">{{ getFormattedDateTime(order.visitDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Estado -->
        <div class="col-12 md:col-2 flex justify-content-end">
          <div class="flex flex-column align-items-end gap-2">
            <span class="text-500 text-xs font-medium">Estado:</span>
            <span 
              :class="['status-badge', getStatusClass(order.status)]"
            >
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ver en Google Maps -->
      <div v-if="order.addressLocation" class="mt-3 pt-3 border-top-1 border-200">
        <a
          :href="order.addressLocation"
          target="_blank"
          class="text-primary font-medium flex align-items-center gap-2 no-underline hover:text-primary-600"
        >
          <i class="pi pi-external-link"></i>
          Ver en Google Maps
        </a>
      </div>
    </div>

    <!-- Si no hay órdenes -->
    <div v-if="filteredOrders.length === 0" class="text-center py-8">
      <i class="pi pi-inbox text-6xl text-400 mb-3 block"></i>
      <p class="text-600 text-lg font-medium m-0">No hay órdenes que coincidan con los filtros aplicados.</p>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  transition: all 0.2s ease-in-out;
  background: var(--surface-0);
  border: 1px solid var(--surface-100);
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  transition: all 0.2s ease;
}

/* Estados de órdenes usando variables corporativas */
.status-pendiente {
  background-color: var(--status-pendiente);
  color: var(--text-black);
}

.status-asignado {
  background-color: var(--status-asignado);
  color: var(--text-white);
}

.status-en_proceso {
  background-color: var(--status-en-proceso);
  color: var(--text-black);
}

.status-completada {
  background-color: var(--status-completada);
  color: var(--text-white);
}

.status-cancelada {
  background-color: var(--status-cancelada);
  color: var(--text-white);
}

.status-observado {
  background-color: var(--status-observado);
  color: var(--text-black);
}

.status-subsanada {
  background-color: var(--status-subsanada);
  color: var(--text-white);
}
</style>
