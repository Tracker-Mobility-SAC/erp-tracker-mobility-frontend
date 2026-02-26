<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { useToast } from 'primevue/usetoast';
import { useConfirmDialog } from '../../../shared-v2/composables/use-confirm-dialog.js';
import { useInputValidation } from '../../../shared-v2/composables/use-input-validation.js';
import FileUploader from '../../../shared-v2/presentation/components/file-uploader.vue';

// Store, Toast, Confirm Dialog & Composables
const store = useOrderRequestStore();
const toast = useToast();
const { showConfirm } = useConfirmDialog();
const { validateTextOnly, validateNumbersOnly } = useInputValidation();

// Emits
const emit = defineEmits(['next', 'back', 'cancel', 'complete']);

// Estado local
const touched = ref({
  reciboServicio: false,
  documentoIdentidad: false,
  nombres: false,
  numeroContacto: false
});

const showValidation = ref(false);

// Computed properties para archivos
const serviceReceiptFile = computed({
  get() {
    const doc = store.client.documents.find(d => d.type === 'RECIBO_SERVICIO');
    return doc?.file || null;
  },
  set(file) {
    const existingIndex = store.client.documents.findIndex(d => d.type === 'RECIBO_SERVICIO');
    if (file) {
      const document = { type: 'RECIBO_SERVICIO', file: file, url: null };
      if (existingIndex >= 0) {
        store.client.documents[existingIndex] = document;
      } else {
        store.client.documents.push(document);
      }
    } else if (existingIndex >= 0) {
      store.client.documents.splice(existingIndex, 1);
    }
  }
});

const identityDocFile = computed({
  get() {
    const doc = store.client.documents.find(d => d.type === 'DOCUMENTO_IDENTIDAD');
    return doc?.file || null;
  },
  set(file) {
    const existingIndex = store.client.documents.findIndex(d => d.type === 'DOCUMENTO_IDENTIDAD');
    if (file) {
      const document = { type: 'DOCUMENTO_IDENTIDAD', file: file, url: null };
      if (existingIndex >= 0) {
        store.client.documents[existingIndex] = document;
      } else {
        store.client.documents.push(document);
      }
    } else if (existingIndex >= 0) {
      store.client.documents.splice(existingIndex, 1);
    }
  }
});

// Validaciones
const isLandlordPhoneValid = computed(() => {
  const phone = store.client.landlordPhoneNumber;
  if (!phone) return false;
  const compact = String(phone).replace(/[\s-]/g, '');
  return /^9\d{8}$/.test(compact);
});

const fieldErrors = computed(() => {
  const errors = {};
  
  // Documentación de respaldo (siempre obligatoria)
  if (touched.value.reciboServicio || showValidation.value) {
    const reciboDoc = store.client.documents.find(d => d.type === 'RECIBO_SERVICIO');
    if (!reciboDoc) {
      errors.reciboServicio = 'El archivo es obligatorio';
    }
  }
  
  if (touched.value.documentoIdentidad || showValidation.value) {
    const identityDoc = store.client.documents.find(d => d.type === 'DOCUMENTO_IDENTIDAD');
    if (!identityDoc) {
      errors.documentoIdentidad = 'El archivo es obligatorio';
    }
  }
  
  // Datos del arrendador (SOLO si es inquilino)
  if (store.client.isTenant) {
    if (touched.value.nombres || showValidation.value) {
      if (!store.client.landlordName || store.client.landlordName.trim().length < 2) {
        errors.nombres = 'Ingresa nombres válidos';
      }
    }
    
    if (touched.value.numeroContacto || showValidation.value) {
      if (!store.client.landlordPhoneNumber) {
        errors.numeroContacto = 'El número de contacto es obligatorio';
      } else if (!isLandlordPhoneValid.value) {
        errors.numeroContacto = 'Debe iniciar con 9 y tener 9 dígitos';
      }
    }
  }
  
  return errors;
});

const isFormValid = computed(() => {
  const reciboDoc = store.client.documents.find(d => d.type === 'RECIBO_SERVICIO');
  const identityDoc = store.client.documents.find(d => d.type === 'DOCUMENTO_IDENTIDAD');
  const docsOk = reciboDoc && identityDoc;
  
  // Si NO es inquilino, no exigimos arrendador
  const landlordOk = !store.client.isTenant ||
    (store.client.landlordName && store.client.landlordPhoneNumber && isLandlordPhoneValid.value);
  
  return Boolean(docsOk && landlordOk && Object.keys(fieldErrors.value).length === 0);
});

// Watchers
watch(() => store.client.isTenant, (val) => {
  if (!val) {
    store.client.landlordName = '';
    store.client.landlordPhoneNumber = '';
    touched.value.nombres = false;
    touched.value.numeroContacto = false;
  }
});

