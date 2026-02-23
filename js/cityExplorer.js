// ============ REAL-TIME CITY EXPLORER ============
// Fetch and display real attractions from backend

let selectedCityData = null;
let useRealAttractions = false;  // Toggle between seed data and real OSM attractions

/**
 * Load real attractions for a city from backend
 */
async function loadCityAttractions(city, category = 'all', useReal = false) {
    const contentTitle = document.getElementById('content-title');
    const attractionsListView = document.getElementById('attractions-list-view');
    
    if (!attractionsListView) return;
    
    // Show loading state
    attractionsListView.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Loading ' + (useReal ? 'real' : 'featured') + ' attractions...</p></div>';
    
    try {
        // Fetch attractions from backend
        let attractions;
        if (useReal) {
            console.log('📍 Fetching REAL attractions from OpenStreetMap...');
            attractions = await getRealAttractionsByCity(city, category);
        } else {
            console.log('📚 Fetching attractions from database...');
            attractions = await getAttractionsByCity(city, category);
        }
        
        if (!attractions || attractions.length === 0) {
            attractionsListView.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">No attractions found for this city and category.</p></div>';
            if (contentTitle) contentTitle.textContent = `${category === 'all' ? 'Featured Attractions' : category} in ${city}`;
            return;
        }
        
        // Update title with data source indicator
        if (contentTitle) {
            const dataSource = useReal ? '🌍 OSM' : '📚 DB';
            contentTitle.textContent = `${dataSource} ${attractions.length} ${category === 'all' ? 'Attractions' : category} in ${city}`;
        }
        
        // Clear and render attractions
        attractionsListView.innerHTML = '';
        
        attractions.forEach(attraction => {
            const statusClass = attraction.status === 'Open' 
                ? 'bg-green-100 text-green-800' 
                : attraction.status === 'Closed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800';
            
            const card = `
                <div class="bg-white p-4 rounded-lg shadow-md flex gap-4 overflow-hidden transition-all hover:shadow-lg cursor-pointer attraction-card" data-attraction-id="${attraction._id || 'osm-' + attraction.name}" data-attraction-name="${attraction.name}">
                    <img src="${attraction.image || 'https://placehold.co/600x400/6366f1/white?text=' + encodeURIComponent(attraction.name)}" alt="${attraction.name}" class="w-24 h-24 md:w-32 md:h-32 object-cover rounded-md flex-shrink-0">
                    <div class="flex-1 flex flex-col">
                        <h4 class="text-lg font-semibold text-gray-900">${attraction.name}</h4>
                        <p class="text-sm text-gray-600">${attraction.category || 'Other'}</p>
                        <p class="text-xs text-gray-500 mt-1 line-clamp-2">${attraction.description || 'No description available'}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <svg class="w-5 h-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clip-rule="evenodd" />
                            </svg>
                            <span class="font-bold text-gray-800">${attraction.rating ? attraction.rating.toFixed(1) : 'N/A'}</span>
                            <span class="text-xs font-semibold px-3 py-1 rounded-full ${statusClass}">${attraction.status || 'Unknown'}</span>
                        </div>
                        <p class="text-xs text-gray-600 mt-2">${attraction.address || 'No address available'}</p>
                        ${attraction.phone ? `<p class="text-xs text-gray-600">${attraction.phone}</p>` : ''}
                        ${attraction.latitude ? `<p class="text-xs text-gray-600">📍 ${attraction.latitude.toFixed(4)}, ${attraction.longitude.toFixed(4)}</p>` : ''}
                        <button class="view-details-btn group mt-3 ml-auto flex items-center justify-center gap-2 bg-indigo-100 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-200 transition duration-300 text-sm" data-attraction-name="${attraction.name}" data-attraction-city="${city}">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            View Details
                        </button>
                    </div>
                </div>
            `;
            attractionsListView.innerHTML += card;
        });
        
        // Attach event listeners to view details buttons
        attachAttractionDetailsListeners();
        
    } catch (error) {
        console.error('Error loading attractions:', error);
        attractionsListView.innerHTML = '<div class="text-center py-8"><p class="text-red-500">Error loading attractions. Please try again.</p></div>';
    }
}

/**
 * Attach event listeners to attraction detail buttons
 */
function attachAttractionDetailsListeners() {
    const buttons = document.querySelectorAll('.view-details-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = btn.dataset.attractionName;
            const city = btn.dataset.attractionCity;
            showAttractionDetails(name, city);
        });
    });
}

/**
 * Show attraction details in a modal
 */
function showAttractionDetails(attractionName, city) {
    const details = `
        <div class="space-y-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">${attractionName}</h3>
                <p class="text-sm text-gray-600 mt-2">Located in: ${city}</p>
            </div>
            <button class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition" onclick="generateAttractionTips('${attractionName}', '${city}')">
                Get AI Insights & Tips
            </button>
        </div>
    `;
    openModal(`${attractionName} Details`, details);
}

/**
 * Generate AI insights for an attraction
 */
async function generateAttractionTips(attractionName, city) {
    if (isAILoading || !typeof callGeminiAPI === 'function') return;
    
    isAILoading = true;
    
    try {
        const systemPrompt = `You are a knowledgeable travel guide with expertise in ${city}. Provide helpful tips and insights about the attraction.`;
        const userPrompt = `I'm visiting ${attractionName} in ${city}. Please provide:
1. Best time to visit
2. Tips for visiting
3. Nearby attractions
4. Food recommendations nearby
Keep it concise and helpful.`;
        
        const insights = await callGeminiAPI(systemPrompt, userPrompt);
        
        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">✨ AI Insights for ${attractionName}</h3>
                    <div class="bg-indigo-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                        ${insights}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error generating insights:', error);
        openModal('Error', 'Could not generate insights. Please try again.');
    } finally {
        isAILoading = false;
    }
}

/**
 * Handle category filter for city explorer
 */
function attachCategoryFilterListeners(city) {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active state from all buttons
            categoryBtns.forEach(b => b.classList.remove('border-indigo-500', 'bg-indigo-50'));
            // Add active state to clicked button
            btn.classList.add('border-indigo-500', 'bg-indigo-50');
            
            const category = btn.dataset.category || 'all';
            loadCityAttractions(city, category, useRealAttractions);
        });
    });
}

/**
 * Toggle between seed data and real attractions
 */
function toggleAttractionsMode(city, category = 'all') {
    useRealAttractions = !useRealAttractions;
    const toggleBtn = document.querySelector('[data-toggle-attractions]');
    if (toggleBtn) {
        toggleBtn.textContent = useRealAttractions 
            ? '📚 Show Database Attractions' 
            : '🌍 Show Real Attractions';
        toggleBtn.className = useRealAttractions 
            ? 'toggle-btn bg-blue-600 hover:bg-blue-700'
            : 'toggle-btn bg-green-600 hover:bg-green-700';
    }
    loadCityAttractions(city, category, useRealAttractions);
}

// Initialize when city explorer is loaded
document.addEventListener('DOMContentLoaded', () => {
    const discoverView = document.getElementById('discover-view');
    if (discoverView) {
        // Listen for when discover feature is activated
        document.addEventListener('discoverActivated', (e) => {
            const city = e.detail?.city || currentCity;
            loadCityAttractions(city, 'all');
            attachCategoryFilterListeners(city);
        });
    }
});
