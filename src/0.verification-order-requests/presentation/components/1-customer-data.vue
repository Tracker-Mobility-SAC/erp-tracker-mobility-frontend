<script setup>
import { ref, computed } from 'vue';
import { useOrderRequestStore } from '../../application/order-request.store.js';
import { useInputValidation } from '../../../shared-v2/composables/use-input-validation.js';

// Store & Composables
const store = useOrderRequestStore();
const { validateTextOnly, validateNumbersOnly } = useInputValidation();

// Emits
const emit = defineEmits(['next']);

// Estado local
const touched = ref({
  name: false,
  lastName: false,
  documentType: false,
  documentNumber: false,
  phoneNumber: false
});

const showValidation = ref(false);

// Datos
const documentTypes = [
  { label: 'DNI', value: 'DNI' },
  { label: 'PTP', value: 'PTP' },
  { label: 'Carnet de extranjería', value: 'CARNET_EXTRANJERIA' }
];

// Validaciones
const isPhoneValid = computed(() => {
  const phone = store.client.phoneNumber;
  if (!phone) return false;
  const phoneStr = String(phone).replace(/[\s-]/g, '');
  return /^9\d{8}$/.test(phoneStr);
});

const isDocumentValid = computed(() => {
  const { documentType, documentNumber } = store.client;
  if (!documentType || !documentNumber) return false;
  const num = String(documentNumber).replace(/\s/g, '');
  if (documentType === 'DNI') return /^\d{8}$/.test(num);
  if (documentType === 'CARNET_EXTRANJERIA' || documentType === 'PTP') return /^\d{9,12}$/.test(num);
  return false;
});

const fieldErrors = computed(() => {
  const errors = {};
  
  if (touched.value.name || showValidation.value) {
    if (!store.client.name || store.client.name.trim().length < 2) {
      errors.name = 'Ingresa nombres válidos';
    }
  }
  
  if (touched.value.lastName || showValidation.value) {
    if (!store.client.lastName || store.client.lastName.trim().length < 2) {
      errors.lastName = 'Ingresa apellidos válidos';
    }
  }
  
  if (touched.value.documentType || showValidation.value) {
    if (!store.client.documentType) errors.documentType = 'Selecciona un tipo de documento';
  }
  
  if (touched.value.documentNumber || showValidation.value) {
    if (!store.client.documentNumber) {
      errors.documentNumber = 'El número de documento es obligatorio';
    } else if (!isDocumentValid.value) {
      errors.documentNumber = 'Número de documento inválido para el tipo seleccionado';
    }
  }
  
  if (touched.value.phoneNumber || showValidation.value) {
    if (!store.client.phoneNumber) {
      errors.phoneNumber = 'El número de contacto es obligatorio';
    } else if (!isPhoneValid.value) {
      errors.phoneNumber = 'El número debe iniciar con 9 y tener 9 dígitos';
    }
  }
  
  return errors;
});

const isFormValid = computed(() => {
  const basicOk =
    store.client.name &&
    store.client.lastName &&
    store.client.documentType &&
    store.client.documentNumber &&
    store.client.phoneNumber;
  
  return Boolean(
    basicOk &&
    isDocumentValid.value &&
    isPhoneValid.value &&
    Object.keys(fieldErrors.value).length === 0
  );
});

// Métodos
const onFieldBlur = (fieldName) => {
  touched.value[fieldName] = true;
};

const onNext = () => {
  showValidation.value = true;
  if (!isFormValid.value) {
    focusFirstError();
    return;
  }
  
  emit('next');
};

const focusFirstError = () => {
  const first = Object.keys(fieldErrors.value)[0];
  if (!first) return;
  const idMap = {
    name: 'nombres',
    lastName: 'apellidos',
    documentType: 'tipo-doc',
    documentNumber: 'num-doc',
    phoneNumber: 'telefono'
  };
  setTimeout(() => {
    const el = document.getElementById(idMap[first] || 'nombres');
    if (el) el.focus();
  }, 100);
};
</script>

