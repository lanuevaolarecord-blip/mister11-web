/**
 * src/utils/firebaseErrors.js
 * Mapeo de códigos de error de Firebase Authentication a mensajes amigables y comprensibles.
 */

export function getFriendlyAuthErrorMessage(errorOrCode, t) {
  if (!errorOrCode) return '';
  
  const code = typeof errorOrCode === 'string' 
    ? errorOrCode 
    : (errorOrCode.code || errorOrCode.message || '');

  // Función fallback para t si no está disponible o la clave no existe
  const translate = (key, fallback) => {
    if (typeof t === 'function') {
      const res = t(key);
      if (res && res !== key) return res;
    }
    return fallback;
  };

  switch (code) {
    case 'auth/user-not-found':
      return translate('authError.userNotFound', 'No existe ninguna cuenta registrada con este correo electrónico.');
    case 'auth/wrong-password':
      return translate('authError.wrongPassword', 'La contraseña introducida es incorrecta. Por favor, inténtalo de nuevo.');
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return translate('authError.invalidCredential', 'El correo o la contraseña no son válidos. Comprueba tus datos.');
    case 'auth/email-already-in-use':
      return translate('authError.emailAlreadyInUse', 'Ya existe una cuenta con este correo electrónico. Inicia sesión en su lugar.');
    case 'auth/weak-password':
      return translate('authError.weakPassword', 'La contraseña debe tener al menos 6 caracteres.');
    case 'auth/invalid-email':
      return translate('authError.invalidEmail', 'El formato del correo electrónico no es válido.');
    case 'auth/too-many-requests':
      return translate('authError.tooManyRequests', 'Demasiados intentos fallidos. Por seguridad, espera unos minutos antes de volver a intentarlo.');
    case 'auth/network-request-failed':
      return translate('authError.networkRequestFailed', 'Error de conexión a internet. Comprueba tu red y vuelve a intentarlo.');
    case 'auth/popup-closed-by-user':
      return translate('authError.popupClosed', 'Se cerró la ventana de autenticación antes de completar el inicio de sesión.');
    case 'auth/user-disabled':
      return translate('authError.userDisabled', 'Esta cuenta ha sido deshabilitada. Contacta con soporte.');
    case 'auth/operation-not-allowed':
      return translate('authError.operationNotAllowed', 'Este método de inicio de sesión no está disponible actualmente.');
    case 'auth/requires-recent-login':
      return translate('authError.requiresRecentLogin', 'Por seguridad, debes iniciar sesión de nuevo antes de realizar esta acción.');
    default:
      if (typeof errorOrCode === 'object' && errorOrCode.message) {
        return errorOrCode.message;
      }
      return translate('authError.generic', 'Ocurrió un error inesperado al procesar la solicitud. Inténtalo de nuevo.');
  }
}
