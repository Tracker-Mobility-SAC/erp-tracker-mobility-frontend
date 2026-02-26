import { defineStore } from "pinia";
import { ref } from "vue";
import { useNotification } from "../../shared-v2/composables/use-notification.js";
import { ReportHttpRepository } from "../infrastructure/repositories/report-http.repository.js";
import { ReportApi } from "../infrastructure/report.api.js";
import { ReportErrorHandler } from "./error-handlers/report-error.handler.js";
import { FetchAllReportsUseCase } from "./use-cases/fetch-all-reports.use-case.js";
import { FetchPaginatedReportsUseCase } from "./use-cases/fetch-paginated-reports.use-case.js";
import { FetchReportByIdUseCase } from "./use-cases/fetch-report-by-id.use-case.js";
import { UpdateLandlordInterviewUseCase } from "./use-cases/update-landlord-interview.use-case.js";
import { UpdateReportUseCase } from "./use-cases/update-report.use-case.js";
import { DeleteReportUseCase } from "./use-cases/delete-report.use-case.js";

/**
 * Store de Pinia para funcionalidad de reportes de verificación.
 * Arquitectura: Presentation → Store → Use Cases → Repository → API
 */
const useVerificationReportStore = defineStore('verificationReport', () => {
    // State
    const verificationReports = ref([]);

    // Paginated-mode state
    const paginatedReports = ref([]);
    const totalElements    = ref(0);

    // Dependencies
    const notificationService = useNotification();
    const repository          = new ReportHttpRepository();
    const errorHandler        = new ReportErrorHandler(notificationService);
    const api                 = new ReportApi();

    // Use Cases
    const fetchAllUseCase               = new FetchAllReportsUseCase(repository, errorHandler);
    const fetchPaginatedUseCase         = new FetchPaginatedReportsUseCase(repository, errorHandler);
    const fetchByIdUseCase              = new FetchReportByIdUseCase(repository, errorHandler);
    const updateLandlordInterviewUseCase = new UpdateLandlordInterviewUseCase(repository, errorHandler);
    const updateReportUseCase           = new UpdateReportUseCase(repository, errorHandler);
    const deleteReportUseCase           = new DeleteReportUseCase(repository, errorHandler);

    /**
     * Obtiene todos los reportes resumidos.
     * Delega a Use Case para separar lógica de negocio del estado reactivo.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchAll() {
        verificationReports.value = [];
        const result = await fetchAllUseCase.execute();
        
        if (result.success) {
            verificationReports.value = result.data;
        }
        
        return result;
    }

    /**
     * Obtiene reportes paginados con filtros del servidor.
     * Actualiza paginatedReports y totalElements.
     * @param {Object} params - { page, size, finalResult?, isResultValid?, search? }
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchPaginated({ page = 0, size = 10, finalResult, isResultValid, search } = {}) {
        const result = await fetchPaginatedUseCase.execute({ page, size, finalResult, isResultValid, search });

        if (result.success) {
            paginatedReports.value = result.data.items;
            totalElements.value    = result.data.totalElements;
        }

        return result;
    }

    /**
     * Obtiene un reporte por su ID.
     * Delega a Use Case.
     * @param {string|number} id - El ID del reporte.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchById(id) {
        const result = await fetchByIdUseCase.execute(id);
        
        if (!result.success && result.code === 'NOT_FOUND') {
            notificationService.showWarning('Reporte no encontrado', 'No encontrado', 3000);
        }
        
        return result;
    }

    /**
     * Elimina un reporte por su ID.
     * Delega a Use Case.
     * @param {number} id - El ID del reporte a eliminar.
     * @returns {Promise<Object>} Resultado { success, message, code }
     */
    async function remove(id) {
        const result = await deleteReportUseCase.execute(id);
        
        if (result.success) {
            // Actualizar estado local
            verificationReports.value = verificationReports.value.filter(r => r.reportId !== id);
            notificationService.showSuccess('Reporte eliminado exitosamente', 'Éxito', 3000);
        }
        
        return result;
    }

    /**
     * Actualiza la entrevista con el arrendador.
     * Delega a Use Case.
     * @param {number} orderId - El ID de la orden.
     * @param {Object} data - Los datos de la entrevista.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function updateLandlordInterview(orderId, data) {
        return await updateLandlordInterviewUseCase.execute(orderId, data);
    }

    /**
     * Actualiza un reporte de verificación (resultado, resumen, observaciones, etc.).
     * Delega a Use Case.
     * @param {number} reportId - El ID del reporte.
     * @param {Object} data - Los datos actualizados del reporte.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function updateReport(reportId, data) {
        return await updateReportUseCase.execute(reportId, data);
    }

    /**
     * Obtiene la URL de descarga del reporte PDF.
     * Evita que las vistas accedan directamente a la infraestructura.
     * @param {number} reportId - El ID del reporte
     * @returns {Promise<Object>} { success, data: { reportUrl }, message, code }
     */
    async function getReportDownloadUrl(reportId) {
        try {
            const parsedReportId = parseInt(reportId, 10);
            if (!parsedReportId || isNaN(parsedReportId) || parsedReportId <= 0) {
                return { success: false, message: 'ID de reporte inválido', code: 'INVALID_PARAMS' };
            }
            const response = await api.getReportDownloadUrl(parsedReportId);
            return { success: true, data: response.data, message: 'URL obtenida correctamente', code: 'SUCCESS' };
        } catch (error) {
            return errorHandler.handle(error, 'obtener la URL de descarga del reporte');
        }
    }

    return {
        verificationReports,
        paginatedReports,
        totalElements,
        fetchAll,
        fetchPaginated,
        fetchById,
        remove,
        updateLandlordInterview,
        updateReport,
        getReportDownloadUrl
    };
});

export default useVerificationReportStore;

