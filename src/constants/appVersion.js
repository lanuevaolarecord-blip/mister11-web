/**
 * appVersion.js
 * Fuente única de verdad: lee la versión directamente desde package.json.
 * Cualquier bump de versión en package.json se refleja automáticamente en toda la UI.
 */
import { version } from '../../package.json';
export const APP_VERSION = version;
