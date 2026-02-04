// Get all screens
const screens = {
 login: document.getElementById("login-screen"),
  register: document.getElementById("register-screen"),
  feature: document.getElementById("feature-select-screen"),
  city: document.getElementById("city-screen"),
  menu: document.getElementById("main-menu-screen"),
  dashboard: document.getElementById("dashboard-screen"),
};

// Buttons
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const featureSelectBtns = document.querySelectorAll('.feature-select-btn');
const cityBtns = document.querySelectorAll('.city-btn');
const searchCityBtn = document.getElementById('search-city-btn');
const customCityInput = document.getElementById('custom-city-input');
const menuFeatureBtns = document.querySelectorAll('.menu-feature-btn');
// Views and Panel

let currentScreen = null;
const activeProfileCity = document.getElementById('active-profile-city');
const selectedCityDashboard = document.getElementById('selected-city-dashboard');
const mainMenuCity = document.getElementById('main-menu-city');
const discoverView = document.getElementById('discover-view');
const routeView = document.getElementById('route-view');
const aiView = document.getElementById('ai-view');
const eventsView = document.getElementById('events-view');
const infoView = document.getElementById('info-view');
const safetyView = document.getElementById('safety-view');
const profileView = document.getElementById('profile-view');
const adminView = document.getElementById('admin-view');
const mapView = document.getElementById('map-view');
const controlsPanel = document.getElementById('controls-panel');
const contentTitle = document.getElementById('content-title');
const apiKey = ""; 
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
let currentCity = 'Ahmedabad'; // Default city to start with
let currentFeature = 'discover'; 
let isAILoading = false;
let previousScreen = 'feature-select'; // Tracks screen for dynamic back button control
// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close-btn');


