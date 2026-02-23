// ============ MAIN MENU FUNCTIONALITY ============

/**
 * Initialize menu button event listeners
 */
function initializeMenu() {
  const menuFeatureBtns = document.querySelectorAll('.menu-feature-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // Setup feature buttons
  menuFeatureBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const featureName = btn.getAttribute('data-feature');
      
      // Remove active state from all buttons
      menuFeatureBtns.forEach(b => b.classList.remove('active'));
      
      // Add active state to clicked button
      btn.classList.add('active');
      
      // Load the dashboard feature with controls and views
      if (typeof loadDashboardFeature === 'function') {
        loadDashboardFeature(featureName);
      }
    });
  });

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuthStorage();
      showScreen('login');
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeMenu);