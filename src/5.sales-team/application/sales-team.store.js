import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { SalesTeamHttpRepository } from '../infrastructure/repositories/sales-team-http.repository.js';
import { useAuthenticationStore } from '../../6.security/application/authentication.store.js';

const repository = new SalesTeamHttpRepository();

/**
 * Store de Sales Team - Gestión de equipo de ventas
 * Solo accesible para usuarios con rol GERENTE_VENTAS
 */
export const useSalesTeamStore = defineStore('salesTeam', () => {
    // ===========================
    // STATE
    // ===========================
    const loading = ref(false);
    const error = ref(null);
    const currentEmployee = ref(null); // Empleado autenticado (gerente)
    const salesTeam = ref([]); // Lista de vendedores a cargo
    const selectedEmployee = ref(null); // Vendedor seleccionado
    const employeeOrders = ref([]); // Órdenes del vendedor seleccionado
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
     * Obtiene las órdenes de un vendedor específico
     * @param {number} employeeId - ID del vendedor
     */
    async function fetchEmployeeOrders(employeeId) {
        loading.value = true;
        error.value = null;
        
        try {
            // TODO: Implementar llamada al endpoint
            console.log(`📦 [SalesTeamStore] Fetching orders for employee ${employeeId}...`);
            
            // Placeholder
            employeeOrders.value = [];
            
            return {
                success: true,
                data: employeeOrders.value
            };
        } catch (err) {
            error.value = err;
            console.error('❌ [SalesTeamStore] Error fetching employee orders:', err);
            return {
                success: false,
                error: err
            };
        } finally {
            loading.value = false;
        }
    }

    /**
     * Obtiene los detalles de una orden específica
     * @param {number} orderId - ID de la orden
     */
    async function fetchOrderDetail(orderId) {
        loading.value = true;
        error.value = null;
        
        try {
            // TODO: Implementar llamada al endpoint
            console.log(`🔍 [SalesTeamStore] Fetching order detail ${orderId}...`);
            
            // Placeholder
            selectedOrder.value = null;
            
            return {
                success: true,
                data: selectedOrder.value
            };
        } catch (err) {
            error.value = err;
            console.error('❌ [SalesTeamStore] Error fetching order detail:', err);
            return {
                success: false,
                error: err
            };
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
        selectedOrder.value = null;
        error.value = null;
    }

    return {
        // State
        loading,
        error,
        currentEmployee, // ✅ Exportar el empleado actual (gerente)
        salesTeam,
        selectedEmployee,
        employeeOrders,
        selectedOrder,
        
        // Getters
        teamCount,
        hasTeam,
        activeOrders,
        
        // Actions
        fetchSalesTeam,
        fetchEmployeeOrders,
        fetchOrderDetail,
        selectEmployee,
        clearState
    };
});
