<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import useVerificationReportStore from '../../application/verification-report.store.js';
import { useNotification } from '../../../shared-v2/composables/use-notification.js';
import { ReportApi } from '../../infrastructure/report.api.js';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';

// Import all report card components
import VerificationInfoCard from '../components/verification-info-card.vue';
import ApplicantClientInfoCard from '../components/applicant-client-info-card.vue';
import AddressInfoCard from '../components/address-info-card.vue';
import InterviewDetailsCard from '../components/interview-details-card.vue';
import ContactReferencesCard from '../components/contact-references-card.vue';
import LandlordInterviewCard from '../components/landlord-interview-card.vue';
import ObservationsCard from '../components/observations-card.vue';
import SummaryCard from '../components/summary-card.vue';
import GlossaryCard from '../components/glossary-card.vue';
import CasuisticsCard from '../components/casuistics-card.vue';

import AnnexePhotographicRegistry from '../components/annexe-photographic-registry.vue';
import EmailSendDialog from '../components/email-send-dialog.vue';

// Composables
const route = useRoute();
const confirm = useConfirm();
const reportStore = useVerificationReportStore();
const { showSuccess, showError, showWarning } = useNotification();
const reportApi = new ReportApi();

// State
const report = ref(null);
const isLoading = ref(true);
const hasError = ref(false);
const errorMessage = ref('');
const emailDialogVisible = ref(false);
const landlordInterviewCardRef = ref(null);
const isDownloadingReport = ref(false);
const isConfirmingResult = ref(false);

// Estado para edición de confirmación de resultado
const editableReport = ref({
  finalResult: '',
  summary: '',
  observations: [],
  casuistics: []
});

// Estado para cambios en Anexo 06 (solo reemplazos)
const annexe06Changes = ref({
  photosToReplace: []
});

// Estado para cambios en riesgos de zona
const zoneRisksChanged = ref(false);
const editedAreaRisks = ref([]);

// URLs temporales para previsualizaciones de imágenes reemplazadas
const tempPhotoUrls = ref([]);


// Computed
const canExportPDF = computed(() => {
  if (!report.value) return false;
  // Permitir exportación solo si isResultValid es true
  return report.value.isResultValid === true && !!report.value.reportId;
});

const canEditInterview = computed(() => {
  if (!report.value) return false;
  // Permitir edición si el resultado es ENTREVISTA_ARRENDADOR_FALTANTE
  return report.value.finalResult === 'ENTREVISTA_ARRENDADOR_FALTANTE';
});

const canConfirmResult = computed(() => {
  if (!report.value) return false;
  // Habilitar confirmación de resultado si:
  // - isResultValid es false
  // - finalResult NO es ENTREVISTA_ARRENDADOR_FALTANTE
  return report.value.isResultValid === false && 
         report.value.finalResult !== 'ENTREVISTA_ARRENDADOR_FALTANTE';
});

// Computed para las fotos del Anexo 06 (reactivo para previsualizaciones)
const annexe06PhotosComputed = computed(() => {
  if (!report.value || !report.value.annexe06Photos) return [];
  return report.value.annexe06Photos;
});

const isEditBlockedByFinalResult = computed(() => {
  if (!report.value) return false;
  // Bloquear si hay resultado final diferente a ENTREVISTA_ARRENDADOR_FALTANTE
  return !!report.value.finalResult && report.value.finalResult !== 'ENTREVISTA_ARRENDADOR_FALTANTE';
});

const showInterviewAlert = computed(() => {
  return report.value?.finalResult === 'ENTREVISTA_ARRENDADOR_FALTANTE';
});

const showConfirmResultAlert = computed(() => {
  return canConfirmResult.value;
});

// Loading steps
const loadingStep = ref(0);
const loadingSteps = [
  { icon: 'pi-file', label: 'Cargando reporte' },
  { icon: 'pi-images', label: 'Cargando anexos' },
  { icon: 'pi-check', label: 'Completado' }
];

