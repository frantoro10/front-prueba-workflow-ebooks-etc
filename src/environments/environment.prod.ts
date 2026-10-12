/**
 * Configuración de PRODUCCIÓN. `ng build` (configuración "production")
 * reemplaza environment.ts por este archivo (ver fileReplacements en angular.json).
 *
 * ANTES DE DESPLEGAR: reemplazar apiUrl por la URL pública (https) del backend
 * desplegado, SIN barra final y terminada en /api. Ejemplo:
 *   https://pintaebook-backend.onrender.com/api
 * Con https el WebSocket usa wss:// automáticamente.
 */
export const environment = {
  production: true,
  apiUrl: 'https://CAMBIAR-POR-URL-DEL-BACKEND/api',
};
