<script setup>
import { ref, computed, watch } from 'vue';
import { CustomerValidators } from '../../domain/validators/customer.validators.js';
import CreateAndEdit from '../../../shared-v2/presentation/components/create-and-edit.vue';

const props = defineProps({
    edit: Boolean,
    item: Object,
    visible: Boolean
});

const emit = defineEmits(['cancel-requested', 'save-requested']);

// State
const submitted = ref(false);
const customerForm = ref({
    ruc: '',
    companyName: '',
    password: '',
    brands: [], // Array de strings para marcas
    status: 'ACTIVE' // Solo se usa en edición
});

// Computed
const isFormValid = computed(() => {
    const rucValid = customerForm.value.ruc && validateRuc(customerForm.value.ruc);
    const companyNameValid = customerForm.value.companyName && validateCompanyName(customerForm.value.companyName);
    // Password obligatorio solo en creación
    const passwordValid = props.edit || (customerForm.value.password && customerForm.value.password.trim().length > 0);
    return rucValid && companyNameValid && passwordValid;
});

// Status options
const statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
];

// Validation methods
const validateRuc = (ruc) => {
    try {
        CustomerValidators.validateRuc(ruc);
        return true;
    } catch {
        return false;
    }
};

const validateCompanyName = (name) => {
    try {
        CustomerValidators.validateCompanyName(name);
        return true;
    } catch {
        return false;
    }
};

// Methods
const cancelRequested = () => {
    submitted.value = false;
    resetForm();
    emit('cancel-requested');
};

const saveRequested = () => {
    submitted.value = true;
    
    if (isFormValid.value) {
        const customerData = { ...customerForm.value };
        
        // Include ID if editing
        if (props.edit && props.item) {
            customerData.id = props.item.id;
        }
        
        // Si estamos en modo edición y la contraseña está vacía, no incluirla
        if (props.edit && (!customerData.password || customerData.password.trim() === '')) {
            delete customerData.password;
        }
        
        console.log('[Dialog] Emitting customerData:', customerData);
        emit('save-requested', customerData);
        // No resetear aquí - dejar que el padre maneje el reset cuando sea exitoso
    }
};

const resetForm = () => {
    customerForm.value = {
        ruc: '',
        companyName: '',
        password: '',
        brands: [],
        status: 'ACTIVE'
    };
    submitted.value = false;
};

// Watch for dialog open/close
watch(() => props.visible, (newValue, oldValue) => {
    // Cuando el diálogo se abre
    if (newValue && props.edit && props.item) {
        // En modo edición, mapear brands de Brand entities a strings
        const brandsArray = props.item.brands && Array.isArray(props.item.brands)
            ? props.item.brands.map(brand => brand.value || brand)
            : [];
        
        customerForm.value = {
            ruc: props.item.ruc || '',
            companyName: props.item.companyName || '',
            password: '', // No mostrar password en edición
            brands: brandsArray,
            status: props.item.status || 'ACTIVE'
        };
    } else if (newValue && !props.edit) {
        resetForm();
    }
    
    // Cuando el diálogo se cierra (newValue = false, oldValue = true)
    if (!newValue && oldValue) {
        resetForm();
    }
});
</script>

<template>
    <create-and-edit
        :entity="customerForm"
        :visible="visible"
        entity-name="Cliente"
        :edit="edit"
        size="standard"
        @canceled-shared="cancelRequested"
        @saved-shared="saveRequested"
    >
        <template #content>

        <div class="grid p-2">
            <!-- Fila 1: RUC y Nombre de Empresa -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="ruc" class="block text-900 font-medium mb-2">
                        <i class="pi pi-id-card mr-2"></i>RUC *
                    </label>
                    <pv-input-text
                        id="ruc"
                        v-model="customerForm.ruc"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese el RUC (11 dígitos)"
                        maxlength="11"
                        @keypress="(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }"
                        :class="{ 'p-invalid': submitted && (!customerForm.ruc || !validateRuc(customerForm.ruc)) }"
                    />
                    <small v-if="submitted && !customerForm.ruc" class="p-error">
                        El RUC es requerido
                    </small>
                    <small v-else-if="submitted && customerForm.ruc && !validateRuc(customerForm.ruc)" class="p-error">
                        El RUC debe tener exactamente 11 dígitos numéricos
                    </small>
                </div>
            </div>

            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="companyName" class="block text-900 font-medium mb-2">
                        <i class="pi pi-building mr-2"></i>Nombre de la Empresa *
                    </label>
                    <pv-input-text
                        id="companyName"
                        v-model="customerForm.companyName"
                        class="w-full"
                        size="small"
                        placeholder="Ingrese el nombre de la empresa"
                        :class="{ 'p-invalid': submitted && (!customerForm.companyName || !validateCompanyName(customerForm.companyName)) }"
                    />
                    <small v-if="submitted && !customerForm.companyName" class="p-error">
                        El nombre de la empresa es requerido
                    </small>
                    <small v-else-if="submitted && customerForm.companyName && !validateCompanyName(customerForm.companyName)" class="p-error">
                        El nombre debe tener entre 3 y 100 caracteres
                    </small>
                </div>
            </div>

            <!-- Fila 2: Contraseña y Estado -->
            <div class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="password" class="block text-900 font-medium mb-2">
                        <i class="pi pi-lock mr-2"></i>Contraseña {{ edit ? '' : '*' }}
                    </label>
                    <pv-password
                        id="password"
                        v-model="customerForm.password"
                        class="w-full"
                        inputClass="w-full"
                        size="small"
                        :placeholder="edit ? 'Dejar vacío para no cambiar' : 'Ingrese la contraseña'"
                        :feedback="false"
                        toggleMask
                        :inputStyle="{ width: '100%' }"
                        :class="{ 'p-invalid': submitted && !edit && (!customerForm.password || customerForm.password.trim().length === 0) }"
                    />
                    <small v-if="submitted && !edit && (!customerForm.password || customerForm.password.trim().length === 0)" class="p-error">
                        La contraseña es requerida
                    </small>
                    <small v-if="edit" class="text-500 block mt-1">
                        Dejar vacío para mantener la contraseña actual
                    </small>
                </div>
            </div>

            <!-- Estado (solo en modo edición) -->
            <div v-if="edit" class="col-12 md:col-6 px-2 pb-1">
                <div class="field">
                    <label for="status" class="block text-900 font-medium mb-2">
                        <i class="pi pi-check-circle mr-2"></i>Estado
                    </label>
                    <pv-select
                        id="status"
                        v-model="customerForm.status"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione el estado"
                        class="w-full"
                        size="small"
                    />
                </div>
            </div>

            <!-- Fila 3: Marcas (Brands) -->
            <div class="col-12 px-2 pb-1">
                <div class="field">
                    <label for="brands" class="block text-900 font-medium mb-2">
                        <i class="pi pi-tags mr-2"></i>Marcas
                    </label>
                    <pv-input-chips
                        id="brands"
                        v-model="customerForm.brands"
                        class="w-full"
                        placeholder="Ingrese una marca y presione Enter"
                        separator=","
                    />
                    <small class="text-500 block mt-1">
                        Ingrese las marcas asociadas al cliente (opcional)
                    </small>
                </div>
            </div>
        </div>
        </template>
    </create-and-edit>
</template>

<style scoped>
/* Using corporate design system */
</style>
