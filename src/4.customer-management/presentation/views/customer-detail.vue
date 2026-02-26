<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCustomerStore } from '../../application/customer.store.js';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import EmployeeCollaboratorCreateAndEdit from '../components/employee-collaborator-create-and-edit.vue';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import {
    StatusTranslations,
    StatusFilterOptions,
    RoleTranslations,
    EmployeeUILabels
} from '../constants/customer-ui.constants.js';

const route = useRoute();
const customerStore = useCustomerStore();
const confirm = useConfirm();
const toast = useToast();

// State
const customerId = ref(null);
const search = ref('');
const selectStatus = ref('');
const selectedBrand = ref(''); // Filtro por marca
const isEdit = ref(false);
const itemEmployee = ref(null);
const createAndEditDialogIsVisible = ref(false);
const employeeFormRef = ref(null); // Ref al componente hijo
const rolesPopoversRefs = ref(new Map()); // Map para referencias de popovers por ID

// Loading states
const isLoading = ref(true);
const loadingStep = ref(0);
const loadingSteps = [
    { icon: 'pi-building', label: 'Datos del cliente' },
    { icon: 'pi-users', label: 'Colaboradores' },
    { icon: 'pi-check', label: 'Completado' }
];

// Status options
const statusOptions = StatusFilterOptions;

// Computed
const customer = computed(() => customerStore.currentCustomer);

// Brand options - generadas dinámicamente desde las marcas del cliente
const brandOptions = computed(() => {
    if (!customer.value?.brands || customer.value.brands.length === 0) {
        return [{ label: 'Todas las marcas', value: '' }];
    }
    
    return [
        { label: 'Todas las marcas', value: '' },
        ...customer.value.brands.map(brand => ({
            label: brand.name || brand.value,
            value: String(brand.id)
        }))
    ];
});

const filteredEmployees = computed(() => {
    let filtered = customerStore.employees;

    // Filter by search text
    if (search.value && search.value.trim().length > 0) {
        // Normalizar término de búsqueda: minúsculas, eliminar espacios extras
        const searchTerm = search.value.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Helper para normalizar texto: minúsculas + espacios simples
        const normalizeText = (text) => {
            if (!text) return '';
            return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
        };
        
        filtered = filtered.filter(employee => {
            // Normalizar cada campo antes de comparar
            const name = normalizeText(employee.name);
            const lastName = normalizeText(employee.lastName);
            const email = normalizeText(employee.getEmailValue());
            const phoneNumber = normalizeText(employee.getPhoneValue());
            
            // Buscar coincidencias parciales en cualquiera de los campos
            return name.includes(searchTerm) ||
                   lastName.includes(searchTerm) ||
                   email.includes(searchTerm) ||
                   phoneNumber.includes(searchTerm);
        });
    }

    // Filter by status
    if (selectStatus.value) {
        filtered = filtered.filter(employee => employee.status === selectStatus.value);
    }

    // Filter by brand
    if (selectedBrand.value) {
        filtered = filtered.filter(employee => 
            String(employee.brandId) === selectedBrand.value
        );
    }

    return filtered;
});

// Columns configuration for data-manager
const columns = ref([
    { field: 'name', header: 'Nombres', sortable: true, style: 'min-width: 150px' },
    { field: 'lastName', header: 'Apellidos', sortable: true, style: 'min-width: 150px' },
    { field: 'email', header: 'Email', sortable: true, style: 'min-width: 150px' },
    { field: 'phoneNumber', header: 'Teléfono', sortable: true, style: 'min-width: 100px' },
    { field: 'brandName', header: 'Marca', sortable: true, style: 'min-width: 150px', template: 'brandName' },
    { field: 'roles', header: 'Rol', sortable: true, style: 'min-width: 120px', template: 'roles' },
    { field: 'status', header: 'Estado', sortable: true, style: 'min-width: 120px', template: 'status' }
]);

const statusProps = computed(() => {
    if (customer.value?.isActive()) {
        return {
            container: 'bg-green-50 text-green-700 border-green-200',
            icon: 'pi pi-check-circle text-green-600'
        };
    } else {
        return {
            container: 'bg-red-50 text-red-700 border-red-200',
            icon: 'pi pi-times-circle text-red-600'
        };
    }
});

