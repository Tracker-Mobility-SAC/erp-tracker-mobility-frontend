<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderRequestForm } from '../composables/use-order-request-form.js';
import { useOrderRequestStore } from '../../application/order-request.store.js';

// Componentes de los pasos
import CustomerData from '../components/1-customer-data.vue';
import AddressData from '../components/2-address-data.vue';
import SupportDocsLandlord from '../components/3-support-docs-landlord.vue';
import Resumen from '../components/4-resumen.vue';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';

const router = useRouter();
const store = useOrderRequestStore();

// Usar el composable para la lógica del formulario
const {
  initForm,
  handleNext,
  handleBack,
  handleCancel,
  handleComplete,
  handleFinish
} = useOrderRequestForm();

// Inicializar el formulario al montar
onMounted(async () => {
  await initForm();
});
</script>

<template>
  <div class="order-request-form-container h-full w-full flex flex-column">
    <!-- Toolbar -->
    <toolbar
      title="Nueva Solicitud"
      description="Completa los pasos para crear una solicitud de visita domiciliaria"
      :show-back-button="true"
    >
      <template #actions>
        <div class="flex align-items-center gap-2">
          <span class="text-white text-sm">Paso <pv-badge :value="store.currentStep" severity="warning" /> de <pv-badge :value="store.totalSteps" severity="info" /> </span>
        </div>
      </template>
    </toolbar>

    <div class="flex-1 overflow-auto p-4">
      <!-- Contenido del paso actual -->
      <div class="form-container mx-auto">
      <div v-if="store.currentStep === 1">
        <customer-data 
          @next="handleNext"
        />
      </div>

      <div v-else-if="store.currentStep === 2">
        <address-data 
          @next="handleNext"
          @back="handleBack"
        />
      </div>

      <div v-else-if="store.currentStep === 3">
        <support-docs-landlord 
          @back="handleBack"
          @cancel="handleCancel"
          @complete="handleComplete"
        />
      </div>

      <div v-else-if="store.currentStep === 4">
        <resumen 
          @finish="handleFinish"
        />
      </div>
    </div>
    </div>

    <!-- Loading overlay -->
    <div v-if="store.loading" class="loading-overlay flex align-items-center justify-content-center">
      <div class="surface-card border-round-lg shadow-4 p-5 text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <div class="text-xl font-semibold text-900">Procesando solicitud...</div>
        <div class="text-sm text-600 mt-2">Por favor espera un momento</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-request-form-container {
  background: var(--surface-ground);
}
</style>
