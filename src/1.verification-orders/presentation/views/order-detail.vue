<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import OrderDescription from '../components/order-description.vue';
import OrderActions from '../components/order-actions.vue';
import useVerificationOrderStore from '../../application/verification-order.store.js';
import useVerifierStore from '../../../3.verifiers-accounts/application/verifier.store.js';

// Router
const route = useRoute();
const router = useRouter();

// Store y composables
const store = useVerificationOrderStore();
const verifierStore = useVerifierStore();

// State
const orderDetail = ref(null);
const verifiersList = ref([]);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const loadingStep = ref(0);

// Constantes
const STATUS_OPTIONS = [
  { label: 'Todos', value: null },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Asignado', value: 'ASIGNADO' },
  { label: 'En Proceso', value: 'EN_PROCESO' },
  { label: 'Completada', value: 'COMPLETADA' },
  { label: 'Cancelada', value: 'CANCELADA' },
  { label: 'Observado', value: 'OBSERVADO' },
  { label: 'Subsanada', value: 'SUBSANADA' }
];

const LOADING_STEPS = [
  { icon: 'pi-file-o', label: 'Datos de la orden' },
  { icon: 'pi-users', label: 'Información del cliente' },
  { icon: 'pi-cog', label: 'Detalles del servicio' }
];

let loadingProgressInterval = null;

// Methods
function onDownloadDocument(payload) {
  console.log(`Descargar documento: ${payload.type} para la orden ${payload.item.id}`);
}

function simulateLoadingProgress() {
  clearLoadingInterval();
  loadingProgressInterval = setInterval(() => {
    if (loadingStep.value < LOADING_STEPS.length - 1) {
      loadingStep.value++;
    } else {
      clearLoadingInterval();
    }
  }, 200);
  setTimeout(() => clearLoadingInterval(), 4000);
}

function clearLoadingInterval() {
  if (loadingProgressInterval) {
    clearInterval(loadingProgressInterval);
    loadingProgressInterval = null;
  }
}

function goBack() {
  router.push({ name: 'verification-orders-list' });
}

async function loadVerifiers() {
  try {
    const result = await verifierStore.fetchAll();
    
    if (result.success) {
      verifiersList.value = result.data || [];
    } else {
      console.error('[OrderDetail] Error al cargar verificadores:', result.message);
      verifiersList.value = [];
    }
  } catch (error) {
    console.error('[OrderDetail] Excepción al cargar verificadores:', error);
    verifiersList.value = [];
  }
}

const clearData = () => {
  // Limpiar datos SÍNCRONAMENTE (inmediato, sin await)
  orderDetail.value = null;
  verifiersList.value = [];
  hasError.value = false;
  errorMessage.value = '';
  loadingStep.value = 0;
};

const loadData = async (orderId) => {
  if (!orderId) {
    hasError.value = true;
    errorMessage.value = 'ID de orden no proporcionado';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  loadingStep.value = 0;
  
  simulateLoadingProgress();

  try {
    // Cargar orden y verificadores en paralelo
    const [orderResult] = await Promise.all([
      store.fetchById(orderId),
      loadVerifiers()
    ]);
    
    if (orderResult.success) {
      orderDetail.value = orderResult.data;
      loadingStep.value = LOADING_STEPS.length;
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      hasError.value = true;
      errorMessage.value = orderResult.message || 'Error al cargar los detalles de la orden';
    }
  } catch (error) {
    console.error('Error al obtener detalles de la orden:', error);
    hasError.value = true;
    errorMessage.value = 'Error al cargar los detalles de la orden. Por favor, intente nuevamente.';
  } finally {
    isLoading.value = false;
    clearLoadingInterval();
  }
};

async function loadOrderDetail() {
  const orderId = route.query.id;
  clearData();
  await loadData(orderId);
}
 
// Lifecycle
onMounted(() => {
  loadOrderDetail();
});

// Watch for route changes
watch(() => route.query.id, async (newId) => {
  if (newId) {
    clearData(); // Limpiar INMEDIATAMENTE (síncrono)
    await loadData(newId); // Luego cargar (asíncrono)
  }
});

onBeforeUnmount(() => {
  clearLoadingInterval();
});
</script>

<template>
  <div class="h-full w-full flex flex-column">

    <toolbar 
      :title="'Detalle de Orden'" 
      :description="orderDetail?.orderCode ? `Orden: ${orderDetail.orderCode}` : 'Cargando...'" 
      :show-back-button="true"
      @back="goBack"
    >
      <template #actions>
        <div class="flex align-items-center gap-2 px-3 py-2 border-round-md border-2 surface-border bg-blue-50">
          <i class="pi pi-calendar text-blue-600 text-lg"></i>
          <div class="flex flex-column">
            <span class="text-xs font-semibold text-blue-700 uppercase mb-1">Fecha de solicitud</span>
            <span v-if="orderDetail" class="text-base font-bold text-900">
              {{ orderDetail.requestDateFormatted || 'No disponible' }}
            </span>
            <span v-else class="text-sm text-600">Cargando...</span>
          </div>
        </div>
      </template>
    </toolbar>

    <div class="flex-1 p-4 overflow-auto">
      
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex justify-content-center align-items-center surface-ground border-round my-3" style="min-height: 50vh;">
        <div class="flex flex-column align-items-center text-center gap-3">
          <pv-progress-spinner 
            size="48" 
            stroke-width="4" 
            animation-duration="1.2s" 
            style="opacity: 0.8;"
          />
          
          <div style="max-width: 300px;">
            <h3 class="text-xl font-medium text-900 m-0" style="letter-spacing: -0.025em;">Cargando orden de servicio</h3>
            <p class="text-sm text-600 m-0 mt-2" style="transition: opacity 0.3s ease;">{{ LOADING_STEPS[loadingStep]?.label || 'Preparando datos...' }}</p>
          </div>
        </div>
      </div>

      <!-- Estado de error -->
      <div v-else-if="hasError" class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <pv-message severity="error" :closable="false">
          <template #default>
            <div class="flex flex-column align-items-center">
              <i class="pi pi-exclamation-triangle text-4xl mb-3"></i>
              <span>{{ errorMessage }}</span>
              <pv-button 
                label="Reintentar" 
                icon="pi pi-refresh" 
                class="mt-3"
                @click="loadOrderDetail"
              />
            </div>
          </template>
        </pv-message>
      </div>

      <!-- Grid de detalles de la orden (con dos columnas: izquierda más ancha, derecha más estrecha) -->
      <div v-else-if="orderDetail" class="flex flex-wrap gap-3">

        <!-- Columna izquierda (60% del ancho) -->
        <div class="flex-1" style="min-width: 300px; max-width: 100%;">
          <order-description
              :item="orderDetail"
              @download-document="onDownloadDocument"
          />
        </div>

        <!-- Columna derecha (40% del ancho) -->
        <div class="flex-none" style="width: 450px; min-width: 300px;">
          <order-actions
              :item="orderDetail"
              :verifiers-list="verifiersList"
              :status-options="STATUS_OPTIONS"
          />
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
</style>
