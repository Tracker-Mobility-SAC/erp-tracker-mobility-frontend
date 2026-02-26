import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js';
import useVerifierStore from '../../application/verifier.store.js';
import { UpdateVerifierCommand } from '../../domain/commands/update-verifier.command.js';
import { useAuthenticationStore } from '../../../6.security/application/authentication.store.js';

/**
 * Composable para gestionar operaciones CRUD de verificadores.
 * Encapsula lógica de creación, edición, eliminación y navegación.
 * Presentation Layer - Composable.
 * 
 * @returns {Object} Propiedades y métodos de CRUD
 */
export function useVerifierCrud() {
  const router = useRouter();
  const verifierStore = useVerifierStore();
  const authStore = useAuthenticationStore();
  const { confirmDelete, confirmDeleteMultiple } = useConfirmDialog();

  // State para diálogos
  const createAndEditDialogIsVisible = ref(false);
  const isEdit = ref(false);
  const submitted = ref(false);
  const createItem = ref({});
  const item = ref(null);

  // Computed
  const currentItem = computed(() => {
    return isEdit.value ? item.value : createItem.value;
  });

  /**
   * Abre el diálogo para crear un nuevo verificador.
   */
  function onCreateItem() {
    createItem.value = {};
    isEdit.value = false;
    submitted.value = false;
    createAndEditDialogIsVisible.value = true;
  }

  /**
   * Abre el diálogo para editar un verificador existente.
   * @param {Object} verifier - Verificador a editar
   */
  function onEditItem(verifier) {
    item.value = { ...verifier };
    isEdit.value = true;
    submitted.value = false;
    createAndEditDialogIsVisible.value = true;
  }

  /**
   * Navega a la vista de detalle del verificador.
   * @param {Object} verifier - Verificador a visualizar
   */
  function onViewItem(verifier) {
    router.push({
      name: 'verifier-details',
      query: { id: verifier.id }
    });
  }

  /**
   * Maneja la solicitud de eliminación de un verificador.
   * La confirmación ya fue manejada por el data-manager.
   * @param {Object} verifier - Verificador a eliminar
   */
  async function onDeleteItem(verifier) {
    await verifierStore.remove(verifier.id, verifier.fullName);
  }

  /**
   * Maneja la solicitud de eliminación de múltiples verificadores.
   * La confirmación ya fue manejada por el data-manager.
   * @param {Array} selectedItemsArray - Array de verificadores seleccionados
   */
  async function onDeleteSelectedItems(selectedItemsArray) {
    await verifierStore.removeMultiple(selectedItemsArray);
  }

  /**
   * Cancela la operación de creación/edición.
   */
  function onCancelRequested() {
    createAndEditDialogIsVisible.value = false;
    submitted.value = false;
    isEdit.value = false;
  }

  /**
   * Guarda un verificador (crear o actualizar).
   * @param {Object} formData - Datos del formulario
   */
  async function onSaveRequested(formData) {
    submitted.value = true;

    if (isEdit.value) {
      // Actualizar verificador existente
      const updateCommand = new UpdateVerifierCommand({
        id: item.value.id,
        ...formData
      });
      await verifierStore.update(updateCommand);
    } else {
      // Crear nuevo verificador - delegar resolución de adminId al use case
      const userId = authStore.currentUserId;
      await verifierStore.create(formData, userId);
    }

    createAndEditDialogIsVisible.value = false;
    isEdit.value = false;
  }

  return {
    // State
    createAndEditDialogIsVisible,
    isEdit,
    submitted,
    createItem,
    item,
    currentItem,
    
    // Methods
    onCreateItem,
    onEditItem,
    onViewItem,
    onDeleteItem,
    onDeleteSelectedItems,
    onCancelRequested,
    onSaveRequested
  };
}
