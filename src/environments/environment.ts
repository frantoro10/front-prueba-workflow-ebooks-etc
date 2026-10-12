/**
 * Configuración de DESARROLLO (ng serve / docker compose).
 *
 * `apiUrl` es el ÚNICO lugar donde se define la URL del backend: todos los
 * servicios (auth, ebooks, billing, WebSocket) la leen de acá.
 * El host del WebSocket se deriva de esta misma URL.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
