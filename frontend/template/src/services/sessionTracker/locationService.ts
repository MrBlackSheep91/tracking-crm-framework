/**
 * Servicio de geolocalización por IP
 */

// Interfaz para respuesta de ubicación por IP
export interface IPLocation {
  ip?: string;
  city?: string;
  region?: string;
  country_name?: string;
  timezone?: string;
}

/**
 * Obtiene la ubicación del usuario a través de una API externa
 * @returns Datos de ubicación o null en caso de error
 */
export const getIPLocation = async (): Promise<IPLocation | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo ubicación IP:', error);
    return null;
  }
};
