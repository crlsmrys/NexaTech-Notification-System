/**
 * NexaTech Notification System - UI Controller
 * 
 * Handles advanced UI features:
 * - Notification animations
 * - Toast messages
 * - Modal dialogs
 * - Theme management
 * - Accessibility features
 */

class UIController {
  constructor() {
    this.toastContainer = null;
    this.initializeToastContainer();
  }

  /**
   * Initialize toast container
   */
  initializeToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.id = 'toast-container';
    this.toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(this.toastContainer);
  }

  /**
   * Show toast notification
   * @param {string} message - Toast message
   * @param {string} type - 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (default: 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    
    const colors = {
      success: { bg: '#28a745', icon: '✅' },
      error: { bg: '#dc3545', icon: '❌' },
      warning: { bg: '#ffc107', icon: '⚠️' },
      info: { bg: '#007bff', icon: 'ℹ️' }
    };

    const config = colors[type] || colors.info;

    toast.style.cssText = `
      background-color: ${config.bg};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideInRight 0.3s ease;
      font-weight: 500;
    `;

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${config.icon}</span>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    // Add animation
    const style = document.createElement('style');
    if (!document.getElementById('toast-animations')) {
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Auto remove
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Show confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {function} onConfirm - Callback when confirmed
   * @param {function} onCancel - Callback when cancelled
   */
  showConfirmDialog(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      animation: scaleIn 0.3s ease;
    `;

    dialog.innerHTML = `
      <h2 style="margin-bottom: 15px; color: #212529; font-size: 1.3rem;">${title}</h2>
      <p style="margin-bottom: 25px; color: #666; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelBtn" style="
          padding: 10px 20px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s;
        ">Cancel</button>
        <button id="confirmBtn" style="
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.3s;
        ">Confirm</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const confirmBtn = dialog.querySelector('#confirmBtn');
    const cancelBtn = dialog.querySelector('#cancelBtn');

    confirmBtn.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        overlay.remove();
        if (onConfirm) onConfirm();
      }, 200);
    });

    cancelBtn.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        overlay.remove();
        if (onCancel) onCancel();
      }, 200);
    });

    // Add animations if not already present
    const style = document.createElement('style');
    if (!document.getElementById('dialog-animations')) {
      style.id = 'dialog-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
          overlay.remove();
          if (onCancel) onCancel();
        }, 200);
      }
    });
  }

  /**
   * Show loading spinner
   * @returns {function} Function to hide spinner
   */
  showSpinner(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.id = 'loading-spinner';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="color: white; font-weight: 600;">${message}</p>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add animation
    const style = document.createElement('style');
    if (!document.getElementById('spinner-animation')) {
      style.id = 'spinner-animation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    // Return function to hide spinner
    return () => {
      const spinner = document.getElementById('loading-spinner');
      if (spinner) {
        spinner.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => spinner.remove(), 200);
      }
    };
  }

  /**
   * Format timestamp
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted time
   */
  formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Highlight text
   * @param {string} text - Text to highlight
   * @param {string} searchTerm - Term to search for
   * @returns {string} Highlighted HTML
   */
  highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px;">$1</mark>');
  }

  /**
   * Disable button during action
   * @param {HTMLElement} button - Button element
   * @param {string} loadingText - Text to show while loading
   * @returns {function} Function to re-enable button
   */
  disableButton(button, loadingText = 'Loading...') {
    const originalText = button.textContent;
    const originalState = button.disabled;

    button.disabled = true;
    button.textContent = loadingText;

    return () => {
      button.disabled = originalState;
      button.textContent = originalText;
    };
  }

  /**
   * Animate element
   * @param {HTMLElement} element - Element to animate
   * @param {string} animation - Animation name
   * @param {number} duration - Duration in milliseconds
   */
  animate(element, animation, duration = 300) {
    return new Promise((resolve) => {
      element.style.animation = `${animation} ${duration}ms ease`;
      
      const handleAnimationEnd = () => {
        element.style.animation = '';
        element.removeEventListener('animationend', handleAnimationEnd);
        resolve();
      };

      element.addEventListener('animationend', handleAnimationEnd);
    });
  }

  /**
   * Update page title with badge
   * @param {string} title - Page title
   * @param {number} count - Badge count
   */
  updatePageTitle(title, count = 0) {
    if (count > 0) {
      document.title = `(${count}) ${title}`;
    } else {
      document.title = title;
    }
  }

  /**
   * Scroll to bottom of element
   * @param {HTMLElement} element - Element to scroll
   */
  scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
  }

  /**
   * Smooth scroll to element
   * @param {HTMLElement} element - Element to scroll to
   */
  smoothScrollTo(element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  /**
   * Copy to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success', 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      this.showToast('Failed to copy', 'error');
      return false;
    }
  }

  /**
   * Get initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Determine if user prefers dark mode
   * @returns {boolean}
   */
  prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}

// Create global UI controller instance
const ui = new UIController();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
