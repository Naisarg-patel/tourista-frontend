document.addEventListener("DOMContentLoaded", () => {

  // Initialize first screen
  showScreen("login");

  // Switch screens
  const goToRegister = document.getElementById("go-to-register");
  const goToLogin = document.getElementById("go-to-login");

  if (goToRegister)
    goToRegister.onclick = () => showScreen("register");

  if (goToLogin)
    goToLogin.onclick = () => showScreen("login");

  // LOGIN
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = async () => {
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      console.log("Login clicked", email); 
      const data = await loginUser({ email, password });

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showScreen("feature");
      } else {
        alert(data.message || "Login failed");
        showScreen("login");
      }
    };
  }

  // REGISTER
  const registerBtn = document.getElementById("register-btn");
  if (registerBtn) {
    registerBtn.onclick = async () => {
      const name = document.getElementById("register-name").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;

      console.log("Register clicked", email); // 🔍 DEBUG

      const data = await registerUser({ name, email, password });

      if (data.user) {
        alert("Registration successful. Please login.");
        showScreen("login");
      } else {
        alert(data.message || "Registration failed");
      }
    };
  }
});