// Methods
const getReportById = async (reportId) => {
  const startTime = performance.now();
  console.log('[report-detail] Iniciando carga del reporte...');
  
  try {
    const result = await reportStore.fetchById(reportId);
    const fetchTime = performance.now();
    console.log(`[report-detail] Fetch completado en ${(fetchTime - startTime).toFixed(2)}ms`);
    
    if (result.success && result.data) {
      report.value = result.data;
      isLoading.value = false;
      
      const totalTime = performance.now();
      console.log(`[report-detail] Reporte cargado completamente en ${(totalTime - startTime).toFixed(2)}ms`);
    } else {
      throw new Error(result.message || 'Reporte no encontrado');
    }
  } catch (error) {
    console.error('Error al recuperar reporte:', error);
    hasError.value = true;
    isLoading.value = false;
    errorMessage.value = error.message || 'No se pudo cargar el reporte. Intente nuevamente.';
  }
};

const clearData = () => {
  // Limpiar datos SÍNCRONAMENTE (inmediato, sin await)
  report.value = null;
  hasError.value = false;
  errorMessage.value = '';
  loadingStep.value = 0;
  emailDialogVisible.value = false;
};

const loadData = async (reportId) => {
  if (!reportId) {
    hasError.value = true;
    isLoading.value = false;
    errorMessage.value = 'ID de reporte no proporcionado';
    return;
  }
  
  isLoading.value = true;
  await getReportById(reportId);
};

const retryLoading = () => {
  const reportId = route.params.reportId;
  hasError.value = false;
  clearData();
  loadData(reportId);
};

const handleViewPhoto = (photo) => {
  // TODO: Implementar visualizador de fotos
  console.log('Ver foto:', photo);
};

const handleViewAnnex = (annex) => {
  // TODO: Implementar visualizador de anexos
  console.log('Ver anexo:', annex);
};

const handleDownloadAnnex = (annex) => {
  // TODO: Implementar descarga de anexos
  console.log('Descargar anexo:', annex);
};

const handleSendEmail = () => {
  emailDialogVisible.value = true;
};

const handleEmailSaveRequested = async (emailData) => {
  // TODO: Implementar envío de email
  console.log('Enviar email:', emailData);
  showSuccess('Email enviado exitosamente', 'Éxito');
  emailDialogVisible.value = false;
};

const handleEmailCancelRequested = () => {
  emailDialogVisible.value = false;
};

const handleExportPDF = async () => {
  // Validar si falta la entrevista con el arrendador
  if (report.value?.finalResult === 'ENTREVISTA_ARRENDADOR_FALTANTE') {
    showError(
      'Debe completar la entrevista con el arrendador antes de descargar el informe. Por favor, complete los datos de la entrevista en la sección "Detalles de la entrevista" y vuelva a intentarlo.',
      'Entrevista pendiente',
      6000
    );
    return;
  }

  if (!report.value?.reportId) {
    showError('No se puede descargar el reporte: ID de reporte no disponible');
    return;
  }

  isDownloadingReport.value = true;
  
  try {
    // Obtener URL de descarga a través del Store (Clean Architecture)
    const result = await reportStore.getReportDownloadUrl(report.value.reportId);
    
    if (!result.success) {
      showError(result.message || 'No se pudo obtener la URL de descarga del reporte');
      return;
    }

    const downloadUrl = result.data?.reportUrl;
    
    if (!downloadUrl) {
      showError('No se pudo obtener la URL de descarga del reporte');
      return;
    }
    
    // Abrir URL en nueva pestaña para descargar
    window.open(downloadUrl, '_blank');
    
    showSuccess('Reporte descargado exitosamente', 'Descarga completada');
  } catch (error) {
    console.error('[ReportDetail] Error al descargar reporte:', error);
    showError('No se pudo descargar el reporte. Intente nuevamente.', 'Error de descarga');
  } finally {
    isDownloadingReport.value = false;
  }
};

