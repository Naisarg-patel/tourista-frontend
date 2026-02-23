// ============ MAP VIEW MANAGEMENT (GOOGLE MAPS LIKE) ============
// Real-time map with routes, pinpoints, and live updates

let tourMap = null;
let routeLayer = null;
let markers = {};
let pinPoints = [];
let stops = [];  // NEW: Array to store stops along the route
let currentRoute = null;
let startPoint = null;
let endPoint = null;
let isTrackingLocation = false;
let locationUpdateInterval = null;

/**
 * Initialize Leaflet Map on DOM load
 */
function initializeMap(mapContainerId = 'leaflet-map-container') {
    try {
        const mapContainer = document.getElementById(mapContainerId);
        if (!mapContainer) {
            console.error(`Map container ${mapContainerId} not found`);
            return;
        }

        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('❌ Leaflet.js not loaded. Check CDN in HTML.');
            return;
        }

        // Invalidate map size to ensure proper rendering
        setTimeout(() => {
            if (mapContainer.classList.contains('hidden')) {
                console.warn('⚠️ Map container is hidden - waiting for it to be visible');
                // Hide any existing overlays (they will be recreated on next show)
                const ov = document.getElementById('map-loading-overlay');
                if (ov) ov.remove();
                // Wait a bit more for container to be visible
                setTimeout(() => initializeMap(mapContainerId), 200);
                return;
            }

            // Initialize Leaflet map centered on India
            tourMap = L.map(mapContainerId).setView([20.5937, 78.9629], 4);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 2
            }).addTo(tourMap);

            // Create feature groups for layers
            routeLayer = L.featureGroup().addTo(tourMap);

            // Make global for external access
            window.tourMap = tourMap;

            console.log('✅ Map initialized successfully');

            // Remove loading overlay if present once map is ready
            const overlay = document.getElementById('map-loading-overlay');
            if (overlay) {
                overlay.parentNode.removeChild(overlay);
                console.log('🗑️ Map loading overlay removed');
            }

            // Auto-fit to bounds when pinpoints are added
            tourMap.on('zoomend', () => {
                console.log('Map zoom level:', tourMap.getZoom());
            });

            // also hide overlay on leaflet load event (in case tiles take longer)
            tourMap.on('load', () => {
                const ov = document.getElementById('map-loading-overlay');
                if (ov) {
                    ov.remove();
                    console.log('🗑️ Map loading overlay removed on load');
                }
            });

            // Trigger re-render
            tourMap.invalidateSize();
        }, 50);

        return tourMap;
    } catch (error) {
        console.error('❌ Error initializing map:', error);
        return null;
    }
}

/**
 * Add or update start point marker
 */
function setStartPoint(latitude, longitude, title = 'Start') {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized yet');
            return;
        }

        // Remove old start marker
        if (markers.start) {
            tourMap.removeLayer(markers.start);
        }

        // Create blue marker for start point
        markers.start = L.circleMarker([latitude, longitude], {
            radius: 10,
            fillColor: '#4F46E5',
            color: '#000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        })
            .bindPopup(`<div class="font-semibold text-blue-600">📍 START: ${title}</div><small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>`)
            .addTo(tourMap);

        // Add label
        L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: 'start-marker-label',
                html: '<div class="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">START</div>',
                iconSize: [60, 20],
                iconAnchor: [30, 0]
            })
        }).addTo(tourMap);

        startPoint = { lat: latitude, lng: longitude, title };
        console.log(`✅ Start point set at (${latitude}, ${longitude})`);

        return markers.start;
    } catch (error) {
        console.error('❌ Error setting start point:', error);
    }
}

/**
 * Add or update end point marker
 */
