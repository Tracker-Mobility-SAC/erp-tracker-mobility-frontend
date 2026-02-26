<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSalesTeamStore } from '../../application/sales-team.store.js';
import { useCustomerStore } from '../../../4.customer-management/application/customer.store.js';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import SellerCreateAndEdit from '../components/seller-create-and-edit.vue';

const router = useRouter();
const salesTeamStore = useSalesTeamStore();
const customerStore = useCustomerStore();
const toast = useToast();
const confirm = useConfirm();

// State
const isEdit = ref(false);
const itemSeller = ref(null);
const createAndEditDialogIsVisible = ref(false);
const sellerFormRef = ref(null);

// Computed
const loading = computed(() => salesTeamStore.loading);
const salesTeam = computed(() => salesTeamStore.salesTeam);
const currentEmployee = computed(() => salesTeamStore.currentEmployee);

// Configuración de columnas para el DataTable
const columns = [
    { field: 'fullName', header: 'Nombre Completo', sortable: true, template: 'body-fullName' },
    { field: 'email', header: 'Correo Electrónico', sortable: true },
    { field: 'phoneNumber', header: 'Teléfono', sortable: true },
    { field: 'brandName', header: 'Marca', sortable: true },
    { field: 'status', header: 'Estado', sortable: true, template: 'body-status' }
];

// Methods
const viewEmployeeOrders = (employee) => {
    salesTeamStore.selectEmployee(employee);
    router.push({
        name: 'employee-orders',
        params: { employeeId: employee.id }
    });
};

const onNewSeller = () => {
    itemSeller.value = null;
    isEdit.value = false;
    createAndEditDialogIsVisible.value = true;
};

const onEditSeller = (seller) => {
    itemSeller.value = seller;
    isEdit.value = true;
    createAndEditDialogIsVisible.value = true;
};

const onCancelRequested = () => {
    isEdit.value = false;
    itemSeller.value = null;
    createAndEditDialogIsVisible.value = false;
};

const onSaveRequested = async (sellerData) => {
    // Validar que currentEmployee esté disponible
    if (!currentEmployee.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información del gerente',
            life: 4000
        });
        return;
    }
    
    // Validar email duplicado
    const emailToCompare = typeof sellerData.email === 'string' 
        ? sellerData.email.toLowerCase() 
        : String(sellerData.email || '').toLowerCase();
    
    const emailExists = salesTeamStore.salesTeam.find(seller => {
        if (isEdit.value && itemSeller.value && seller.id === itemSeller.value.id) {
            return false;
        }
        // Los vendedores son objetos planos, acceder directamente al email
        const sellerEmail = seller.email || '';
        return sellerEmail.toLowerCase() === emailToCompare;
    });
    
    if (emailExists) {
        const errorMessage = `Ya existe un vendedor con el email ${emailToCompare}`;
        
        toast.add({
            severity: 'error',
            summary: 'Email duplicado',
            detail: errorMessage,
            life: 5000
        });
        
        if (sellerFormRef.value) {
            sellerFormRef.value.setEmailError(errorMessage);
        }
        
        return;
    }
    
    let result;
    const companyId = currentEmployee.value.applicantCompanyId;
    
    if (isEdit.value) {
        result = await customerStore.updateEmployee(companyId, sellerData.id, sellerData);
    } else {
        result = await customerStore.createEmployee(companyId, sellerData);
    }
    
    if (result.success) {
        const action = isEdit.value ? 'actualizado' : 'creado';
        toast.add({
            severity: 'success',
            summary: `Vendedor ${action}`,
            detail: `El vendedor ${sellerData.name} ${sellerData.lastName} ha sido ${action} exitosamente`,
            life: 4000
        });
        
        // Recargar lista de vendedores
        await salesTeamStore.fetchSalesTeam();
        
        if (sellerFormRef.value) {
            sellerFormRef.value.resetFormOnSuccess();
        }
        createAndEditDialogIsVisible.value = false;
        isEdit.value = false;
        itemSeller.value = null;
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'No se pudo guardar el vendedor',
            life: 4000
        });
    }
};

const onDeleteSeller = async (seller) => {
    if (!currentEmployee.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la información del gerente',
            life: 4000
        });
        return;
    }
    
    const companyId = currentEmployee.value.applicantCompanyId;
    const result = await customerStore.deleteEmployee(companyId, seller.id);
    
    if (result.success) {
        toast.add({
            severity: 'success',
            summary: 'Vendedor eliminado',
            detail: `${seller.fullName} ha sido eliminado exitosamente`,
            life: 4000
        });
        
        // Recargar lista
        await salesTeamStore.fetchSalesTeam();
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error al eliminar',
            detail: result.message || 'No se pudo eliminar el vendedor',
            life: 4000
        });
    }
};

// Lifecycle
onMounted(async () => {
    await salesTeamStore.fetchSalesTeam();
});
</script>

<style scoped>
/* Estilos corporativos aplicados desde src/styles */
.sales-team-list-view {
    background-color: var(--color-background);
    min-height: 100vh;
}
</style>




<template>
    <div class="sales-team-list-view">
        <!-- Toolbar Header -->
        <toolbar 
            :title="'Equipo de Ventas'" 
            :description="'Gestiona y visualiza tu equipo de vendedores'"
            :icon="'pi-users'" 
        />


        <div class="container-fluid px-4 py-4">
            <!-- Data Manager Component -->
            <data-manager
                :items="salesTeam"
                :columns="columns"
                :loading="loading"
                :title="{ singular: 'vendedor', plural: 'vendedores' }"
                :dynamic="true"
                :show-new="true"
                :show-delete="false"
                :show-export="false"
                :show-selection="false"
                :show-actions="true"
                :show-action-buttons="true"
                :show-view-action="true"
                :show-edit-action="true"
                :show-delete-action="true"
                :view-action-icon-only="true"
                :rows="10"
                :rows-per-page-options="[10, 15, 20, 25]"
                export-button-label="Exportar"
                new-button-label="Agregar vendedor"
                search-placeholder="Buscar por nombre, apellido, email..."
                @new-item-requested-manager="onNewSeller"
                @edit-item-requested-manager="onEditSeller"
                @delete-item-requested-manager="onDeleteSeller"
                @view-item-requested-manager="viewEmployeeOrders"
            >
                <!-- Slot personalizado para la columna de estado -->
                <template #body-status="{ data }">
                    <pv-tag 
                        :value="data.status === 'ACTIVE' ? 'Activo' : 'Inactivo'" 
                        :severity="data.status === 'ACTIVE' ? 'success' : 'danger'"
                    />
                </template>

                <!-- Slot personalizado para nombre completo con avatar -->
                <template #body-fullName="{ data }">
                    <div class="flex align-items-center gap-2">
                        <div class="flex align-items-center justify-content-center border-circle bg-primary text-white" 
                             style="width: 32px; height: 32px;">
                            <i class="pi pi-user text-sm"></i>
                        </div>
                        <span class="font-medium">{{ data.fullName }}</span>
                    </div>
                </template>
            </data-manager>

            <!-- Dialog para crear/editar vendedor -->
            <seller-create-and-edit
                v-if="currentEmployee"
                ref="sellerFormRef"
                :visible="createAndEditDialogIsVisible"
                :edit="isEdit"
                :item="itemSeller"
                :current-employee="currentEmployee"
                @cancel-requested="onCancelRequested"
                @save-requested="onSaveRequested"
            />
        </div>
    </div>
</template>