/**
         * Shows a specific screen and hides others
         * @param {string} screenId - 'login', 'register', 'feature-select', 'city', 'main-menu', or 'dashboard'
         */
        function showScreen(screenId) {
            // Store current screen before changing
            const activeScreen = Object.keys(screens).find(key => screens[key].classList.contains('active'));
            if (activeScreen && activeScreen !== screenId) {
                previousScreen = activeScreen;
            }

            // Update City in Profile Screen
            if (screenId === 'profile' || screenId === 'dashboard') {
                if (activeProfileCity) activeProfileCity.textContent = currentCity;
            }

            Object.values(screens).forEach(screen => {
                screen.classList.remove('active');
            });
            if(screens[screenId]) {
                screens[screenId].classList.add('active');
            }
        }

         /**
         * Core function to call the Gemini API
         * @returns {Promise<string>} - The generated text content
         */
        async function callGeminiAPI(systemPrompt, userPrompt, retries = 3) {
            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
            };
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    return candidate.content.parts[0].text;
                } else {
                    throw new Error("Invalid response structure from API.");
                }
            } catch (error) {
                console.error("API Error:", error);
                if (retries > 0) {
                    await new Promise(res => setTimeout(res, (4 - retries) * 1000));
                    return callGeminiAPI(systemPrompt, userPrompt, retries - 1);
                } else {
                    return "Sorry, I'm having trouble connecting to the AI. Please try again later. (Error: API Limit)";
                }
            }
        }
        
        /**
         * Handles setting the city and transitioning to the main menu.
         * @param {string} city 
         * @param {string | null} nextFeature - Optional feature to load after city selection
         */
        function handleCitySelection(city, nextFeature = null) {
            currentCity = city;
            // The following elements are guaranteed to exist now that we are inside window.onload
            if (selectedCityDashboard) selectedCityDashboard.textContent = currentCity; 
            if (mainMenuCity) mainMenuCity.textContent = currentCity; 
            
            if (nextFeature) {
                // If a feature is specified (Map, Offline), load it directly
                loadDashboardFeature(nextFeature);
            } else {
                // Otherwise, go to the general Main Menu (Screen 4)
                showScreen('menu');
            }
        }


        /**
         * Renders the controls and content for the current feature
         * @param {string} featureId - 'discover', 'route', 'ai', 'events', 'info', 'offline', 'safety', 'profile', 'admin', 'map'
         */
        function loadDashboardFeature(featureId) {
            currentFeature = featureId;

            // 1. Set Controls Panel Content
            controlsPanel.innerHTML = templates[`${featureId}Controls`] || templates.offlineSim; 
            
            // 2. Set Main View Visibility and Title
            [discoverView, routeView, aiView, eventsView, infoView, safetyView, profileView, adminView, mapView].forEach(view => view.classList.add('hidden'));

            if (featureId === 'discover') {
                discoverView.classList.remove('hidden');
                contentTitle.textContent = "Featured Attractions";
                renderAttractions('all');
                attachDiscoverListeners();
            } else if (featureId === 'route') {
                routeView.classList.remove('hidden');
                contentTitle.textContent = "Route Planner";
                attachRouteListeners();
            } else if (featureId === 'ai') {
                aiView.classList.remove('hidden');
                contentTitle.textContent = "AI Itinerary Generation";
                attachAIListeners();
            } else if (featureId === 'events') { 
                eventsView.classList.remove('hidden');
                contentTitle.textContent = `Local Events in ${currentCity}`;
                renderMockEvents();
                attachEventsListeners();
            } else if (featureId === 'info') { 
                infoView.classList.remove('hidden');
                contentTitle.textContent = "Tourist Information Hub";
            } else if (featureId === 'safety') { 
                safetyView.classList.remove('hidden');
                contentTitle.textContent = "Safety and Emergency Information";
                attachSafetyListeners();
            } else if (featureId === 'profile') { 
                profileView.classList.remove('hidden');
                contentTitle.textContent = "User Profile and App Settings";
                attachProfileListeners();
            } else if (featureId === 'admin') {
                adminView.classList.remove('hidden');
                contentTitle.textContent = "Admin Dashboard (Sim.)";
                // attachAdminListeners(); // If needed later
            } else if (featureId === 'map') { // NEW MAP
                mapView.classList.remove('hidden');
                contentTitle.textContent = "General Map View";
                // attachMapListeners(); // If needed later
            }
             else if (featureId === 'offline') {
                 // Offline map simulation uses the controls panel as its display area
                 controlsPanel.innerHTML = templates.offlineSim;
                 contentTitle.textContent = "Offline Map Access";
                 // Hide main content area for this view
                 discoverView.classList.add('hidden');
                 routeView.classList.add('hidden');
                 aiView.classList.add('hidden');
                 eventsView.classList.add('hidden');
                 infoView.classList.add('hidden');
                 safetyView.classList.add('hidden');
                 profileView.classList.add('hidden');
                 adminView.classList.add('hidden');
                 mapView.classList.add('hidden');
            }
            
            showScreen('dashboard');
        }

        function showModal(title, content) {
            modalTitle.textContent = title;
            if (content) {
                modalBody.innerText = content; 
            } else {
                modalBody.innerHTML = `<div class="flex items-center justify-center h-24"><div class="spinner text-indigo-600"></div></div>`;
            }
            modalOverlay.style.display = 'flex';
        }

        function attachDiscoverListeners() {
            const dynamicCategoryBtns = controlsPanel.querySelectorAll('.category-btn');
            const dynamicSearchInput = controlsPanel.querySelector('#search-input');
            
            // Category buttons
            dynamicCategoryBtns.forEach(btn => {
                btn.onclick = () => {
                    renderAttractions(btn.dataset.category);
                };
            });

            // Search input
            if(dynamicSearchInput) {
                dynamicSearchInput.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        renderAttractions(dynamicSearchInput.value);
                    }
                };
            }

            // AI Tips Button (Delegation)
            // Ensure we only attach this once
            if (!attractionsListView.getAttribute('data-tips-listener')) {
                attractionsListView.setAttribute('data-tips-listener', 'true');
                attractionsListView.addEventListener('click', async (e) => {
                    const tipsBtn = e.target.closest('.get-tips-btn');
                    if (!tipsBtn || isAILoading) return;

                    isAILoading = true;
                    tipsBtn.disabled = true;

                    const originalBtnText = tipsBtn.innerHTML;
                    tipsBtn.innerHTML = '<div class="spinner"></div>';

                    const attractionName = tipsBtn.dataset.name;
                    const attractionType = tipsBtn.dataset.type;

                    showModal(`Tips for ${attractionName}`, ''); 

                    const systemPrompt = "You are a local expert and tourist guide. Provide 3 concise 'Insider Tips' for the given location. These could be hidden gems nearby, what to eat, the best time to visit, or a fun fact. Keep the response under 100 words. Do not use Markdown, just plain text.";
                    const userPrompt = `What are your top insider tips for ${attractionName}, which is a ${attractionType} in ${currentCity}?`;

                    const tips = await callGeminiAPI(systemPrompt, userPrompt);

                    modalBody.innerText = tips; 
                    tipsBtn.innerHTML = originalBtnText;
                    tipsBtn.disabled = false;
                    isAILoading = false;
                });
            }
        }

        function attachRouteListeners() {
            const dynamicRouteForm = controlsPanel.querySelector('#route-form-dynamic');
            if(dynamicRouteForm) {
                dynamicRouteForm.onsubmit = (e) => {
                    e.preventDefault(); 
                    const routeCity = controlsPanel.querySelector('#route-city-input').value.trim();
                    const source = document.getElementById('source').value;
                    const destination = document.getElementById('destination').value;
                    
                    if (!routeCity || !source || !destination) {
                        showModal("Input Required", "Please enter a Trip City, Source, and Destination.");
                        return;
                    }
                    
                    // Update global city state for display on the dashboard header (S5)
                    currentCity = routeCity;
                    selectedCityDashboard.textContent = routeCity;
                    
                    contentTitle.textContent = `Route in ${routeCity}: ${source} to ${destination}`;
                };
            }
        }
        
        function attachAIListeners() {
            const dynamicAiPlanBtn = controlsPanel.querySelector('#ai-plan-btn-dynamic');
            const dynamicAiPromptInput = controlsPanel.querySelector('#ai-prompt-dynamic');
            const aiItineraryOutput = document.getElementById('ai-itinerary-output');

            if(dynamicAiPlanBtn) {
                dynamicAiPlanBtn.onclick = async () => {
                    const aiCityInput = controlsPanel.querySelector('#ai-city-input');
                    const aiCity = aiCityInput.value.trim();
                    const userPrompt = dynamicAiPromptInput.value;
                    
                    if (!aiCity || !userPrompt) {
                        showModal("Input Required", "Please enter a Trip Destination and your request.");
                        return;
                    }

                    dynamicAiPlanBtn.disabled = true;
                    isAILoading = true;
                    const originalBtnText = dynamicAiPlanBtn.innerHTML;
                    dynamicAiPlanBtn.innerHTML = `<span class="spinner"></span> Generating...`;
                    
                    // Update global city state for display on the dashboard header (S5)
                    currentCity = aiCity;
                    selectedCityDashboard.textContent = aiCity;

                    contentTitle.textContent = "✨ Generating Your AI Itinerary...";
                    aiItineraryOutput.innerHTML = `<div class="flex items-center justify-center p-12"><div class="spinner text-indigo-600 w-12 h-12"></div></div>`;
                    
                    const systemPrompt = "You are a helpful and creative tour guide. Generate a concise, step-by-step itinerary based on the user's request for a specific city. Format the output with simple headings (e.g., 'Morning:', 'Afternoon:') and bullet points. Be friendly and enthusiastic. Do not use Markdown, just plain text with newlines.";
                    const fullUserPrompt = `Create a tourist itinerary for ${aiCity} based on this request: "${userPrompt}"`;

                    const itinerary = await callGeminiAPI(systemPrompt, fullUserPrompt);

                    contentTitle.textContent = "✨ Your AI-Generated Itinerary";
                    aiItineraryOutput.innerHTML = `
                        <div class="bg-white p-6 rounded-lg shadow-md">
                            <p class="text-gray-700" style="white-space: pre-wrap; word-wrap: break-word;">${itinerary}</p>
                        </div>
                    `;

                    dynamicAiPlanBtn.innerHTML = originalBtnText;
                    dynamicAiPlanBtn.disabled = false;
                    isAILoading = false;
                };
            }
        }

        function attachEventsListeners() {
            const eventsList = document.getElementById('events-list');

            // Event Delegation for Event Summary/Translation
            // Ensure we only attach this once
            if (!eventsList.getAttribute('data-events-listener')) {
                eventsList.setAttribute('data-events-listener', 'true');
                eventsList.addEventListener('click', async (e) => {
                    const detailsBtn = e.target.closest('.event-details-btn');
                    if (!detailsBtn || isAILoading) return;

                    isAILoading = true;
                    detailsBtn.disabled = true;
                    const originalBtnText = detailsBtn.innerHTML;
                    detailsBtn.innerHTML = '<div class="spinner"></div>';
                    
                    const eventName = detailsBtn.dataset.eventName;
                    const eventLocation = detailsBtn.dataset.eventLocation;
                    const eventDetails = mockEventsData.find(e => e.name === eventName)?.details || "No complex details available, simulate based on name.";

                    showModal(`Event: ${eventName}`, '');

                    const systemPrompt = "You are a marketing copywriter specializing in tourism. Write a 4-sentence summary of the event's appeal, focusing on what a tourist should know. Then, add a line break and translate the full summary into Spanish. Use the format: 'Summary: [English Summary] \n\n Spanish: [Spanish Summary]'. Do not use markdown.";
                    const userPrompt = `Summarize and translate the appeal of this event: ${eventName} happening at ${eventLocation} in ${currentCity}.`;

                    const summary = await callGeminiAPI(systemPrompt, userPrompt);
                    modalBody.innerText = summary;
                    
                    detailsBtn.innerHTML = originalBtnText;
                    detailsBtn.disabled = false;
                    isAILoading = false;
                });
            }
        }

        function attachSafetyListeners() {
            const generateSafetyBtn = controlsPanel.querySelector('#generate-safety-advice-btn');
            const safetyOutput = document.getElementById('safety-advice-output');

            if(generateSafetyBtn) {
                generateSafetyBtn.onclick = async () => {
                    isAILoading = true;
                    generateSafetyBtn.disabled = true;
                    safetyOutput.innerHTML = `<div class="flex items-center gap-2 text-orange-600"><div class="spinner"></div> Generating local advice...</div>`;
                    
                    const systemPrompt = "You are a non-alarming security expert focused on tourist safety. Generate three highly practical and specific safety tips for visiting a major city in India. Focus on transport, crowded areas, and handling local services (like taxis or street vendors). Present the tips concisely using bullet points.";
                    const userPrompt = `Generate current safety advice for a tourist visiting ${currentCity}.`;
                    
                    const advice = await callGeminiAPI(systemPrompt, userPrompt);
                    
                    // Format advice for display
                    safetyOutput.style.whiteSpace = 'pre-wrap';
                    safetyOutput.innerText = advice;

                    generateSafetyBtn.disabled = false;
                    isAILoading = false;
                };
            }
        }

        function attachProfileListeners() {
            const generateBioBtn = controlsPanel.querySelector('#generate-bio-btn');
            const profileBioInput = document.getElementById('profile-bio-input'); // Re-query since this is a dynamic template

            if(generateBioBtn) {
                generateBioBtn.onclick = async () => {
                    const currentBio = profileBioInput.value.trim();
                    
                    isAILoading = true;
                    generateBioBtn.disabled = true;
                    const originalBtnText = generateBioBtn.innerHTML;
                    generateBioBtn.innerHTML = `<span class="spinner"></span> Writing Bio...`;

                    const systemPrompt = "You are a social media personality profile generator. Rewrite the user's current bio into a short, enthusiastic, and fun profile bio, appropriate for a travel app. Keep it one short, punchy paragraph (max 2 sentences).";
                    const userPrompt = `Rewrite this bio to sound enthusiastic about travel: "${currentBio}"`;
                    
                    const newBio = await callGeminiAPI(systemPrompt, userPrompt);
                    
                    profileBioInput.value = newBio.trim();

                    generateBioBtn.innerHTML = originalBtnText;
                    generateBioBtn.disabled = false;
                    isAILoading = false;
                };
            }
        }
