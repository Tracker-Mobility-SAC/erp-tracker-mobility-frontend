/**
 * Utilidades para validación de fechas.
 * Funciones reutilizables para validar fechas en diferentes contextos.
 * Todas las funciones respetan la zona horaria local del usuario.
 */
export class DateValidator {
  /**
   * Normaliza una fecha a medianoche (00:00:00.000) en zona horaria local.
   * Útil para comparaciones que solo deben considerar el día, no la hora.
   * IMPORTANTE: Maneja correctamente strings en formato ISO (yyyy-MM-dd) evitando conversión UTC.
   * @param {Date|string} date - Fecha a normalizar
   * @returns {Date|null} Fecha normalizada o null si es inválida
   */
  static normalizeToMidnight(date) {
    if (!date) return null;

    try {
      let dateObj;
      
      // Si es un string en formato ISO (yyyy-MM-dd), parsearlo manualmente
      // para evitar que new Date() lo interprete como UTC
      if (typeof date === 'string') {
        // Formato esperado: yyyy-MM-dd o yyyy-MM-ddTHH:mm:ss
        const isoMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          // Crear Date directamente con componentes locales (sin UTC)
          dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Intentar parsear como está
          dateObj = new Date(date);
        }
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return null;
      }
      
      if (isNaN(dateObj.getTime())) return null;

      // Crear nueva fecha a medianoche en zona horaria local
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
      );
    } catch (error) {
      console.error('[DateValidator] Error al normalizar fecha:', error);
      return null;
    }
  }

  /**
   * Valida si una fecha es igual o posterior a hoy (solo compara días).
   * @param {Date|string} date - Fecha a validar
   * @returns {boolean} True si la fecha es hoy o futura
   */
  static isTodayOrFuture(date) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const normalizedToday = this.normalizeToMidnight(new Date());
    
    return normalizedDate >= normalizedToday;
  }

  /**
   * Valida si una fecha es estrictamente futura (posterior a hoy).
   * @param {Date|string} date - Fecha a validar
   * @returns {boolean} True si la fecha es futura
   */
  static isFuture(date) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const normalizedToday = this.normalizeToMidnight(new Date());
    
    return normalizedDate > normalizedToday;
  }

  /**
   * Valida si una fecha es igual o anterior a hoy (solo compara días).
   * @param {Date|string} date - Fecha a validar
   * @returns {boolean} True si la fecha es hoy o pasada
   */
  static isTodayOrPast(date) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const normalizedToday = this.normalizeToMidnight(new Date());
    
    return normalizedDate <= normalizedToday;
  }

  /**
   * Valida si una fecha es estrictamente pasada (anterior a hoy).
   * @param {Date|string} date - Fecha a validar
   * @returns {boolean} True si la fecha es pasada
   */
  static isPast(date) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const normalizedToday = this.normalizeToMidnight(new Date());
    
    return normalizedDate < normalizedToday;
  }

  /**
   * Valida si una fecha es hoy.
   * @param {Date|string} date - Fecha a validar
   * @returns {boolean} True si la fecha es hoy
   */
  static isToday(date) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const normalizedToday = this.normalizeToMidnight(new Date());
    
    return normalizedDate.getTime() === normalizedToday.getTime();
  }

  /**
   * Valida si una fecha está dentro de un rango (inclusivo).
   * @param {Date|string} date - Fecha a validar
   * @param {Date|string} startDate - Fecha inicio del rango
   * @param {Date|string} endDate - Fecha fin del rango
   * @returns {boolean} True si la fecha está dentro del rango
   */
  static isInRange(date, startDate, endDate) {
    const normalizedDate = this.normalizeToMidnight(date);
    const normalizedStart = this.normalizeToMidnight(startDate);
    const normalizedEnd = this.normalizeToMidnight(endDate);

    if (!normalizedDate || !normalizedStart || !normalizedEnd) return false;

    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  }

  /**
   * Calcula la diferencia en días entre dos fechas.
   * @param {Date|string} date1 - Primera fecha
   * @param {Date|string} date2 - Segunda fecha
   * @returns {number|null} Diferencia en días (puede ser negativa) o null si alguna fecha es inválida
   */
  static daysDifference(date1, date2) {
    const normalized1 = this.normalizeToMidnight(date1);
    const normalized2 = this.normalizeToMidnight(date2);

    if (!normalized1 || !normalized2) return null;

    const diffTime = normalized1.getTime() - normalized2.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Valida si una fecha es un objeto Date válido.
   * @param {any} date - Valor a validar
   * @returns {boolean} True si es un Date válido
   */
  static isValidDate(date) {
    if (!date) return false;
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return !isNaN(dateObj.getTime());
    } catch (error) {
      return false;
    }
  }

  /**
   * Valida si una fecha está dentro de los próximos N días.
   * @param {Date|string} date - Fecha a validar
   * @param {number} days - Número de días hacia el futuro
   * @returns {boolean} True si la fecha está dentro de los próximos N días
   */
  static isWithinNextDays(date, days) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const today = this.normalizeToMidnight(new Date());
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    return normalizedDate >= today && normalizedDate <= futureDate;
  }

  /**
   * Valida si una fecha está dentro de los últimos N días.
   * @param {Date|string} date - Fecha a validar
   * @param {number} days - Número de días hacia el pasado
   * @returns {boolean} True si la fecha está dentro de los últimos N días
   */
  static isWithinPastDays(date, days) {
    const normalizedDate = this.normalizeToMidnight(date);
    if (!normalizedDate) return false;

    const today = this.normalizeToMidnight(new Date());
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);

    return normalizedDate >= pastDate && normalizedDate <= today;
  }
}