<template>
  <div class="flex justify-content-center w-full">
    <div class="surface-card border-round-lg shadow-3 p-4 form-container">
      <form class="formgrid grid p-fluid form-grid-compact" @submit.prevent="onNext" @keydown.enter.prevent>
        <!-- Título -->
        <div class="col-12 mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-user text-2xl text-primary-dark"></i>
            <h2 class="m-0 text-xl font-semibold text-primary-dark">Datos del cliente</h2>
          </div>
        </div>

        <!-- Nombres -->
        <div class="field col-12 md:col-6">
          <label for="nombres" class="block mb-2 font-semibold text-color">
            Nombres completos <span class="field-required-mark">*</span>
          </label>
          <pv-input-text
            id="nombres"
            v-model="store.client.name"
            placeholder="Ana María"
            class="w-full"
            @blur="onFieldBlur('name')"
            @keydown="validateTextOnly"
          />
          <small v-if="fieldErrors.name" class="field-error-message">{{ fieldErrors.name }}</small>
        </div>

        <!-- Apellidos -->
        <div class="field col-12 md:col-6">
          <label for="apellidos" class="block mb-2 font-semibold text-color">
            Apellidos completos <span class="field-required-mark">*</span>
          </label>
          <pv-input-text
            id="apellidos"
            v-model="store.client.lastName"
            placeholder="López Fernández"
            class="w-full"
            @blur="onFieldBlur('lastName')"
            @keydown="validateTextOnly"
          />
          <small v-if="fieldErrors.lastName" class="field-error-message">{{ fieldErrors.lastName }}</small>
        </div>

        <!-- Tipo documento -->
        <div class="field col-12 md:col-6">
          <label for="tipo-doc" class="block mb-2 font-semibold text-color">
            Tipo de documento de identidad <span class="field-required-mark">*</span>
          </label>
          <pv-select
            id="tipo-doc"
            v-model="store.client.documentType"
            :options="documentTypes"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecciona"
            class="w-full"
            @blur="onFieldBlur('documentType')"
          />
          <small v-if="fieldErrors.documentType" class="field-error-message">{{ fieldErrors.documentType }}</small>
        </div>

        <!-- Número documento -->
        <div class="field col-12 md:col-6">
          <label for="num-doc" class="block mb-2 font-semibold text-color">
            N° de documento de identidad <span class="field-required-mark">*</span>
          </label>
          <pv-icon-field>
            <pv-input-icon class="pi pi-id-card" />
            <pv-input-text
              id="num-doc"
              v-model="store.client.documentNumber"
              placeholder="12345678"
              class="w-full"
              @blur="onFieldBlur('documentNumber')"
              @keydown="validateNumbersOnly"
            />
          </pv-icon-field>
          <small v-if="fieldErrors.documentNumber" class="field-error-message">{{ fieldErrors.documentNumber }}</small>
        </div>

        <!-- Teléfono -->
        <div class="field col-12 md:col-6">
          <label for="telefono" class="block mb-2 font-semibold text-color">
            Número de contacto <span class="field-required-mark">*</span>
          </label>
          <pv-icon-field>
            <pv-input-icon class="pi pi-phone" />
            <pv-input-mask
              id="telefono"
              v-model="store.client.phoneNumber"
              mask="999 999 999"
              placeholder="999 888 777"
              class="w-full"
              @blur="onFieldBlur('phoneNumber')"
            />
          </pv-icon-field>
          <small v-if="fieldErrors.phoneNumber" class="field-error-message">{{ fieldErrors.phoneNumber }}</small>
        </div>

        <!-- Botones -->
        <div class="col-12 flex justify-content-end gap-2 mt-4">
          <pv-button
            label="Siguiente"
            icon="pi pi-arrow-right"
            iconPos="right"
            type="submit"
            :disabled="!isFormValid"
            class="px-5"
          />
        </div>
      </form>
    </div>
  </div>
</template>
