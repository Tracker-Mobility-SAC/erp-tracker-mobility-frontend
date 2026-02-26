<script setup>
import { ref, watch } from 'vue';
import CreateAndEdit from '../../../shared-v2/presentation/components/create-and-edit.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  recipientEmail: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  reportCode: {
    type: String,
    default: 'N/A'
  }
});

const emit = defineEmits(['cancel-requested', 'save-requested']);

// State
const submitted = ref(false);
const emailForm = ref({
  recipientEmail: '',
  subject: '',
  message: ''
});

// Watch visibility to pre-fill form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    emailForm.value = {
      recipientEmail: props.recipientEmail || '',
      subject: props.subject || '',
      message: props.message || ''
    };
  }
});

// Methods
const handleCancel = () => {
  submitted.value = false;
  emailForm.value = {
    recipientEmail: '',
    subject: '',
    message: ''
  };
  emit('cancel-requested');
};

const handleSave = () => {
  submitted.value = true;
  
  if (isFormValid()) {
    emit('save-requested', emailForm.value);
    handleCancel();
  }
};

const isFormValid = () => {
  return (
    emailForm.value.recipientEmail &&
    emailForm.value.subject &&
    emailForm.value.message
  );
};
</script>

<template>
  <create-and-edit
    :edit="false"
    :visible="visible"
    title="Enviar reporte por correo"
    @cancel-requested="handleCancel"
    @save-requested="handleSave"
  >
    <div class="formgrid grid">
      <!-- Código del reporte -->
      <div class="field col-12">
        <label class="font-semibold">Código del reporte</label>
        <pv-input-text 
          :model-value="reportCode" 
          disabled 
          class="w-full"
        />
      </div>

      <!-- Email destinatario -->
      <div class="field col-12">
        <label class="font-semibold">
          Email destinatario <span class="text-red-500">*</span>
        </label>
        <pv-input-text 
          v-model="emailForm.recipientEmail"
          type="email"
          placeholder="ejemplo@correo.com"
          class="w-full"
          :class="{ 'p-invalid': submitted && !emailForm.recipientEmail }"
        />
        <small 
          v-if="submitted && !emailForm.recipientEmail" 
          class="p-error"
        >
          El email es requerido
        </small>
      </div>

      <!-- Asunto -->
      <div class="field col-12">
        <label class="font-semibold">
          Asunto <span class="text-red-500">*</span>
        </label>
        <pv-input-text 
          v-model="emailForm.subject"
          placeholder="Ingrese el asunto del correo"
          class="w-full"
          :class="{ 'p-invalid': submitted && !emailForm.subject }"
        />
        <small 
          v-if="submitted && !emailForm.subject" 
          class="p-error"
        >
          El asunto es requerido
        </small>
      </div>

      <!-- Mensaje -->
      <div class="field col-12">
        <label class="font-semibold">
          Mensaje <span class="text-red-500">*</span>
        </label>
        <pv-textarea 
          v-model="emailForm.message"
          rows="6"
          placeholder="Escriba el mensaje del correo"
          class="w-full"
          :class="{ 'p-invalid': submitted && !emailForm.message }"
        />
        <small 
          v-if="submitted && !emailForm.message" 
          class="p-error"
        >
          El mensaje es requerido
        </small>
      </div>
    </div>
  </create-and-edit>
</template>
