// ============ MODAL/DIALOG UTILITIES ============
function openModal(title, content) {
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = content;
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) modal.classList.remove('active');
}

// ============ DOM MANIPULATION UTILITIES ============
function getStoredUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getStoredToken() {
  return localStorage.getItem('token');
}

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function setAuthStorage(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// ============ VALIDATION UTILITIES ============
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPassword(password) {
  return password && password.length >= 6;
}

// ============ STRING UTILITIES ============
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}