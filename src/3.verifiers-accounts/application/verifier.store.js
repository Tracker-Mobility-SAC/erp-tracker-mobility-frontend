import { defineStore } from "pinia";
import { ref } from "vue";
import { VerifierHttpRepository } from "../infrastructure/repositories/verifier-http.repository.js";
import { AdminHttpRepository } from "../infrastructure/repositories/admin-http.repository.js";
import { CreateVerifierCommand } from "../domain/commands/create-verifier.command.js";
import { DefaultRole, DefaultStatus } from "../domain/constants/verifier.constants.js";
import { VerifierErrorHandler } from "./error-handlers/verifier-error.handler.js";
import { useNotification } from "../../shared-v2/composables/use-notification.js";
import { useAuthenticationStore } from "../../6.security/application/authentication.store.js";

/**
 * Store de Pinia para funcionalidad de verificadores.
 * Arquitectura simplificada: Presentation → Store → Repository → API
 * El Store contiene la lógica de negocio y gestiona estado reactivo.
 */
const useVerifierStore = defineStore('verifier', () => {
    // State
    const verifiers = ref([]);

    // Dependencies
    const verifierRepository = new VerifierHttpRepository();
    const adminRepository = new AdminHttpRepository();
    const { showSuccess, showError, showWarning } = useNotification();
    const authStore = useAuthenticationStore();
    const errorHandler = new VerifierErrorHandler({ showSuccess, showError, showWarning });

    // Actions
    /**
     * Obtiene todos los verificadores.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchAll() {
        // Limpiar datos SÍNCRONAMENTE antes de cargar
        verifiers.value = [];
        
        try {
            const data = await verifierRepository.findAll();
            verifiers.value = data;

            return {
                success: true,
                data,
                message: `${data.length} verificador${data.length !== 1 ? 'es' : ''} cargado${data.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'cargar los verificadores');
        }
    }

    /**
     * Obtiene los verificadores de un administrador específico.
     * @param {number} adminId - El ID del administrador.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchByAdminId(adminId) {
        try {
            if (!adminId) {
                return {
                    success: false,
                    message: 'ID de administrador requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            const data = await verifierRepository.findByAdminId(adminId);
            verifiers.value = data;

            return {
                success: true,
                data,
                message: `${data.length} verificador${data.length !== 1 ? 'es' : ''} cargado${data.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'cargar los verificadores del administrador');
        }
    }

    /**
     * Obtiene un verificador por su ID.
     * @param {string|number} id - El ID del verificador.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchById(id) {
        try {
            const verifierId = parseInt(id);
            
            if (!verifierId) {
                return {
                    success: false,
                    message: 'ID de verificador requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            const data = await verifierRepository.findById(verifierId);

            if (!data) {
                showWarning('Verificador no encontrado', 'No encontrado', 3000);
                return {
                    success: false,
                    message: 'Verificador no encontrado',
                    code: 'NOT_FOUND'
                };
            }

            return {
                success: true,
                data,
                message: 'Verificador cargado',
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'cargar el verificador');
        }
    }

    /**
     * Crea un nuevo verificador.
     * @param {Object} formData - Datos del formulario
     * @param {number} userId - ID del usuario (para resolver adminId)
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function create(formData, userId) {
        try {
            // 1. Validar permisos
            if (!authStore.currentUserId) {
                return {
                    success: false,
                    message: 'No tiene permisos para crear verificadores',
                    code: 'UNAUTHORIZED'
                };
            }

            // 2. Resolver adminId desde userId
            let adminId = formData.adminId;
            
            if (!adminId && userId) {
                const admin = await adminRepository.findByUserId(userId);
                
                if (!admin || !admin.id) {
                    showError('No se encontró administrador para el usuario', 'Error', 4000);
                    return {
                        success: false,
                        message: 'No se encontró administrador',
                        code: 'ADMIN_NOT_FOUND'
                    };
                }
                
                adminId = admin.id;
            }

            if (!adminId) {
                return {
                    success: false,
                    message: 'adminId o userId es requerido',
                    code: 'INVALID_PARAMS'
                };
            }

            // 3. Construir command con adminId y defaults
            const command = new CreateVerifierCommand({
                ...formData,
                adminId,
                role: formData.role || DefaultRole,
                status: formData.status || DefaultStatus
            });

            // 4. Ejecutar persistencia
            const verifier = await verifierRepository.save(command);

            // 5. Actualizar estado reactivo
            verifiers.value.push(verifier);

            // 6. Notificar éxito
            showSuccess(
                `El verificador ${verifier.fullName} ha sido creado exitosamente`,
                'Verificador creado',
                4000
            );

            // 7. Retornar resultado
            return {
                success: true,
                data: verifier,
                message: 'Verificador creado exitosamente',
                code: 'CREATED'
            };
        } catch (error) {
            return errorHandler.handle(error, 'crear el verificador');
        }
    }

    /**
     * Actualiza un verificador existente.
     * @param {UpdateVerifierCommand} command - El comando para actualizar el verificador.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function update(command) {
        try {
            // 1. Validar que el verificador existe
            const existingVerifier = await verifierRepository.findById(command.id);
            
            if (!existingVerifier) {
                showWarning(
                    'El verificador que intenta actualizar no existe',
                    'Verificador no encontrado',
                    4000
                );
                return {
                    success: false,
                    message: 'Verificador no encontrado',
                    code: 'NOT_FOUND'
                };
            }

            // 2. Ejecutar actualización
            const updatedVerifier = await verifierRepository.update(command);

            // 3. Actualizar estado reactivo
            const index = verifiers.value.findIndex(v => v.id === updatedVerifier.id);
            if (index !== -1) {
                verifiers.value[index] = updatedVerifier;
            }

            // 4. Notificar éxito
            showSuccess(
                `El verificador ${updatedVerifier.fullName} ha sido actualizado exitosamente`,
                'Verificador actualizado',
                4000
            );

            // 5. Retornar resultado
            return {
                success: true,
                data: updatedVerifier,
                message: 'Verificador actualizado exitosamente',
                code: 'UPDATED'
            };
        } catch (error) {
            return errorHandler.handle(error, 'actualizar el verificador');
        }
    }

    /**
     * Elimina un verificador.
     * @param {number} verifierId - El ID del verificador a eliminar.
     * @param {string} verifierName - Nombre del verificador (opcional, para notificación)
     * @returns {Promise<Object>} Resultado { success, message, code }
     */
    async function remove(verifierId, verifierName = '') {
        try {
            // 1. Validar que el verificador existe
            const existingVerifier = await verifierRepository.findById(verifierId);
            
            if (!existingVerifier) {
                showWarning(
                    'El verificador que intenta eliminar no existe',
                    'Verificador no encontrado',
                    4000
                );
                return {
                    success: false,
                    message: 'Verificador no encontrado',
                    code: 'NOT_FOUND'
                };
            }

            // 2. Ejecutar eliminación
            await verifierRepository.delete(verifierId);

            // 3. Actualizar estado reactivo
            verifiers.value = verifiers.value.filter(v => v.id !== verifierId);

            // 4. Notificar éxito
            const displayName = verifierName || existingVerifier.fullName;
            showSuccess(
                `El verificador ${displayName} ha sido eliminado exitosamente`,
                'Verificador eliminado',
                4000
            );

            // 5. Retornar resultado
            return {
                success: true,
                message: 'Verificador eliminado exitosamente',
                code: 'DELETED'
            };
        } catch (error) {
            return errorHandler.handle(error, 'eliminar el verificador');
        }
    }

    /**
     * Elimina múltiples verificadores.
     * @param {Array<Object>} selectedVerifiers - Array de verificadores a eliminar
     * @returns {Promise<Object>} Resultado con conteo de éxitos/fallos
     */
    async function removeMultiple(selectedVerifiers) {
        const verifiersToDelete = selectedVerifiers.map(v => ({
            id: v.id,
            name: v.fullName || `${v.name} ${v.lastName}`
        }));
        
        const results = [];
        
        for (const verifier of verifiersToDelete) {
            const result = await remove(verifier.id, verifier.name);
            results.push({ verifier, result });
        }

        const successCount = results.filter(r => r.result.success).length;
        const failureCount = results.filter(r => !r.result.success).length;

        if (successCount > 0 && failureCount === 0) {
            showSuccess(
                `${successCount} verificador${successCount !== 1 ? 'es' : ''} eliminado${successCount !== 1 ? 's' : ''} exitosamente`,
                'Operación completada',
                4000
            );
        } else if (failureCount > 0) {
            showWarning(
                `${failureCount} de ${verifiersToDelete.length} operaciones fallaron`,
                'Operación parcial',
                4000
            );
        }

        return {
            success: failureCount === 0,
            successCount,
            failureCount,
            results,
            message: `${successCount} exitoso${successCount !== 1 ? 's' : ''}, ${failureCount} fallido${failureCount !== 1 ? 's' : ''}`,
            code: failureCount === 0 ? 'ALL_DELETED' : 'PARTIAL_DELETE'
        };
    }

    /**
     * Obtiene las órdenes asignadas a un verificador.
     * @param {number} verifierId - El ID del verificador.
     * @returns {Promise<Array>} Las órdenes asignadas
     */
    async function fetchAssignedOrders(verifierId) {
        try {
            console.log('[VerifierStore] Fetching assigned orders for verifier:', verifierId);
            const orders = await verifierRepository.findAssignedOrders(verifierId);
            console.log('[VerifierStore] Assigned orders received:', orders);
            return orders;
        } catch (err) {
            console.error('[VerifierStore] Error fetching assigned orders:', err);
            console.error('[VerifierStore] Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            
            const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
            showError(`No se pudieron cargar las órdenes: ${errorMessage}`, 'Error del Servidor', 5000);
            return [];
        }
    }

    return {
        // State
        verifiers,
        // Actions
        fetchAll,
        fetchByAdminId,
        fetchById,
        create,
        update,
        remove,
        removeMultiple,
        fetchAssignedOrders
    };
});

export default useVerifierStore;
