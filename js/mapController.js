// ============ MAP UI INTERACTION CONTROLLER ============
// Handles all user interactions with the map views

// Ensure MAP_PROVIDER exists (defaults to Leaflet/OpenStreetMap)
window.MAP_PROVIDER = window.MAP_PROVIDER || 'leaflet';

/**
 * Initialize map view controls and event listeners
 */
function initializeMapViewControls() {
    try {
        console.log('🗺️ Initializing map view controls...');

        // === NEW ROUTE PLANNING CONTROLS ===
        const setStartBtn = document.getElementById('set-start-btn');
        const setEndBtn = document.getElementById('set-end-btn');
        const drawRouteBtn = document.getElementById('draw-route-btn');
        const clearRouteBtn = document.getElementById('clear-route-btn');
        const addStopBtn = document.getElementById('add-stop-btn');
        const startPointInput = document.getElementById('start-point-input');
        const endPointInput = document.getElementById('end-point-input');
        const stopInput = document.getElementById('stop-input');

        // Set Start Button
        if (setStartBtn) {
            setStartBtn.addEventListener('click', async () => {
                const address = startPointInput.value.trim();
                if (!address) {
                    alert('Please enter a start location');
                    return;
                }
                const result = await setStartPointByName(address);
                if (result) {
                    console.log(`✅ Start point set: ${address}`);
                    startPointInput.value = ''; // Clear input
                } else {
                    alert('Could not find location: ' + address);
                }
            });
        }

        // Set End Button
        if (setEndBtn) {
            setEndBtn.addEventListener('click', async () => {
                const address = endPointInput.value.trim();
                if (!address) {
                    alert('Please enter an end location');
                    return;
                }
                const result = await setEndPointByName(address);
                if (result) {
                    console.log(`✅ End point set: ${address}`);
                    endPointInput.value = ''; // Clear input
                } else {
                    alert('Could not find location: ' + address);
                }
            });
        }

        // Draw Route Button
        if (drawRouteBtn) {
            drawRouteBtn.addEventListener('click', async () => {
                if (!startPoint || !endPoint) {
                    alert('Please set both start and end points first');
                    return;
                }

                // Draw route through all stops
                const stopsArray = getStops();
                const result = await drawRouteWithStops(
                    startPoint.lat,
                    startPoint.lng,
                    endPoint.lat,
                    endPoint.lng,
                    stopsArray,
                    '#4F46E5'
                );

                if (result) {
                    console.log(`✅ Route drawn successfully`);
                    // Display stops list
                    displayStops();
                } else {
                    alert('Could not find route between selected points');
                }
            });
        }

        // Clear Route Button
        if (clearRouteBtn) {
            clearRouteBtn.addEventListener('click', () => {
                clearRoute();
                clearAllStops();
                clearAllPinPoints();
                startPoint = null;
                endPoint = null;
                console.log('✅ Route and all stops cleared');
                
                // Update UI
                const routeInfoPanel = document.getElementById('route-info-panel');
                if (routeInfoPanel) {
                    routeInfoPanel.style.display = 'none';
                }
                displayStops(); // Refresh stops list
            });
        }

        // Add Stop Button
        if (addStopBtn) {
            addStopBtn.addEventListener('click', async () => {
                const stopName = stopInput.value.trim();
                if (!stopName) {
                    alert('Please enter a stop location name');
                    return;
                }

                const stop = await addStopByName(stopName);
                if (stop) {
                    console.log(`✅ Stop added: ${stopName}`);
                    stopInput.value = ''; // Clear input
                    displayStops(); // Refresh stops list

                    // Update stops count
                    const stopsCount = document.getElementById('stops-count');
                    if (stopsCount) {
                        stopsCount.textContent = getStops().length;
                    }
                } else {
                    alert('Could not find location: ' + stopName);
                }
            });
        }

        // Allow Enter key on inputs
        if (startPointInput) {
            startPointInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') setStartBtn.click();
            });
        }

        if (endPointInput) {
            endPointInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') setEndBtn.click();
            });
        }

        if (stopInput) {
            stopInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addStopBtn.click();
            });
        }

        // enter on map search should trigger go button too
        const mapSearchInputEl = document.getElementById('map-search-input');
        const mapSearchBtnEl = document.getElementById('map-search-btn');
        if (mapSearchInputEl) {
            mapSearchInputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && mapSearchBtnEl) mapSearchBtnEl.click();
            });
        }

        // === NEW MAP CONTROLS (Google Maps Style) ===

