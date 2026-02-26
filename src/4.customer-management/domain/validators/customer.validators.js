/**
 * Validadores del dominio para clientes.
 * Patrón híbrido: combina validaciones compartidas con reglas de dominio específicas
 */
import { useInputValidation } from '../../../shared-v2/composables/use-input-validation.js';
import { CustomerMessages, EmployeeCollaboratorMessages, BusinessRules } from '../constants/customer.constants.js';
import { Ruc } from '../value-objects/ruc.vo.js';
import { Email } from '../value-objects/email.vo.js';
import { PhoneNumber } from '../value-objects/phone-number.vo.js';

const { isValidEmail, validateRequired } = useInputValidation();

export class CustomerValidators {
    /**
     * Valida el RUC de un cliente
     * Combina validación básica (shared) con reglas de dominio (Value Object).
     * @param {string} ruc
     * @returns {{valid: boolean, message?: string}}
     */
    static validateRuc(ruc) {
        // Capa 1: Validación básica (shared)
        const requiredError = validateRequired(ruc, 'RUC');
        if (requiredError) {
            return { valid: false, message: CustomerMessages.RUC_REQUIRED };
        }

        // Capa 2: Validación de dominio con Value Object
        try {
            new Ruc(ruc);
            return { valid: true };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * Valida el nombre de la empresa
     * @param {string} companyName
     * @returns {{valid: boolean, message?: string}}
     */
    static validateCompanyName(companyName) {
        // Capa 1: Validación básica (shared)
        const requiredError = validateRequired(companyName, 'Nombre de empresa');
        if (requiredError) {
            return { valid: false, message: CustomerMessages.COMPANY_NAME_REQUIRED };
        }

        // Capa 2: Reglas de longitud (domain)
        const trimmedName = companyName.trim();
        if (trimmedName.length < BusinessRules.COMPANY_NAME_MIN_LENGTH) {
            return { valid: false, message: CustomerMessages.COMPANY_NAME_MIN_LENGTH };
        }

        if (trimmedName.length > BusinessRules.COMPANY_NAME_MAX_LENGTH) {
            return { valid: false, message: CustomerMessages.COMPANY_NAME_MAX_LENGTH };
        }

        return { valid: true };
    }

    /**
     * Valida el estado del cliente
     * @param {string} status
     * @returns {{valid: boolean, message?: string}}
     */
    static validateStatus(status) {
        const requiredError = validateRequired(status, 'Estado');
        if (requiredError) {
            return { valid: false, message: CustomerMessages.STATUS_REQUIRED };
        }

        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            return { valid: false, message: CustomerMessages.STATUS_INVALID };
        }

        return { valid: true };
    }
}

export class EmployeeCollaboratorValidators {
    /**
     * Valida el email del colaborador
     * Combina validación básica de formato (shared) con reglas de dominio (Value Object).
     * @param {string} email
     * @returns {{valid: boolean, message?: string}}
     */
    static validateEmail(email) {
        // Capa 1: Formato básico (shared)
        if (!isValidEmail(email)) {
            return { valid: false, message: EmployeeCollaboratorMessages.EMAIL_INVALID };
        }

        // Capa 2: Validación de dominio con Value Object
        try {
            new Email(email);
            return { valid: true };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * Valida el nombre del colaborador
     * @param {string} name
     * @returns {{valid: boolean, message?: string}}
     */
    static validateName(name) {
        const requiredError = validateRequired(name, 'Nombre');
        if (requiredError) {
            return { valid: false, message: EmployeeCollaboratorMessages.NAME_REQUIRED };
        }

        if (name.trim().length < BusinessRules.NAME_MIN_LENGTH) {
            return { valid: false, message: EmployeeCollaboratorMessages.NAME_MIN_LENGTH };
        }

        return { valid: true };
    }

    /**
     * Valida el apellido del colaborador
     * @param {string} lastName
     * @returns {{valid: boolean, message?: string}}
     */
    static validateLastName(lastName) {
        const requiredError = validateRequired(lastName, 'Apellido');
        if (requiredError) {
            return { valid: false, message: EmployeeCollaboratorMessages.LASTNAME_REQUIRED };
        }

        if (lastName.trim().length < BusinessRules.NAME_MIN_LENGTH) {
            return { valid: false, message: EmployeeCollaboratorMessages.LASTNAME_MIN_LENGTH };
        }

        return { valid: true };
    }

    /**
     * Valida el teléfono del colaborador
     * Combina validación básica (shared) con reglas de dominio (Value Object).
     * @param {string} phoneNumber
     * @returns {{valid: boolean, message?: string}}
     */
    static validatePhoneNumber(phoneNumber) {
        const requiredError = validateRequired(phoneNumber, 'Teléfono');
        if (requiredError) {
            return { valid: false, message: EmployeeCollaboratorMessages.PHONE_REQUIRED };
        }

        // Validación de dominio con Value Object
        try {
            new PhoneNumber(phoneNumber);
            return { valid: true };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }
}