// Methods
const getCountByStatus = (status) => {
    return customerStore.employees.filter(e => e.status === status).length;
};

const getCountByBrand = (brandId) => {
    if (!brandId) {
        return customerStore.employees.length;
    }
    return customerStore.employees.filter(e => String(e.brandId) === String(brandId)).length;
};

const getStatusSeverity = (status) => {
    return status === 'ACTIVE' ? 'success' : 'danger';
};

const translateRole = (role) => {
    return RoleTranslations[role] || role || 'Sin rol';
};

/**
 * Filtra roles excluyendo COMPANY_EMPLOYEE (rol base que todos tienen)
 * @param {Array} roles - Array de roles del colaborador
 * @returns {Array} Roles filtrados
 */
const filterRelevantRoles = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return [];
    }
    
    // Filtrar roles que NO sean COMPANY_EMPLOYEE
    const filtered = roles.filter(role => role !== 'COMPANY_EMPLOYEE');
    
    // Si después de filtrar no queda ninguno, retornar el original
    return filtered.length > 0 ? filtered : roles;
};

/**
 * Obtiene el rol principal a mostrar (primer rol relevante)
 * @param {Array} roles - Array de roles del colaborador
 * @returns {string} Rol traducido
 */
const getDisplayRole = (roles) => {
    const relevantRoles = filterRelevantRoles(roles);
    
    if (relevantRoles.length === 0) {
        return 'Sin rol';
    }
    
    return translateRole(relevantRoles[0]);
};

/**
 * Obtiene todos los roles traducidos
 * @param {Array} roles - Array de roles del colaborador
 * @returns {Array} Array de roles traducidos
 */
const getTranslatedRoles = (roles) => {
    const relevantRoles = filterRelevantRoles(roles);
    
    if (relevantRoles.length === 0) {
        return ['Sin rol'];
    }
    
    return relevantRoles.map(role => translateRole(role));
};

/**
 * Cuenta cuántos roles tiene un colaborador (excluyendo COMPANY_EMPLOYEE)
 * @param {Array} roles - Array de roles
 * @returns {number} Cantidad de roles
 */
const getRolesCount = (roles) => {
    const relevantRoles = filterRelevantRoles(roles);
    return relevantRoles.length;
};

/**
 * Alterna la visibilidad del popover de roles
 * @param {Event} event - Evento del click
 * @param {string} employeeId - ID del empleado para identificar el popover
 */
const toggleRolesPopover = (event, employeeId) => {
    const popover = rolesPopoversRefs.value.get(employeeId);
    if (popover) {
        popover.toggle(event);
    }
};

/**
 * Callback para establecer la referencia del popover en el Map
 * @param {Object} el - Elemento del popover
 * @param {string} employeeId - ID del empleado
 */
const setPopoverRef = (el, employeeId) => {
    if (el) {
        rolesPopoversRefs.value.set(employeeId, el);
    } else {
        rolesPopoversRefs.value.delete(employeeId);
    }
};

const onNewItem = () => {
    itemEmployee.value = null;
    isEdit.value = false;
    createAndEditDialogIsVisible.value = true;
};

const onCancelRequested = () => {
    isEdit.value = false;
    itemEmployee.value = null;
    createAndEditDialogIsVisible.value = false;
};