function setEndPoint(latitude, longitude, title = 'End') {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized yet');
            return;
        }

        // Remove old end marker
        if (markers.end) {
            tourMap.removeLayer(markers.end);
        }

        // Create red marker for end point
        markers.end = L.circleMarker([latitude, longitude], {
            radius: 10,
            fillColor: '#EF4444',
            color: '#000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        })
            .bindPopup(`<div class="font-semibold text-red-600">🏁 END: ${title}</div><small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>`)
            .addTo(tourMap);

        // Add label
        L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: 'end-marker-label',
                html: '<div class="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">END</div>',
                iconSize: [60, 20],
                iconAnchor: [30, -20]
            })
        }).addTo(tourMap);

        endPoint = { lat: latitude, lng: longitude, title };
        console.log(`✅ End point set at (${latitude}, ${longitude})`);

        return markers.end;
    } catch (error) {
        console.error('❌ Error setting end point:', error);
    }
}

/**
 * Draw route between start and end points using OSRM (Open Source Routing Machine)
 */
async function drawRoute(startLat, startLon, endLat, endLon, color = '#4F46E5') {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized yet');
            return;
        }

        if (!startLat || !startLon || !endLat || !endLon) {
            console.error('❌ Invalid coordinates for route');
            return;
        }

        console.log(`📍 Calculating route from (${startLat}, ${startLon}) to (${endLat}, ${endLon})...`);

        // Use OSRM for free routing
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distance = (route.distance / 1000).toFixed(2); // km
            const duration = Math.round(route.duration / 60); // minutes

            // Draw the route line
            const polyline = L.polyline(coordinates, {
                color: color,
                weight: 4,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'route-polyline'
            }).addTo(tourMap);

            // Add gradient waypoints
            addWaypoints(coordinates);

            // Fit map to route
            const bounds = polyline.getBounds();
            tourMap.fitBounds(bounds, { padding: [50, 50] });

            currentRoute = {
                polyline: polyline,
                coordinates: coordinates,
                distance: distance,
                duration: duration,
                bounds: bounds
            };

            console.log(`✅ Route drawn: ${distance}km, ${duration} min`);

            // Return route info
            return {
                distance: distance,
                duration: duration,
                coordinates: coordinates,
                polyline: polyline
            };
        } else {
            console.error('❌ No route found between points');
            return null;
        }
    } catch (error) {
        console.error('❌ Error drawing route:', error);
        return null;
    }
}

/**
 * Add waypoint markers along the route
 */
function addWaypoints(coordinates, interval = 10) {
    try {
        if (!tourMap) {
            console.warn('⚠️ Map not initialized');
            return;
        }

        for (let i = 0; i < coordinates.length; i += interval) {
            const coord = coordinates[i];
            L.circleMarker(coord, {
                radius: 4,
                fillColor: '#8B5CF6',
                color: '#fff',
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.6
            }).addTo(tourMap);
        }

        console.log(`✅ Added ${Math.ceil(coordinates.length / interval)} waypoints`);
    } catch (error) {
        console.error('❌ Error adding waypoints:', error);
    }
}

/**
 * Add a custom pinpoint/marker on the map
 */
