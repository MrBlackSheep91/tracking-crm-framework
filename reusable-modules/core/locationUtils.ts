/**
 * Obtiene datos de ubicación por IP utilizando el servicio ipapi.co
 */
export const getLocationByIp = async (): Promise<any> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`Error al obtener ubicación: ${response.statusText}`);
    }
    
    const locationData = await response.json();
    return locationData;
  } catch (error) {
    console.error('Error al obtener datos de ubicación:', error);
    return null;
  }
};
