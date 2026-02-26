<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { useConfirm } from 'primevue/useconfirm';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import VerifierDataCard from "../components/verifier-data-card.vue";
import VerifierAssignedOrdersList from "../components/verifier-assigned-orders-list.vue";
import useVerifierStore from "../../application/verifier.store.js";
import { UpdateVerifierCommand } from "../../domain/commands/update-verifier.command.js";

// Composables
const route = useRoute();
const router = useRouter();
const { showSuccess, showError } = useNotification();
const confirm = useConfirm();
const verifierStore = useVerifierStore();

// State
const item = ref({});
const assignedOrders = ref([]);

// Loading states
const isLoadingVerifier = ref(true);
const hasVerifierError = ref(false);
const verifierErrorMessage = ref('');

const isLoadingOrders = ref(true);
const hasOrdersError = ref(false);
const ordersErrorMessage = ref('');

const loadingStep = ref(0);
const loadingSteps = [
  { icon: 'pi-user', label: 'Datos del verificador' },
  { icon: 'pi-list', label: 'Órdenes asignadas' },
  { icon: 'pi-check', label: 'Configuración completa' }
];

// Methods
const onSaveVerifier = async (updatedData) => {
  const updateCommand = new UpdateVerifierCommand({
    id: item.value.id,
    ...updatedData
  });
  
  const result = await verifierStore.update(updateCommand);
  
  if (result.success && result.data) {
    // Actualizar item local con los datos retornados del servidor
    item.value = { ...result.data };
  }
};

const onCancelEdit = () => {
  // No es necesario hacer nada, el componente maneja su propio estado
};

const onRemoveOrder = async (order) => {
  // TODO: Implementar actualización de orden para remover verificador
  // Esto debería estar en un OrderStore separado
  const updateOrder = {
    homeVisitDetails: {
      verifierId: null,
      visitDate: "",
      visitTime: ""
    }
  };
  
  try {
    // Por ahora simulamos la actualización
    showSuccess('Orden removida del verificador correctamente', 'Éxito');
    
    // Actualizar la lista localmente
    assignedOrders.value = assignedOrders.value.filter(o => o.id !== order.id);
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    showError('No se pudo remover la orden del verificador');
  }
};

const confirmRemoveOrder = (order) => {
  confirm.require({
    message: '¿Está seguro que desea remover esta orden del verificador?',
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Remover',
    acceptClass: 'p-button-danger',
    accept: () => {
      onRemoveOrder(order);
    }
  });
};

const simulateLoadingProgress = () => {
  const progressInterval = setInterval(() => {
    if (loadingStep.value < loadingSteps.length - 1) {
      loadingStep.value++;
    } else {
      clearInterval(progressInterval);
    }
  }, 700);
  
  setTimeout(() => {
    clearInterval(progressInterval);
  }, 4000);
};

const clearData = () => {
  // Limpiar datos SÍNCRONAMENTE (inmediato, sin await)
  item.value = {};
  assignedOrders.value = [];
  hasVerifierError.value = false;
  hasOrdersError.value = false;
  verifierErrorMessage.value = '';
  ordersErrorMessage.value = '';
};

const loadData = async (verifierId) => {
  if (verifierId) {
    isLoadingVerifier.value = true;
    isLoadingOrders.value = true;
    loadingStep.value = 0;
    
    simulateLoadingProgress();
    
    await getVerifierById(verifierId);
    await getAssignedOrdersByVerifierId(verifierId);
  } else {
    hasVerifierError.value = true;
    isLoadingVerifier.value = false;
    isLoadingOrders.value = false;
    verifierErrorMessage.value = 'ID de verificador no válido.';
  }
};

const retryLoadingVerifier = () => {
  const verifierId = route.query.id;
  hasVerifierError.value = false;
  clearData();
  loadData(verifierId);
  isLoadingVerifier.value = true;
  loadingStep.value = 0;
  
  simulateLoadingProgress();
  getVerifierById(verifierId);
};

const retryLoadingOrders = () => {
  const verifierId = route.query.id;
  hasOrdersError.value = false;
  isLoadingOrders.value = true;
  
  getAssignedOrdersByVerifierId(verifierId);
};

const getVerifierById = async (verifierId) => {
  try {
    // Buscar en el store o API con fetchById
    const result = await verifierStore.fetchById(verifierId);
    
    if (result.success && result.data) {
      item.value = { ...result.data };
      isLoadingVerifier.value = false;
    } else {
      throw new Error(result.message || 'Verificador no encontrado');
    }
  } catch (error) {
    console.error('Error al recuperar verificador:', error);
    hasVerifierError.value = true;
    isLoadingVerifier.value = false;
    verifierErrorMessage.value = error.message || 'No se pudo cargar la información del verificador. Intente nuevamente.';
  }
};

