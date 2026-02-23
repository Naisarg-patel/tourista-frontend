// ============ MODAL DIALOG MANAGEMENT ============
// Note: Modal elements (modalOverlay, modalTitle, modalBody, modalCloseBtn) are declared in navigation.js

/**
 * Opens a modal dialog with title and content
 * @param {string} title - Modal title
 * @param {string} content - Modal HTML content
 */
function openModal(title, content) {
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = content;
  if (modalOverlay) {
    modalOverlay.classList.add('active');
    modalOverlay.style.display = 'flex';
  }
}

/**
 * Closes the modal dialog
 */
function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    modalOverlay.style.display = 'none';
  }
}

/**
 * Shows a confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 */
function showConfirmModal(message, onConfirm, onCancel) {
  const content = `
    <p class="mb-6 text-gray-700">${message}</p>
    <div class="flex gap-3 justify-end">
      <button id="confirm-cancel-btn" class="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
      <button id="confirm-ok-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm</button>
    </div>
  `;
  
  openModal('Confirm', content);
  
  const okBtn = document.getElementById('confirm-ok-btn');
  const cancelBtn = document.getElementById('confirm-cancel-btn');
  
  if (okBtn) okBtn.onclick = () => { onConfirm?.(); closeModal(); };
  if (cancelBtn) cancelBtn.onclick = () => { onCancel?.(); closeModal(); };
}

/**
 * Shows an alert dialog
 * @param {string} message - Alert message
 * @param {Function} onClose - Callback when closed
 */
function showAlertModal(message, onClose) {
  const content = `
    <p class="mb-6 text-gray-700">${message}</p>
    <div class="flex justify-end">
      <button id="alert-close-btn" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">OK</button>
    </div>
  `;
  
  openModal('Alert', content);
  
  const closeBtn = document.getElementById('alert-close-btn');
  if (closeBtn) closeBtn.onclick = () => { onClose?.(); closeModal(); };
}

// Initialize modal close button (when DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
});

// Close modal when clicking outside
if (typeof modalOverlay !== 'undefined' && modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}