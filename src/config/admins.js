/**
 * @file admins.js
 * @description Lista centralizada de emails de desarrolladores y administradores.
 * ÚNICA fuente de verdad. No duplicar en otros archivos.
 */

export const DEVELOPER_EMAILS = [
  'mister11.app@gmail.com',
  'lanuevaolarecord@gmail.com',
  'jhocao111294@gmail.com',
  'lavozdelformador@gmail.com',
];

/**
 * Verifica si un email pertenece a un desarrollador/administrador del sistema.
 * @param {string|null} email - Email del usuario
 * @returns {boolean}
 */
export const isDeveloperEmail = (email) => {
  if (!email) return false;
  return DEVELOPER_EMAILS.includes(email.toLowerCase());
};
