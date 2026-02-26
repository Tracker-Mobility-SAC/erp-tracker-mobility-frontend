import { defineStore } from "pinia";
import { ref } from "vue";
import { OrderHttpRepository } from "../infrastructure/repositories/order-http.repository.js";
import { AssignVerifierCommand } from "../domain/commands/assign-verifier.command.js";
import { CreateObservationCommand } from "../domain/commands/create-observation.command.js";
import { VerificationOrderErrorHandler } from "./error-handlers/verification-order-error.handler.js";
import { useNotification } from "../../shared-v2/composables/use-notification.js";

/**
 * Store de Pinia para funcionalidad de órdenes de verificación.
 * Arquitectura: Presentation → Store → Repository → API
 * El Store contiene la lógica de negocio y gestiona estado reactivo.
 * Incluye operaciones: fetchAllSummaries, fetchById, assignVerifier, createObservation
 */
const useVerificationOrderStore = defineStore('verificationOrder', () => {
    // State
    const orderSummaries = ref([]);

    // Dependencies
    const orderRepository = new OrderHttpRepository();
    const { showSuccess, showError, showWarning } = useNotification();
    const errorHandler = new VerificationOrderErrorHandler({ showSuccess, showError, showWarning });

    /**
     * Obtiene todas las órdenes en formato resumido
     * @returns {Promise<{success: boolean, data?, message?, code}>}
     */
    async function fetchAllSummaries() {
        // Limpiar datos SÍNCRONAMENTE antes de cargar
        orderSummaries.value = [];
        
        try {
            const data = await orderRepository.findAllSummaries();
            orderSummaries.value = data;
            return {
                success: true,
                data,
                message: `${data.length} orden${data.length !== 1 ? 'es' : ''} cargada${data.length !== 1 ? 's' : ''}`,
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'cargar las órdenes');
        }
    }

    /**
     * Obtiene una orden completa por ID
     * @param {string|number} orderId - El ID de la orden
     * @returns {Promise<{success: boolean, data?, message?, code}>}
     */
    async function fetchById(orderId) {
        try {
            if (!orderId) {
                throw new Error('El ID de la orden es requerido');
            }
            const data = await orderRepository.findById(orderId);
            return {
                success: true,
                data,
                message: 'Orden cargada correctamente',
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'cargar la orden');
        }
    }

    /**
     * Asigna un verificador a una orden
     * @param {number} orderId - El ID de la orden
     * @param {Object} assignmentData - Datos de asignación {verifierId, visitDate, visitTime}
     * @returns {Promise<{success: boolean, message?, code}>}
     */
    async function assignVerifier(orderId, assignmentData) {
        try {
            // Validación básica previa a la creación del comando
            if (!orderId) {
                throw new Error('El ID de la orden es requerido');
            }
            if (!assignmentData.verifierId) {
                throw new Error('El verificador es requerido');
            }

            // Crear el comando con validación automática
            const command = new AssignVerifierCommand({
                orderId,
                verifierId: assignmentData.verifierId,
                visitDate: assignmentData.visitDate,
                visitTime: assignmentData.visitTime
            });

            await orderRepository.assignVerifier(command);
            
            showSuccess(
                'El verificador ha sido asignado correctamente a la orden de servicio.',
                'Verificador asignado'
            );
            return {
                success: true,
                message: 'Verificador asignado correctamente',
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'asignar el verificador');
        }
    }

    /**
     * Crea una observación para una orden
     * @param {number} orderId - El ID de la orden
     * @param {Object} observationData - Datos de observación {observationType, description}
     * @returns {Promise<{success: boolean, data?, message?, code}>}
     */
    async function createObservation(orderId, observationData) {
        try {
            // Validación básica previa a la creación del comando
            if (!orderId) {
                throw new Error('El ID de la orden es requerido');
            }

            // Crear el comando con validación automática
            const command = new CreateObservationCommand({
                orderId,
                observationType: observationData.observationType,
                description: observationData.description
            });

            const data = await orderRepository.createObservation(command);
            
            showSuccess(
                'La observación ha sido registrada correctamente.',
                'Observación agregada'
            );
            return {
                success: true,
                data,
                message: 'Observación creada correctamente',
                code: 'SUCCESS'
            };
        } catch (error) {
            return errorHandler.handle(error, 'crear la observación');
        }
    }

    return {
        // State
        orderSummaries,
        
        // Actions
        fetchAllSummaries,
        fetchById,
        assignVerifier,
        createObservation
    };
});

export default useVerificationOrderStore;