// Métodos
const onFieldBlur = (field) => {
  touched.value[field] = true;
};

const onReciboSelected = (file) => {
  serviceReceiptFile.value = file;
  touched.value.reciboServicio = true;
};

const onReciboRemoved = () => {
  serviceReceiptFile.value = null;
  touched.value.reciboServicio = true;
};

const onReciboValidationError = (errors) => {
  errors.forEach(error => {
    toast.add({ severity: 'warn', summary: 'Error de archivo', detail: error.message, life: 3000 });
  });
};

const onIdentidadSelected = (file) => {
  identityDocFile.value = file;
  touched.value.documentoIdentidad = true;
};

const onIdentidadRemoved = () => {
  identityDocFile.value = null;
  touched.value.documentoIdentidad = true;
};

const onIdentidadValidationError = (errors) => {
  errors.forEach(error => {
    toast.add({ severity: 'warn', summary: 'Error de archivo', detail: error.message, life: 3000 });
  });
};

const onCancel = async () => {
  const confirmed = await showConfirm({
    message: '¿Deseas cancelar? Se perderán todos los datos ingresados',
    header: 'Confirmar cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, cancelar',
    rejectLabel: 'No'
  });
  
  if (confirmed) {
    emit('cancel');
  }
};

const onBack = () => {
  emit('back');
};

const onSubmit = async () => {
  showValidation.value = true;
  
  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Formulario incompleto',
      detail: 'Por favor complete todos los campos obligatorios',
      life: 4000
    });
    return;
  }
  
  const confirmed = await showConfirm({
    message: '¿Deseas enviar la solicitud?',
    header: 'Confirmar envío',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Sí, enviar',
    rejectLabel: 'Cancelar'
  });
  
  if (!confirmed) return;
  
  const result = await store.createOrder();
  
  if (result.success && store.orderResponse) {
    // ✅ El Store ya muestra la notificación de éxito
    // No duplicamos la notificación aquí
    emit('complete', store.orderResponse);
  } else {
    // Manejo de errores específicos
    const errorCode = result.errorCode;
    const errorData = result.errorData;
    
    let errorMessage = result.error || 'Ocurrió un error al crear la solicitud';
    let errorSummary = 'Error al crear solicitud';
    
    if (errorCode === 400) {
      errorSummary = 'Datos inválidos';
      errorMessage = errorData?.message || 'Verifique que todos los datos sean correctos';
    } else if (errorCode === 401) {
      errorSummary = 'Sesión expirada';
      errorMessage = 'Su sesión ha expirado. Por favor, inicie sesión nuevamente';
    } else if (errorCode === 403) {
      errorSummary = 'Acceso denegado';
      errorMessage = 'No tiene permisos para crear solicitudes de verificación';
    } else if (errorCode === 409) {
      errorSummary = 'Solicitud duplicada';
      errorMessage = errorData?.message || 'Ya existe una solicitud con estos datos';
    } else if (errorCode === 422) {
      errorSummary = 'Datos inválidos';
      errorMessage = errorData?.message || 'Los datos proporcionados no pudieron ser procesados';
    } else if (errorCode >= 500) {
      errorSummary = 'Error del servidor';
      errorMessage = 'Error interno del servidor. Por favor, contacte al administrador';
    } else if (result.originalError?.request && !result.originalError?.response) {
      errorSummary = 'Error de conexión';
      errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión a internet';
    }
    
    toast.add({
      severity: 'error',
      summary: errorSummary,
      detail: errorMessage,
      life: 5000
    });
  }
};

// Lifecycle
onMounted(() => {
  // Limpiar tipos de documento antiguos
  const oldTypes = ['FACADE_PHOTO', 'SERVICE_RECEIPT', 'IDENTITY_DOCUMENT', 'DNI', 'CARNET_EXTRANJERIA', 'PTP', 'RECIBO_AGUA', 'RECIBO_LUZ'];
  store.client.documents = store.client.documents.filter(doc => !oldTypes.includes(doc.type));
});
</script>

