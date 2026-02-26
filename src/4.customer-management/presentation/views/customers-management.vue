<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useCustomerStore } from '../../application/customer.store.js';
import { useCustomerCrud } from '../composables/use-customer-crud.js';
import CustomerCreateAndEdit from '../components/customer-create-and-edit.vue';
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';
import {
    StatusTranslations,
    StatusFilterOptions,
    StatusClassMap,
    CustomerUILabels
} from '../constants/customer-ui.constants.js';

const router = useRouter();
const toast = useToast();
const customerStore = useCustomerStore();
const { createCustomer, updateCustomer, deleteCustomer } = useCustomerCrud();

// State
const search = ref('');
const selectStatus = ref('');
const currentPage = ref(0);
const pageSize = ref(6);
const isEdit = ref(false);
const itemClient = ref(null);
const createAndEditDialogIsVisible = ref(false);
const loading = ref(false);

// Status options
const statusOptions = StatusFilterOptions;

// Computed
const filteredClients = computed(() => {
    let filtered = customerStore.customers;

    // Filter by search text
    if (search.value && search.value.trim().length > 0) {
        // Normalizar término de búsqueda: minúsculas, eliminar espacios extras
        const searchTerm = search.value.toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Helper para normalizar texto: minúsculas + espacios simples
        const normalizeText = (text) => {
            if (!text) return '';
            return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
        };
        
        filtered = filtered.filter(customer => {
            // Normalizar cada campo antes de comparar
            const ruc = normalizeText(customer.getRucValue());
            const companyName = normalizeText(customer.companyName);
            const status = normalizeText(customer.status);
            
            // Buscar coincidencias parciales en cualquiera de los campos
            return ruc.includes(searchTerm) ||
                   companyName.includes(searchTerm) ||
                   status.includes(searchTerm);
        });
    }

    // Filter by status
    if (selectStatus.value) {
        filtered = filtered.filter(customer => customer.status === selectStatus.value);
    }

    return filtered;
});

const paginatedClients = computed(() => {
    const start = currentPage.value * pageSize.value;
    const end = start + pageSize.value;
    return filteredClients.value.slice(start, end);
});

const totalFilteredRecords = computed(() => filteredClients.value.length);

// Methods
const getCountByStatus = (status) => {
    return customerStore.customers.filter(c => c.status === status).length;
};

const getStatusClass = (status) => {
    return StatusClassMap[status] || 'status-default';
};

const onNewItem = () => {
    itemClient.value = null;
    isEdit.value = false;
    createAndEditDialogIsVisible.value = true;
};

const onCancelRequested = () => {
    isEdit.value = false;
    itemClient.value = null;
    createAndEditDialogIsVisible.value = false;
};

const onSaveRequested = async (customerData) => {
    // Validar RUC duplicado
    const rucExists = customerStore.customers.find(customer => {
        // Si estamos editando, excluir el cliente actual de la búsqueda
        if (isEdit.value && itemClient.value && customer.id === itemClient.value.id) {
            return false;
        }
        return customer.getRucValue() === customerData.ruc;
    });
    
    if (rucExists) {
        toast.add({
            severity: 'error',
            summary: 'RUC duplicado',
            detail: `Ya existe un cliente con el RUC ${customerData.ruc}`,
            life: 4000
        });
        return;
    }
    
    try {
        if (isEdit.value) {
            await updateCustomer(customerData);
        } else {
            await createCustomer(customerData);
        }
        createAndEditDialogIsVisible.value = false;
        isEdit.value = false;
        itemClient.value = null;
    } catch (error) {
        // Error ya manejado por el composable
    }
};

const onClearFilters = () => {
    search.value = '';
    selectStatus.value = '';
    currentPage.value = 0;
};

const onViewItem = (customer) => {
    router.push({
        name: 'customer-detail',
        query: { id: customer.id }
    });
};