function addPinPoint(latitude, longitude, details = {}) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return;
        }

        const {
            title = 'Point of Interest',
            category = 'attraction',
            icon = '📍',
            color = '#F59E0B'
        } = details;

        const pinPoint = {
            id: Date.now(),
            lat: latitude,
            lng: longitude,
            title: title,
            category: category,
            timestamp: new Date().toISOString()
        };

        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-pinpoint',
            html: `<div class="flex flex-col items-center">
                <div class="bg-${color}-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-lg">
                    ${icon}
                </div>
                <div class="bg-white text-black text-xs px-2 py-1 rounded shadow-md mt-1 font-semibold whitespace-nowrap">
                    ${title}
                </div>
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });

        // Add marker to map
        const marker = L.marker([latitude, longitude], { icon: customIcon })
            .bindPopup(`
                <div class="text-sm">
                    <h4 class="font-bold text-gray-800">${title}</h4>
                    <p class="text-gray-600">Category: ${category}</p>
                    <p class="text-xs text-gray-500">Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}</p>
                    <p class="text-xs text-gray-400">${new Date(pinPoint.timestamp).toLocaleTimeString()}</p>
                </div>
            `)
            .addTo(tourMap);

        pinPoints.push(pinPoint);

        console.log(`✅ Pinpoint added: ${title} at (${latitude}, ${longitude})`);

        return pinPoint;
    } catch (error) {
        console.error('❌ Error adding pinpoint:', error);
    }
}

/**
 * Clear all route-related elements
 */
function clearRoute() {
    try {
        if (!tourMap) {
            console.warn('⚠️ Map not initialized');
            return;
        }

        if (currentRoute && currentRoute.polyline) {
            tourMap.removeLayer(currentRoute.polyline);
        }
        currentRoute = null;
        console.log('✅ Route cleared');
    } catch (error) {
        console.error('❌ Error clearing route:', error);
    }
}

/**
 * Start real-time location tracking (simulated for now)
 */
function startLocationTracking(interval = 5000) {
    try {
        if (isTrackingLocation) {
            console.log('Location tracking already active');
            return;
        }

        isTrackingLocation = true;
        console.log('📍 Starting location tracking...');

        locationUpdateInterval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        updateUserLocation(latitude, longitude, accuracy);
                    },
                    (error) => {
                        console.warn('⚠️ Geolocation error:', error.message);
                    }
                );
            }
        }, interval);

        console.log(`✅ Location tracking started (interval: ${interval}ms)`);
    } catch (error) {
        console.error('❌ Error starting location tracking:', error);
    }
}

/**
 * Stop location tracking
 */
function stopLocationTracking() {
    try {
        if (locationUpdateInterval) {
            clearInterval(locationUpdateInterval);
        }
        isTrackingLocation = false;
        console.log('✅ Location tracking stopped');
    } catch (error) {
        console.error('❌ Error stopping location tracking:', error);
    }
}

/**
 * Update user's current location on map (real-time)
 */
function updateUserLocation(latitude, longitude, accuracy = null) {
    try {
        if (!tourMap) {
            console.warn('⚠️ Map not initialized, cannot update location');
            return;
        }

        // Remove old user marker
        if (markers.userLocation) {
            tourMap.removeLayer(markers.userLocation);
        }

        // Create pulsing blue dot for current location
        markers.userLocation = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#06B6D4',
            color: '#0E7490',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8,
            className: 'user-location-marker pulse'
        })
            .bindPopup(`<div class="font-semibold text-cyan-600">📍 YOUR LOCATION</div><small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>${accuracy ? `<br><small>Accuracy: ±${Math.round(accuracy)}m</small>` : ''}`)
            .addTo(tourMap);

        // Center map on user only first time
        if (!markers._centerSet) {
            tourMap.setView([latitude, longitude], 15);
            markers._centerSet = true;
            console.log('📍 Map centered on your location');
        }

        console.log(`📍 Location updated: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    } catch (error) {
        console.error('❌ Error updating user location:', error);
    }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
}

/**
 * Add multiple attractions as pinpoints on the map
 */
async function addAttractionsToMap(attractions = []) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return;
        }

        console.log(`🗺️ Adding ${attractions.length} attractions to map...`);

        attractions.forEach((attraction) => {
            if (attraction.latitude && attraction.longitude) {
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
                    'Other': '📍'
                };

                const icon = categoryIcons[attraction.category] || '📍';

                addPinPoint(
                    attraction.latitude,
                    attraction.longitude,
                    {
                        title: attraction.name,
                        category: attraction.category,
                        icon: icon,
                        color: getColorForCategory(attraction.category)
                    }
                );
            }
        });

        // Auto-fit map to show all markers
        if (pinPoints.length > 0) {
            const group = new L.featureGroup(
                pinPoints.map((p, i) => L.circleMarker([p.lat, p.lng]))
            );
            tourMap.fitBounds(group.getBounds(), { padding: [50, 50] });
        }

        console.log(`✅ Added ${attractions.length} attractions to map`);
    } catch (error) {
        console.error('❌ Error adding attractions to map:', error);
    }
}

