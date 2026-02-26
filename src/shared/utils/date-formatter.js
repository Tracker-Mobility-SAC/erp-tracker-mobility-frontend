/**
 * Utilidades para formateo y conversión de fechas.
 * Maneja las conversiones entre formato del backend (yyyy-MM-dd) y formato del usuario (dd/mm/yyyy).
 */
export class DateFormatter {
    /**
     * Convierte fecha del formato del backend (yyyy-MM-dd) a formato de visualización (dd/mm/yyyy).
     * @param {string} dateString - Fecha en formato yyyy-MM-dd (ejemplo: "2024-01-15")
     * @returns {string} Fecha en formato dd/mm/yyyy (ejemplo: "15/01/2024")
     */
    static fromBackend(dateString) {
        if (!dateString) return '';
        
        // Validar formato yyyy-MM-dd
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.warn(`Formato de fecha inválido desde backend: ${dateString}`);
            return dateString;
        }
        
        // Backend envía: yyyy-MM-dd (ejemplo: 2024-01-15)
        const [year, month, day] = dateString.split('-');
        // Frontend muestra: dd/mm/yyyy (ejemplo: 15/01/2024)
        return `${day}/${month}/${year}`;
    }

    /**
     * Convierte fecha del formato de visualización (dd/mm/yyyy) a formato del backend (yyyy-MM-dd).
     * @param {string} dateString - Fecha en formato dd/mm/yyyy (ejemplo: "15/01/2024")
     * @returns {string} Fecha en formato yyyy-MM-dd (ejemplo: "2024-01-15")
     */
    static toBackend(dateString) {
        if (!dateString) return '';
        
        // Validar formato dd/mm/yyyy
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            console.warn(`Formato de fecha inválido para backend: ${dateString}`);
            return dateString;
        }
        
        // Frontend envía: dd/mm/yyyy (ejemplo: 15/01/2024)
        const [day, month, year] = dateString.split('/');
        // Backend espera: yyyy-MM-dd (ejemplo: 2024-01-15)
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    /**
     * Convierte un objeto Date a formato de visualización (dd/mm/yyyy).
     * @param {Date} date - Objeto Date de JavaScript
     * @returns {string} Fecha en formato dd/mm/yyyy
     */
    static fromDateObject(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    /**
     * Convierte una fecha en formato dd/mm/yyyy a objeto Date.
     * @param {string} dateString - Fecha en formato dd/mm/yyyy
     * @returns {Date|null} Objeto Date o null si es inválido
     */
    static toDateObject(dateString) {
        if (!dateString) return null;
        
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        
        // Formato: dd/mm/yyyy -> Date(yyyy, mm-1, dd)
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);
        
        // Validar que la fecha sea válida
        if (isNaN(date.getTime())) return null;
        
        return date;
    }

    /**
     * Formatea una fecha para mostrar en formato legible (ej: "15 de enero de 2024").
     * @param {Date|string} date - Objeto Date o string en formato dd/mm/yyyy
     * @param {string} locale - Locale para el formato (por defecto 'es-ES')
     * @returns {string} Fecha formateada en texto
     */
    static toReadableFormat(date, locale = 'es-ES') {
        let dateObj = date;
        
        if (typeof date === 'string') {
            dateObj = this.toDateObject(date);
        }
        
        if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
        
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString(locale, { month: 'long' });
        const year = dateObj.getFullYear();
        
        return `${day} de ${month} de ${year}`;
    }

    /**
     * Convierte fecha del backend (yyyy-MM-dd) directamente a objeto Date.
     * @param {string} dateString - Fecha en formato yyyy-MM-dd
     * @returns {Date|null} Objeto Date o null si es inválido
     */
    static backendToDateObject(dateString) {
        if (!dateString) return null;
        
        const formattedDate = this.fromBackend(dateString);
        return this.toDateObject(formattedDate);
    }

    /**
     * Convierte objeto Date directamente a formato backend (yyyy-MM-dd).
     * @param {Date} date - Objeto Date de JavaScript
     * @returns {string} Fecha en formato yyyy-MM-dd
     */
    static dateObjectToBackend(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
        
        const formattedDate = this.fromDateObject(date);
        return this.toBackend(formattedDate);
    }
}
