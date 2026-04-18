import { ISalesTeamRepository } from "../../domain/repositories/sales-team.repository.interface.js";
import { SalesTeamApi } from "../sales-team.api.js";
import { SalesTeamAssembler } from "../assemblers/sales-team.assembler.js";
import { EmployeeOrderSummaryAssembler } from "../assemblers/employee-order-summary.assembler.js";

/**
 * Repositorio HTTP para el equipo de ventas.
 * Implementa la interfaz del dominio usando la API (Adaptador en Arquitectura Hexagonal).
 */
export class SalesTeamHttpRepository extends ISalesTeamRepository {
    #api;

    constructor() {
        super();
        this.#api = new SalesTeamApi();
    }

    /**
     * Obtiene el empleado actual por ID de usuario.
     * @param {number} userId - ID del usuario autenticado.
     * @returns {Promise<Object>} Datos del empleado transformados.
     */
    async getEmployeeByUserId(userId) {
        try {
            const response = await this.#api.getEmployeeByUserId(userId);
            
            // Log de datos crudos del API
            console.log('📥 [SalesTeamRepository] Datos crudos del API:', response.data);
            
            const employee = SalesTeamAssembler.toEmployeeDomain(response.data);
            
            console.log('📦 [SalesTeamRepository] Empleado transformado:', {
                id: employee.id,
                name: employee.name,
                brandId: employee.brandId,
                brandName: employee.brandName,
                applicantCompanyId: employee.applicantCompanyId,
                applicantCompanyName: employee.applicantCompanyName
            });
            
            return employee;
        } catch (error) {
            console.error('[SalesTeamRepository] Error al obtener empleado por userId:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los empleados de una marca.
     * @param {number} brandId - ID de la marca.
     * @returns {Promise<Array>} Lista de empleados transformados.
     */
    async getEmployeesByBrandId(brandId) {
        try {
            const response = await this.#api.getEmployeesByBrandId(brandId);
            const employees = SalesTeamAssembler.toEmployeeDomainCollection(response.data);
            
            console.log(`📦 [SalesTeamRepository] ${employees.length} empleados transformados`);
            
            return employees;
        } catch (error) {
            console.error('[SalesTeamRepository] Error al obtener empleados por brandId:', error);
            throw error;
        }
    }

    /**
     * Obtiene las órdenes paginadas de un vendedor por su email corporativo.
     * @param {Object} params
     * @param {string} params.corporateEmail - Email corporativo del vendedor
     * @param {number} [params.page=0] - Página (0-indexed)
     * @param {number} [params.size=10] - Elementos por página
     * @param {string} [params.status] - Filtro por estado
     * @param {string} [params.search] - Búsqueda por orderCode, clientName o phoneNumber
     * @returns {Promise<{items, totalElements, totalPages, currentPage, pageSize, ...counts}>}
     */
    async findOrdersByCorporateEmailPaginated({ corporateEmail, page = 0, size = 10, status, search } = {}) {
        const response = await this.#api.getOrdersByCorporateEmailPaginated({ corporateEmail, page, size, status, search });
        const data = response.data;
        return {
            items:                   EmployeeOrderSummaryAssembler.toEntities(data.content || []),
            totalElements:           data.totalElements            ?? 0,
            totalPages:              data.totalPages               ?? 0,
            currentPage:             data.currentPage              ?? page,
            pageSize:                data.pageSize                 ?? size,
            totalPendiente:          data.totalPendiente           ?? 0,
            totalAsignado:           data.totalAsignado            ?? 0,
            totalEnProceso:          data.totalEnProceso           ?? 0,
            totalCompletada:         data.totalCompletada          ?? 0,
            totalCancelada:          data.totalCancelada           ?? 0,
            totalObservada:          data.totalObservada           ?? 0,
            totalSubsanada:          data.totalSubsanada           ?? 0,
            totalEntrevistaFaltante: data.totalEntrevistaFaltante  ?? 0,
            totalEnValidacion:       data.totalEnValidacion        ?? 0,
        };
    }
}
