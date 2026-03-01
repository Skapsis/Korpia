/**
 * Extrae un mensaje de error legible desde un objeto de error
 * Maneja errores de red, HTTP y otros tipos de errores
 */
export function getErrorMessage(error: any, fallback: string = 'Ocurrió un error inesperado'): string {
    // Network errors (offline, timeout, etc.)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Sin conexión a internet. Verifica tu conexión e intenta nuevamente.';
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return 'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.';
    }

    // HTTP errors with response
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Use server message if available
        if (data?.message) {
            return data.message;
        }

        // Generic messages by status code
        switch (status) {
            case 400:
                return 'Solicitud inválida. Verifica los datos ingresados.';
            case 401:
                return 'Sesión expirada. Por favor inicia sesión nuevamente.';
            case 403:
                return 'No tienes permisos para realizar esta acción.';
            case 404:
                return 'Recurso no encontrado. Verifica la información.';
            case 409:
                return 'El recurso ya existe o hay un conflicto.';
            case 422:
                return 'Datos inválidos. Revisa el formato de los campos.';
            case 429:
                return 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
            case 500:
                return 'Error del servidor. Intenta nuevamente en unos momentos.';
            case 503:
                return 'Servicio temporalmente no disponible. Intenta más tarde.';
            default:
                return `Error del servidor (${status}). Intenta nuevamente.`;
        }
    }

    // Other errors with message
    if (error.message) {
        return error.message;
    }

    // Fallback
    return fallback;
}

/**
 * Toast helper para mensajes de éxito contextualizados
 */
export function getSuccessMessage(action: string, entity?: string): string {
    const entityText = entity ? ` ${entity}` : '';
    
    const messages: Record<string, string> = {
        create: `${entityText} creado exitosamente.`,
        update: `${entityText} actualizado correctamente.`,
        delete: `${entityText} eliminado con éxito.`,
        upload: `${entityText} cargado correctamente.`,
        save: `Cambios guardados exitosamente.`,
        login: `¡Bienvenido de vuelta!`,
        logout: `Sesión cerrada correctamente.`,
    };

    return messages[action] || `Operación completada con éxito.`;
}