<template>
  <div class="flex justify-content-center w-full">
    <div class="surface-card border-round-lg shadow-3 p-4 w-full form-container">
      <form class="formgrid grid p-fluid form-grid-compact" @submit.prevent="onSubmit" @keydown.enter.prevent>
        
        <!-- Título: Documentación de respaldo -->
        <div class="col-12 mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-folder text-2xl text-primary-dark"></i>
            <h2 class="m-0 text-xl font-semibold text-primary-dark">Documentación de respaldo</h2>
          </div>
        </div>

        <!-- Recibo de servicio -->
        <div class="field col-12 md:col-6">
          <file-uploader
            v-model="serviceReceiptFile"
            input-id="file-uploader-recibo"
            file-type="any"
            label="Copia de recibo de servicio (Luz o Agua)"
            placeholder="Haz clic para subir recibo"
            hint="Imagen, PDF, DOC o DOCX (máximo 10MB)"
            drag-text=" o arrastra aquí"
            :max-file-size="10 * 1024 * 1024"
            :accepted-formats="[
              'image/jpeg', 'image/png', 'image/webp', 'image/gif',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]"
            :error-messages="{
              fileTooBig: 'El archivo es muy grande. Máximo {maxSize}',
              invalidFormat: 'Solo se permiten: {formats}'
            }"
            required
            @file-selected="onReciboSelected"
            @file-removed="onReciboRemoved"
            @validation-error="onReciboValidationError"
          />
          <small v-if="fieldErrors.reciboServicio" class="field-error-message">{{ fieldErrors.reciboServicio }}</small>
        </div>

        <!-- Documento de identidad -->
        <div class="field col-12 md:col-6">
          <file-uploader
            v-model="identityDocFile"
            input-id="file-uploader-identidad"
            file-type="any"
            label="Copia de documento de identidad"
            placeholder="Haz clic para subir documento"
            hint="Imagen, PDF, DOC o DOCX (máximo 10MB)"
            drag-text=" o arrastra aquí"
            :max-file-size="10 * 1024 * 1024"
            :accepted-formats="[
              'image/jpeg', 'image/png', 'image/webp', 'image/gif',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]"
            :error-messages="{
              fileTooBig: 'El archivo es muy grande. Máximo {maxSize}',
              invalidFormat: 'Solo se permiten: {formats}'
            }"
            required
            @file-selected="onIdentidadSelected"
            @file-removed="onIdentidadRemoved"
            @validation-error="onIdentidadValidationError"
          />
          <small v-if="fieldErrors.documentoIdentidad" class="field-error-message">{{ fieldErrors.documentoIdentidad }}</small>
        </div>

        <!-- ¿Es inquilino? -->
        <div class="field col-12">
          <div class="flex align-items-center gap-3">
            <pv-input-switch
              inputId="es-inquilino"
              v-model="store.client.isTenant"
            />
            <label for="es-inquilino" class="font-medium text-color cursor-pointer">¿Es inquilino?</label>
          </div>
        </div>

        <div class="col-12" v-if="store.client.isTenant">
          <pv-divider />
        </div>

        <!-- Datos del arrendador -->
        <template v-if="store.client.isTenant">
          <div class="col-12 mb-3">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-building text-2xl text-primary"></i>
              <h2 class="m-0 text-xl font-semibold text-primary">Datos del arrendador</h2>
            </div>
          </div>

          <!-- Nombres -->
          <div class="field col-12 md:col-6">
            <label for="land-nombres" class="block mb-2 font-semibold text-color">
              Nombres <span class="field-required-mark">*</span>
            </label>
            <pv-input-text
              id="land-nombres"
              v-model="store.client.landlordName"
              placeholder="Nombre completo del arrendador"
              class="w-full"
              @blur="onFieldBlur('nombres')"
              @keydown="validateTextOnly"
            />
            <small v-if="fieldErrors.nombres" class="field-error-message">{{ fieldErrors.nombres }}</small>
          </div>

          <!-- Teléfono -->
          <div class="field col-12 md:col-6">
            <label for="land-telefono" class="block mb-2 font-semibold text-color">
              Número de contacto <span class="field-required-mark">*</span>
            </label>
            <pv-icon-field class="w-full">
              <pv-input-icon class="pi pi-phone" />
              <pv-input-mask
                id="land-telefono"
                v-model="store.client.landlordPhoneNumber"
                mask="999 999 999"
                placeholder="999 888 777"
                class="w-full"
                @blur="onFieldBlur('numeroContacto')"
              />
            </pv-icon-field>
            <small v-if="fieldErrors.numeroContacto" class="field-error-message">{{ fieldErrors.numeroContacto }}</small>
          </div>
        </template>

        <!-- Botones -->
        <div class="col-12 flex justify-content-between gap-2 mt-4">
          <pv-button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="onCancel"
            class="px-5"
          />

          <div class="flex gap-2">
            <pv-button
              label="Regresar"
              icon="pi pi-arrow-left"
              severity="secondary"
              :disabled="store.loading"
              @click="onBack"
              class="px-5"
            />
            <pv-button
              :label="store.loading ? 'Enviando...' : 'Enviar solicitud'"
              :icon="store.loading ? 'pi pi-spin pi-spinner' : 'pi pi-send'"
              type="submit"
              :disabled="!isFormValid || store.loading"
              :loading="store.loading"
              class="px-5"
            />
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
