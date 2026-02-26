<script setup>
import { ref, computed, watch } from 'vue';
import { EmployeeCollaboratorValidators } from '../../../4.customer-management/domain/validators/customer.validators.js';
import CreateAndEdit from '../../../shared-v2/presentation/components/create-and-edit.vue';

const props = defineProps({
    edit: Boolean,
    item: Object,
    visible: Boolean,
    currentEmployee: {
        type: Object,
        required: false,
        default: null
    }
});

const emit = defineEmits(['cancel-requested', 'save-requested']);

// Refs
const submitted = ref(false);
const emailInputRef = ref(null);
const emailError = ref('');

const sellerForm = ref({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    status: 'ACTIVE'
});

// Status options
const statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
];

// Validation methods
const validateName = (name) => {
    try {
        EmployeeCollaboratorValidators.validateName(name);
        return true;
    } catch {
        return false;
    }
};

const validateLastName = (lastName) => {
    try {
        EmployeeCollaboratorValidators.validateLastName(lastName);
        return true;
    } catch {
        return false;
    }
};

const validateEmail = (email) => {
    try {
        EmployeeCollaboratorValidators.validateEmail(email);
        return true;
    } catch {
        return false;
    }
};

const validatePhoneNumber = (phoneNumber) => {
    try {
        EmployeeCollaboratorValidators.validatePhoneNumber(phoneNumber);
        return true;
    } catch {
        return false;
    }
};

// Computed
const isFormValid = computed(() => {
    const passwordValid = props.edit || (sellerForm.value.password && sellerForm.value.password.trim().length > 0);
    return validateName(sellerForm.value.name) &&
           validateLastName(sellerForm.value.lastName) &&
           validateEmail(sellerForm.value.email) &&
           validatePhoneNumber(sellerForm.value.phoneNumber) &&
           passwordValid;
});

// Methods
const cancelRequested = () => {
    submitted.value = false;
    emailError.value = '';
    resetForm();
    emit('cancel-requested');
};

const saveRequested = () => {
    submitted.value = true;
    emailError.value = '';
    
    if (isFormValid.value) {
        // Validar que currentEmployee esté disponible
        if (!props.currentEmployee) {
            console.error('[SellerForm] currentEmployee no está disponible');
            return;
        }
        
        // Construir payload con datos automáticos del gerente
        const applicantCompanyIdNum = Number(props.currentEmployee.applicantCompanyId);
        const brandIdNum = Number(props.currentEmployee.brandId);
        
        const sellerData = {
            email: sellerForm.value.email,
            password: sellerForm.value.password,
            name: sellerForm.value.name,
            lastName: sellerForm.value.lastName,
            phoneNumber: sellerForm.value.phoneNumber,
            applicantCompanyId: applicantCompanyIdNum,
            brandId: brandIdNum,
            role: 'VENDEDOR' // Siempre vendedor
        };
        
        // Include ID if editing
        if (props.edit && props.item) {
            sellerData.id = props.item.id;
        }
        
        // Si estamos en modo edición y la contraseña está vacía, no incluirla
        if (props.edit && (!sellerData.password || sellerData.password.trim() === '')) {
            delete sellerData.password;
        }
        
        // Incluir status solo si estamos editando
        if (props.edit) {
            sellerData.status = sellerForm.value.status;
        }
        
        console.log('📦 [SellerForm] Payload a enviar:', JSON.stringify(sellerData, null, 2));
        
        emit('save-requested', sellerData);
    }
};

const focusEmailInput = () => {
    if (emailInputRef.value) {
        const inputElement = emailInputRef.value.$el || emailInputRef.value;
        if (inputElement && inputElement.focus) {
            inputElement.focus();
        } else if (inputElement && inputElement.querySelector) {
            const input = inputElement.querySelector('input');
            if (input) {
                input.focus();
            }
        }
    }
};

const setEmailError = (message) => {
    emailError.value = message;
    focusEmailInput();
};

const resetFormOnSuccess = () => {
    resetForm();
};

const resetForm = () => {
    sellerForm.value = {
        name: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        status: 'ACTIVE'
    };
    submitted.value = false;
    emailError.value = '';
};

// Exponer métodos para uso externo
defineExpose({
    focusEmailInput,
    setEmailError,
    resetFormOnSuccess
});

// Watch for dialog open
watch(() => props.visible, (newValue) => {
    if (newValue) {
        // Log para depuración
        console.log('🔍 [SellerForm] Dialog abierto con currentEmployee:', {
            id: props.currentEmployee?.id,
            name: props.currentEmployee?.name,
            brandId: props.currentEmployee?.brandId,
            brandName: props.currentEmployee?.brandName,
            applicantCompanyId: props.currentEmployee?.applicantCompanyId,
            applicantCompanyName: props.currentEmployee?.applicantCompanyName
        });
        
        if (props.edit && props.item) {
            sellerForm.value = {
                name: props.item.name || '',
                lastName: props.item.lastName || '',
                email: props.item.email || '',
                password: '',
                phoneNumber: props.item.phoneNumber || '',
                status: props.item.status || 'ACTIVE'
            };
        } else if (!props.edit) {
            resetForm();
        }
    }
});
</script>

