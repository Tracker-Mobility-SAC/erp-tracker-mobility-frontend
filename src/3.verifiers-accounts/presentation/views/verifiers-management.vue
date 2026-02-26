<script setup>
import { ref, onMounted } from 'vue';
import DataManager from '../../../shared-v2/presentation/components/data-manager.vue';
import VerifierCreateAndEdit from "../components/verifier-create-and-edit.vue";
import useVerifierStore from "../../application/verifier.store.js";
import { useVerifierCrud } from "../composables/use-verifier-crud.js";
import { useVerifierFilters } from "../composables/use-verifier-filters.js";
import { VerifierStatus } from "../../domain/constants/verifier.constants.js";
import {
  StatusTranslations,
  StatusFilterOptions,
  StatusClassMap,
  VerifierUILabels
} from "../constants/verifier-ui.constants.js";
import Toolbar from '../../../shared-v2/presentation/components/toolbar.vue';

// Store
const verifierStore = useVerifierStore();

// Composables
const {
  createAndEditDialogIsVisible,
  isEdit,
  submitted,
  currentItem,
  onCreateItem,
  onEditItem,
  onViewItem,
  onDeleteItem,
  onDeleteSelectedItems,
  onCancelRequested,
  onSaveRequested
} = useVerifierCrud();

const {
  globalFilterValue,
  selectedStatus,
  filteredVerifiers,
  clearFilters,
  updateGlobalFilter,
  updateStatusFilter,
  getCountByStatus
} = useVerifierFilters(() => verifierStore.verifiers);

// Local state
const loading = ref(false);
const selectedItems = ref([]);

// Configuración
const statusOptions = StatusFilterOptions;
const title = VerifierUILabels.title;

// Columnas de la tabla
const columns = [
  { field: 'name', header: 'Nombres', sortable: true, style: 'width: 160px;' },
  { field: 'lastName', header: 'Apellidos', sortable: true, style: 'width: 160px;' },
  { field: 'emailValue', header: 'Email', sortable: true, style: 'width: 200px;' },
  { field: 'phoneValue', header: 'Teléfono', sortable: true, style: 'width: 140px;' },
  { field: 'status', header: 'Estado', sortable: true, template: 'status', style: 'width: 120px;' },
];

// Métodos
function onGlobalFilterChange(value) {
  updateGlobalFilter(value);
}

function onClearFilters() {
  clearFilters();
}

function getStatusClass(status) {
  return StatusClassMap[status] || 'status-default';
}

function getStatusItemsArray(status) {
  switch (status) {
    case VerifierStatus.ACTIVE:
      return 'success';
    case VerifierStatus.INACTIVE:
      return 'danger';
    default:
      return 'info';
  }
}

async function getAllVerifiers() {
  loading.value = true;
  try {
    await verifierStore.fetchAll();
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  await getAllVerifiers();
});
</script>

<template>
  
  <div class="h-full w-full flex flex-column">

    <toolbar 
      :title="'Gestion de Verificadores'" 
      :description="'contacto, credenciales y asignación de órdenes'" 
      :show-back-button="false"
    />

    <div class="flex-1 p-4 overflow-auto">
      <div>
       
        <data-manager
          :items="verifierStore.verifiers"
          :filtered-items="filteredVerifiers"
          :global-filter-value="globalFilterValue"
          :columns="columns"
          :title="title"
          :loading="loading"
          :dynamic="true"
          :show-new="true"
          :show-delete="true"
          :show-export="true"
          :show-selection="true"
          :show-actions="true"
          :show-action-buttons="true"
          :show-view-action="true"
          :show-edit-action="true"
          :show-delete-action="true"
          :view-action-icon-only="true"
          :rows="5"
          :rows-per-page-options="[10, 15, 20, 25]"
          new-button-label="Nuevo Verificador"
          delete-button-label="Eliminar"
          export-button-label="Exportar"
          search-placeholder="Busca por nombre, apellido, email o teléfono..."
          @new-item-requested-manager="onCreateItem"
          @delete-selected-items-requested-manager="onDeleteSelectedItems"
          @delete-item-requested-manager="onDeleteItem"
          @view-item-requested-manager="onViewItem"
          @edit-item-requested-manager="onEditItem"
          @global-filter-change="onGlobalFilterChange"
          @clear-filters="onClearFilters"
        >
          <!-- Filtro personalizado para el estado -->
          <template #filters="{ clearFilters }">
            
            <!-- Filtros personalizados -->
            <pv-dropdown
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Filtrar por estado"
              class="w-full md:w-auto"
              @change="updateStatusFilter(selectedStatus)"
            />
            <pv-button
              label="Limpiar filtros"
              icon="pi pi-filter-slash"
              class="p-button-secondary p-button-outlined w-full md:w-auto"
              @click="onClearFilters"
            />
            
          </template>


          <template #status="slotProps">
            <pv-tag
              :value="StatusTranslations[slotProps.data.status]"
              :severity="getStatusItemsArray(slotProps.data.status)"
              :class="getStatusClass(slotProps.data.status)"
            />
            </template>
        </data-manager>
      </div>
    </div>

    <!-- Diálogo de Crear/Editar -->
    <verifier-create-and-edit
      v-model:visible="createAndEditDialogIsVisible"
      :verifier="currentItem"
      :is-edit="isEdit"
      @save="onSaveRequested"
      @cancel="onCancelRequested"
    />
  </div>
</template>
