/**
 * Customer Store - Application Layer
 * Pinia store con toda la lógica de negocio del módulo de clientes
 * Usa Composition API para poder acceder a composables de Vue
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CustomerHttpRepository } from '../infrastructure/repositories/customer-http.repository.js';
import { CreateCustomerCommand } from '../domain/commands/create-customer.command.js';
import { UpdateCustomerCommand } from '../domain/commands/update-customer.command.js';
import { CustomerErrorHandler } from './error-handlers/customer-error.handler.js';
import { useNotification } from '../../shared/composables/use-notification.js';

/**
 * Store de Pinia para funcionalidad de clientes.
 * Arquitectura: Presentation → Store → Repository → API
 * El Store contiene la lógica de negocio y gestiona estado reactivo.
 */
export const useCustomerStore = defineStore('customer', () => {
    // State
    const customers = ref([]);
    const employees = ref([]);
    const currentCustomer = ref(null);
    const currentEmployee = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Dependencies
    const repository = new CustomerHttpRepository();
    const { showSuccess, showError, showWarning } = useNotification();
    const errorHandler = new CustomerErrorHandler({ showSuccess, showError, showWarning });

    // Getters
    /**
     * Clientes activos
     */
    const activeCustomers = computed(() => customers.value.filter(c => c.isActive()));

    /**
     * Clientes inactivos
     */
    const inactiveCustomers = computed(() => customers.value.filter(c => !c.isActive()));

    /**
     * Total de clientes
     */
    const totalCustomers = computed(() => customers.value.length);

    /**
     * Obtiene un cliente por ID
     */
    const getCustomerById = computed(() => (id) => customers.value.find(c => c.id === id));

    /**
     * Colaboradores activos del cliente actual
     */
    const activeEmployees = computed(() => employees.value.filter(e => e.isActive()));

    // Actions

    /**
     * Obtiene todos los clientes
     */
    async function fetchAll() {
        // Limpiar datos SÍNCRONAMENTE antes de cargar
        customers.value = [];
        
        loading.value = true;
        error.value = null;

        try {
            customers.value = await repository.findAll();
            return {
                success: true,
                data: customers.value,
                message: `${customers.value.length} cliente${customers.value.length !== 1 ? 's' : ''} cargado${customers.value.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'fetchAll');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Obtiene los clientes de un administrador específico
     */
    async function fetchByAdminId(adminId) {
        loading.value = true;
        error.value = null;

        try {
            if (!adminId) {
                return {
                    success: false,
                    message: 'ID de administrador requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            customers.value = await repository.findByAdminId(adminId);
            return {
                success: true,
                data: customers.value,
                message: `${customers.value.length} cliente${customers.value.length !== 1 ? 's' : ''} cargado${customers.value.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'fetchByAdminId');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Obtiene un cliente por su ID
     */
    async function fetchById(id) {
        // Limpiar datos anteriores primero
        currentCustomer.value = null;
        
        loading.value = true;
        error.value = null;

        try {
            const customerId = parseInt(id);

            if (!customerId) {
                return {
                    success: false,
                    message: 'ID de cliente requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            currentCustomer.value = await repository.findById(customerId);

            if (!currentCustomer.value) {
                showWarning('Cliente no encontrado', 'No encontrado', 3000);
                return {
                    success: false,
                    message: 'Cliente no encontrado',
                    code: 'NOT_FOUND'
                };
            }

            return {
                success: true,
                data: currentCustomer.value,
                message: 'Cliente cargado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'fetchById');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Crea un nuevo cliente
     */
    async function create(data) {
        loading.value = true;
        error.value = null;

        try {
            const command = new CreateCustomerCommand(data);
            const newCustomer = await repository.create(command);
            
            customers.value.push(newCustomer);

            return {
                success: true,
                data: newCustomer,
                message: 'Cliente creado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'create');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Actualiza un cliente existente
     */
    async function update(id, data) {
        loading.value = true;
        error.value = null;

        try {
            const command = new UpdateCustomerCommand({ id, ...data });
            const updatedCustomer = await repository.update(id, command);

            // Actualizar el cliente en la lista
            const index = customers.value.findIndex(c => c.id === id);
            if (index !== -1) {
                customers.value[index] = updatedCustomer;
            }

            // Actualizar currentCustomer si es el mismo
            if (currentCustomer.value?.id === id) {
                currentCustomer.value = updatedCustomer;
            }

            return {
                success: true,
                data: updatedCustomer,
                message: 'Cliente actualizado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'update');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Elimina un cliente
     */
    async function remove(id) {
        loading.value = true;
        error.value = null;

        try {
            await repository.delete(id);

            // Eliminar de la lista
            customers.value = customers.value.filter(c => c.id !== id);

            // Limpiar currentCustomer si es el mismo
            if (currentCustomer.value?.id === id) {
                currentCustomer.value = null;
            }

            return {
                success: true,
                message: 'Cliente eliminado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'delete');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Obtiene los colaboradores de un cliente
     */
    async function fetchEmployees(customerId) {
        // Limpiar datos anteriores primero
        employees.value = [];
        
        loading.value = true;
        error.value = null;

        try {
            if (!customerId) {
                return {
                    success: false,
                    message: 'ID de cliente requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            employees.value = await repository.findEmployeesByCustomerId(customerId);

            return {
                success: true,
                data: employees.value,
                message: `${employees.value.length} colaborador${employees.value.length !== 1 ? 'es' : ''} cargado${employees.value.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'fetchEmployees');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Crea un nuevo colaborador para un cliente
     */
    async function createEmployee(customerId, employeeData) {
        loading.value = true;
        error.value = null;

        try {
            if (!customerId) {
                return {
                    success: false,
                    message: 'ID de cliente requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            // � Transformar roles (array) al primer elemento como role (string) si es necesario
            let roleValue = employeeData.role;
            if (!roleValue && employeeData.roles && Array.isArray(employeeData.roles) && employeeData.roles.length > 0) {
                roleValue = employeeData.roles[0];
                console.log('🔄 [Store] Transformación roles → role:', {
                    rolesOriginal: employeeData.roles,
                    roleTransformado: roleValue
                });
            }

            // 🔍 Validar campos requeridos por el backend
            const requiredFields = ['email', 'password', 'name', 'lastName', 'phoneNumber', 'applicantCompanyId', 'brandId'];
            const missingFields = requiredFields.filter(field => !employeeData[field]);
            
            if (!roleValue) {
                missingFields.push('role');
            }
            
            if (missingFields.length > 0) {
                console.error('❌ [Store] Campos requeridos faltantes:', missingFields);
                return {
                    success: false,
                    message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
                    code: 'INVALID_PARAMS'
                };
            }

            // ✅ Limpiar payload: solo campos esperados por el backend con tipos correctos
            const cleanPayload = {
                email: employeeData.email,
                password: employeeData.password,
                name: employeeData.name,
                lastName: employeeData.lastName,
                phoneNumber: employeeData.phoneNumber,
                applicantCompanyId: typeof employeeData.applicantCompanyId === 'number' 
                    ? employeeData.applicantCompanyId 
                    : parseInt(employeeData.applicantCompanyId), // ✅ Asegurar que sea número
                brandId: typeof employeeData.brandId === 'number' 
                    ? employeeData.brandId 
                    : parseInt(employeeData.brandId), // ✅ Asegurar que sea número
                role: roleValue // String singular (transformado desde roles si era necesario)
            };

            console.log('🚀 [Store] Enviando payload limpio:', JSON.stringify(cleanPayload, null, 2));
            console.log('🔍 [Store] Validación de tipos:', {
                applicantCompanyId: typeof cleanPayload.applicantCompanyId,
                brandId: typeof cleanPayload.brandId,
                applicantCompanyIdValue: cleanPayload.applicantCompanyId,
                brandIdValue: cleanPayload.brandId
            });

            const newEmployee = await repository.createEmployee(customerId, cleanPayload);
            
            console.log('📥 [Store] Respuesta del backend:', newEmployee);
            
            // 🔍 Si el backend no devuelve brandName, buscarlo en las marcas del cliente
            if (newEmployee.brandId && !newEmployee.brandName && currentCustomer.value?.brands) {
                const brand = currentCustomer.value.brands.find(b => b.id === newEmployee.brandId);
                if (brand) {
                    console.log('✅ [Store] Asignando brandName desde cliente:', brand.name);
                    newEmployee.brandName = brand.name;
                } else {
                    console.warn('⚠️ [Store] No se encontró marca con id:', newEmployee.brandId);
                }
            }
            
            employees.value.push(newEmployee);

            return {
                success: true,
                data: newEmployee,
                message: 'Colaborador creado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'createEmployee');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Actualiza un colaborador existente
     * Implementa actualización optimista con rollback en caso de error
     */
    async function updateEmployee(customerId, employeeId, employeeData) {
        loading.value = true;
        error.value = null;

        try {
            if (!customerId || !employeeId) {
                return {
                    success: false,
                    message: 'ID de cliente y colaborador requeridos',
                    code: 'INVALID_PARAMS'
                };
            }

            // 🔍 Guardar estado anterior para rollback
            const index = employees.value.findIndex(e => e.id === employeeId);
            const previousEmployee = index !== -1 ? { ...employees.value[index] } : null;
            const previousCurrentEmployee = currentEmployee.value?.id === employeeId 
                ? { ...currentEmployee.value } 
                : null;

            console.log('💾 [Store] Estado anterior guardado para rollback');

            try {
                // � Transformar roles (array) al primer elemento como role (string) si es necesario
                let cleanEmployeeData = { ...employeeData };
                if (cleanEmployeeData.roles && Array.isArray(cleanEmployeeData.roles) && cleanEmployeeData.roles.length > 0) {
                    cleanEmployeeData.role = cleanEmployeeData.roles[0];
                    delete cleanEmployeeData.roles;
                    console.log('🔄 [Store] Transformación PATCH roles → role:', {
                        rolesOriginal: employeeData.roles,
                        roleTransformado: cleanEmployeeData.role
                    });
                }
                
                // 🚀 Actualización en el servidor
                const updatedEmployee = await repository.updateEmployee(customerId, employeeId, cleanEmployeeData);

                // ✅ Actualización exitosa: actualizar en memoria
                if (index !== -1) {
                    employees.value[index] = updatedEmployee;
                    console.log('✅ [Store] Colaborador actualizado en memoria (employees array)');
                }

                if (currentEmployee.value?.id === employeeId) {
                    currentEmployee.value = updatedEmployee;
                    console.log('✅ [Store] currentEmployee actualizado en memoria');
                }

                return {
                    success: true,
                    data: updatedEmployee,
                    message: 'Colaborador actualizado exitosamente',
                    code: 'SUCCESS'
                };
            } catch (updateError) {
                // ❌ Error en la actualización: ROLLBACK
                console.error('❌ [Store] Error al actualizar colaborador, haciendo rollback');
                
                if (previousEmployee && index !== -1) {
                    employees.value[index] = previousEmployee;
                    console.log('🔄 [Store] Rollback aplicado en employees array');
                }

                if (previousCurrentEmployee && currentEmployee.value?.id === employeeId) {
                    currentEmployee.value = previousCurrentEmployee;
                    console.log('🔄 [Store] Rollback aplicado en currentEmployee');
                }

                throw updateError; // Re-lanzar el error para el catch externo
            }
        } catch (err) {
            error.value = errorHandler.handle(err, 'updateEmployee');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Elimina un colaborador
     */
    async function deleteEmployee(customerId, employeeId) {
        loading.value = true;
        error.value = null;

        try {
            if (!customerId || !employeeId) {
                return {
                    success: false,
                    message: 'ID de cliente y colaborador requeridos',
                    code: 'INVALID_PARAMS'
                };
            }

            await repository.deleteEmployee(customerId, employeeId);

            // Eliminar de la lista
            employees.value = employees.value.filter(e => e.id !== employeeId);

            // Limpiar currentEmployee si es el mismo
            if (currentEmployee.value?.id === employeeId) {
                currentEmployee.value = null;
            }

            return {
                success: true,
                message: 'Colaborador eliminado exitosamente',
                code: 'SUCCESS'
            };
        } catch (err) {
            error.value = errorHandler.handle(err, 'deleteEmployee');
            return error.value;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Limpia el estado del store
     */
    function clearState() {
        customers.value = [];
        employees.value = [];
        currentCustomer.value = null;
        currentEmployee.value = null;
        loading.value = false;
        error.value = null;
    }

    // Return
    return {
        // State
        customers,
        employees,
        currentCustomer,
        currentEmployee,
        loading,
        error,
        // Getters
        activeCustomers,
        inactiveCustomers,
        totalCustomers,
        getCustomerById,
        activeEmployees,
        // Actions
        fetchAll,
        fetchByAdminId,
        fetchById,
        create,
        update,
        remove,
        fetchEmployees,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        clearState
    };
});