const onSaveRequested = async (employeeData) => {
    // 🔍 Validar email duplicado
    // Normalizar email a string para comparación
    const emailToCompare = typeof employeeData.email === 'string' 
        ? employeeData.email.toLowerCase() 
        : String(employeeData.email || '').toLowerCase();
    
    const emailExists = customerStore.employees.find(employee => {
        // Si estamos editando, excluir el colaborador actual de la búsqueda
        if (isEdit.value && itemEmployee.value && employee.id === itemEmployee.value.id) {
            return false;
        }
        return employee.getEmailValue().toLowerCase() === emailToCompare;
    });
    
    if (emailExists) {
        // ❌ NO cerrar el dialog, solo mostrar error y hacer focus
        const errorMessage = `Ya existe un colaborador con el email ${emailToCompare}`;
        
        toast.add({
            severity: 'error',
            summary: 'Email duplicado',
            detail: errorMessage,
            life: 5000
        });
        
        // Hacer focus en el input de email y mostrar error en el formulario
        if (employeeFormRef.value) {
            employeeFormRef.value.setEmailError(errorMessage);
        }
        
        return; // Detener aquí - NO cerrar dialog, NO limpiar formulario
    }
    
    let result;
    
    if (isEdit.value) {
        result = await customerStore.updateEmployee(customerId.value, employeeData.id, employeeData);
    } else {
        result = await customerStore.createEmployee(customerId.value, employeeData);
    }
    
    if (result.success) {
        const action = isEdit.value ? 'actualizado' : 'creado';
        toast.add({
            severity: 'success',
            summary: `Colaborador ${action}`,
            detail: `El colaborador ${employeeData.name} ${employeeData.lastName} ha sido ${action} exitosamente`,
            life: 4000
        });
        
        // ✅ Solo ahora cerrar dialog y limpiar formulario
        if (employeeFormRef.value) {
            employeeFormRef.value.resetFormOnSuccess();
        }
        createAndEditDialogIsVisible.value = false;
        isEdit.value = false;
        itemEmployee.value = null;
    } else {
        // ❌ Error del servidor - mantener dialog abierto
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'No se pudo guardar el colaborador',
            life: 4000
        });
        // Dialog permanece abierto para que el usuario pueda corregir
    }
};

const onClearFilters = () => {
    search.value = '';
    selectStatus.value = '';
    selectedBrand.value = '';
};

const onEditItem = (employee) => {
    itemEmployee.value = employee;
    isEdit.value = true;
    createAndEditDialogIsVisible.value = true;
};

const onDeleteItem = async (employee) => {
    const result = await customerStore.deleteEmployee(customerId.value, employee.id);
    
    if (result.success) {
        toast.add({
            severity: 'success',
            summary: 'Colaborador eliminado',
            detail: `El colaborador ${employee.fullName} ha sido eliminado exitosamente`,
            life: 4000
        });
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar',
            detail: result.message || 'No se pudo eliminar el colaborador',
            life: 4000
        });
    }
};

const simulateLoadingProgress = () => {
    const progressInterval = setInterval(() => {
        if (loadingStep.value < loadingSteps.length - 1) {
            loadingStep.value++;
        } else {
            clearInterval(progressInterval);
        }
    }, 700);
    
    setTimeout(() => {
        clearInterval(progressInterval);
    }, 4000);
};

const clearData = () => {
    // Limpiar datos SÍNCRONAMENTE (inmediato, sin await)
    customerStore.currentCustomer = null;
    customerStore.employees = [];
    search.value = '';
    selectStatus.value = '';
    selectedBrand.value = '';
    loadingStep.value = 0;
};

const loadData = async (newCustomerId) => {
    if (newCustomerId) {
        isLoading.value = true;
        loadingStep.value = 0;
        simulateLoadingProgress();
        
        await customerStore.fetchById(newCustomerId);
        await customerStore.fetchEmployees(newCustomerId);
        
        // 📊 Log de colaboradores cargados
        console.log('📋 [CustomerDetail] Colaboradores cargados:', {
            total: customerStore.employees.length,
            customerId: newCustomerId,
            colaboradores: customerStore.employees.map(emp => ({
                id: emp.id,
                nombre: `${emp.name} ${emp.lastName}`,
                email: emp.getEmailValue(),
                telefono: emp.getPhoneValue(),
                roles: emp.roles,
                rolesTraducidos: emp.roles?.map(r => RoleTranslations[r] || r),
                marca: emp.brandName,
                estado: emp.status
            }))
        });
        
        loadingStep.value = loadingSteps.length;
        isLoading.value = false;

    }
};

// Lifecycle
onMounted(async () => {
    customerId.value = route.query.id;
    clearData();
    await loadData(customerId.value);


});

// Watch for route changes
watch(() => route.query.id, async (newId) => {
    if (newId && newId !== customerId.value) {
        customerId.value = newId;
        clearData(); // Limpiar INMEDIATAMENTE (síncrono)
        await loadData(newId); // Luego cargar (asíncrono)
    }
});
</script>