const getAssignedOrdersByVerifierId = async (verifierId) => {
  try {
    console.log('[VerifierDetail] Getting assigned orders for verifier:', verifierId);
    const orders = await verifierStore.fetchAssignedOrders(verifierId);
    console.log('[VerifierDetail] Orders received:', orders?.length || 0, 'orders');
    
    assignedOrders.value = orders || [];
    
    loadingStep.value = loadingSteps.length;
    isLoadingOrders.value = false;
  } catch (error) {
    console.error('[VerifierDetail] Error al recuperar órdenes asignadas:', error);
    console.error('[VerifierDetail] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    hasOrdersError.value = true;
    isLoadingOrders.value = false;
    
    const errorDetail = error.response?.data?.message || error.message || 'Error desconocido';
    ordersErrorMessage.value = `No se pudieron cargar las órdenes asignadas. Error del servidor: ${errorDetail}. Por favor, contacte al administrador si el problema persiste.`;
  }
};

// Lifecycle
onMounted(async () => {
  const verifierId = route.query.id;
  clearData();
  await loadData(verifierId);
});

// Watch for route changes
watch(() => route.query.id, async (newId) => {
  if (newId) {
    clearData(); // Limpiar INMEDIATAMENTE (síncrono)
    await loadData(newId); // Luego cargar (asíncrono)
  }
});
</script>

<template>
  <pv-confirm-dialog/>
  <!-- NOTA: pv-toast eliminado - se usa el global de App.vue para evitar duplicados -->

  <div class="h-full w-full flex flex-column">
    <toolbar 
      :title="item.name || 'Detalle del Verificador'"
      description="Información completa y órdenes asignadas"
      :back-route="{ name: 'verifiers' }"
    />

    <div class="flex-1 p-4 overflow-auto">
      <div>
        <!-- Estado de carga para datos del verificador -->
        <div v-if="isLoadingVerifier" class="loading-container">
      <div class="loading-content">
        <pv-progress-spinner 
          size="48" 
          stroke-width="4" 
          animation-duration="1.2s" 
          class="loading-spinner"
        />
        
        <div class="loading-text">
          <h3 class="loading-title">Cargando verificador</h3>
          <p class="loading-subtitle">{{ loadingSteps[loadingStep]?.label || 'Preparando datos...' }}</p>
        </div>
      </div>
    </div>

    <!-- Estado de error para datos del verificador -->
    <div v-else-if="hasVerifierError" class="error-container">
      <div class="error-content">
        <i class="pi pi-exclamation-triangle text-6xl error-icon"></i>
        <h3 class="error-title">Error al cargar verificador</h3>
        <p class="error-message">{{ verifierErrorMessage }}</p>
        <pv-button 
          label="Reintentar" 
          icon="pi pi-refresh" 
          outlined
          @click="retryLoadingVerifier"
        />
      </div>
    </div>

    <!-- Contenido principal -->
    <div v-else class="flex-1 flex flex-column gap-4 mt-4">
      <verifier-data-card
        :verifier="item"
        :assigned-orders-count="assignedOrders.length"
        :editable="true"
        @save="onSaveVerifier"
        @cancel="onCancelEdit"
      />

      <!-- Sección de órdenes asignadas -->
      <div class="w-full flex-1 flex-column gap-3">
        <h3 class="section-title">
          <i class="pi pi-clipboard-list"></i>
          Órdenes asignadas
        </h3>

        <!-- Estado de carga para órdenes -->
        <div v-if="isLoadingOrders" class="loading-inline">
          <div class="loading-content">
            <pv-progress-spinner 
              size="32" 
              stroke-width="4" 
              animation-duration="1.2s"
              class="loading-spinner"
            />
            <p class="loading-message">Cargando órdenes asignadas...</p>
          </div>
        </div>

        <!-- Estado de error para órdenes -->
        <div v-else-if="hasOrdersError" class="error-inline">
          <div class="error-content">
            <i class="pi pi-exclamation-triangle text-4xl error-icon"></i>
            <h4 class="error-title">Error al cargar órdenes</h4>
            <p class="error-message">{{ ordersErrorMessage }}</p>
            <pv-button 
              label="Reintentar" 
              icon="pi pi-refresh" 
              outlined
              size="small"
              @click="retryLoadingOrders"
            />
          </div>
        </div>

        <!-- Lista de ordenes asignadas -->
        <verifier-assigned-orders-list
          v-else
          :orders="assignedOrders"
          @remove-order="confirmRemoveOrder"
        />
      </div>
    </div>
      </div>
    </div>
  </div>
</template>