/**
 * Get color for category
 */
function getColorForCategory(category) {
    const colorMap = {
        'Restaurant': 'yellow',
        'Mall': 'pink',
        'Park': 'green',
        'Museum': 'purple',
        'Historical': 'red',
        'Temple': 'orange',
        'Entertainment': 'indigo',
        'Beach': 'blue',
        'Garden': 'teal',
        'Other': 'gray'
    };
    return colorMap[category] || 'gray';
}

/**
 * Get map center coordinates
 */
function getMapCenter() {
    try {
        if (tourMap) {
            const center = tourMap.getCenter();
            return { latitude: center.lat, longitude: center.lng };
        }
        console.warn('⚠️ Map not initialized');
        return null;
    } catch (error) {
        console.error('❌ Error getting map center:', error);
        return null;
    }
}

/**
 * Get all current pinpoints
 */
function getPinPoints() {
    return pinPoints;
}

/**
 * Remove a specific pinpoint
 */
function removePinPoint(pinPointId) {
    try {
        pinPoints = pinPoints.filter(p => p.id !== pinPointId);
        console.log(`✅ Pinpoint ${pinPointId} removed`);
    } catch (error) {
        console.error('❌ Error removing pinpoint:', error);
    }
}

/**
 * Clear all pinpoints
 */
function clearAllPinPoints() {
    try {
        if (!tourMap) {
            console.warn('⚠️ Map not initialized');
            pinPoints = [];
            return;
        }

        // Remove all markers from map
        Object.keys(markers).forEach(key => {
            if (markers[key] && tourMap.hasLayer(markers[key])) {
                // Only clear attraction markers, not start/end/user location
                if (key === 'attractions' || (key.startsWith('pinpoint_'))) {
                    tourMap.removeLayer(markers[key]);
                }
            }
        });

        pinPoints = [];
        console.log('✅ All pinpoints cleared');
    } catch (error) {
        console.error('❌ Error clearing pinpoints:', error);
    }
}

/**
 * Export map data
 */
function exportMapData() {
    try {
        return {
            startPoint: startPoint,
            endPoint: endPoint,
            route: currentRoute ? {
                distance: currentRoute.distance,
                duration: currentRoute.duration
            } : null,
            pinPoints: pinPoints,
            mapCenter: getMapCenter(),
            mapZoom: tourMap ? tourMap.getZoom() : null,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Error exporting map data:', error);
        return {};
    }
}

/**
 * Add a stop along the route
 */
function addStop(latitude, longitude, stopName) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return null;
        }

        const stop = {
            id: Date.now(),
            lat: latitude,
            lng: longitude,
            name: stopName,
            timestamp: new Date().toISOString()
        };

        // Create stop marker (amber/yellow color)
        const stopMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#F59E0B',
            color: '#000',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
            zIndex: 350
        })
            .bindPopup(`<div class="font-semibold text-amber-600">🛑 STOP: ${stopName}</div><small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>`)
            .addTo(tourMap);

        // Add label
        L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: 'stop-marker-label',
                html: `<div class="bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold shadow-lg">${stops.length + 1}</div>`,
                iconSize: [40, 20],
                iconAnchor: [20, -10]
            })
        }).addTo(tourMap);

        stop.marker = stopMarker;
        stops.push(stop);

        console.log(`✅ Stop added: ${stopName} at (${latitude}, ${longitude})`);
        return stop;
    } catch (error) {
        console.error('❌ Error adding stop:', error);
        return null;
    }
}

/**
 * Remove a specific stop
 */
