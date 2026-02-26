<script setup>
import { ref, computed, watch } from 'vue';
import { EmployeeCollaboratorValidators } from '../../domain/validators/customer.validators.js';
import { RoleOptions } from '../constants/customer-ui.constants.js';
import CreateAndEdit from '../../../shared-v2/presentation/components/create-and-edit.vue';

const props = defineProps({
    edit: Boolean,
    item: Object,
    visible: Boolean,
    customerId: {
        type: [String, Number],
        required: false,
        default: null
    },
    customerBrands: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['cancel-requested', 'save-requested']);

// Refs
const submitted = ref(false);
const emailInputRef = ref(null);
const emailError = ref(''); // Error personalizado para email duplicado

const employeeForm = ref({
    name: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    status: 'ACTIVE',
    brandId: null,
    role: ''
});

// Status options
const statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
];

// Role options (importado desde constants)
const roleOptions = RoleOptions;

// Computed - Brand options from customer brands
const brandOptions = computed(() => {
    return props.customerBrands.map(brand => ({
        label: brand.value || brand,
        value: brand.id
    }));
});

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
    const passwordValid = props.edit || (employeeForm.value.password && employeeForm.value.password.trim().length > 0);
    return validateName(employeeForm.value.name) &&
           validateLastName(employeeForm.value.lastName) &&
           validateEmail(employeeForm.value.email) &&
           validatePhoneNumber(employeeForm.value.phoneNumber) &&
           passwordValid &&
           employeeForm.value.brandId !== null &&
           employeeForm.value.role !== '';
});

// Methods
const cancelRequested = () => {
    submitted.value = false;
    emailError.value = ''; // Limpiar error personalizado
    resetForm();
    emit('cancel-requested');
};

const saveRequested = () => {
    submitted.value = true;
    emailError.value = ''; // Limpiar error personalizado al intentar guardar
    
    if (isFormValid.value) {
        // 📦 Construir payload según especificación del backend
        // ⚠️ IMPORTANTE: Convertir IDs a números explícitamente
        const applicantCompanyIdNum = Number(props.customerId);
        const brandIdNum = Number(employeeForm.value.brandId);
        
        console.log('🔍 [Form] ANTES de crear payload:', {
            'props.customerId (original)': props.customerId,
            'typeof props.customerId': typeof props.customerId,
            'applicantCompanyIdNum (convertido)': applicantCompanyIdNum,
            'typeof applicantCompanyIdNum': typeof applicantCompanyIdNum,
            'brandId (original)': employeeForm.value.brandId,
            'typeof brandId': typeof employeeForm.value.brandId,
            'brandIdNum (convertido)': brandIdNum,
            'typeof brandIdNum': typeof brandIdNum
        });
        
        const employeeData = {
            email: employeeForm.value.email,
            password: employeeForm.value.password,
            name: employeeForm.value.name,
            lastName: employeeForm.value.lastName,
            phoneNumber: employeeForm.value.phoneNumber,
            applicantCompanyId: applicantCompanyIdNum, // ✅ Número explícito
            brandId: brandIdNum,                        // ✅ Número explícito
            role: employeeForm.value.role               // ✅ String singular
        };
        
        // Include ID if editing
        if (props.edit && props.item) {
            employeeData.id = props.item.id;
        }
        
        // Si estamos en modo edición y la contraseña está vacía, no incluirla
        if (props.edit && (!employeeData.password || employeeData.password.trim() === '')) {
            delete employeeData.password;
        }
        
        // ✅ Incluir status solo si estamos editando (no requerido en creación)
        if (props.edit) {
            employeeData.status = employeeForm.value.status;
        }
        
        console.log('📦 [Form] Payload a enviar:', JSON.stringify(employeeData, null, 2));
        console.log('✅ [Form] Tipos finales:', {
            applicantCompanyId: typeof employeeData.applicantCompanyId,
            brandId: typeof employeeData.brandId,
            applicantCompanyIdValue: employeeData.applicantCompanyId,
            brandIdValue: employeeData.brandId,
            role: employeeData.role,
            roleType: typeof employeeData.role
        });
        
        emit('save-requested', employeeData);
        // ❌ NO resetear el formulario aquí - se reseteará solo si el guardado es exitoso
    }
};

/**
 * Método público para hacer focus en el input de email
 * Usado por el componente padre cuando hay error de duplicado
 */
