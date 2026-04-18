import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { SalesTeamHttpRepository } from '../infrastructure/repositories/sales-team-http.repository.js';
import { SalesTeamErrorHandler } from './error-handlers/sales-team.error-handler.js';
import { FetchEmployeeOrdersUseCase } from './use-cases/fetch-employee-orders.use-case.js';
import { useNotification } from '../../shared-v2/composables/use-notification.js';
import { useAuthenticationStore } from '../../6.security/application/authentication.store.js';

const repository = new SalesTeamHttpRepository();

/**
 * Store de Sales Team - Gestión de equipo de ventas
 * Solo accesible para usuarios con rol GERENTE_VENTAS
 */
export const useSalesTeamStore = defineStore('salesTeam', () => {
    // Dependencies
    const { showSuccess, showError, showWarning } = useNotification();
    const errorHandler = new SalesTeamErrorHandler({ showSuccess, showError, showWarning });
    const fetchEmployeeOrdersUseCase = new FetchEmployeeOrdersUseCase(repository, errorHandler);
    // ===========================
    // STATE
    // ===========================
    const loading = ref(false);
    const error = ref(null);
    const currentEmployee = ref(null); // Empleado autenticado (gerente)
    const salesTeam = ref([]); // Lista de vendedores a cargo
    const selectedEmployee = ref(null); // Vendedor seleccionado
    const employeeOrders = ref([]); // Órdenes paginadas del vendedor seleccionado
    const totalOrderElements = ref(0); // Total de órdenes (server-side)
    const savedOrderPage = ref(0); // Última página visitada
    const savedOrderSize = ref(10); // Último tamaño de página
    const selectedOrder = ref(null); // Orden seleccionada para ver detalles

    // ===========================
    // GETTERS
    // ===========================
    const teamCount = computed(() => salesTeam.value.length);
    const hasTeam = computed(() => salesTeam.value.length > 0);
    const activeOrders = computed(() => 
        employeeOrders.value.filter(order => order.status === 'ACTIVE')
    );

    // ===========================
    // ACTIONS
    // ===========================

    /**
     * Obtiene el equipo de ventas completo.
     * Flujo: Obtiene empleado actual → Obtiene empleados de su marca
     */
    async function fetchSalesTeam() {
        loading.value = true;
        error.value = null;
        
        try {
            // 1. Obtener el userId del usuario autenticado
            const authStore = useAuthenticationStore();
            const userId = authStore.currentUserId;

            if (!userId) {
                throw new Error('Usuario no autenticado');
            }

            console.log('📋 [SalesTeamStore] Obteniendo empleado para userId:', userId);

            // 2. Obtener datos del empleado actual (gerente)
            currentEmployee.value = await repository.getEmployeeByUserId(userId);
            
            console.log('✅ [SalesTeamStore] Empleado obtenido:', {
                id: currentEmployee.value.id,
                name: currentEmployee.value.name,
                lastName: currentEmployee.value.lastName,
                brandId: currentEmployee.value.brandId,
                brandName: currentEmployee.value.brandName,
                applicantCompanyId: currentEmployee.value.applicantCompanyId,
                applicantCompanyName: currentEmployee.value.applicantCompanyName
            });

            // 3. Obtener el brandId del empleado actual
            const brandId = currentEmployee.value.brandId;

            if (!brandId) {
                throw new Error('El empleado no tiene una marca asignada');
            }

            console.log('🏷️ [SalesTeamStore] Obteniendo empleados de marca:', brandId);

            // 4. Obtener todos los empleados de la misma marca
            const allEmployees = await repository.getEmployeesByBrandId(brandId);
            
            // 5. Filtrar para mostrar solo empleados con rol VENDEDOR (excluir al gerente)
            salesTeam.value = allEmployees.filter(emp => 
                emp.id !== currentEmployee.value.id && 
                emp.roles.includes('VENDEDOR')
            );

            console.log('✅ [SalesTeamStore] Equipo de ventas obtenido:', salesTeam.value.length, 'vendedores');
            
            return {
                success: true,
                data: salesTeam.value
            };
        } catch (err) {
            error.value = err.message;
            console.error('❌ [SalesTeamStore] Error al obtener equipo de ventas:', err);
            return {
                success: false,
                error: err
            };
        } finally {
            loading.value = false;
        }
    }

    /**
     * Obtiene las órdenes paginadas de un vendedor por su email corporativo.
     * @param {Object} params
     * @param {string} params.corporateEmail - Email corporativo del vendedor
     * @param {number} [params.page=0] - Página (0-indexed)
     * @param {number} [params.size=10] - Elementos por página
     * @param {string} [params.status] - Filtro por estado
     * @param {string} [params.search] - Búsqueda
     */
    async function fetchEmployeeOrders({ corporateEmail, page = 0, size = 10, status, search } = {}) {
        loading.value = true;
        error.value = null;

        try {
            const result = await fetchEmployeeOrdersUseCase.execute({ corporateEmail, page, size, status, search });

            if (result.success) {
                employeeOrders.value     = result.data.items;
                totalOrderElements.value = result.data.totalElements;
                savedOrderPage.value     = page;
                savedOrderSize.value     = size;
            } else {
                error.value = result.message;
            }

            return result;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Selecciona un vendedor para ver sus órdenes
     * @param {Object} employee - Datos del vendedor
     */
    function selectEmployee(employee) {
        selectedEmployee.value = employee;
        console.log('👤 [SalesTeamStore] Employee selected:', employee);
    }

    /**
     * Limpia el estado del store
     */
    function clearState() {
        salesTeam.value = [];
        selectedEmployee.value = null;
        employeeOrders.value = [];
        totalOrderElements.value = 0;
        savedOrderPage.value = 0;
        savedOrderSize.value = 10;
        selectedOrder.value = null;
        error.value = null;
    }

    return {
        // State
        loading,
        error,
        currentEmployee,
        salesTeam,
        selectedEmployee,
        employeeOrders,
        totalOrderElements,
        savedOrderPage,
        savedOrderSize,
        selectedOrder,
        
        // Getters
        teamCount,
        hasTeam,
        activeOrders,
        
        // Actions
        fetchSalesTeam,
        fetchEmployeeOrders,
        selectEmployee,
        clearState
    };
});
