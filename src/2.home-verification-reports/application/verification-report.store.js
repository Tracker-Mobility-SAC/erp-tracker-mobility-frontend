import { defineStore } from "pinia";
import { ref } from "vue";
import { useNotification } from "../../shared-v2/composables/use-notification.js";
import { getContainer } from "../infrastructure/di-container.js";
import { SERVICE_KEYS, registerVerificationReportDependencies } from "../infrastructure/module.config.js";

/**
 * Store de Pinia para funcionalidad de reportes de verificación.
 * Refactorizado para usar Dependency Injection Container.
 * Arquitectura: Presentation → Store → Use Cases → Repository → API
 * 
 * LIMPIO: Ya no instancia dependencias directamente, las resuelve desde el container.
 */
const useVerificationReportStore = defineStore('verificationReport', () => {
    // State
    const verificationReports = ref([]);

    // Obtener notificaciones de Vue
    const notificationService = useNotification();

    // Inicializar DI Container si no está configurado
    const container = getContainer();
    if (!container.has(SERVICE_KEYS.REPORT_REPOSITORY)) {
        registerVerificationReportDependencies({ notificationService });
    }

    // Resolver Use Cases desde el container
    const getFetchAllReportsUseCase = () => container.resolve(SERVICE_KEYS.FETCH_ALL_REPORTS_USE_CASE);
    const getFetchReportByIdUseCase = () => container.resolve(SERVICE_KEYS.FETCH_REPORT_BY_ID_USE_CASE);
    const getUpdateLandlordInterviewUseCase = () => container.resolve(SERVICE_KEYS.UPDATE_LANDLORD_INTERVIEW_USE_CASE);
    const getUpdateReportUseCase = () => container.resolve(SERVICE_KEYS.UPDATE_REPORT_USE_CASE);
    const getDeleteReportUseCase = () => container.resolve(SERVICE_KEYS.DELETE_REPORT_USE_CASE);

    /**
     * Obtiene todos los reportes resumidos.
     * Delega a Use Case para separar lógica de negocio del estado reactivo.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function fetchAll() {
        // Limpiar datos SÍNCRONAMENTE antes de cargar
        verificationReports.value = [];
        
        const useCase = getFetchAllReportsUseCase();
        const result = await useCase.execute();
        
        if (result.success) {
            verificationReports.value = result.data;
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
        const useCase = getFetchReportByIdUseCase();
        const result = await useCase.execute(id);
        
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
        const useCase = getDeleteReportUseCase();
        const result = await useCase.execute(id);
        
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
        const useCase = getUpdateLandlordInterviewUseCase();
        return await useCase.execute(orderId, data);
    }

    /**
     * Actualiza un reporte de verificación (resultado, resumen, observaciones, etc.).
     * Delega a Use Case.
     * @param {number} reportId - El ID del reporte.
     * @param {Object} data - Los datos actualizados del reporte.
     * @returns {Promise<Object>} Resultado { success, data?, message, code }
     */
    async function updateReport(reportId, data) {
        const useCase = getUpdateReportUseCase();
        const result = await useCase.execute(reportId, data);
        
        // NOTA: No mostramos notificación aquí porque el componente ya maneja el feedback al usuario
        // Esto evita notificaciones duplicadas
        
        return result;
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
                return {
                    success: false,
                    message: 'ID de reporte inválido',
                    code: 'INVALID_PARAMS'
                };
            }

            // Resolver el repositorio desde el container
            const repository = container.resolve(SERVICE_KEYS.REPORT_REPOSITORY);
            
            // Acceder a la API a través del repositorio
            // (Idealmente esto debería ser un método del repositorio, pero por ahora
            // accedemos directamente para mantener compatibilidad)
            const ReportApi = (await import('../infrastructure/report.api.js')).ReportApi;
            const api = new ReportApi();
            const response = await api.getReportDownloadUrl(parsedReportId);

            return {
                success: true,
                data: response.data,
                message: 'URL obtenida correctamente',
                code: 'SUCCESS'
            };
        } catch (error) {
            const errorHandler = container.resolve(SERVICE_KEYS.ERROR_HANDLER);
            return errorHandler.handle(error, 'obtener la URL de descarga del reporte');
        }
    }

    return {
        verificationReports,
        fetchAll,
        fetchById,
        remove,
        updateLandlordInterview,
        updateReport,
        getReportDownloadUrl
    };
});

export default useVerificationReportStore;

