/**
 * Container de Inyección de Dependencias simple.
 * Resuelve las violaciones de Clean Architecture permitiendo configurar
 * implementaciones concretas sin acoplar las capas.
 * 
 * Patrón: Service Locator + Dependency Injection
 */
export class DIContainer {
  #services = new Map();
  #singletons = new Map();

  /**
   * Registra un servicio con una factory function
   * @param {string} key - Identificador del servicio
   * @param {Function} factory - Función que crea el servicio
   * @param {boolean} singleton - Si true, se crea una única instancia
   */
  register(key, factory, singleton = false) {
    if (!key || typeof key !== 'string') {
      throw new Error('La key del servicio debe ser un string no vacío');
    }
    if (typeof factory !== 'function') {
      throw new Error('La factory debe ser una función');
    }

    this.#services.set(key, { factory, singleton });
  }

  /**
   * Registra una instancia directamente como singleton
   * @param {string} key - Identificador del servicio
   * @param {*} instance - Instancia del servicio
   */
  registerInstance(key, instance) {
    if (!key || typeof key !== 'string') {
      throw new Error('La key del servicio debe ser un string no vacío');
    }
    if (!instance) {
      throw new Error('La instancia no puede ser nula');
    }

    this.#singletons.set(key, instance);
  }

  /**
   * Resuelve un servicio por su key
   * @param {string} key - Identificador del servicio
   * @returns {*} Instancia del servicio
   */
  resolve(key) {
    // Primero verificar si es una instancia singleton ya creada
    if (this.#singletons.has(key)) {
      return this.#singletons.get(key);
    }

    // Buscar en servicios registrados
    const service = this.#services.get(key);
    if (!service) {
      throw new Error(`Servicio no registrado: ${key}`);
    }

    // Si es singleton y no existe, crearlo y guardarlo
    if (service.singleton) {
      const instance = service.factory(this);
      this.#singletons.set(key, instance);
      return instance;
    }

    // Si no es singleton, crear nueva instancia cada vez
    return service.factory(this);
  }

  /**
   * Verifica si un servicio está registrado
   * @param {string} key - Identificador del servicio
   * @returns {boolean}
   */
  has(key) {
    return this.#services.has(key) || this.#singletons.has(key);
  }

  /**
   * Limpia todos los servicios registrados
   */
  clear() {
    this.#services.clear();
    this.#singletons.clear();
  }

}

// Instancia global del container (singleton)
let globalContainer = null;

/**
 * Obtiene la instancia global del container
 * @returns {DIContainer}
 */
export function getContainer() {
  if (!globalContainer) {
    globalContainer = new DIContainer();
  }
  return globalContainer;
}


