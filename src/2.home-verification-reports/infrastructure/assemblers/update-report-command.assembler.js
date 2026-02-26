/**
 * Assembler para convertir UpdateReportCommand a resource DTO.
 * Infrastructure layer - Data transformation
 * Responsabilidad: Serializar Commands del dominio al formato esperado por la API.
 * 
 * @class UpdateReportCommandAssembler
 */
export class UpdateReportCommandAssembler {
    
    /**
     * Convierte un UpdateReportCommand a un objeto resource para la API.
     * @param {UpdateReportCommand} command - El comando de actualización de reporte.
     * @returns {Object} El objeto resource formateado para la API.
     */
    static toResource(command) {
        const resource = {
            finalResult: command.finalResult,
            summary: command.summary,
            observations: command.observations,
            glossary: command.glossary,
            casuistics: command.casuistics,
            isResultValid: command.isResultValid
        };
        
        console.log('[UpdateReportCommandAssembler] DEBUG - Convirtiendo a resource:', {
            input: command,
            output: resource
        });
        
        return resource;
    }
}
