<script setup>
import { computed } from 'vue';
import { DateFormatter } from '../../../shared-v2/utils/date-formatter.js';

const props = defineProps({
  // Datos del Solicitante (Empresa)
  companyName: {
    type: String,
    default: ''
  },
  companyRuc: {
    type: String,
    default: ''
  },
  companyExecutiveName: {
    type: String,
    default: ''
  },
  requestDate: {
    type: String,
    default: ''
  },
  finalResult: {
    type: String,
    default: ''
  },
  // Datos del Cliente (Candidato)
  clientFullName: {
    type: String,
    default: ''
  },
  clientInterviewedName: {
    type: String,
    default: ''
  },
  clientRelation: {
    type: String,
    default: ''
  },
  clientDocumentType: {
    type: String,
    default: ''
  },
  clientDocumentNumber: {
    type: String,
    default: ''
  }
});

// Computed
const resultBadgeClass = computed(() => {
  const result = props.finalResult?.toUpperCase();
  const classMap = {
    'CONFORME': 'status-conforme',
    'OBSERVADO': 'status-observado',
    'RECHAZADO': 'status-rechazado',
    'ENTREVISTA_ARRENDADOR_FALTANTE': 'status-entrevista-arrendador-faltante'
  };
  return classMap[result] || 'status-default';
});

const formattedResult = computed(() => {
  const result = props.finalResult?.toUpperCase();
  if (result === 'ENTREVISTA_ARRENDADOR_FALTANTE') {
    return 'Entrevista Arrendador';
  }
  return result || 'Sin definir';
});

const formattedRequestDate = computed(() => {
  if (!props.requestDate) return 'No definida';
  
  try {
    return DateFormatter.fromBackend(props.requestDate);
  } catch {
    return props.requestDate;
  }
});
</script>

<template>
  <div class="grid">
    <!-- Datos del Solicitante -->
    <div class="col-12 lg:col-6">
      <pv-card class="applicant-client-card h-full">
        <template #header>
          <h3 class="card-header-applicant flex align-items-center gap-2 text-white p-3 m-0 font-bold text-lg">
            <i class="pi pi-building"></i>
            Datos del Solicitante
          </h3>
        </template>
        <template #content>
          <div class="grid">
            <!-- Razón Social -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Razón Social</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ companyName || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- RUC -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">RUC</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ companyRuc || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- Nombre del Ejecutivo -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Nombre del Ejecutivo</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ companyExecutiveName || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- Fecha de Solicitud -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Fecha de Solicitud</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ formattedRequestDate }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </pv-card>
    </div>

    <!-- Datos del Cliente -->
    <div class="col-12 lg:col-6">
      <pv-card class="applicant-client-card h-full">
        <template #header>
          <h3 class="card-header-client flex align-items-center gap-2 text-white p-3 m-0 font-bold text-lg">
            <i class="pi pi-user"></i>
            Datos del Cliente
          </h3>
        </template>
        <template #content>
          <div class="grid">
            <!-- Nombre Completo -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Nombre Completo</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ clientFullName || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- Entrevistado -->
            <div class="col-12">
              <div class="flex align-items-start">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Entrevistado</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ clientInterviewedName || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- Parentesco -->
            <div class="col-12">
              <div class="flex align-items-start  ">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem">Parentesco</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  TITULAR
                </p>
              </div>
            </div>

            <!-- Documento y Número -->
            <div class="col-12">
              <div class="flex align-items-start  ">
                <label class="text-sm text-600 font-semibold m-0 flex-shrink-0 w-12rem align-items-start">Tipo Documento</label>
                <p class="text-sm font-bold text-700 m-0 flex-1 text-right">
                  {{ clientDocumentType || '-' }}  {{ clientDocumentNumber || 'No especificado' }}
                </p>
              </div>
            </div>
    
          </div>
        </template>
      </pv-card>
    </div>
  </div>
</template>
