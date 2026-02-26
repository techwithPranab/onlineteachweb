/**
 * Simple toast notification utility
 * Creates temporary toast notifications without external dependencies
 */

const createToast = (message, type = 'info') => {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }

  // Create toast element
  const toast = document.createElement('div')
  toast.style.cssText = `
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 350px;
    font-size: 14px;
    font-weight: 500;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    margin-bottom: 10px;
  `
  toast.textContent = message

  // Add animation keyframes if not already added
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }

  container.appendChild(toast)

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out'
    setTimeout(() => {
      container.removeChild(toast)
      if (container.children.length === 0) {
        document.body.removeChild(container)
      }
    }, 300)
  }, 3000)
}

export const toast = {
  success: (message) => createToast(message, 'success'),
  error: (message) => createToast(message, 'error'),
  info: (message) => createToast(message, 'info')
}

export default toast
