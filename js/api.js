const API_URL = "https://tourista-backend-hhaz.onrender.com/api/auth";

async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email : email,
                           password : password }),
  });
  return res.json();
}

async function registerUser(name, email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name : name, email : email, password : password }),
  });
  return res.json();
}
