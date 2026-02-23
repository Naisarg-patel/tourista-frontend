// ============ MAP UI INTERACTION CONTROLLER ============
// Handles all user interactions with the map views

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

        // === NEW MAP CONTROLS (Google Maps Style) ===
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
                    tourMap.centerObject(markers.userLocation);
                    console.log('Map centered on user location');
                }
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
            }, 200);
        } else {
            initializeMapViewControls();
        }
    } else if (viewName === 'route') {
        console.log('🛣️ Route view activated');
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