<template>
    <create-and-edit
        :entity="sellerForm"
        :visible="visible"
        entity-name="Vendedor"
        :edit="edit"
        size="standard"
        @canceled-shared="cancelRequested"
        @saved-shared="saveRequested"
    >
        <template #content>
        <div class="grid p-2">
            <!-- Fila 1: Nombres y Apellidos -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="name" class="block text-900 font-medium mb-2">
                        <i class="pi pi-user mr-2"></i>Nombres *
                    </label>
                    <pv-input-text
                        id="name"
                        v-model="sellerForm.name"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese los nombres"
                        :class="{ 'p-invalid': submitted && (!sellerForm.name || !validateName(sellerForm.name)) }"
                    />
                    <small v-if="submitted && !sellerForm.name" class="p-error">
                        Los nombres son requeridos
                    </small>
                    <small v-else-if="submitted && sellerForm.name && !validateName(sellerForm.name)" class="p-error">
                        Los nombres deben tener al menos 2 caracteres
                    </small>
                </div>
            </div>

            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="lastName" class="block text-900 font-medium mb-2">
                        <i class="pi pi-users mr-2"></i>Apellidos *
                    </label>
                    <pv-input-text
                        id="lastName"
                        v-model="sellerForm.lastName"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese los apellidos"
                        :class="{ 'p-invalid': submitted && (!sellerForm.lastName || !validateLastName(sellerForm.lastName)) }"
                    />
                    <small v-if="submitted && !sellerForm.lastName" class="p-error">
                        Los apellidos son requeridos
                    </small>
                    <small v-else-if="submitted && sellerForm.lastName && !validateLastName(sellerForm.lastName)" class="p-error">
                        Los apellidos deben tener al menos 2 caracteres
                    </small>
                </div>
            </div>

            <!-- Fila 2: Email y Teléfono -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="email" class="block text-900 font-medium mb-2">
                        <i class="pi pi-envelope mr-2"></i>Email *
                    </label>
                    <pv-input-text
                        id="email"
                        ref="emailInputRef"
                        v-model="sellerForm.email"
                        class="w-full"
                        size="small"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        :class="{ 'p-invalid': (submitted && (!sellerForm.email || !validateEmail(sellerForm.email))) || emailError }"
                        @input="emailError = ''"
                    />
                    <small v-if="emailError" class="p-error">
                        {{ emailError }}
                    </small>
                    <small v-else-if="submitted && !sellerForm.email" class="p-error">
                        El email es requerido
                    </small>
                    <small v-else-if="submitted && sellerForm.email && !validateEmail(sellerForm.email)" class="p-error">
                        Ingrese un email válido
                    </small>
                </div>
            </div>

            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="phoneNumber" class="block text-900 font-medium mb-2">
                        <i class="pi pi-phone mr-2"></i>Teléfono *
                    </label>
                    <pv-input-text
                        id="phoneNumber"
                        v-model="sellerForm.phoneNumber"
                        class="w-full"
                        size="small"
                        placeholder="999 999 999"
                        maxlength="15"
                        @keypress="(e) => { if (!/[0-9+\s]/.test(e.key)) e.preventDefault(); }"
                        :class="{ 'p-invalid': submitted && (!sellerForm.phoneNumber || !validatePhoneNumber(sellerForm.phoneNumber)) }"
                    />
                    <small v-if="submitted && !sellerForm.phoneNumber" class="p-error">
                        El teléfono es requerido
                    </small>
                    <small v-else-if="submitted && sellerForm.phoneNumber && !validatePhoneNumber(sellerForm.phoneNumber)" class="p-error">
                        El teléfono debe tener entre 9 y 15 dígitos
                    </small>
                </div>
            </div>

            <!-- Fila 3: Contraseña -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="password" class="block text-900 font-medium mb-2">
                        <i class="pi pi-lock mr-2"></i>Contraseña {{ edit ? '' : '*' }}
                    </label>
                    <pv-password
                        id="password"
                        v-model="sellerForm.password"
                        class="w-full"
                        inputClass="w-full"
                        size="small"
                        :placeholder="edit ? 'Dejar vacío para no cambiar' : 'Ingrese la contraseña'"
                        :feedback="false"
                        toggleMask
                        :inputStyle="{ width: '100%' }"
                        :class="{ 'p-invalid': submitted && !edit && (!sellerForm.password || sellerForm.password.trim().length === 0) }"
                    />
                    <small v-if="submitted && !edit && (!sellerForm.password || sellerForm.password.trim().length === 0)" class="p-error">
                        La contraseña es requerida
                    </small>
                    <small v-if="edit" class="text-500 block mt-1">
                        Dejar vacío para mantener la contraseña actual
                    </small>
                </div>
            </div>

            <!-- Fila 4: Rol (no editable) -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="role" class="block text-900 font-medium mb-2">
                        <i class="pi pi-id-card mr-2"></i>Rol
                    </label>
                    <pv-input-text
                        id="role"
                        value="Vendedor"
                        class="w-full"
                        size="small"
                        disabled
                    />
                </div>
            </div>

            <!-- Fila 4: Estado (solo en modo edición) -->
            <div v-if="edit" class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="status" class="block text-900 font-medium mb-2">
                        <i class="pi pi-check-circle mr-2"></i>Estado
                    </label>
                    <pv-select
                        id="status"
                        v-model="sellerForm.status"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione el estado"
                        class="w-full"
                        size="small"
                    />
                </div>
            </div>
        </div>
        </template>
    </create-and-edit>
</template>

<style scoped>
/* Using corporate design system */
</style>