// geolocation helper
function locateUser() {
    if (!tourMap || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        if (MAP_PROVIDER === 'google') {
            if (markers.userLocation && markers.userLocation.setMap) {
                markers.userLocation.setMap(null);
            }
            markers.userLocation = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: tourMap,
                title: 'You are here',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#2e7d32',
                    fillOpacity: 0.8,
                    strokeColor: '#fff',
                    strokeWeight: 2
                }
            });
            tourMap.setCenter({ lat: latitude, lng: longitude });
            tourMap.setZoom(15);
        } else {
            if (markers.userLocation) {
                tourMap.removeLayer(markers.userLocation);
            }
            markers.userLocation = L.circleMarker([latitude, longitude], {
                radius: 8,
                fillColor: '#2e7d32',
                color: '#fff',
                weight: 2,
                fillOpacity: 0.8
            }).addTo(tourMap).bindPopup('You are here').openPopup();
            tourMap.setView([latitude, longitude], 15);
        }
        // show nearby attractions as pinpoints
        findAttractionsNearRoute([[latitude, longitude]], 3).then(nears => {
            nears.forEach(attr => {
                addPinPoint(attr.latitude, attr.longitude, {
                    title: attr.name,
                    category: attr.category,
                    icon: '📍',
                    color: getColorForCategory(attr.category)
                });
            });
        });
    }, err => {
        console.error('Geolocation error', err);
    });
}

        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const centerMapBtn = document.getElementById('center-map-btn');
        const toggleSatelliteBtn = document.getElementById('toggle-satellite-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (tourMap) {
                    tourMap.zoomIn();
                    console.log('Zoomed in');
                }
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                if (tourMap) {
                    tourMap.zoomOut();
                    console.log('Zoomed out');
                }
            });
        }

        if (centerMapBtn) {
            centerMapBtn.addEventListener('click', () => {
                if (MAP_PROVIDER === 'google') {
                    if (startPoint && endPoint) {
                        const bounds = new google.maps.LatLngBounds();
                        bounds.extend(startPoint);
                        bounds.extend(endPoint);
                        tourMap.fitBounds(bounds);
                        console.log('Map centered on route');
                    } else if (startPoint) {
                        tourMap.setCenter(startPoint);
                        tourMap.setZoom(13);
                        console.log('Map centered on start point');
                    } else if (markers.userLocation && markers.userLocation.getPosition) {
                        tourMap.setCenter(markers.userLocation.getPosition());
                        console.log('Map centered on user location');
                    }
                } else {
                    if (startPoint && endPoint) {
                        const bounds = L.latLngBounds([
                            [startPoint.lat, startPoint.lng],
                            [endPoint.lat, endPoint.lng]
                        ]);
                        tourMap.fitBounds(bounds, { padding: [100, 100] });
                        console.log('Map centered on route');
                    } else if (startPoint) {
                        tourMap.setView([startPoint.lat, startPoint.lng], 13);
                        console.log('Map centered on start point');
                    } else if (markers.userLocation) {
                        try {
                            let latlng = null;
                            if (markers.userLocation.getLatLng) {
                                latlng = markers.userLocation.getLatLng();
                            } else if (markers.userLocation.getPosition) {
                                const p = markers.userLocation.getPosition();
                                latlng = { lat: p.lat(), lng: p.lng() };
                            }
                            if (latlng) {
                                tourMap.setView([latlng.lat, latlng.lng], 13);
                                console.log('Map centered on user location');
                            }
                        } catch (err) {
                            console.warn('Could not center on user location:', err);
                        }
                    }
                }
            });
        }
        // geolocation control
        const locateBtn = document.getElementById('locate-btn');
        if (locateBtn) {
            locateBtn.addEventListener('click', () => {
                locateUser();
            });
        }

        if (toggleSatelliteBtn) {
            let isSatellite = false;
            toggleSatelliteBtn.addEventListener('click', () => {
                if (!tourMap) return;
                
                // Remove current tile layer
                tourMap.eachLayer(layer => {
                    if (layer instanceof L.TileLayer) {
                        tourMap.removeLayer(layer);
                    }
                });

                if (!isSatellite) {
                    // Switch to satellite
                    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                        attribution: 'Tiles © Esri',
                        maxZoom: 19
                    }).addTo(tourMap);
                    toggleSatelliteBtn.style.backgroundColor = '#DBEAFE';
                    console.log('Switched to satellite view');
                } else {
                    // Switch to normal map
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap',
                        maxZoom: 19
                    }).addTo(tourMap);
                    toggleSatelliteBtn.style.backgroundColor = 'white';
                    console.log('Switched to normal map');
                }
                isSatellite = !isSatellite;
            });
        }

        // === LOCATION SEARCH HELPERS ===
        function geocodeLocation(query) {
            // use Nominatim open geocoder
            return fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
                .then(r => r.json())
                .then(arr => arr && arr.length ? arr[0] : null);
        }

        const searchBtn = document.getElementById('map-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const q = document.getElementById('map-search-input')?.value;
                if (!q) return;
                geocodeLocation(q).then(loc => {
                    if (!loc) {
                        alert('Location not found');
                        return;
                    }
                    const lat = parseFloat(loc.lat), lon = parseFloat(loc.lon);
                    if (MAP_PROVIDER === 'google') {
                        tourMap.setCenter({ lat, lng: lon });
                        tourMap.setZoom(14);
                    } else {
                        tourMap.setView([lat, lon], 14);
                    }
                    // place a temporary marker
                    addPinPoint(lat, lon, { title: q, icon: '🔎' });
                }).catch(err => {
                    console.error('Geocode error', err);
                });
            });
        }

        // === OTHER OPTIONS (top-right menu) ===
        const otherOptionsBtn = document.getElementById('other-options-btn');
        const otherOptionsMenu = document.getElementById('other-options-menu');
        const toggleLegendBtn = document.getElementById('toggle-legend-btn');
        const showAllAttractionsBtn = document.getElementById('show-all-attractions-btn');
        const toggleClusterBtn = document.getElementById('toggle-cluster-btn');

        let clusteringEnabled = false;

        if (otherOptionsBtn && otherOptionsMenu) {
            otherOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                otherOptionsMenu.classList.toggle('hidden');
            });

            // close menu when clicking outside
            document.addEventListener('click', () => {
                if (!otherOptionsMenu.classList.contains('hidden')) otherOptionsMenu.classList.add('hidden');
            });
        }

        // Toggle legend visibility
        if (toggleLegendBtn) {
            toggleLegendBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const legend = document.getElementById('map-legend');
                if (legend) {
                    legend.classList.toggle('hidden');
                }
                otherOptionsMenu.classList.add('hidden');
            });
        }

        // Helper: fetch attractions inside bbox via Overpass (simple)
        async function fetchAttractionsByBBox(south, west, north, east) {
            try {
                const query = `[out:json][timeout:25];(node["amenity"](${south},${west},${north},${east});node["tourism"](${south},${west},${north},${east});node["shop"](${south},${west},${north},${east}););out body;`;
                const res = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`
                });
                if (!res.ok) throw new Error('Overpass request failed');
                const data = await res.json();
                return (data.elements || []).map(el => ({
                    name: el.tags && (el.tags.name || el.tags.amenity || el.tags.tourism || el.tags.shop) || 'POI',
                    latitude: el.lat,
                    longitude: el.lon,
                    category: el.tags && (el.tags.tourism || el.tags.amenity || el.tags.shop) || 'Other'
                }));
            } catch (err) {
                console.error('❌ Overpass fetch error', err);
                return [];
            }
        }

        // Show all attractions across route bbox
        if (showAllAttractionsBtn) {
            showAllAttractionsBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                otherOptionsMenu.classList.add('hidden');
                if (!tourMap) return;

                // Compute bbox from start/end if available, otherwise use current map bounds
                let south, west, north, east;
                if (startPoint && endPoint) {
                    const lats = [startPoint.lat, endPoint.lat];
                    const lngs = [startPoint.lng, endPoint.lng];
                    south = Math.min(...lats) - 0.5; // add buffer
                    north = Math.max(...lats) + 0.5;
                    west = Math.min(...lngs) - 0.5;
                    east = Math.max(...lngs) + 0.5;
                } else if (tourMap.getBounds) {
                    const b = tourMap.getBounds();
                    south = b.getSouth(); west = b.getWest(); north = b.getNorth(); east = b.getEast();
                } else {
                    alert('Set a route or zoom to the area first');
                    return;
                }

                showAlert('🔎 Fetching attractions across route area — this may take a moment');
                const pois = await fetchAttractionsByBBox(south, west, north, east);
                if (!pois || pois.length === 0) {
                    showAlert('No attractions found in bounding box');
                    return;
                }

                // clear previous pins (optional)
                clearAllPinPoints();

                pois.slice(0, 500).forEach(p => {
                    addPinPoint(p.latitude, p.longitude, { title: p.name, category: p.category, icon: '📍' });
                });

                showAlert(`✅ Added ${Math.min(pois.length,500)} attractions from bbox`);
            });
        }

        // Toggle clustering placeholder
        if (toggleClusterBtn) {
            toggleClusterBtn.addEventListener('click', () => {
                clusteringEnabled = !clusteringEnabled;
                showAlert(`Clustering ${clusteringEnabled ? 'enabled' : 'disabled'}`);
                otherOptionsMenu.classList.add('hidden');
            });
        }

        // Back button inside options menu
        const mapBackBtn = document.getElementById('map-back-btn');
        if (mapBackBtn) {
            mapBackBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Prefer going back to main feature select if available
                if (typeof showScreen === 'function') {
                    showScreen('feature');
                } else {
                    // fallback: click existing nav back button if present
                    const navBack = document.getElementById('back-to-menu-btn');
                    if (navBack) navBack.click();
                }
                otherOptionsMenu.classList.add('hidden');
            });
        }

        // === ATTRACTION FILTER BUTTONS ===
        const filterButtons = document.querySelectorAll('.attractions-filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active state from all buttons
                    filterButtons.forEach(b => {
                        b.classList.remove('bg-blue-100', 'text-blue-700');
                        b.classList.add('bg-gray-100', 'text-gray-700');
                    });

                    // Add active state to clicked button
                    btn.classList.remove('bg-gray-100', 'text-gray-700');
                    btn.classList.add('bg-blue-100', 'text-blue-700');

                    const filter = btn.dataset.filter;
                    filterAttractionsByCategory(filter);
                    console.log(`Filtering attractions: ${filter}`);
                });
            });
        }

        // === LEGACY ROUTE VIEW CONTROLS (Optional) ===
        const startTrackingBtn = document.getElementById('start-tracking-btn');
        const stopTrackingBtn = document.getElementById('stop-tracking-btn');
        const setRouteExampleBtn = document.getElementById('set-route-example-btn');
        const addAttractionsBtn = document.getElementById('add-attractions-to-map-btn');

        if (startTrackingBtn) {
            startTrackingBtn.addEventListener('click', () => {
                startLocationTracking(5000);
                startTrackingBtn.style.display = 'none';
                stopTrackingBtn.style.display = 'block';
            });
        }

        if (stopTrackingBtn) {
            stopTrackingBtn.addEventListener('click', () => {
                stopLocationTracking();
                startTrackingBtn.style.display = 'block';
                stopTrackingBtn.style.display = 'none';
            });
        }

        if (setRouteExampleBtn) {
            setRouteExampleBtn.addEventListener('click', () => {
                // Example: Mumbai to Bangalore route
                setStartPoint(19.0760, 72.8777, 'Mumbai Gateway of India');
                setEndPoint(12.9716, 77.5946, 'Bangalore Vidhana Soudha');
                drawRoute(19.0760, 72.8777, 12.9716, 77.5946, '#4F46E5');

                // Show route info
                const routeInfoPanel = document.getElementById('route-info-panel');
                if (routeInfoPanel) {
                    routeInfoPanel.style.display = 'block';
                    document.getElementById('route-distance').textContent = currentRoute ? currentRoute.distance + ' km' : '--';
                    document.getElementById('route-duration').textContent = currentRoute ? currentRoute.duration + ' min' : '--';
                    document.getElementById('pinpoint-count').textContent = pinPoints.length;
                }
            });
        }

        if (addAttractionsBtn) {
            addAttractionsBtn.addEventListener('click', async () => {
                try {
                    // Get current attractions from local storage or API
                    const city = currentCity || 'Ahmedabad';
                    console.log(`📍 Adding attractions from ${city} to map...`);

                    const attractions = await getAttractionsByCity(city, 'all');

                    if (attractions && attractions.length > 0) {
                        await addAttractionsToMap(attractions);

                        // Update pinpoint count
                        const pinpointCountEl = document.getElementById('pinpoint-count');
                        if (pinpointCountEl) {
                            pinpointCountEl.textContent = pinPoints.length;
                        }

                        console.log(`✅ Added ${attractions.length} attractions to map`);
                    } else {
                        console.warn('No attractions found for this city');
                    }
                } catch (error) {
                    console.error('❌ Error adding attractions:', error);
                }
            });
        }

        console.log('✅ Map view controls initialized');
    } catch (error) {
        console.error('❌ Error initializing map view controls:', error);
    }
}

/**
 * Initialize route view controls
 */
function initializeRouteViewControls() {
    try {
        console.log('🛣️ Initializing route view controls...');

        const mainRouteBtn = document.getElementById('use-main-route-btn');
        const altRouteBtn = document.getElementById('use-alt-route-btn');

        if (mainRouteBtn) {
            mainRouteBtn.addEventListener('click', () => {
                if (currentRoute) {
                    showAlert('✅ Main route selected and activated!');
                    console.log('Route info:', currentRoute);
                }
            });
        }

        if (altRouteBtn) {
            altRouteBtn.addEventListener('click', () => {
                showAlert('🌳 Alternative scenic route selected!');
            });
        }

        console.log('✅ Route view controls initialized');
    } catch (error) {
        console.error('❌ Error initializing route view controls:', error);
    }
}

/**
 * Update map when a city is selected
 */
async function updateMapWithCity(city) {
    try {
        if (!tourMap) {
            console.warn('Map not yet initialized');
            return;
        }

        console.log(`🗺️ Updating map for city: ${city}`);

        // Clear existing markers
        clearAllPinPoints();
        clearRoute();

        // Get attractions for the city
        const attractions = await getAttractionsByCity(city, 'all');

        if (attractions && attractions.length > 0) {
            // Add attractions to map
            await addAttractionsToMap(attractions);

            // Fit map to show all attractions
            if (pinPoints.length > 0) {
                const latitudes = pinPoints.map(p => p.lat);
                const longitudes = pinPoints.map(p => p.lng);
                const minLat = Math.min(...latitudes);
                const maxLat = Math.max(...latitudes);
                const minLng = Math.min(...longitudes);
                const maxLng = Math.max(...longitudes);

                tourMap.fitBounds([
                    [minLat, minLng],
                    [maxLat, maxLng]
                ], { padding: [50, 50] });

                console.log(`✅ Map updated with ${attractions.length} attractions`);
            }
        }
    } catch (error) {
        console.error('❌ Error updating map with city:', error);
    }
}

/**
 * Handle city selection for map
 */
document.addEventListener('citySelected', (event) => {
    const city = event.detail?.city;
    if (city && tourMap) {
        updateMapWithCity(city);
    }
});

/**
 * Auto-initialize map controls when map view is shown
 */
document.addEventListener('viewChanged', (event) => {
    const viewName = event.detail?.view;

    if (viewName === 'map') {
        console.log('🗺️ Map view activated');
        // Ensure map is initialized
        if (!tourMap) {
            setTimeout(() => {
                initializeMap('leaflet-map-container');
                initializeMapViewControls();
                updateMapWithCity(window.currentCity || 'Ahmedabad');
            }, 200);
        } else {
            initializeMapViewControls();
            updateMapWithCity(window.currentCity || 'Ahmedabad');
        }
    } else if (viewName === 'route') {
        console.log('🛣️ Route view activated');
        // Initialize route-specific map and controls
        if (window.MapController && typeof MapController.initializeRouteMap === 'function') {
            MapController.initializeRouteMap('route-map-container');
        }
        initializeRouteViewControls();
    }
});

/**
 * Initialize on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all other scripts are loaded
    setTimeout(() => {
        // Check if we're on the map or route view
        const mapView = document.getElementById('map-view');
        const routeView = document.getElementById('route-view');

        if (mapView && !mapView.classList.contains('hidden')) {
            console.log('Map view is active');
            initializeMapViewControls();
        }

        if (routeView && !routeView.classList.contains('hidden')) {
            console.log('Route view is active');
            initializeRouteViewControls();
        }

        console.log('✅ Map UI Controller Ready');
    }, 500);
});

/**
 * Filter attractions by category
 */
function filterAttractionsByCategory(category = 'all') {
    try {
        const attractionsContainer = document.getElementById('attractions-along-route');
        if (!attractionsContainer) return;

        // Get all attraction items
        const allItems = attractionsContainer.querySelectorAll('[data-category]');
        
        let visibleCount = 0;
        allItems.forEach(item => {
            const itemCategory = item.dataset.category;
            
            if (category === 'all' || itemCategory === category) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        console.log(`Showing ${visibleCount} attractions for category: ${category}`);
    } catch (error) {
        console.error('❌ Error filtering attractions:', error);
    }
}

/**
 * Check if attraction is major/popular
 */
function isMajorAttraction(attraction, attractionsArray) {
    try {
        if (!attraction) return false;
        
        // Mark as major if contains keywords or in top attractions
        const majorKeywords = ['taj', 'gateway', 'palace', 'fort', 'monument', 'temple', 'historic', 'unesco', 'famous', 'landmark', 'museum', 'national'];
        const name = (attraction.name || '').toLowerCase();
        
        const isFamousPlace = majorKeywords.some(keyword => name.includes(keyword));
        
        // Check if in top attractions for the city
        const sortedByRating = attractionsArray
            .filter(a => a.category === attraction.category)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);
        
        const isTopRated = sortedByRating.includes(attraction);
        
        return isFamousPlace || isTopRated;
    } catch (error) {
        return false;
    }
}

/**
 * Display attractions along route in UI (with major places highlighted)
 */

/**
 * Render the current stops list in the sidebar UI
 */
function displayStops() {
    const container = document.getElementById('stops-list');
    if (!container) return;

    const stopsArray = getStops();
    if (!stopsArray || stopsArray.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-xs text-center p-3">No stops yet</p>';
        return;
    }

    // build list
    container.innerHTML = '';
    stopsArray.forEach((stop, idx) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between gap-2 p-2 bg-gray-50 rounded shadow-sm';
        item.innerHTML = `
            <span class="flex-1 truncate">${stop.name}</span>
            <button data-index="${idx}" class="text-red-500 text-sm remove-stop-btn">✖️</button>
        `;
        container.appendChild(item);
    });

    // attach remove handlers
    container.querySelectorAll('.remove-stop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            const stop = stopsArray[idx];
            if (stop) {
                removeStop(stop.id);
                displayStops();
                const stopsCount = document.getElementById('stops-count');
                if (stopsCount) stopsCount.textContent = getStops().length;
            }
        });
    });
}

async function displayAttractionsAlongRoute() {
    try {
        const attractionsContainer = document.getElementById('attractions-along-route');
        if (!attractionsContainer) return;

        const route = currentRoute;
        if (!route || !route.coordinates) {
            attractionsContainer.innerHTML = '<p class="text-gray-400 text-xs text-center py-4">Draw route to see attractions</p>';
            return;
        }

        attractionsContainer.innerHTML = '<p class="text-gray-500 text-xs text-center py-2">🔍 Finding top places...</p>';

        const attractions = await findAttractionsNearRoute(route.coordinates, 3);

        if (!attractions || attractions.length === 0) {
            attractionsContainer.innerHTML = '<p class="text-gray-400 text-xs text-center py-4">No places found</p>';
            return;
        }

        const categoryIcons = {
            'Restaurant': '🍽️',
            'Mall': '🛍️',
            'Park': '🌳',
            'Museum': '🏛️',
            'Historical': '🏰',
            'Temple': '🕉️',
            'Entertainment': '🎭',
            'Beach': '🏖️',
            'Garden': '🌺',
            'Other': '⭐'
        };

        // Sort major attractions first
        const sorted = attractions.sort((a, b) => {
            const aIsMajor = isMajorAttraction(a, attractions) ? 1 : 0;
            const bIsMajor = isMajorAttraction(b, attractions) ? 1 : 0;
            return bIsMajor - aIsMajor;
        });

        const attractionsHtml = sorted.map(attr => {
            const category = attr.category || 'Other';
            const icon = categoryIcons[category] || '⭐';
            const distance = attr.distance ? `${attr.distance.toFixed(1)} km` : 'N/A';
            const isMajor = isMajorAttraction(attr, attractions);
            
            // Major attractions get special styling
            const majorClass = isMajor ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-300 shadow-md' : 'bg-green-50 border-green-300';

            return `
                <div class="attraction-item ${majorClass} border-l-4 p-3 rounded-lg mb-2 hover:shadow-lg transition cursor-pointer" 
                     data-category="${category.toLowerCase()}"
                     onclick="if(tourMap) tourMap.setView([${attr.latitude}, ${attr.longitude}], 16);">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1">
                            <div class="font-semibold text-gray-900 text-sm">
                                ${icon} ${attr.name}
                                ${isMajor ? '<span class="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold ml-1">🌟 MAJOR</span>' : ''}
                            </div>
                            <small class="text-gray-600 text-xs">${category}</small>
                        </div>
                        <span class="text-xs bg-white bg-opacity-75 text-gray-800 px-2 py-1 rounded font-semibold whitespace-nowrap">${distance}</span>
                    </div>
                </div>
            `;
        }).join('');

        attractionsContainer.innerHTML = attractionsHtml;
        console.log(`✅ Displayed ${attractions.length} places (${sorted.filter(a => isMajorAttraction(a, attractions)).length} major)`);

        // Reapply current filter
        const activeFilter = document.querySelector('.attractions-filter-btn.bg-blue-100');
        if (activeFilter) {
            filterAttractionsByCategory(activeFilter.dataset.filter);
        }
    } catch (error) {
        console.error('❌ Error displaying attractions:', error);
    }
}

/**
 * Show alert helper
 */
function showAlert(message) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (modal && modalTitle && modalBody) {
        modalTitle.textContent = 'Route Update';
        modalBody.innerHTML = `<p>${message}</p>`;
        modal.style.display = 'flex';
    } else {
        alert(message);
    }
}

// Export all map functions globally
window.MapController = {
    initializeMap,
    setStartPoint,
    setEndPoint,
    drawRoute,
    drawRouteWithStops,
    addPinPoint,
    addAttractionsToMap,
    addAttractionsNearRoute,
    startLocationTracking,
    stopLocationTracking,
    updateUserLocation,
    clearRoute,
    clearAllPinPoints,
    updateMapWithCity,
    initializeMapViewControls,
    initializeRouteViewControls,
    initializeRouteMap,
    calculateDistance,
    getPinPoints,
    exportMapData,
    // New functions
    geocodeAddress,
    setStartPointByName,
    setEndPointByName,
    addStopByName,
    addStop,
    removeStop,
    clearAllStops,
    getStops,
    findAttractionsNearRoute,
    displayStops,
    displayAttractionsAlongRoute,
    // Filtering & display
    filterAttractionsByCategory,
    isMajorAttraction
};