function removeStop(stopId) {
    try {
        if (!tourMap) return;

        const stopIndex = stops.findIndex(s => s.id === stopId);
        if (stopIndex !== -1) {
            const stop = stops[stopIndex];
            
            // Remove marker from map
            if (stop.marker && tourMap.hasLayer(stop.marker)) {
                tourMap.removeLayer(stop.marker);
            }

            stops.splice(stopIndex, 1);
            console.log(`✅ Stop removed: ${stop.name}`);
        }
    } catch (error) {
        console.error('❌ Error removing stop:', error);
    }
}

/**
 * Clear all stops
 */
function clearAllStops() {
    try {
        if (!tourMap) {
            stops = [];
            return;
        }

        stops.forEach(stop => {
            if (stop.marker && tourMap.hasLayer(stop.marker)) {
                tourMap.removeLayer(stop.marker);
            }
        });

        stops = [];
        console.log('✅ All stops cleared');
    } catch (error) {
        console.error('❌ Error clearing stops:', error);
    }
}

/**
 * Get all stops
 */
function getStops() {
    return stops;
}

/**
 * Find attractions within a certain distance from a route
 */
async function findAttractionsNearRoute(routeCoordinates, searchRadius = 2) {
    try {
        // Get current city or use default
        const city = window.currentCity || 'Ahmedabad';
        
        // Fetch attractions for the city
        const attractions = await getAttractionsByCity(city, 'all');
        
        if (!attractions || attractions.length === 0) {
            return [];
        }

        // Filter attractions that are close to the route
        const nearbyAttractions = attractions.filter(attraction => {
            if (!attraction.latitude || !attraction.longitude) return false;

            // Check distance from each point on the route
            for (let coordinate of routeCoordinates) {
                const distance = calculateDistance(
                    coordinate[0], coordinate[1],
                    attraction.latitude, attraction.longitude
                );

                // If within search radius (km), include it
                if (distance <= searchRadius) {
                    return true;
                }
            }
            return false;
        });

        console.log(`✅ Found ${nearbyAttractions.length} attractions near route`);
        return nearbyAttractions;
    } catch (error) {
        console.error('❌ Error finding attractions near route:', error);
        return [];
    }
}

/**
 * Add attractions near route as pinpoints on map
 */
async function addAttractionsNearRoute(routeCoordinates) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return [];
        }

        const nearbyAttractions = await findAttractionsNearRoute(routeCoordinates, 3); // 3 km radius

        nearbyAttractions.forEach(attraction => {
            if (attraction.latitude && attraction.longitude) {
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

                const icon = categoryIcons[attraction.category] || '⭐';

                addPinPoint(
                    attraction.latitude,
                    attraction.longitude,
                    {
                        title: attraction.name,
                        category: attraction.category,
                        icon: icon,
                        color: getColorForCategory(attraction.category)
                    }
                );
            }
        });

        console.log(`✅ Added ${nearbyAttractions.length} nearby attractions to map`);
        return nearbyAttractions;
    } catch (error) {
        console.error('❌ Error adding attractions near route:', error);
        return [];
    }
}

/**
 * Draw route through multiple stops (if provided)
 */