const onEditItem = (customer) => {
    itemClient.value = customer;
    isEdit.value = true;
    createAndEditDialogIsVisible.value = true;
};

const onDeleteItem = async (customer) => {
    try {
        await deleteCustomer(customer);
    } catch (error) {
        console.error('Error deleting customer:', error);
    }
};

const onPageChange = (event) => {
    currentPage.value = event.page;
};

// Lifecycle
onMounted(async () => {
    loading.value = true;
    try {
        await customerStore.fetchAll();
    } finally {
        loading.value = false;
    }
});

// Watch filters
const resetPage = () => {
    currentPage.value = 0;
};
</script>

<template>
  
    <div class="h-full w-full flex flex-column">
        <!-- Toolbar -->
        <toolbar
            :title="'Gestión de Clientes'"
            :description="'Administra la información y cuentas de tus clientes y su equipo'"
            :show-back-button="false"
        />

        <div class="flex-1 p-4 overflow-auto">

        <!-- Filters Card -->
        <div class="card p-4 mb-4">
            <div class="flex flex-column md:flex-row gap-3 align-items-stretch md:align-items-center">
                <!-- Search -->
                <pv-icon-field class="flex-grow-1">
                    <pv-input-icon class="pi pi-search" />
                    <pv-input-text
                        v-model="search"
                        :placeholder="CustomerUILabels.placeholders.search"
                        class="w-full"
                        @input="resetPage"
                    />
                </pv-icon-field>

                <!-- Status Filter -->
                <div class="w-full md:w-auto" style="min-width: 200px">
                    <pv-dropdown
                        v-model="selectStatus"
                        :options="statusOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Filtrar por estado"
                        class="w-full md:w-auto"
                        @change="resetPage"
                    >
                        <template #option="slotProps">
                            <div class="flex align-items-center justify-content-between w-full">
                                <span>{{ slotProps.option.label }}</span>
                                <span 
                                    v-if="slotProps.option.value !== ''"
                                    class="badge badge-primary ml-2"
                                >
                                    {{ getCountByStatus(slotProps.option.value) }}
                                </span>
                                <span v-else class="badge badge-secondary ml-2">
                                    {{ customerStore.customers.length }}
                                </span>
                            </div>
                        </template>
                    </pv-dropdown>
                </div>

                <!-- Clear Filters -->
                <div class="w-full md:w-auto">
                    <pv-button
                        :label="CustomerUILabels.buttons.clearFilters"
                        icon="pi pi-filter-slash"
                        class="p-button-secondary p-button-outlined w-full"
                        style="white-space: nowrap;"
                        @click="onClearFilters"
                    />
                </div>

                <!-- Add Customer -->
                <div class="w-full md:w-auto">
                    <pv-button
                        :label="CustomerUILabels.buttons.new"
                        icon="pi pi-plus"
                        severity="success"
                        @click="onNewItem"
                        class="w-full md:w-auto"
                        style="white-space: nowrap;"
                    />
                </div>
            </div>
        </div>

        <!-- Customer Cards -->
        <div v-if="loading" class="flex flex-column justify-content-center align-items-center" style="min-height: 50vh;">
            <pv-progress-spinner 
                size="48" 
                stroke-width="4" 
                animation-duration="1.2s" 
            />
            <p class="text-muted mt-3 font-medium">Cargando datos...</p>
        </div>
        
        <div v-else class="flex-grow-1 flex flex-column" style="min-height: 0;">
            <div class="grid overflow-auto flex-grow-1" style="min-height: 0;">
                <div 
                    v-for="customer in paginatedClients" 
                    :key="customer.id"
                    class="col-12 sm:col-6 lg:col-4"
                >
                    <div class="card p-4 h-full">
                        <!-- Header -->
                        <div class="flex justify-content-between align-items-start mb-3">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-building text-primary text-xl"></i>
                                <span 
                                    class="badge px-2 py-1 text-xs font-semibold"
                                    :class="getStatusClass(customer.status)"
                                >
                                    {{ StatusTranslations[customer.status] }}
                                </span>
                            </div>
                        </div>

                        <!-- Content -->
                        <div class="mb-4">
                            <h4 class="text-dark font-bold text-lg mb-2">{{ customer.companyName }}</h4>
                            <div class="flex align-items-center gap-2 mb-2">
                                <i class="pi pi-id-card text-muted"></i>
                                <span class="text-muted text-sm font-medium">RUC:</span>
                                <span class="text-dark font-semibold">{{ customer.getRucValue() }}</span>
                            </div>
                            <!-- Brands -->
                            <div v-if="customer.brands && customer.brands.length > 0" class="flex align-items-center gap-2 flex-wrap">
                                <i class="pi pi-tags text-muted"></i>
                                <span class="text-muted text-sm font-medium">Marcas:</span>
                                <span 
                                    v-for="brand in customer.brands" 
                                    :key="brand.id || brand.value"
                                    class="badge bg-blue-100 text-blue-700 text-xs px-2 py-1"
                                >
                                    {{ brand.value || brand }}
                                </span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-2">
                            <pv-button
                                icon="pi pi-eye"
                                class="p-button-outlined btn-view flex-1"
                                size="small"
                                @click="onViewItem(customer)"
                                v-tooltip.top="'Ver detalles'"
                            />
                            <pv-button
                                icon="pi pi-pencil"
                                class="p-button-outlined btn-edit flex-1"
                                size="small"
                                @click="onEditItem(customer)"
                                v-tooltip.top="'Editar cliente'"
                            />
                            <pv-button
                                icon="pi pi-trash"
                                class="p-button-outlined btn-delete flex-1"
                                size="small"
                                @click="onDeleteItem(customer)"
                                v-tooltip.top="'Eliminar cliente'"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paginator -->
            <div v-if="totalFilteredRecords > 0" class="mt-3 flex-shrink-0">
                <pv-paginator
                    :first="currentPage * pageSize"
                    :rows="pageSize"
                    :totalRecords="totalFilteredRecords"
                    @page="onPageChange"
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                />
            </div>
        </div>

        <!-- Empty State - No Customers -->
        <div v-if="!loading && customerStore.customers.length === 0" class="flex-grow-1 flex align-items-center justify-content-center">
            <div class="text-center">
                <i class="pi pi-inbox text-6xl text-400 mb-3 block"></i>
                <h3 class="text-dark mb-2">{{ CustomerUILabels.messages.noCustomers }}</h3>
                <p class="text-muted mb-4">{{ CustomerUILabels.messages.addFirstCustomer }}</p>
                <pv-button
                    :label="CustomerUILabels.buttons.new"
                    icon="pi pi-plus"
                    severity="success"
                    @click="onNewItem"
                />
            </div>
        </div>

        <!-- Empty State - No Results -->
        <div v-else-if="!loading && filteredClients.length === 0 && (search || selectStatus)" 
             class="flex-grow-1 flex align-items-center justify-content-center">
            <div class="text-center">
                <i class="pi pi-search text-6xl text-400 mb-3 block"></i>
                <h3 class="text-dark mb-2">{{ CustomerUILabels.messages.noResults }}</h3>
                <p class="text-muted mb-4">Intenta ajustar los filtros de búsqueda</p>
                <pv-button
                    :label="CustomerUILabels.buttons.clearFilters"
                    icon="pi pi-filter-slash"
                    severity="secondary"
                    @click="onClearFilters"
                />
            </div>
        </div>

        <!-- Create/Edit Dialog -->
        <customer-create-and-edit
            :edit="isEdit"
            :item="itemClient"
            :visible="createAndEditDialogIsVisible"
            @cancel-requested="onCancelRequested"
            @save-requested="onSaveRequested"
        />
        </div>
    </div>
</template>

<style scoped>
/* Using corporate design system - no custom styles needed */
</style>
