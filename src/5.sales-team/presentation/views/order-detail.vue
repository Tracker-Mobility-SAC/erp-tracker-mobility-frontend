<script setup>
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import { useOrderRequestStore } from '../../../0.verification-order-requests/application/order-request.store.js';
import { useSalesTeamStore } from '../../application/sales-team.store.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';
import { StatusTranslations } from '../../../0.verification-order-requests/presentation/constants/order-request-ui.constants.js';

const route = useRoute();
const router = useRouter();
const orderRequestStore = useOrderRequestStore();
const salesTeamStore = useSalesTeamStore();

const loading = ref(false);
const orderDetail = computed(() => orderRequestStore.orderRequestDetail);
const selectedEmployee = computed(() => salesTeamStore.selectedEmployee);

// Lifecycle
onMounted(async () => {
  loading.value = true;
  
  const orderId = route.params.orderId;
  
  // Cargar el detalle de la orden
  await orderRequestStore.fetchById(orderId);
  
  loading.value = false;
});

// Métodos
function goBack() {
  if (selectedEmployee.value) {
    router.push({
      name: 'employee-orders',
      params: { employeeId: selectedEmployee.value.id }
    });
  } else {
    router.push({ name: 'sales-team-list' });
  }
}

function formatDate(date) {
  if (!date) return '-';
  try {
    return DateFormatter.fromBackend(date);
  } catch {
    return date;
  }
}

function getStatusLabel(status) {
  return StatusTranslations[status] || status;
}

function downloadDocument(doc) {
  if (doc.url) {
    window.open(doc.url, '_blank');
  }
}
</script>

<template>
  <div class="order-detail-sales-view">
    <!-- Toolbar Header -->
    <Toolbar 
      :title="`Orden ${orderDetail?.orderCode || ''}`" 
      :description="`Detalle de la orden de verificación`"
      :icon="'pi-file-check'"
      :show-back="true"
      @back="goBack"
    />

    <div class="container-fluid px-4 py-4">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-content-center align-items-center" style="min-height: 400px;">
        <pv-progress-spinner />
      </div>

      <!-- Order Detail Content -->
      <div v-else-if="orderDetail" class="grid">
        <!-- Información General -->
        <div class="col-12">
          <pv-card class="mb-3">
            <template #title>
              <div class="flex align-items-center justify-content-between">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-info-circle text-primary"></i>
                  <span>Información General</span>
                </div>
                <pv-tag 
                  :value="getStatusLabel(orderDetail.status)" 
                  :severity="orderDetail.status === 'COMPLETADA' ? 'success' : orderDetail.status === 'RECHAZADA' ? 'danger' : 'warning'"
                />
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-12 md:col-6 lg:col-3">
                  <label class="block text-600 font-semibold mb-2">Código de Orden</label>
                  <p class="text-900 text-xl m-0 font-bold">{{ orderDetail.orderCode }}</p>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <label class="block text-600 font-semibold mb-2">Fecha de Solicitud</label>
                  <p class="text-900 m-0">{{ formatDate(orderDetail.requestDate) }}</p>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <label class="block text-600 font-semibold mb-2">Fecha de Visita</label>
                  <p class="text-900 m-0">{{ formatDate(orderDetail.visitDate) || 'Pendiente' }}</p>
                </div>
                <div class="col-12 md:col-6 lg:col-3">
                  <label class="block text-600 font-semibold mb-2">Vendedor Asignado</label>
                  <p class="text-900 m-0">{{ selectedEmployee?.fullName || '-' }}</p>
                </div>
              </div>
            </template>
          </pv-card>
        </div>

        <!-- Información del Cliente -->
        <div class="col-12 lg:col-6">
          <pv-card class="h-full">
            <template #title>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-user text-primary"></i>
                <span>Cliente</span>
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-12">
                  <label class="block text-600 font-semibold mb-2">Nombre Completo</label>
                  <p class="text-900 m-0">{{ orderDetail.clientName }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <label class="block text-600 font-semibold mb-2">{{ orderDetail.clientDocumentType || 'Documento' }}</label>
                  <p class="text-900 m-0">{{ orderDetail.clientDocumentNumber }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <label class="block text-600 font-semibold mb-2">Teléfono</label>
                  <p class="text-900 m-0 flex align-items-center gap-2">
                    <i class="pi pi-phone text-primary"></i>
                    {{ orderDetail.clientPhoneNumber }}
                  </p>
                </div>
                <div class="col-12">
                  <label class="block text-600 font-semibold mb-2">Dirección</label>
                  <p class="text-900 m-0">{{ orderDetail.clientHomeAddress }}</p>
                </div>
              </div>
            </template>
          </pv-card>
        </div>

        <!-- Información de la Empresa -->
        <div class="col-12 lg:col-6">
          <pv-card class="h-full">
            <template #title>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-building text-primary"></i>
                <span>Empresa Solicitante</span>
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div class="col-12">
                  <label class="block text-600 font-semibold mb-2">Razón Social</label>
                  <p class="text-900 m-0">{{ orderDetail.applicantCompanyName || '-' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <label class="block text-600 font-semibold mb-2">RUC</label>
                  <p class="text-900 m-0">{{ orderDetail.applicantCompanyRuc || '-' }}</p>
                </div>
                <div class="col-12 md:col-6">
                  <label class="block text-600 font-semibold mb-2">Email Corporativo</label>
                  <p class="text-900 m-0">{{ orderDetail.corporateEmail || '-' }}</p>
                </div>
              </div>
            </template>
          </pv-card>
        </div>

        <!-- Documentos Adjuntos -->
        <div class="col-12" v-if="orderDetail.attachedDocuments && orderDetail.attachedDocuments.length > 0">
          <pv-card>
            <template #title>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-paperclip text-primary"></i>
                <span>Documentos Adjuntos</span>
                <pv-badge :value="orderDetail.attachedDocuments.length" severity="info" />
              </div>
            </template>
            <template #content>
              <div class="grid">
                <div 
                  v-for="(doc, index) in orderDetail.attachedDocuments" 
                  :key="index"
                  class="col-12 md:col-6 lg:col-4"
                >
                  <div class="surface-border border-1 border-round p-3 hover:surface-hover cursor-pointer transition-all transition-duration-150"
                       @click="downloadDocument(doc)">
                    <div class="flex align-items-center gap-3">
                      <div class="flex align-items-center justify-content-center border-circle bg-primary text-white"
                           style="width: 40px; height: 40px;">
                        <i class="pi pi-file text-lg"></i>
                      </div>
                      <div class="flex-1">
                        <p class="font-semibold m-0 mb-1">{{ doc.type || `Documento ${index + 1}` }}</p>
                        <p class="text-sm text-600 m-0">Click para ver</p>
                      </div>
                      <i class="pi pi-external-link text-primary"></i>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </pv-card>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-6">
        <i class="pi pi-exclamation-circle text-6xl text-red-400 mb-4"></i>
        <h3 class="text-600 mb-2">No se pudo cargar el detalle</h3>
        <p class="text-500 mb-4">La orden no existe o no tienes permisos para verla</p>
        <pv-button label="Volver" icon="pi pi-arrow-left" @click="goBack" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-detail-sales-view {
  background-color: var(--color-background);
  min-height: 100vh;
}
</style>