const handleUpdateInterviewDetailsRequested = async (payload) => {
  const startTime = performance.now();
  console.log('[report-detail] Iniciando actualización de entrevista...');
  
  try {
    isLoading.value = true;

    // Función para limpiar strings
    const cleanString = (v) => {
      if (v === null || v === undefined || v === '' || v === '-' || v === 'No especificado') {
        return '';
      }
      return String(v).trim();
    };

    // Obtener el orderId desde el reporte
    const orderId = report.value?.orderId;

    console.log('[report-detail] DEBUG - handleUpdateInterviewDetailsRequested:', {
      orderId,
      reportId: report.value?.reportId,
      reportCode: report.value?.reportCode,
      payload
    });

    if (!orderId) {
      showError(
        'El backend no está enviando el orderId. Por favor, contacte al administrador del sistema.',
        'Error de configuración'
      );
      throw new Error('No se pudo obtener el ID de la orden desde el reporte');
    }

    // Preparar datos en el formato que espera el Command
    const commandData = {
      tenantName: cleanString(payload?.tenantName),
      ownHouse: cleanString(payload?.ownHouse),
      serviceClientPays: cleanString(payload?.serviceClientPays),
      clientPaysPunctual: cleanString(payload?.clientPaysPunctual),
      clientRentalTime: cleanString(payload?.clientRentalTime),
      clientFloorNumber: cleanString(payload?.clientFloorNumber),
      interviewObservation: cleanString(payload?.interviewObservation)
    };

    console.log('[report-detail] Enviando actualización de entrevista al backend...');
    const updateStart = performance.now();
    
    // 1. Enviar actualización de la entrevista al backend
    const result = await reportStore.updateLandlordInterview(orderId, commandData);
    
    const updateEnd = performance.now();
    console.log(`[report-detail] Actualización de entrevista completada en ${(updateEnd - updateStart).toFixed(2)}ms`);

    if (!result.success) {
      throw new Error(result.message || 'Error al actualizar la entrevista');
    }

    // 2. Si hay imágenes para subir, subirlas inmediatamente después
    if (payload?.imageFiles && payload.imageFiles.length > 0) {
      try {
        console.log(`[report-detail] Subiendo ${payload.imageFiles.length} imagen(es) de entrevista...`);
        const imageStart = performance.now();
        
        // Subir cada imagen secuencialmente
        for (let i = 0; i < payload.imageFiles.length; i++) {
          const imageFile = payload.imageFiles[i];
          console.log(`[report-detail] Subiendo imagen ${i + 1} de ${payload.imageFiles.length}...`);
          await reportApi.addAttachment(report.value.reportId, imageFile, 'OTROS');
        }
        
        const imageEnd = performance.now();
        console.log(`[report-detail] ${payload.imageFiles.length} imagen(es) subida(s) en ${(imageEnd - imageStart).toFixed(2)}ms`);
      } catch (imageError) {
        console.error('Error al subir imagen:', imageError);
        // No fallar todo el proceso si la imagen falla
        showWarning(
          'La entrevista se guardó correctamente pero hubo un error al subir una o más imágenes. Puede intentar subirlas nuevamente.',
          'Advertencia',
          5000
        );
      }
    }

    showSuccess('Entrevista con el arrendador actualizada exitosamente', 'Éxito');
    
    // 3. Recargar el reporte completo desde el backend
    console.log('[report-detail] Recargando reporte...');
    const reloadStart = performance.now();
    
    await getReportById(route.params.reportId);
    
    const reloadEnd = performance.now();
    console.log(`[report-detail] Recarga completada en ${(reloadEnd - reloadStart).toFixed(2)}ms`);
    
    // 4. Reinicializar campos editables con datos frescos del backend
    console.log('[report-detail] Reinicializando campos editables...');
    initializeEditableReport();
    
    const totalTime = performance.now();
    console.log(`[report-detail] ⏱️ Tiempo total de operación: ${(totalTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error('Error al actualizar entrevista:', error);
    showError(
      error.message || 'No se pudo actualizar la entrevista. Intente nuevamente.',
      'Error al guardar'
    );
  } finally {
    isLoading.value = false;
  }
};

const scrollToInterviewCard = () => {
  if (landlordInterviewCardRef.value) {
    landlordInterviewCardRef.value.$el.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }
};

// Obtiene los attachments con tipo "OTROS" para la entrevista (máximo 2)
const getInterviewAttachments = () => {
  if (!report.value || !report.value.attachments) return [];
  
  // Buscar todos los attachments con tipo "OTROS"
  const interviewAttachments = report.value.attachments.filter(
    att => att.type === 'OTROS'
  );
  
  return interviewAttachments;
};

// Handlers para Anexo 06
const handleReplacePhotoInAnnexe06 = async ({ index, file }) => {
  console.log('[handleReplacePhotoInAnnexe06] Iniciando reemplazo:', { index, fileName: file.name });
  
  const photo = report.value.annexe06Photos[index];
  if (photo && photo.id) {
    // Crear URL temporal para previsualización
    const tempUrl = URL.createObjectURL(file);
    console.log('[handleReplacePhotoInAnnexe06] URL temporal creada:', tempUrl);
    tempPhotoUrls.value.push(tempUrl);
    
    // Guardar cambio para aplicar después
    annexe06Changes.value.photosToReplace.push({
      attachmentId: photo.id,
      file: file,
      originalUrl: photo.url // Guardar URL original por si se cancela
    });
    
    // Crear nuevo array con la foto reemplazada
    const newPhotos = [...report.value.annexe06Photos];
    newPhotos[index] = {
      ...photo,
      url: tempUrl,
      isTemporary: true
    };
    
    console.log('[handleReplacePhotoInAnnexe06] Antes de actualizar:', report.value.annexe06Photos[index].url);
    
    // Actualizar el objeto report completo para forzar reactividad
    report.value = {
      ...report.value,
      annexe06Photos: newPhotos
    };
    
    console.log('[handleReplacePhotoInAnnexe06] Después de actualizar:', report.value.annexe06Photos[index].url);
    
    // Forzar actualización del DOM
    await nextTick();
    console.log('[handleReplacePhotoInAnnexe06] Reemplazo completado');
  }
};

// Handler para cambios en riesgos de zona
const handleAreaRiskUpdate = (newRisks) => {
  console.log('[report-detail] DEBUG - handleAreaRiskUpdate llamado:', newRisks);
  const originalRisks = report.value.zone?.areaRisk || [];
  const risksChanged = JSON.stringify(originalRisks.sort()) !== JSON.stringify(newRisks.sort());
  
  zoneRisksChanged.value = risksChanged;
  editedAreaRisks.value = newRisks;
  console.log('[report-detail] DEBUG - zoneRisksChanged:', risksChanged);
};

const handleDeletePhotoFromAnnexe06 = (index) => {
  const photo = report.value.annexe06Photos[index];
  if (photo && photo.id) {
    annexe06Changes.value.photosToDelete.push(photo.id);
    // Remover visualmente de la lista
    report.value.annexe06Photos.splice(index, 1);
  }
};

const initializeEditableReport = () => {
  if (report.value) {
    editableReport.value = {
      finalResult: report.value.finalResult || '',
      summary: report.value.summary || '',
      observations: report.value.observations || [],
      casuistics: report.value.casuistics || []
    };
    
    // Inicializar riesgos de zona editables
    editedAreaRisks.value = [...(report.value.zone?.areaRisk || [])];
    zoneRisksChanged.value = false;
    
    console.log('[report-detail] DEBUG - initializeEditableReport:', {
      observations: editableReport.value.observations,
      casuistics: editableReport.value.casuistics,
      areaRisks: editedAreaRisks.value
    });
  }
};

const handleConfirmResult = async () => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[PROD DEBUG] Estado COMPLETO del reporte ANTES de confirmar:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('reportId:', report.value?.reportId, '| Tipo:', typeof report.value?.reportId);
    console.log('orderId:', report.value?.orderId, '| Tipo:', typeof report.value?.orderId);
    console.log('isResultValid:', report.value?.isResultValid);
    console.log('finalResult:', report.value?.finalResult);
    console.log('reportCode:', report.value?.reportCode);
    console.log('Reporte completo:', JSON.stringify(report.value, null, 2));
    console.log('═══════════════════════════════════════════════════════');
    
    if (!report.value?.reportId) {
      showError('No se puede confirmar el resultado: ID de reporte no disponible');
      return;
    }

    // Validar que los campos requeridos no estén vacíos
    if (!editableReport.value.finalResult) {
      showError('Debe seleccionar un resultado final');
      return;
    }

    if (!editableReport.value.summary || editableReport.value.summary.trim() === '') {
      showError('Debe ingresar un resumen');
      return;
    }

    // Construir mensaje de confirmación
    const hasAnnexe06Changes = annexe06Changes.value.photosToReplace.length > 0;
    const hasZoneRiskChanges = zoneRisksChanged.value;

    let confirmMessage = '¿Está seguro de que desea confirmar y validar el resultado del reporte?';
    
    const changes = [];
    if (hasAnnexe06Changes) {
      changes.push(`${annexe06Changes.value.photosToReplace.length} foto(s) del Anexo 06`);
    }
    if (hasZoneRiskChanges) {
      changes.push('riesgos de la zona');
    }
    
    if (changes.length > 0) {
      confirmMessage = `¿Está seguro de que desea confirmar y validar el resultado del reporte?\n\nSe actualizarán: ${changes.join(' y ')}.`;
    }

    // Mostrar diálogo de confirmación
    confirm.require({
      message: confirmMessage,
      header: 'Confirmar Validación de Resultado',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Confirmar y Validar',
      rejectClass: 'p-button-secondary',
      acceptClass: 'p-button-success',
      accept: async () => {
        await processConfirmResult();
      }
    });
  } catch (error) {
    console.error('Error al preparar confirmación:', error);
    showError(error.message || 'Error al preparar la confirmación');
  }
};

const processConfirmResult = async () => {
  try {
    isConfirmingResult.value = true;

    // 1. Procesar cambios del Anexo 06 (solo reemplazos)
    if (annexe06Changes.value.photosToReplace.length > 0) {
      // Procesar reemplazos
      for (const change of annexe06Changes.value.photosToReplace) {
        try {
          console.log('[report-detail] Procesando reemplazo:', {
            attachmentId: change.attachmentId,
            fileName: change.file.name,
            fileType: change.file.type
          });
          
          await reportApi.updateAttachment(
            report.value.reportId,
            change.attachmentId,
            change.file
          );
        } catch (error) {
          console.error(`Error al reemplazar attachment ${change.attachmentId}:`, error);
          throw new Error(`Error al actualizar foto del Anexo 06: ${error.message}`);
        }
      }
    }

    // 2. Procesar cambios en riesgos de zona
    console.log('[report-detail] DEBUG - Verificando actualización de zone risks:', {
      zoneRisksChanged: zoneRisksChanged.value,
      orderId: report.value.orderId,
      editedAreaRisks: editedAreaRisks.value
    });
    
    if (zoneRisksChanged.value && report.value.orderId) {
      try {
        console.log('[report-detail] Actualizando riesgos de zona:', editedAreaRisks.value);
        
        await reportApi.updateHomeVerification(report.value.orderId, {
          zone: {
            areaRisks: editedAreaRisks.value
          }
        });
        
        console.log('[report-detail] Riesgos de zona actualizados exitosamente');
      } catch (error) {
        console.error('Error al actualizar riesgos de zona:', error);
        throw new Error(`Error al actualizar riesgos de la zona: ${error.message}`);
      }
    } else {
      console.log('[report-detail] DEBUG - NO se actualizarán riesgos de zona porque:', {
        zoneRisksChanged: zoneRisksChanged.value ? 'Sí' : 'No',
        orderId: report.value.orderId ? report.value.orderId : 'NO EXISTE'
      });
    }

    // 3. Actualizar el resultado del reporte
    const updateData = {
      finalResult: editableReport.value.finalResult,
      summary: editableReport.value.summary,
      observations: editableReport.value.observations,
      casuistics: editableReport.value.casuistics,
      glossary: report.value.glossary || [], // Mantener el glosario sin cambios
      isResultValid: true // Marcar como validado
    };

    console.log('[report-detail] DEBUG - Datos antes de actualizar:', {
      observations: editableReport.value.observations,
      casuistics: editableReport.value.casuistics,
      areaRisks: editedAreaRisks.value,
      updateData
    });
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('[PROD DEBUG] PAYLOAD FINAL a enviar:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('reportId que se usará:', report.value.reportId, '| Tipo:', typeof report.value.reportId);
    console.log('updateData JSON:', JSON.stringify(updateData, null, 2));
    console.log('═══════════════════════════════════════════════════════');

    const result = await reportStore.updateReport(report.value.reportId, updateData);

    if (result.success) {
      showSuccess('Resultado validado exitosamente', 'Éxito');
      
      // Limpiar URLs temporales
      tempPhotoUrls.value.forEach(url => URL.revokeObjectURL(url));
      tempPhotoUrls.value = [];
      
      // Limpiar cambios del Anexo 06
      annexe06Changes.value = {
        photosToReplace: []
      };
      
      // Limpiar cambios de riesgos de zona
      zoneRisksChanged.value = false;
      editedAreaRisks.value = [];
      
      // Recargar el reporte para obtener los datos actualizados
      await getReportById(route.params.reportId);
      
      // Reinicializar los campos editables con los datos frescos del backend
      initializeEditableReport();
    } else {
      throw new Error(result.message || 'Error al confirmar el resultado');
    }
  } catch (error) {
    console.error('Error al confirmar resultado:', error);
    showError(
      error.message || 'No se pudo confirmar el resultado. Intente nuevamente.',
      'Error al confirmar'
    );
  } finally {
    isConfirmingResult.value = false;
  }
};

const handleUpdateSummary = (value) => {
  editableReport.value.summary = value;
};

const handleUpdateObservations = (value) => {
  console.log('[report-detail] DEBUG - handleUpdateObservations llamado:', value);
  editableReport.value.observations = value;
};

const handleUpdateCasuistics = (value) => {
  console.log('[report-detail] DEBUG - handleUpdateCasuistics llamado:', value);
  editableReport.value.casuistics = value;
};

const handleUpdateFinalResult = (value) => {
  editableReport.value.finalResult = value;
};

// Lifecycle
onMounted(async () => {
  const reportId = route.params.reportId;
  clearData();
  await loadData(reportId);
  initializeEditableReport();
});

// Watch for route changes
watch(() => route.params.reportId, async (newId) => {
  if (newId) {
    clearData(); // Limpiar INMEDIATAMENTE (síncrono)
    await loadData(newId); // Luego cargar (asíncrono)
    initializeEditableReport();
  }
});

// NOTA: Se eliminó el watch profundo de report.value que estaba causando
// que se reinicializaran los campos editables cada vez que se modificaba
// el objeto report (ej: al reemplazar fotos), lo que borraba los cambios del usuario
</script>

<template>
  <div class="h-full w-full flex flex-column">
    <!-- Toolbar -->
    <toolbar
      :title="report ? `Reporte ${report.reportCode || 'N/A'}` : 'Detalle del Reporte'"
      :description="'Visualiza toda la información del reporte de verificación domiciliaria'"
      :show-back-button="true"
    >
      <template #actions>
        <pv-button
          v-if="!isLoading && !hasError && canConfirmResult"
          label="Confirmar Resultado"
          icon="pi pi-check"
          class="p-button-success mr-2"
          :loading="isConfirmingResult"
          :disabled="isConfirmingResult"
          v-tooltip.top="'Confirmar y validar el resultado del reporte'"
          @click="handleConfirmResult"
        />
        <pv-button
          v-if="!isLoading && !hasError"
          label="Enviar Email"
          icon="pi pi-envelope"
          class="p-button-outlined mr-2"
          @click="handleSendEmail"
        />
        <pv-button
          v-if="!isLoading && !hasError"
          label="Exportar PDF"
          icon="pi pi-file-pdf"
          class="p-button-outlined"
          :loading="isDownloadingReport"
          :disabled="!canExportPDF || isDownloadingReport"
          v-tooltip.top="!canExportPDF ? 'Debe confirmar el resultado antes de exportar el PDF' : 'Exportar informe a PDF'"
          @click="handleExportPDF"
        />
      </template>
    </toolbar>

    <!-- Content -->
    <div class="flex-1 p-4 overflow-auto">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-column align-items-center justify-content-center h-full">
        <pv-progress-spinner />
        <div class="mt-4 text-center">
          <div class="flex align-items-center gap-3 mb-3">
            <i :class="`pi ${loadingSteps[loadingStep].icon} text-2xl text-primary`"></i>
            <p class="text-xl font-semibold m-0">{{ loadingSteps[loadingStep].label }}</p>
          </div>
          <pv-progress-bar mode="indeterminate" style="height: 6px; width: 300px" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="flex flex-column align-items-center justify-content-center h-full">
        <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-900 mb-2">Error al cargar el reporte</h2>
        <p class="text-lg text-600 mb-4">{{ errorMessage }}</p>
        <pv-button
          label="Reintentar"
          icon="pi pi-refresh"
          class="p-button-outlined"
          @click="retryLoading"
        />
      </div>

      <!-- Report Content -->
      <div v-else-if="report" class="flex flex-column gap-4">
        <!-- Alert: Confirmación de Resultado Pendiente -->
        <pv-message v-if="showConfirmResultAlert" severity="info" :closable="false" class="mb-2">
          <div class="flex align-items-center w-full gap-4">
            <i class="pi pi-info-circle text-2xl"></i>
            <div class="flex-1">
              <p class="font-bold text-base m-0 mb-1">Confirmación de Resultado Pendiente</p>
              <p class="m-0 text-sm">Este reporte requiere que revise y confirme el resultado final, resumen, observaciones y casuísticas antes de poder ser exportado.</p>
            </div>
          </div>
        </pv-message>

        <!-- Alert: Entrevista con Arrendador Faltante -->
        <pv-message v-if="showInterviewAlert" severity="warn" :closable="false" class="mb-2">
          <div class="flex align-items-center w-full gap-4">
            <i class="pi pi-exclamation-triangle text-2xl"></i>
            <div class="flex-1">
              <p class="font-bold text-base m-0 mb-1">Entrevista con el Arrendador Pendiente</p>
              <p class="m-0 text-sm">Este reporte requiere que complete la entrevista con el arrendador antes de poder ser finalizado y exportado.</p>
            </div>
            <pv-button 
              label="Ir a la Entrevista" 
              icon="pi pi-arrow-down"
              class="p-button-warning ml-auto flex-shrink-0"
              @click="scrollToInterviewCard"
            />
          </div>
        </pv-message>

        <!-- Section 0: Verification Info (Highlighted) -->
        <verification-info-card
          :verifier="report.verifierName"
          :address-location="report.addressLocation"
          :visit-date="report.visitDate"
          :result="canConfirmResult ? editableReport.finalResult : report.finalResult"
          :can-edit="canConfirmResult"
          @update:result="handleUpdateFinalResult"
        />

        <!-- Section 1: Applicant & Client Info -->
        <applicant-client-info-card
          :company-name="report.companyName"
          :company-ruc="report.companyRuc"
          :company-executive-name="report.companyExecutiveName"
          :request-date="report.requestDate"
          :final-result="report.finalResult"
          :client-full-name="report.clientFullName"
          :client-interviewed-name="report.clientName"
          :clientRelation="report.residence?.livesWith"
          :client-document-type="report.clientDocumentType"
          :client-document-number="report.clientDocumentNumber"
        />

        <!-- Section 2: Address Info -->
        <address-info-card
          :department="report.addressDepartment"
          :province="report.addressProvince"
          :district="report.addressDistrict"
          :full-address="report.addressStreet"
          :verified-address="report.exactClientAddress"
        />

        <!-- Section 3: Interview Details -->
        <interview-details-card
          :lives-with="report.residence?.livesWith"
          :is-resident="report.residence?.isResident"
          :time-living-text="report.residence?.timeLivingText"
          :dwelling-type="report.dwelling?.dwellingType"
          :residence-type="report.dwelling?.residenceType"
          :apartment-information="report.dwelling?.apartmentInformation"
          :type-furnished="report.dwelling?.typeFurnished"
          :roof-type="report.dwelling?.roofType"
          :facade-color="report.dwelling?.facadeColor"
          :dwelling-material="report.dwelling?.dwellingMaterial"
          :dwelling-condition="report.dwelling?.dwellingCondition"
          :zone-type="report.zone?.zoneType"
          :zone-characteristics="report.zone?.zoneCharacteristics || []"
          :area-risk="canConfirmResult ? editedAreaRisks : (report.zone?.areaRisk || [])"
          :access-type="report.zone?.accessType"
          :garage-type="report.garage?.garageType"
          :distance-to-dwelling="report.garage?.distanceToDwelling"
          :can-edit="canConfirmResult"
          @update:area-risk="handleAreaRiskUpdate"
        />

        <!-- Section 4: Contact References -->
        <contact-references-card
          :references="report.contactReferences || []"
          :landlord-name="report.landlordName"
          :landlord-phone="report.landlordPhoneNumber"
        />

        <!-- Section 5: Landlord Interview Details -->
        <landlord-interview-card
          ref="landlordInterviewCardRef"
          v-if="report.interviewDetails || report.finalResult === 'ENTREVISTA_ARRENDADOR_FALTANTE'"
          :client-name-according-to-landlord="report.interviewDetails?.clientNameAccordingToLandlord"
          :own-home="report.interviewDetails?.ownHome"
          :services-paid-by-client="report.interviewDetails?.servicesPaidByClient"
          :is-the-client-punctual-with-payments="report.interviewDetails?.isTheClientPunctualWithPayments"
          :time-living-according-to-landlord="report.interviewDetails?.timeLivingAccordingToLandlord"
          :floor-occupied-by-client="report.interviewDetails?.floorOccupiedByClient"
          :interview-observation="report.interviewDetails?.interviewObservation"
          :can-edit="canEditInterview"
          :blocked-by-final-result="isEditBlockedByFinalResult"
          :report-id="report.reportId"
          :interview-attachments="getInterviewAttachments()"
          @update-interview-details-requested="handleUpdateInterviewDetailsRequested"
        />

        <!-- Section 6: Summary -->
        <summary-card
          :summary="canConfirmResult ? editableReport.summary : report.summary"
          :can-edit="canConfirmResult"
          @update:summary="handleUpdateSummary"
        />

        <!-- Section 8: Observations -->
        <observations-card
          v-if="!report.isResultValid || report.finalResult !== 'CONFORME'"
          :observations="canConfirmResult ? editableReport.observations : (report.observations || [])"
          :can-edit="canConfirmResult"
          @update:observations="handleUpdateObservations"
        />

        <!-- Section 9: Glossary (Solo Lectura) -->
        <glossary-card
          :glossary="report.glossary || []"
        />

        <!-- Section 10: Casuistics -->
        <casuistics-card
          v-if="!report.isResultValid || report.finalResult !== 'CONFORME'"
          :casuistics="canConfirmResult ? editableReport.casuistics : (report.casuistics || [])"
          :can-edit="canConfirmResult"
          @update:casuistics="handleUpdateCasuistics"
        />
       
        <!-- Section 12: Annexe 01 - Photographic Registry -->
        <annexe-photographic-registry
          title="ANEXO 01: Registro fotográfico del candidato"
          icon="pi-user"
          :description="report.annexe01Description"
          description-label="Descripción del candidato"
          :photos="report.annexe01Photos || []"
          @view-photo="handleViewPhoto"
        />

        <!-- Section 13: Annexe 02 - Domicile Photographic Registry -->
        <annexe-photographic-registry
          title="ANEXO 02: Registro fotográfico del domicilio"
          icon="pi-images"
          :description="report.annexe02Description"
          description-label="Descripción de los alrededores"
          :photos="report.annexe02Photos || []"
          @view-photo="handleViewPhoto"
        />

        <!-- Section 14: Annexe 03 - Garage Photographic Registry -->
        <annexe-photographic-registry
          title="ANEXO 03: Registro fotográfico de la cochera"
          icon="pi-car"
          :description="report.annexe03Description"
          description-label="Descripción de la cochera"
          :photos="report.annexe03Photos || []"
          @view-photo="handleViewPhoto"
        />

        <!-- Section 15: Annexe 04 - Rooms Photographic Registry -->
        <annexe-photographic-registry
          title="ANEXO 04: Registro fotográfico de las habitaciones del domicilio"
          icon="pi-home"
          :description="report.annexe04Description"
          description-label="Descripción de las habitaciones"
          :photos="report.annexe04Photos || []"
          @view-photo="handleViewPhoto"
        />

        <!-- Section 16: Annexe 05 - Surroundings Photographic Registry -->
        <annexe-photographic-registry
          title="ANEXO 05: Registro fotográfico de alrededores del domicilio"
          icon="pi-map-marker"
          :description="report.annexe05Description"
          description-label="Descripción de los alrededores"
          :photos="report.annexe05Photos || []"
          @view-photo="handleViewPhoto"
        />

        <!-- Section 17: Annexe 06 - Datacrim Photo -->
        <annexe-photographic-registry
          title="ANEXO 06: Foto datacrim"
          icon="pi-id-card"
          :description="report.annexe06Description"
          description-label="Información adicional"
          :photos="annexe06PhotosComputed"
          :can-edit="canConfirmResult"
          :replace-only="true"
          @view-photo="handleViewPhoto"
          @replace-photo="handleReplacePhotoInAnnexe06"
        />
      </div>
    </div>

    <!-- Email Send Dialog -->
    <email-send-dialog
      :visible="emailDialogVisible"
      :recipient-email="report?.applicantEmail || ''"
      :subject="`Reporte de Verificación ${report?.reportCode || ''}`"
      :message="`Adjunto encontrará el reporte de verificación domiciliaria.`"
      :report-code="report?.reportCode || 'N/A'"
      @cancel-requested="handleEmailCancelRequested"
      @save-requested="handleEmailSaveRequested"
    />
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
