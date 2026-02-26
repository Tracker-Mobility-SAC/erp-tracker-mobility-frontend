<script setup>
import { computed } from 'vue';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { useToast } from 'primevue/usetoast';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

// Store & Toast
const store = useOrderRequestStore();
const toast = useToast();

// Emits
const emit = defineEmits(['finish']);

// Computed
const orderNumber = computed(() => {
  return store.orderResponse?.orderCode || 'ORD-XXXX-XXX';
});

const requestDate = computed(() => {
  if (!store.orderResponse?.requestDate) return 'No especificado';
  
  try {
    // Usar DateFormatter de shared-v2 para consistencia
    return DateFormatter.fromBackend(store.orderResponse.requestDate);
  } catch (error) {
    console.error('Error al formatear fecha de solicitud:', error);
    return 'No especificado';
  }
});

const petitionerData = computed(() => {
  return {
    razonSocial: store.applicantCompany?.companyName || 'No especificado',
    nombreEjecutivo: store.applicantCompany?.executiveName || 'No especificado',
    correoCorporativo: store.applicantCompany?.corporateEmail || 'No especificado',
    marca: store.applicantCompany?.brandName || 'No especificado'
  };
});

const customerFullName = computed(() => {
  return `${store.client.name || ''} ${store.client.lastName || ''}`.trim() || 'No especificado';
});

const customerPhoneNumber = computed(() => {
  return store.client.phoneNumber || 'No especificado';
});

const fullAddress = computed(() => {
  const parts = [
    store.client.homeAddress,
    store.client.district,
    store.client.province,
    store.client.department
  ].filter(Boolean);
  
  return parts.join(', ') || 'No especificado';
});

const facadePhoto = computed(() => {
  return store.client.documents?.find(doc => doc.type === 'FOTO_FACHADA_VIVIENDA');
});

const facadePhotoUrl = computed(() => {
  if (!facadePhoto.value) return null;
  
  if (facadePhoto.value.file instanceof File) {
    return URL.createObjectURL(facadePhoto.value.file);
  }
  
  if (facadePhoto.value.url) {
    return facadePhoto.value.url;
  }
  
  return null;
});

// Métodos
const onPrint = () => {
  window.print();
};

const onFinish = () => {
  // ✅ No mostramos notificación aquí, se mostrará en el composable
  store.resetForm();
  emit('finish');
};
</script>

<template>
  <div class="flex w-full justify-content-center align-items-start p-4">
    <div class="surface-card border-round-xl shadow-3 p-6 w-full form-container success-summary-card">
      
      <!-- Header con éxito -->
      <div class="text-center mb-5">
        <div class="success-icon-circle inline-flex align-items-center justify-content-center mb-3">
          <i class="pi pi-check text-white text-2xl"></i>
        </div>

        <h1 class="text-4xl font-bold text-900 m-0 mb-4">¡Solicitud enviada de manera exitosa!</h1>

        <!-- Orden de servicio -->
        <div class="order-pill flex align-items-center justify-content-between gap-3 mb-3 w-full mx-auto form-container-narrow">
          <div>
            <span class="block text-600">Orden de servicio:</span>
            <span class="order-pill-code block">{{ orderNumber }}</span>
          </div>
          <div class="text-right">
            <span class="text-sm text-600 block">Fecha de solicitud</span>
            <span class="font-semibold text-primary">{{ requestDate }}</span>
          </div>
        </div>
      </div>

      <!-- Grid de contenido principal -->
      <div class="grid mb-4">
        
        <!-- Columna izquierda - Datos -->
        <div class="col-12 lg:col-8">
          
          <!-- Datos del solicitante -->
          <div class="mb-4">
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-building text-xl text-primary"></i>
              <h2 class="text-xl m-0 font-bold text-900">Datos del solicitante</h2>
            </div>
            <div class="surface-50 border-1 surface-border border-round-lg p-4">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div class="flex flex-column mb-3">
                    <span class="text-sm text-600 mb-1">Razón social</span>
                    <span class="font-semibold text-900">{{ petitionerData.razonSocial }}</span>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-sm text-600 mb-1">Nombre ejecutivo</span>
                    <span class="font-semibold text-900">{{ petitionerData.nombreEjecutivo }}</span>
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="flex flex-column mb-3">
                    <span class="text-sm text-600 mb-1">Correo corporativo</span>
                    <span class="font-semibold text-900">{{ petitionerData.correoCorporativo }}</span>
                  </div>
                  <div class="flex flex-column">
                    <span class="text-sm text-600 mb-1">Marca</span>
                    <span class="font-semibold text-900">{{ petitionerData.marca }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos del cliente -->
          <div class="mb-4">
            <div class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-user text-xl text-primary"></i>
              <h2 class="text-xl m-0 font-bold text-900">Datos del cliente</h2>
            </div>
            <div class="surface-50 border-1 surface-border border-round-lg p-4">
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div class="flex flex-column mb-3">
                    <span class="text-sm text-600 mb-1">Nombre completo</span>
                    <span class="font-semibold text-900">{{ customerFullName }}</span>
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="flex flex-column mb-3">
                    <span class="text-sm text-600 mb-1">Número de contacto</span>
                    <span class="font-semibold text-900">{{ customerPhoneNumber }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="flex flex-column">
                    <span class="text-sm text-600 mb-1">Dirección</span>
                    <span class="font-semibold text-900 word-break-all">{{ fullAddress }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Columna derecha - Fotografía -->
        <div class="col-12 lg:col-4">
          <div class="flex align-items-center gap-2 mb-3">
            <i class="pi pi-image text-xl text-primary"></i>
            <h2 class="text-xl m-0 font-bold text-900">Fotografía de la fachada</h2>
          </div>
          <div class="surface-50 border-1 surface-border border-round-lg p-3 text-center">
            <img
              v-if="facadePhotoUrl"
              :src="facadePhotoUrl"
              alt="Fotografía de la fachada"
              class="w-full border-round shadow-2"
              style="max-width: 300px; height: auto;"
            />
            <div v-else class="flex flex-column align-items-center justify-content-center p-4 text-500">
              <i class="pi pi-image text-4xl mb-2"></i>
              <span>Sin fotografía</span>
            </div>
          </div>
        </div>
        
      </div>

      <!-- Botones de acción -->
      <div class="flex justify-content-center gap-3 pt-4 border-top-1 surface-border print-hide">
        <pv-button
          label="Imprimir"
          icon="pi pi-print"
          severity="secondary"
          outlined
          @click="onPrint"
          class="px-5"
        />
        <pv-button
          label="Finalizar"
          icon="pi pi-check-circle"
          @click="onFinish"
          class="px-5"
        />
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.word-break-all {
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .order-pill {
    flex-direction: column;
    text-align: center;
  }
}

/* Impresión */
@media print {
  @page {
    size: A4;
    margin: 12mm;
  }

  body * {
    visibility: hidden !important;
  }

  .surface-card,
  .surface-card * {
    visibility: visible !important;
  }

  .surface-card {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    box-shadow: none !important;
    border: none !important;
  }

  .print-hide {
    display: none !important;
  }
}
</style>