const focusEmailInput = () => {
    if (emailInputRef.value) {
        // Buscar el input dentro del componente PrimeVue
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

/**
 * Establecer error personalizado de email duplicado
 * @param {string} message - Mensaje de error
 */
const setEmailError = (message) => {
    emailError.value = message;
    focusEmailInput();
};

/**
 * Resetear formulario exitoso (solo llamar después de guardado exitoso)
 */
const resetFormOnSuccess = () => {
    resetForm();
};

const resetForm = () => {
    employeeForm.value = {
        name: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        status: 'ACTIVE',
        brandId: null,
        role: ''
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
    if (newValue && props.edit && props.item) {
        // Tomar el primer rol disponible (excluyendo COMPANY_EMPLOYEE si existe)
        const availableRoles = (props.item.roles || []).filter(r => r !== 'COMPANY_EMPLOYEE');
        const roleValue = availableRoles.length > 0 ? availableRoles[0] : (props.item.roles?.[0] || '');
        
        employeeForm.value = {
            name: props.item.name || '',
            lastName: props.item.lastName || '',
            email: props.item.getEmailValue?.() || props.item.email || '',
            password: '', // No mostrar password en edición
            phoneNumber: props.item.getPhoneValue?.() || props.item.phoneNumber || '',
            status: props.item.status || 'ACTIVE',
            brandId: props.item.brandId || null,
            role: roleValue
        };
    } else if (newValue && !props.edit) {
        resetForm();
    }
});
</script>

<template>
    <create-and-edit
        :entity="employeeForm"
        :visible="visible"
        entity-name="Colaborador"
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
                        v-model="employeeForm.name"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese los nombres"
                        :class="{ 'p-invalid': submitted && (!employeeForm.name || !validateName(employeeForm.name)) }"
                    />
                    <small v-if="submitted && !employeeForm.name" class="p-error">
                        Los nombres son requeridos
                    </small>
                    <small v-else-if="submitted && employeeForm.name && !validateName(employeeForm.name)" class="p-error">
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
                        v-model="employeeForm.lastName"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese los apellidos"
                        :class="{ 'p-invalid': submitted && (!employeeForm.lastName || !validateLastName(employeeForm.lastName)) }"
                    />
                    <small v-if="submitted && !employeeForm.lastName" class="p-error">
                        Los apellidos son requeridos
                    </small>
                    <small v-else-if="submitted && employeeForm.lastName && !validateLastName(employeeForm.lastName)" class="p-error">
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
                        v-model="employeeForm.email"
                        class="w-full"
                        size="small"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        :class="{ 'p-invalid': (submitted && (!employeeForm.email || !validateEmail(employeeForm.email))) || emailError }"
                        @input="emailError = ''"
                    />
                    <small v-if="emailError" class="p-error">
                        {{ emailError }}
                    </small>
                    <small v-else-if="submitted && !employeeForm.email" class="p-error">
                        El email es requerido
                    </small>
                    <small v-else-if="submitted && employeeForm.email && !validateEmail(employeeForm.email)" class="p-error">
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
                        v-model="employeeForm.phoneNumber"
                        class="w-full"
                        size="small"
                        placeholder="999 999 999"
                        maxlength="15"
                        @keypress="(e) => { if (!/[0-9+\s]/.test(e.key)) e.preventDefault(); }"
                        :class="{ 'p-invalid': submitted && (!employeeForm.phoneNumber || !validatePhoneNumber(employeeForm.phoneNumber)) }"
                    />
                    <small v-if="submitted && !employeeForm.phoneNumber" class="p-error">
                        El teléfono es requerido
                    </small>
                    <small v-else-if="submitted && employeeForm.phoneNumber && !validatePhoneNumber(employeeForm.phoneNumber)" class="p-error">
                        El teléfono debe tener entre 9 y 15 dígitos
                    </small>
                </div>
            </div>

            <!-- Fila 3: Contraseña y Marca -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="password" class="block text-900 font-medium mb-2">
                        <i class="pi pi-lock mr-2"></i>Contraseña {{ edit ? '' : '*' }}
                    </label>
                    <pv-password
                        id="password"
                        v-model="employeeForm.password"
                        class="w-full"
                        inputClass="w-full"
                        size="small"
                        :placeholder="edit ? 'Dejar vacío para no cambiar' : 'Ingrese la contraseña'"
                        :feedback="false"
                        toggleMask
                        :inputStyle="{ width: '100%' }"
                        :class="{ 'p-invalid': submitted && !edit && (!employeeForm.password || employeeForm.password.trim().length === 0) }"
                    />
                    <small v-if="submitted && !edit && (!employeeForm.password || employeeForm.password.trim().length === 0)" class="p-error">
                        La contraseña es requerida
                    </small>
                    <small v-if="edit" class="text-500 block mt-1">
                        Dejar vacío para mantener la contraseña actual
                    </small>
                </div>
            </div>

            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="brandId" class="block text-900 font-medium mb-2">
                        <i class="pi pi-tag mr-2"></i>Marca *
                    </label>
                    <pv-select
                        id="brandId"
                        v-model="employeeForm.brandId"
                        :options="brandOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione una marca"
                        class="w-full"
                        size="small"
                        :class="{ 'p-invalid': submitted && !employeeForm.brandId }"
                    />
                    <small v-if="submitted && !employeeForm.brandId" class="p-error">
                        La marca es requerida
                    </small>
                </div>
            </div>

            <!-- Fila 4: Rol y Estado -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="role" class="block text-900 font-medium mb-2">
                        <i class="pi pi-shield mr-2"></i>Rol *
                    </label>
                    <pv-select
                        id="role"
                        v-model="employeeForm.role"
                        :options="roleOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione un rol"
                        class="w-full"
                        :class="{ 'p-invalid': submitted && !employeeForm.role }"
                    />
                    <small v-if="submitted && !employeeForm.role" class="p-error">
                        El rol es requerido
                    </small>
                </div>
            </div>

            <!-- Fila 5: Estado (solo en modo edición) -->
            <div v-if="edit" class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="status" class="block text-900 font-medium mb-2">
                        <i class="pi pi-check-circle mr-2"></i>Estado
                    </label>
                    <pv-select
                        id="status"
                        v-model="employeeForm.status"
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
