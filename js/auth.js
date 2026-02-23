// ============ AUTHENTICATION EVENT HANDLERS ============

document.addEventListener("DOMContentLoaded", () => {

  // Ensure navigation.js functions are available
  if (typeof showScreen === 'undefined') {
    console.error('showScreen function not found. Navigation.js may not have loaded.');
    return;
  }

  // Initialize first screen
  showScreen("login");

  // Switch screens
  const goToRegister = document.getElementById("go-to-register");
  const goToLogin = document.getElementById("go-to-login");

  if (goToRegister)
    goToRegister.onclick = () => showScreen("register");

  if (goToLogin)
    goToLogin.onclick = () => showScreen("login");

  // ============ LOGIN HANDLER ============
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      // Validation
      if (!email || !password) {
        alert("Please enter email and password");
        showScreen("login");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email");
        showScreen("login");
        return;
      }

      console.log("Login attempt:", email);
      
      try {
        const data = await loginUser(email, password);

        if (data.token) {
          setAuthStorage(data.token, data.user);
          showScreen("feature");
        } else {
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login");
      }
    };
  }

  // ============ REGISTER HANDLER ============
  const registerBtn = document.getElementById("register-btn");
  if (registerBtn) {
    registerBtn.onclick = async () => {
      const name = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      // Validation
      if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email");
        return;
      }

      if (!isValidPassword(password)) {
        alert("Password must be at least 6 characters");
        return;
      }

      console.log("Register attempt:", email);

      try {
        const data = await registerUser(name, email, password);

        if (data.user) {
          alert("Registration successful. Please login.");
          showScreen("login");
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        console.error("Register error:", error);
        alert("An error occurred during registration");
      }
    };
  }
});