async function drawRouteWithStops(startLat, startLon, endLat, endLon, stopsArray = [], color = '#4F46E5') {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized yet');
            return;
        }

        if (!startLat || !startLon || !endLat || !endLon) {
            console.error('❌ Invalid coordinates for route');
            return;
        }

        console.log(`📍 Calculating route with ${stopsArray.length} stops...`);

        // Build waypoints string for OSRM
        let waypointsStr = `${startLon},${startLat}`;
        
        // Add stops to waypoints
        stopsArray.forEach(stop => {
            waypointsStr += `;${stop.lng},${stop.lat}`;
        });
        
        // Add end point
        waypointsStr += `;${endLon},${endLat}`;

        // Use OSRM for free routing
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const distance = (route.distance / 1000).toFixed(2); // km
            const duration = Math.round(route.duration / 60); // minutes

            // Draw the route line
            const polyline = L.polyline(coordinates, {
                color: color,
                weight: 4,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'route-polyline'
            }).addTo(tourMap);

            // Add gradient waypoints
            addWaypoints(coordinates);

            // Get attractions near route and add them
            await addAttractionsNearRoute(coordinates);

            // Fit map to route
            const bounds = polyline.getBounds();
            tourMap.fitBounds(bounds, { padding: [50, 50] });

            currentRoute = {
                polyline: polyline,
                coordinates: coordinates,
                distance: distance,
                duration: duration,
                bounds: bounds,
                stopsCount: stopsArray.length
            };

            console.log(`✅ Route drawn: ${distance}km, ${duration} min, ${stopsArray.length} stops`);

            // Update UI with route info
            const routeInfoPanel = document.getElementById('route-info-panel');
            if (routeInfoPanel) {
                routeInfoPanel.style.display = 'block';
                document.getElementById('route-distance').textContent = distance + ' km';
                document.getElementById('route-duration').textContent = duration + ' min';
                document.getElementById('stops-count').textContent = stopsArray.length;
            }

            // Return route info
            return {
                distance: distance,
                duration: duration,
                coordinates: coordinates,
                polyline: polyline,
                stopsCount: stopsArray.length
            };
        } else {
            console.error('❌ No route found between points');
            return null;
        }
    } catch (error) {
        console.error('❌ Error drawing route with stops:', error);
        return null;
    }
}

/**
 * Geocode address to coordinates (using Nominatim OpenStreetMap API - free, no key needed)
 */
async function geocodeAddress(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            console.log(`✅ Geocoded ${address} to (${result.lat}, ${result.lon})`);
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                displayName: result.display_name
            };
        } else {
            console.error(`❌ Could not geocode address: ${address}`);
            return null;
        }
    } catch (error) {
        console.error('❌ Error geocoding address:', error);
        return null;
    }
}

/**
 * Set start point with address/name
 */
async function setStartPointByName(addressOrName) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return null;
        }

        console.log(`🔍 Finding start point: ${addressOrName}...`);

        // Try to geocode the address
        const geocoded = await geocodeAddress(addressOrName);

        if (geocoded) {
            setStartPoint(geocoded.latitude, geocoded.longitude, addressOrName);
            tourMap.setView([geocoded.latitude, geocoded.longitude], 13);
            return geocoded;
        } else {
            console.warn('⚠️ Could not find location, using center of map as fallback');
            // Fallback to example coordinates
            return null;
        }
    } catch (error) {
        console.error('❌ Error setting start point by name:', error);
        return null;
    }
}

/**
 * Set end point with address/name
 */
async function setEndPointByName(addressOrName) {
    try {
        if (!tourMap) {
            console.error('❌ Map not initialized');
            return null;
        }

        console.log(`🔍 Finding end point: ${addressOrName}...`);

        // Try to geocode the address
        const geocoded = await geocodeAddress(addressOrName);

        if (geocoded) {
            setEndPoint(geocoded.latitude, geocoded.longitude, addressOrName);
            return geocoded;
        } else {
            console.warn('⚠️ Could not find location');
            return null;
        }
    } catch (error) {
        console.error('❌ Error setting end point by name:', error);
        return null;
    }
}

/**
 * Add stop with address/name
 */
async function addStopByName(addressOrName) {
    try {
        console.log(`🔍 Finding stop location: ${addressOrName}...`);

        // Try to geocode the address
        const geocoded = await geocodeAddress(addressOrName);

        if (geocoded) {
            const stop = addStop(geocoded.latitude, geocoded.longitude, addressOrName);
            return stop;
        } else {
            console.warn('⚠️ Could not find location');
            return null;
        }
    } catch (error) {
        console.error('❌ Error adding stop by name:', error);
        return null;
    }
}

// Map is now initialized when the map-view is shown in featureSelect.js
// This allows proper rendering since Leaflet needs visible containers
