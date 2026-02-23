// ============ API CONFIGURATION ============
const AUTH_API_URL = "http://localhost:5000/api/auth";
const ATTRACTIONS_API_URL = "http://localhost:5000/api/attractions";

// ============ AUTHENTICATION API CALLS ============
async function loginUser(email, password) {
  const res = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function registerUser(name, email, password) {
  const res = await fetch(`${AUTH_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

// ============ ATTRACTIONS API CALLS ============
async function searchAttractions(city) {
  try {
    const res = await fetch(
      `${ATTRACTIONS_API_URL}/search?city=${encodeURIComponent(city)}`
    );
    if (!res.ok) throw new Error('Failed to fetch attractions');
    return await res.json();
  } catch (err) {
    console.error("Error fetching attractions:", err);
    return [];
  }
}

// Get attractions by city (REAL-TIME)
async function getAttractionsByCity(city, category = 'all') {
  try {
    const url = category && category !== 'all' 
      ? `${ATTRACTIONS_API_URL}/city/${encodeURIComponent(city)}?category=${category}`
      : `${ATTRACTIONS_API_URL}/city/${encodeURIComponent(city)}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch attractions');
    return await res.json();
  } catch (err) {
    console.error("Error fetching attractions:", err);
    return [];
  }
}

// Get attraction by ID
async function getAttractionById(id) {
  try {
    const res = await fetch(`${ATTRACTIONS_API_URL}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch attraction');
    return await res.json();
  } catch (err) {
    console.error("Error fetching attraction:", err);
    return null;
  }
}
// ============ REAL ATTRACTIONS (OpenStreetMap) API CALLS ============
// Get REAL attractions from OpenStreetMap (bypass database)
async function getRealAttractionsByCity(city, category = 'all') {
  try {
    // Backend supports ?source=real on the /city/:cityName endpoint
    const base = `${ATTRACTIONS_API_URL}/city/${encodeURIComponent(city)}`;
    const params = new URLSearchParams();
    params.set('source', 'real');
    if (category && category !== 'all') params.set('category', category);
    const url = `${base}?${params.toString()}`;

    console.log(`📍 Fetching REAL attractions from OpenStreetMap for ${city}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch real attractions');
    const data = await res.json();
    console.log(`✅ Found ${data.length || 0} real attractions`);
    return Array.isArray(data) ? data : data.attractions || [];
  } catch (err) {
    console.error("❌ Error fetching real attractions:", err);
    return [];
  }
}