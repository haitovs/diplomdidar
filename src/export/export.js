/**
 * Export Module
 * Handles PDF report and PNG screenshot export functionality
 */

/**
 * Export canvas as PNG image
 * @param {HTMLCanvasElement} canvas - Canvas element to export
 * @param {string} [filename='network-topology'] - Base filename
 */
export function exportCanvasPNG(canvas, filename = 'network-topology') {
  if (!canvas) {
    console.error('Canvas element not found for export');
    return;
  }

  try {
    const link = document.createElement('a');
    link.download = `${filename}-${getTimestamp()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showExportToast('PNG screenshot saved!');
  } catch (e) {
    console.error('Failed to export PNG:', e);
    showExportToast('Export failed. Try again.', 'error');
  }
}

/**
 * Export current view as PDF report
 * Uses browser print functionality with custom print styles
 */
export function exportPDFReport() {
  // Add print-specific styles
  const printStyles = document.createElement('style');
  printStyles.id = 'print-styles';
  printStyles.textContent = `
    @media print {
      /* Hide non-essential elements */
      .hero__actions,
      .pod-handle,
      .control-sidebar,
      #toggle-sidebar,
      #toggle-dark,
      #toggle-handle-visibility,
      .btn,
      .draggable-card,
      .tooltip,
      .link-handle,
      footer {
        display: none !important;
      }

      /* Reset layout for print */
      body {
        background: white !important;
        color: black !important;
        font-size: 12pt !important;
      }

      .hero {
        page-break-after: always;
      }

      .workspace {
        display: block !important;
        grid-template-columns: 1fr !important;
      }

      .visual-stack {
        page-break-inside: avoid;
      }

      .panel {
        background: white !important;
        border: 1px solid #ccc !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        margin-bottom: 20pt;
      }

      canvas {
        max-width: 100% !important;
        height: auto !important;
      }

      /* Show status in print */
      .status-pill {
        background: #eee !important;
        color: black !important;
        border: 1px solid #ccc;
      }

      /* Print header */
      .hero__content h1 {
        font-size: 24pt !important;
        color: black !important;
      }

      .hero__metrics {
        background: #f5f5f5 !important;
      }

      .hero__visual {
        display: none !important;
      }
    }
  `;
  
  document.head.appendChild(printStyles);

  // Small delay to ensure styles apply
  setTimeout(() => {
    window.print();
    
    // Remove print styles after printing
    setTimeout(() => {
      printStyles.remove();
    }, 1000);
  }, 100);

  showExportToast('Print dialog opened');
}

/**
 * Export simulation data as JSON
 * @param {Object} data - Simulation state data
 * @param {string} [filename='simulation-data'] - Base filename
 */
export function exportDataJSON(data, filename = 'simulation-data') {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${filename}-${getTimestamp()}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    showExportToast('Data exported as JSON');
  } catch (e) {
    console.error('Failed to export JSON:', e);
    showExportToast('Export failed', 'error');
  }
}

/**
 * Get formatted timestamp for filenames
 * @returns {string}
 */
function getTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Show a toast notification for export actions
 * @param {string} message - Toast message
 * @param {string} [type='success'] - Toast type (success, error)
 */
function showExportToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.getElementById('export-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'export-toast';
  toast.className = `export-toast export-toast--${type}`;
  toast.textContent = message;
  
  // Add styles if not present
  if (!document.getElementById('export-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'export-toast-styles';
    style.textContent = `
      .export-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;
      }
      .export-toast--success {
        background: linear-gradient(135deg, #4ee1c1, #38bdf8);
        color: #0a0f1a;
      }
      .export-toast--error {
        background: linear-gradient(135deg, #ff6384, #ff9f40);
        color: white;
      }
      @keyframes toastIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes toastOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove after animation
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Wire up export buttons in footer
 * @param {Object} options - Export options
 */
export function initExportButtons({ canvas, getState }) {
  const downloadBtn = document.querySelector('a[href="#"]:first-of-type');
  const exportBtn = document.querySelector('a[href="#"]:last-of-type');

  // Find footer buttons by text
  document.querySelectorAll('.footer__actions .btn').forEach(btn => {
    if (btn.textContent.includes('Download') || btn.textContent.includes('Report')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        exportPDFReport();
      });
    }
    if (btn.textContent.includes('Export') || btn.textContent.includes('Slide')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (canvas) {
          exportCanvasPNG(canvas);
        }
      });
    }
  });
}