<template>
  
    <div class="h-full w-full flex flex-column">
        <!-- Toolbar -->
        <toolbar
            :title="customer ? `Gestión de Colaboradores - ${customer.companyName}` : 'Gestión de Colaboradores'"
            :description="customer ? 'Credenciales y contacto de colaboradores' : 'Cargando información del cliente...'"
            :show-back-button="true"
            :back-route="{ name: 'customers' }"
        >
            <template #actions>
                <!-- Customer Status Badge -->
                <div 
                    v-if="customer" 
                    :class="['flex align-items-center gap-2 px-3 py-2 border-round border-1', statusProps.container]"
                >
                    <i :class="statusProps.icon"></i>
                    <span class="font-semibold text-sm">Estado del cliente:</span>
                    <span class="font-bold">{{ StatusTranslations[customer.status] }}</span>
                </div>
            </template>
        </toolbar>

        <div class="flex-1 p-4 overflow-auto">

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
            <div class="loading-content">
                <pv-progress-spinner 
                    size="48" 
                    stroke-width="4" 
                    animation-duration="1.2s" 
                    class="loading-spinner"
                />
                
                <div class="loading-text">
                    <h3 class="loading-title">Cargando información del cliente</h3>
                    <p class="loading-subtitle">{{ loadingSteps[loadingStep]?.label || 'Preparando datos...' }}</p>
                </div>
            </div>
        </div>

        <!-- Content -->
        <div v-else class="flex-grow-1 flex flex-column" style="min-height: 0;">
            <!-- Data Manager Component -->
            <data-manager
                :items="customerStore.employees"
                :filtered-items="filteredEmployees"
                :title="{ singular: 'colaborador', plural: 'colaboradores' }"
                :columns="columns"
                :loading="customerStore.loading"
                :dynamic="true"
                :show-selection="false"
                :show-export="false"
                :show-delete="false"
                :show-view-action="false"
                :show-edit-action="true"
                :show-delete-action="true"
                search-placeholder="Buscar por nombre, apellido, email o teléfono..."
                new-button-label="Nuevo Colaborador"
                @new-item-requested-manager="onNewItem"
                @edit-item-requested-manager="onEditItem"
                @delete-item-requested-manager="onDeleteItem"
                @global-filter-change="(value) => search = value"
                @clear-filters="onClearFilters"
            >
                <!-- Custom filters slot -->
                <template #filters="{ clearFilters }">
                    <pv-dropdown
                        v-model="selectStatus"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filtrar por estado"
                        class="w-full md:w-auto"
                        style="min-width: 200px"
                    >
                        <template #option="slotProps">
                            <div class="flex align-items-center justify-content-between w-full">
                                <span>{{ slotProps.option.label }}</span>
                                <span 
                                    v-if="slotProps.option.value === 'ACTIVE'"
                                    class="inline-flex align-items-center justify-content-center border-circle font-semibold text-xs ml-2"
                                    style="min-width: 28px; min-height: 28px; background-color: #10b981; color: white;"
                                >
                                    {{ getCountByStatus(slotProps.option.value) }}
                                </span>
                                <span 
                                    v-else-if="slotProps.option.value === 'INACTIVE'"
                                    class="inline-flex align-items-center justify-content-center border-circle font-semibold text-xs ml-2"
                                    style="min-width: 28px; min-height: 28px; background-color: #ef4444; color: white;"
                                >
                                    {{ getCountByStatus(slotProps.option.value) }}
                                </span>
                                <span 
                                    v-else
                                    class="inline-flex align-items-center justify-content-center border-circle font-semibold text-xs ml-2"
                                    style="min-width: 28px; min-height: 28px; background-color: #64748b; color: white;"
                                >
                                    {{ customerStore.employees.length }}
                                </span>
                            </div>
                        </template>
                    </pv-dropdown>
                    
                    <pv-dropdown
                        v-model="selectedBrand"
                        :options="brandOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filtrar por marca"
                        class="w-full md:w-auto"
                        style="min-width: 200px"
                    >
                        <template #option="slotProps">
                            <div class="flex align-items-center justify-content-between w-full">
                                <span>{{ slotProps.option.label }}</span>
                                <span 
                                    class="inline-flex align-items-center justify-content-center border-circle font-semibold text-xs ml-2"
                                    style="min-width: 28px; min-height: 28px; background-color: #3b82f6; color: white;"
                                >
                                    {{ getCountByBrand(slotProps.option.value) }}
                                </span>
                            </div>
                        </template>
                    </pv-dropdown>
                    
                    <pv-button
                        label="Limpiar filtros"
                        icon="pi pi-filter-slash"
                        class="p-button-secondary p-button-outlined"
                        @click="clearFilters"
                    />
                </template>

                <!-- Custom column templates -->
                <template #brandName="{ data }">
                    <span class="badge bg-blue-100 text-blue-700 text-sm px-2 py-1">
                        {{ data.brandName || 'Sin marca' }}
                    </span>
                </template>

                <template #roles="{ data }">
                    <div class="flex align-items-center gap-2 flex-wrap">
                        <!-- Si tiene solo 1 rol: badge simple -->
                        <span 
                            v-if="getRolesCount(data.roles) === 1"
                            class="badge bg-purple-100 text-purple-700 text-sm px-2 py-1"
                        >
                            {{ getDisplayRole(data.roles) }}
                        </span>
                        
                        <!-- Si tiene 2+ roles: dropdown desglosable -->
                        <div v-else class="roles-dropdown-container">
                            <pv-button
                                :label="`${getRolesCount(data.roles)} roles`"
                                icon="pi pi-chevron-down"
                                icon-pos="right"
                                size="small"
                                outlined
                                severity="secondary"
                                class="roles-dropdown-trigger"
                                @click="(event) => toggleRolesPopover(event, data.id)"
                            />
                            <pv-popover :ref="(el) => setPopoverRef(el, data.id)" class="roles-popover-panel">
                                <div class="flex flex-column gap-2" style="min-width: 200px;">
                                    <div class="text-sm font-semibold text-700 mb-1 pb-2 border-bottom-1 border-200">
                                        Roles asignados
                                    </div>
                                    <div
                                        v-for="(role, index) in getTranslatedRoles(data.roles)"
                                        :key="index"
                                        class="flex align-items-center gap-2 p-2 border-round hover:surface-100 transition-colors transition-duration-150"
                                    >
                                        <i class="pi pi-shield text-purple-500"></i>
                                        <span class="text-900 text-sm">{{ role }}</span>
                                    </div>
                                </div>
                            </pv-popover>
                        </div>
                    </div>
                </template>

                <template #status="{ data }">
                    <pv-tag
                        :value="StatusTranslations[data.status]"
                        :severity="getStatusSeverity(data.status)"
                        class="text-sm"
                    />
                </template>

                <!-- Empty state -->
                <template #empty>
                    <div class="text-center p-4">
                        <i class="pi pi-users text-6xl text-400 mb-3 block"></i>
                        <h3 class="text-dark mb-2">{{ EmployeeUILabels.messages.noEmployees }}</h3>
                        <p class="text-muted mb-4">{{ EmployeeUILabels.messages.addFirstEmployee }}</p>
                    </div>
                </template>
            </data-manager>

        <!-- Create/Edit Dialog -->
        <employee-collaborator-create-and-edit
            ref="employeeFormRef"
            :edit="isEdit"
            :item="itemEmployee"
            :visible="createAndEditDialogIsVisible"
            :customer-id="customerId"
            :customer-brands="customer?.brands || []"
            @cancel-requested="onCancelRequested"
            @save-requested="onSaveRequested"
        />
        </div>
        </div>
    </div>
</template>

<style scoped>
/* Loading Styles */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 2rem;
}

.loading-content {
  text-align: center;
  max-width: 400px;
}

.loading-spinner {
  margin-bottom: 1.5rem;
}

.loading-text {
  margin-top: 1rem;
}

.loading-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.loading-subtitle {
  font-size: 1rem;
  color: var(--text-color-secondary);
  margin: 0;
}
</style>
