// src/utils/toast.js
import './toast.css';

export const showToast = (message, type = 'success') => {
  const toastContainer = document.getElementById('m11-toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `m11-toast m11-toast-${type}`;
  toast.innerText = message;
  
  toastContainer.appendChild(toast);
  
  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.add('m11-toast-show');
  });
  
  // Remover después de 3s
  setTimeout(() => {
    toast.classList.remove('m11-toast-show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
      if (toastContainer.childNodes.length === 0) {
        toastContainer.remove();
      }
    });
  }, 3000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'm11-toast-container';
  document.body.appendChild(container);
  return container;
};
