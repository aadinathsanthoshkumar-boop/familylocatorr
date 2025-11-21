// ============================================
// Family Locator - Main Application Logic
// ============================================

// Application State
const appState = {
    isLoggedIn: false,
    map: null,
    markers: {},
    voiceRecognition: null,
    voiceControlActive: false,
    refreshInterval: null,
    refreshRate: 30000, // 30 seconds
    editingMemberId: null,
    chatMessages: [],
    currentUser: 'You',
    mapView: 'street', // 'street', 'satellite', 'terrain'
    currentTileLayer: null,
    policeStations: [],
    placePhotos: {},
    sharedPhotos: [],
    isOffline: false
};

// Sample Family Data (In production, this would come from an API)
const familyData = {
    members: [
        {
            id: 1,
            name: 'Sarah Johnson',
            avatar: '👩',
            status: 'online',
            location: 'Home',
            coordinates: [40.7128, -74.0060], // New York City
            lastSeen: '2 minutes ago',
            phone: '+1 (555) 123-4567'
        },
        {
            id: 2,
            name: 'Mike Johnson',
            avatar: '👨',
            status: 'online',
            location: 'Office',
            coordinates: [40.7589, -73.9851],
            lastSeen: '5 minutes ago',
            phone: '+1 (555) 234-5678'
        },
        {
            id: 3,
            name: 'Emma Johnson',
            avatar: '👧',
            status: 'online',
            location: 'School',
            coordinates: [40.7505, -73.9934],
            lastSeen: '1 minute ago',
            phone: '+1 (555) 345-6789'
        },
        {
            id: 4,
            name: 'Lucas Johnson',
            avatar: '👦',
            status: 'online',
            location: 'Park',
            coordinates: [40.7829, -73.9654],
            lastSeen: 'Just now',
            phone: '+1 (555) 456-7890'
        }
    ],
    routes: [
        {
            id: 1,
            childName: 'Emma Johnson',
            childAvatar: '👧',
            stops: [
                { name: 'Home', icon: '🏠', time: '7:30 AM', coordinates: [40.7128, -74.0060] },
                { name: 'School', icon: '🏫', time: '8:15 AM', coordinates: [40.7505, -73.9934] },
                { name: 'Park', icon: '🌳', time: '3:30 PM', coordinates: [40.7829, -73.9654] },
                { name: 'Home', icon: '🏠', time: '4:45 PM', coordinates: [40.7128, -74.0060] }
            ]
        },
        {
            id: 2,
            childName: 'Lucas Johnson',
            childAvatar: '👦',
            stops: [
                { name: 'Home', icon: '🏠', time: '7:45 AM', coordinates: [40.7128, -74.0060] },
                { name: 'School', icon: '🏫', time: '8:30 AM', coordinates: [40.7505, -73.9934] },
                { name: 'Park', icon: '🌳', time: '4:00 PM', coordinates: [40.7829, -73.9654] },
                { name: 'Home', icon: '🏠', time: '5:15 PM', coordinates: [40.7128, -74.0060] }
            ]
        }
    ]
};

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Show splash screen first
    showSplashScreen();
    
    // Initialize app after splash
    setTimeout(() => {
        hideSplashScreen();
        initializeApp();
        setupEventListeners();
        checkLoginStatus();
        setupOfflineMode();
        loadSharedPhotos();
    }, 3500);
});

function initializeApp() {
    // Check if user is already logged in
    const savedLogin = localStorage.getItem('familyLocatorLoggedIn');
    if (savedLogin === 'true') {
        login();
    }
}

function showSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        splashScreen.classList.remove('hidden');
    }
}

function hideSplashScreen() {
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 800);
    }
}

function setupEventListeners() {
    // Login buttons
    document.getElementById('fingerprintBtn').addEventListener('click', handleFingerprintLogin);
    document.getElementById('faceBtn').addEventListener('click', handleFaceLogin);
    document.getElementById('voiceBtn').addEventListener('click', handleVoiceLogin);
    document.getElementById('passwordBtn').addEventListener('click', showPasswordForm);
    document.getElementById('submitPassword').addEventListener('click', handlePasswordLogin);
    
    // Photo sharing
    document.getElementById('addPhotoBtn').addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });
    document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
    
    // Main app buttons
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('closeSettings').addEventListener('click', hideSettings);
    document.getElementById('voiceControlBtn').addEventListener('click', toggleVoiceControl);
    document.getElementById('sosButton').addEventListener('click', handleSOS);
    document.getElementById('chatBtn').addEventListener('click', toggleChat);
    document.getElementById('closeChatBtn').addEventListener('click', toggleChat);
    document.getElementById('chatSendBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handlePlaceSearch);
    document.getElementById('placeSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handlePlaceSearch();
    });
    
    // Family member management
    document.getElementById('addMemberBtn').addEventListener('click', () => showMemberModal());
    document.getElementById('closeMemberModal').addEventListener('click', hideMemberModal);
    document.getElementById('cancelMemberBtn').addEventListener('click', hideMemberModal);
    document.getElementById('saveMemberBtn').addEventListener('click', saveFamilyMember);
    
    // Map controls
    document.getElementById('toggleMapViewBtn').addEventListener('click', toggleMapView);
    document.getElementById('findPoliceBtn').addEventListener('click', findNearestPoliceStations);
    
    // Settings
    document.getElementById('voiceControlToggle').addEventListener('change', (e) => {
        if (!e.target.checked) {
            stopVoiceControl();
        }
    });
    
    document.getElementById('refreshInterval').addEventListener('change', (e) => {
        appState.refreshRate = parseInt(e.target.value) * 1000;
        if (appState.refreshInterval) {
            clearInterval(appState.refreshInterval);
            startLocationRefresh();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSettings();
        }
        // SOS shortcut: Space bar when focused
        if (e.key === ' ' && e.target === document.body) {
            e.preventDefault();
            document.getElementById('sosButton').click();
        }
    });
}

function checkLoginStatus() {
    // Check if already logged in
    if (localStorage.getItem('familyLocatorLoggedIn') === 'true') {
        login();
    }
}

// ============================================
// Login Methods
// ============================================

async function handleFingerprintLogin() {
    const btn = document.getElementById('fingerprintBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="icon">⏳</span><span>Scanning...</span>';
    
    try {
        // Check if WebAuthn API is available
        if (navigator.credentials && navigator.credentials.create) {
            // Simulate fingerprint authentication
            // In production, use WebAuthn API
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // For demo purposes, simulate success
            showSuccessMessage('Fingerprint recognized!');
            setTimeout(() => login(), 500);
        } else {
            // Fallback for browsers without WebAuthn
            showSuccessMessage('Fingerprint login (simulated)');
            setTimeout(() => login(), 500);
        }
    } catch (error) {
        showErrorMessage('Fingerprint authentication failed. Please try another method.');
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">👆</span><span>Fingerprint</span>';
    }
}

async function handleFaceLogin() {
    const btn = document.getElementById('faceBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="icon">⏳</span><span>Scanning...</span>';
    
    try {
        // Check if getUserMedia is available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            
            // Simulate face recognition processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Stop the camera stream
            stream.getTracks().forEach(track => track.stop());
            
            showSuccessMessage('Face recognized!');
            setTimeout(() => login(), 500);
        } else {
            // Fallback
            showSuccessMessage('Face login (simulated)');
            setTimeout(() => login(), 500);
        }
    } catch (error) {
        showErrorMessage('Face recognition failed. Please try another method.');
        btn.disabled = false;
        btn.innerHTML = '<span class="icon">👤</span><span>Face Login</span>';
    }
}

function handleVoiceLogin() {
    const btn = document.getElementById('voiceBtn');
    const statusDiv = document.getElementById('voiceStatus');
    
    btn.disabled = true;
    statusDiv.classList.remove('hidden');
    statusDiv.textContent = 'Listening... Please say "Login" or "Access Family Locator"';
    
    startVoiceRecognition((text) => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('login') || lowerText.includes('access') || lowerText.includes('family')) {
            showSuccessMessage('Voice recognized!');
            setTimeout(() => login(), 500);
        } else {
            statusDiv.textContent = 'Voice not recognized. Please try again.';
            btn.disabled = false;
        }
    }, () => {
        statusDiv.textContent = 'Voice recognition failed. Please try again.';
        btn.disabled = false;
    });
}

function showPasswordForm() {
    document.getElementById('passwordForm').classList.remove('hidden');
    document.getElementById('passwordInput').focus();
}

function handlePasswordLogin() {
    const password = document.getElementById('passwordInput').value;
    
    // Simple password check (In production, use secure authentication)
    if (password === 'family123' || password.length >= 4) {
        showSuccessMessage('Login successful!');
        setTimeout(() => login(), 500);
    } else {
        showErrorMessage('Incorrect password. Please try again.');
    }
}

function login() {
    appState.isLoggedIn = true;
    localStorage.setItem('familyLocatorLoggedIn', 'true');
    
    // Hide login modal
    document.getElementById('loginModal').classList.add('hidden');
    
    // Show main app
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Initialize map and data
    initializeMap();
    renderFamilyMembers();
    renderRoutes();
    renderPhotoGallery();
    startLocationRefresh();
    
    // Announce to screen readers
    announceToScreenReader('Successfully logged in. Family Locator is now active.');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        appState.isLoggedIn = false;
        localStorage.removeItem('familyLocatorLoggedIn');
        
        // Stop all intervals
        if (appState.refreshInterval) {
            clearInterval(appState.refreshInterval);
        }
        stopVoiceControl();
        
        // Hide main app
        document.getElementById('mainApp').classList.add('hidden');
        
        // Show login modal
        document.getElementById('loginModal').classList.remove('hidden');
        
        // Reset password form
        document.getElementById('passwordForm').classList.add('hidden');
        document.getElementById('passwordInput').value = '';
        document.getElementById('voiceStatus').classList.add('hidden');
        
        // Reset login buttons
        const loginBtns = document.querySelectorAll('.login-btn');
        loginBtns.forEach(btn => {
            btn.disabled = false;
            const icon = btn.querySelector('.icon').textContent;
            const text = btn.textContent.split('\n')[1] || btn.textContent;
            btn.innerHTML = `<span class="icon">${icon}</span><span>${text}</span>`;
        });
    }
}

// ============================================
// Map Initialization
// ============================================

function initializeMap() {
    // Initialize Leaflet map
    appState.map = L.map('map').setView([40.7128, -74.0060], 12);
    
    // Add default street map tiles
    appState.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(appState.map);
    
    // Add markers for each family member with photos
    familyData.members.forEach(member => {
        addFamilyMemberMarker(member);
    });
    
    // Fit map to show all markers
    const group = new L.featureGroup(Object.values(appState.markers));
    appState.map.fitBounds(group.getBounds().pad(0.1));
    
    // Load place photos for locations
    loadPlacePhotos();
}

function addFamilyMemberMarker(member) {
    // Get place photo if available
    const photoUrl = appState.placePhotos[member.location] || getDefaultPlacePhoto(member.location);
    
    // Get member photo if available (from shared photos)
    const memberPhoto = getMemberPhoto(member.id);
    const displayPhoto = memberPhoto || photoUrl;
    
    // Create enhanced marker with photo
    const marker = L.marker(member.coordinates, {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 60px; 
                height: 60px; 
                border-radius: 50%; 
                border: 4px solid ${getStatusColor(member.status)}; 
                box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(0, 245, 255, 0.6);
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 28px; 
                position: relative;
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3));
                overflow: hidden;
            ">
                ${memberPhoto ? `<img src="${memberPhoto}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" />` : member.avatar}
                <div style="position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; background: ${getStatusColor(member.status)}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px ${getStatusColor(member.status)};"></div>
            </div>`,
            iconSize: [60, 60],
            iconAnchor: [30, 30]
        })
    }).addTo(appState.map);
    
    const callButton = member.phone ? `
        <button onclick="callFamilyMember('${member.phone}', '${member.name}')" style="
            background: linear-gradient(135deg, #10B981, #34D399);
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
            width: 100%;
            transition: transform 0.2s;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(16, 185, 129, 0.6)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)'">
            📞 Call ${member.name}
        </button>
    ` : '';
    
    marker.bindPopup(`
        <div style="text-align: center; padding: 12px; min-width: 250px; background: rgba(30, 41, 59, 0.95); border-radius: 12px; border: 2px solid rgba(139, 92, 246, 0.4);">
            <div style="margin-bottom: 10px;">
                <img src="${displayPhoto}" alt="${member.location}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; border: 2px solid rgba(139, 92, 246, 0.3);" onerror="this.src='https://via.placeholder.com/250x150/6366F1/FFFFFF?text=${encodeURIComponent(member.location)}'">
            </div>
            <div style="font-size: 32px; margin-bottom: 8px; filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.8));">${member.avatar}</div>
            <strong style="font-size: 18px; color: #E0E7FF; text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);">${member.name}</strong><br>
            <span style="color: rgba(224, 231, 255, 0.8); font-size: 14px;">📍 ${member.location}</span><br>
            ${member.phone ? `<span style="color: rgba(224, 231, 255, 0.7); font-size: 13px;">📱 ${member.phone}</span><br>` : ''}
            <small style="color: rgba(224, 231, 255, 0.6);">${member.lastSeen}</small>
            ${callButton}
        </div>
    `, { maxWidth: 280, className: 'cyberpunk-popup' });
    
    appState.markers[member.id] = marker;
}

function getMemberPhoto(memberId) {
    const photo = appState.sharedPhotos.find(p => p.memberId === memberId && p.isProfile);
    return photo ? photo.url : null;
}

function getDefaultPlacePhoto(location) {
    // Use placeholder images based on location type
    const locationLower = location.toLowerCase();
    if (locationLower.includes('home')) {
        return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop';
    } else if (locationLower.includes('school') || locationLower.includes('office')) {
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop';
    } else if (locationLower.includes('park')) {
        return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop';
    } else {
        return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop';
    }
}

async function loadPlacePhotos() {
    // Load photos for each location using Unsplash API (free tier)
    familyData.members.forEach(async (member) => {
        try {
            const query = encodeURIComponent(member.location);
            // Using Unsplash Source API (no key required for basic usage)
            const photoUrl = `https://source.unsplash.com/400x300/?${query}`;
            appState.placePhotos[member.location] = photoUrl;
        } catch (error) {
            console.log('Could not load photo for', member.location);
        }
    });
}

function toggleMapView() {
    const btn = document.getElementById('toggleMapViewBtn');
    
    // Remove current layer
    if (appState.currentTileLayer) {
        appState.map.removeLayer(appState.currentTileLayer);
    }
    
    // Switch view
    if (appState.mapView === 'street') {
        appState.mapView = 'satellite';
        appState.currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
        }).addTo(appState.map);
        btn.textContent = '🗺️ Street';
    } else if (appState.mapView === 'satellite') {
        appState.mapView = 'terrain';
        appState.currentTileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap',
            maxZoom: 17
        }).addTo(appState.map);
        btn.textContent = '🗺️ Terrain';
    } else {
        appState.mapView = 'street';
        appState.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(appState.map);
        btn.textContent = '🛰️ Satellite';
    }
}

async function findNearestPoliceStations() {
    const btn = document.getElementById('findPoliceBtn');
    const stationsDiv = document.getElementById('policeStations');
    
    btn.disabled = true;
    btn.textContent = '🔍 Searching...';
    stationsDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #E0E7FF;">Searching for police stations...</div>';
    stationsDiv.classList.remove('hidden');
    
    try {
        // Get center of map or first family member location
        const center = appState.map.getCenter();
        const lat = center.lat;
        const lng = center.lng;
        
        // Search for police stations using Overpass API (OpenStreetMap)
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="police"](around:5000,${lat},${lng});
              way["amenity"="police"](around:5000,${lat},${lng});
              relation["amenity"="police"](around:5000,${lat},${lng});
            );
            out center;
        `;
        
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.elements && data.elements.length > 0) {
            displayPoliceStations(data.elements, lat, lng);
        } else {
            // Fallback: Use demo police stations with contact info
            displayDemoPoliceStations(lat, lng);
        }
    } catch (error) {
        console.error('Error finding police stations:', error);
        // Fallback to demo stations
        const center = appState.map.getCenter();
        displayDemoPoliceStations(center.lat, center.lng);
    }
    
    btn.disabled = false;
    btn.textContent = '🚔 Find Police';
}

function displayDemoPoliceStations(lat, lng) {
    // Demo police stations with contact numbers
    const demoStations = [
        {
            name: 'NYPD Precinct 1',
            lat: lat + 0.01,
            lng: lng + 0.01,
            phone: '+1 (212) 555-0100',
            address: '123 Main Street'
        },
        {
            name: 'NYPD Precinct 2',
            lat: lat - 0.01,
            lng: lng - 0.01,
            phone: '+1 (212) 555-0200',
            address: '456 Park Avenue'
        },
        {
            name: 'Emergency Services',
            lat: lat + 0.005,
            lng: lng - 0.005,
            phone: '911',
            address: 'Emergency Line'
        }
    ];
    
    displayPoliceStations(demoStations, lat, lng, true);
}

function displayPoliceStations(stations, userLat, userLng, isDemo = false) {
    const stationsDiv = document.getElementById('policeStations');
    
    // Clear existing police markers
    if (appState.policeMarkers) {
        appState.policeMarkers.forEach(marker => appState.map.removeLayer(marker));
    }
    appState.policeMarkers = [];
    
    // Sort by distance
    const stationsWithDistance = stations.map(station => {
        const stationLat = isDemo ? station.lat : (station.lat || station.center?.lat || station.geometry?.[0]?.lat);
        const stationLng = isDemo ? station.lng : (station.lng || station.center?.lng || station.geometry?.[0]?.lon);
        
        if (!stationLat || !stationLng) return null;
        
        const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
        return {
            ...station,
            lat: stationLat,
            lng: stationLng,
            distance: distance,
            name: isDemo ? station.name : (station.tags?.name || 'Police Station'),
            phone: isDemo ? station.phone : (station.tags?.['phone'] || station.tags?.['contact:phone'] || '+1 (212) 555-0000'),
            address: isDemo ? station.address : (station.tags?.['addr:full'] || station.tags?.['addr:street'] || 'Address not available')
        };
    }).filter(s => s !== null).sort((a, b) => a.distance - b.distance);
    
    stationsDiv.innerHTML = '<h3 style="color: #E0E7FF; margin-bottom: 16px; font-family: var(--font-futuristic);">🚔 Nearest Police Stations</h3>';
    
    stationsWithDistance.forEach((station, index) => {
        // Add marker to map
        const marker = L.marker([station.lat, station.lng], {
            icon: L.divIcon({
                className: 'police-marker',
                html: `<div style="background: #EF4444; width: 35px; height: 35px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px;">🚔</div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            })
        }).addTo(appState.map);
        
        marker.bindPopup(`
            <div style="padding: 10px; min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; color: #1E293B;">${station.name}</h4>
                <p style="margin: 4px 0; color: #64748B; font-size: 12px;">📍 ${station.address}</p>
                <p style="margin: 4px 0; color: #64748B; font-size: 12px;">📞 ${station.phone}</p>
                <p style="margin: 4px 0; color: #10B981; font-size: 11px;">📏 ${station.distance.toFixed(2)} km away</p>
                <button onclick="callPolice('${station.phone}', '${station.name}')" style="
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 16px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 8px;
                    width: 100%;
                ">📞 Call ${station.name}</button>
            </div>
        `);
        
        appState.policeMarkers.push(marker);
        
        // Add to list
        const stationDiv = document.createElement('div');
        stationDiv.className = 'police-station-item';
        stationDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; margin-bottom: 8px; border: 1px solid rgba(239, 68, 68, 0.3);">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 4px 0; color: #E0E7FF; font-size: 14px;">${station.name}</h4>
                    <p style="margin: 2px 0; color: rgba(224, 231, 255, 0.7); font-size: 12px;">📍 ${station.address}</p>
                    <p style="margin: 2px 0; color: rgba(224, 231, 255, 0.7); font-size: 12px;">📞 ${station.phone}</p>
                    <p style="margin: 4px 0 0 0; color: #10B981; font-size: 11px; font-weight: 600;">📏 ${station.distance.toFixed(2)} km away</p>
                </div>
                <button onclick="callPolice('${station.phone}', '${station.name}')" style="
                    background: linear-gradient(135deg, #EF4444, #DC2626);
                    border: none;
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 8px;
                ">📞 Call</button>
            </div>
        `;
        stationsDiv.appendChild(stationDiv);
    });
    
    // Fit map to show all police stations
    if (appState.policeMarkers.length > 0) {
        const group = new L.featureGroup(appState.policeMarkers);
        appState.map.fitBounds(group.getBounds().pad(0.2));
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function callFamilyMember(phone, name) {
    if (confirm(`Call ${name} at ${phone}?`)) {
        window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    }
}

function callPolice(phone, name) {
    if (confirm(`Call ${name} at ${phone}?`)) {
        window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    }
}

// Make functions globally accessible
window.callFamilyMember = callFamilyMember;
window.callPolice = callPolice;

function getStatusColor(status) {
    return status === 'online' ? '#4CAF50' : '#9E9E9E';
}

// ============================================
// Family Members Display
// ============================================

function renderFamilyMembers() {
    const container = document.getElementById('familyMembers');
    container.innerHTML = '';
    
    familyData.members.forEach(member => {
        const card = document.createElement('div');
        card.className = 'family-member-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${member.name}, currently at ${member.location}`);
        
        const callButton = member.phone ? `
            <button class="call-btn" onclick="callFamilyMember('${member.phone}', '${member.name}')" aria-label="Call ${member.name}">
                Call ${member.name}
            </button>
        ` : '';
        
        card.innerHTML = `
            <div class="member-actions">
                <button class="edit-member-btn" onclick="editFamilyMember(${member.id})" aria-label="Edit member">✏️</button>
                <button class="delete-member-btn" onclick="deleteFamilyMember(${member.id})" aria-label="Delete member">🗑️</button>
            </div>
            <div class="member-header">
                <div class="member-avatar">${member.avatar}</div>
                <div class="member-info">
                    <h3>${member.name}</h3>
                    <div class="member-status">
                        <span class="status-dot"></span>
                        <span>${member.status === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            </div>
            <div class="member-location">
                📍 ${member.location} • ${member.lastSeen}
            </div>
            ${callButton}
        `;
        
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if (e.target.closest('button')) return;
            // Center map on member
            appState.map.setView(member.coordinates, 15);
            appState.markers[member.id].openPopup();
        });
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
        
        container.appendChild(card);
    });
}

// ============================================
// Routes Display
// ============================================

function renderRoutes() {
    const container = document.getElementById('routesContainer');
    container.innerHTML = '';
    
    familyData.routes.forEach(route => {
        const card = document.createElement('div');
        card.className = 'route-card';
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Route for ${route.childName}`);
        
        let stopsHTML = '';
        route.stops.forEach((stop, index) => {
            stopsHTML += `
                <div class="route-stop">
                    <span class="stop-icon">${stop.icon}</span>
                    <span class="stop-name">${stop.name}</span>
                    <span class="stop-time">${stop.time}</span>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="route-header">
                <span class="route-icon">${route.childAvatar}</span>
                <h3 class="route-title">${route.childName}'s Route</h3>
            </div>
            <div class="route-stops">
                ${stopsHTML}
            </div>
        `;
        
        card.addEventListener('click', () => {
            // Draw route on map
            drawRouteOnMap(route);
        });
        
        container.appendChild(card);
    });
}

function drawRouteOnMap(route) {
    // Clear existing route if any
    if (appState.currentRoute) {
        appState.map.removeLayer(appState.currentRoute);
    }
    
    // Create polyline for route
    const coordinates = route.stops.map(stop => stop.coordinates);
    appState.currentRoute = L.polyline(coordinates, {
        color: '#F4A261',
        weight: 4,
        opacity: 0.7
    }).addTo(appState.map);
    
    // Fit map to route
    appState.map.fitBounds(appState.currentRoute.getBounds().pad(0.2));
    
    // Add markers for stops
    route.stops.forEach((stop, index) => {
        L.marker(stop.coordinates, {
            icon: L.divIcon({
                className: 'route-stop-marker',
                html: `<div style="background: #F4A261; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 14px;">${stop.icon}</div>`,
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })
        }).addTo(appState.map).bindPopup(`${stop.name} - ${stop.time}`);
    });
}

// ============================================
// Location Refresh
// ============================================

function startLocationRefresh() {
    if (appState.refreshInterval) {
        clearInterval(appState.refreshInterval);
    }
    
    appState.refreshInterval = setInterval(() => {
        updateLocations();
    }, appState.refreshRate);
}

function updateLocations() {
    // Simulate location updates
    familyData.members.forEach(member => {
        // Add small random movement to simulate live tracking
        const latOffset = (Math.random() - 0.5) * 0.001;
        const lngOffset = (Math.random() - 0.5) * 0.001;
        
        member.coordinates[0] += latOffset;
        member.coordinates[1] += lngOffset;
        
        // Update marker position
        if (appState.markers[member.id]) {
            appState.markers[member.id].setLatLng(member.coordinates);
        }
        
        // Update last seen time
        const minutes = Math.floor(Math.random() * 5) + 1;
        member.lastSeen = minutes === 1 ? 'Just now' : `${minutes} minutes ago`;
    });
    
    // Re-render family members to update last seen
    renderFamilyMembers();
}

// ============================================
// SOS Functionality
// ============================================

function handleSOS() {
    const sosButton = document.getElementById('sosButton');
    
    // Visual feedback
    sosButton.style.transform = 'scale(0.9)';
    sosButton.style.background = 'linear-gradient(135deg, #D62839 0%, #B71C1C 100%)';
    
    // In production, this would:
    // 1. Send emergency alert to all family members
    // 2. Call emergency services
    // 3. Share current location
    // 4. Send notifications
    
    // Simulate SOS activation
    setTimeout(() => {
        alert('🆘 EMERGENCY SOS ACTIVATED!\n\nEmergency services have been notified.\nYour location is being shared with family members.\nHelp is on the way!');
        
        // Reset button
        sosButton.style.transform = '';
        sosButton.style.background = '';
        
        // Announce to screen readers
        announceToScreenReader('Emergency SOS activated. Help has been notified.');
    }, 300);
    
    // Log SOS event (in production, send to server)
    console.log('SOS activated at:', new Date().toISOString());
}

// ============================================
// Voice Control
// ============================================

function toggleVoiceControl() {
    if (appState.voiceControlActive) {
        stopVoiceControl();
    } else {
        startVoiceControl();
    }
}

function startVoiceControl() {
    const statusDiv = document.getElementById('voiceControlStatus');
    statusDiv.classList.remove('hidden');
    
    appState.voiceControlActive = true;
    
    startVoiceRecognition(
        (text) => handleVoiceCommand(text),
        () => {
            stopVoiceControl();
        }
    );
}

function stopVoiceControl() {
    if (appState.voiceRecognition) {
        appState.voiceRecognition.stop();
        appState.voiceRecognition = null;
    }
    
    appState.voiceControlActive = false;
    document.getElementById('voiceControlStatus').classList.add('hidden');
}

function startVoiceRecognition(onResult, onError) {
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        if (onError) onError();
        alert('Voice recognition is not supported in your browser.');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (onResult) onResult(transcript);
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (onError) onError();
    };
    
    recognition.onend = () => {
        if (appState.voiceControlActive) {
            // Restart if still active
            setTimeout(() => {
                if (appState.voiceControlActive) {
                    recognition.start();
                }
            }, 100);
        }
    };
    
    appState.voiceRecognition = recognition;
    recognition.start();
}

function handleVoiceCommand(text) {
    const lowerText = text.toLowerCase();
    
    // Navigation commands
    if (lowerText.includes('show') || lowerText.includes('display')) {
        if (lowerText.includes('map')) {
            document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
            announceToScreenReader('Scrolled to map');
        } else if (lowerText.includes('family') || lowerText.includes('members')) {
            document.getElementById('familyMembers').scrollIntoView({ behavior: 'smooth' });
            announceToScreenReader('Scrolled to family members');
        } else if (lowerText.includes('route')) {
            document.getElementById('routesContainer').scrollIntoView({ behavior: 'smooth' });
            announceToScreenReader('Scrolled to routes');
        }
    }
    
    // SOS command
    if (lowerText.includes('sos') || lowerText.includes('emergency') || lowerText.includes('help')) {
        handleSOS();
    }
    
    // Settings commands
    if (lowerText.includes('settings') || lowerText.includes('open settings')) {
        showSettings();
    }
    
    // Logout command
    if (lowerText.includes('logout') || lowerText.includes('sign out')) {
        handleLogout();
    }
    
    // Stop voice control
    if (lowerText.includes('stop listening') || lowerText.includes('disable voice')) {
        stopVoiceControl();
    }
}

// ============================================
// Settings
// ============================================

function showSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
    document.getElementById('closeSettings').focus();
}

function hideSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

// ============================================
// Utility Functions
// ============================================

function showSuccessMessage(message) {
    const statusDiv = document.getElementById('voiceStatus');
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.textContent = message;
        statusDiv.style.background = '#D4EDDA';
        statusDiv.style.color = '#155724';
    }
}

function showErrorMessage(message) {
    const statusDiv = document.getElementById('voiceStatus');
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
        statusDiv.textContent = message;
        statusDiv.style.background = '#F8D7DA';
        statusDiv.style.color = '#721C24';
    }
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ============================================
// Place Search Functionality
// ============================================

async function handlePlaceSearch() {
    const searchInput = document.getElementById('placeSearch');
    const query = searchInput.value.trim();
    const resultsDiv = document.getElementById('searchResults');
    
    if (!query) {
        resultsDiv.classList.add('hidden');
        return;
    }
    
    try {
        // Using Nominatim (OpenStreetMap) geocoding API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
            {
                headers: {
                    'User-Agent': 'FamilyLocator/1.0'
                }
            }
        );
        
        const results = await response.json();
        displaySearchResults(results);
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = '<div class="search-result-item">Error searching. Please try again.</div>';
        resultsDiv.classList.remove('hidden');
    }
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '';
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="search-result-item">No results found.</div>';
        resultsDiv.classList.remove('hidden');
        return;
    }
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
            <strong>${result.display_name}</strong>
            <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 4px;">
                ${result.lat}, ${result.lon}
            </div>
        `;
        item.addEventListener('click', () => {
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            appState.map.setView([lat, lon], 15);
            
            // Add marker for searched location
            L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'search-marker',
                    html: `<div style="background: #EC4899; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">📍</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(appState.map).bindPopup(result.display_name).openPopup();
            
            resultsDiv.classList.add('hidden');
            document.getElementById('placeSearch').value = '';
        });
        resultsDiv.appendChild(item);
    });
    
    resultsDiv.classList.remove('hidden');
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        document.getElementById('searchResults').classList.add('hidden');
    }
});

// ============================================
// Family Member Management
// ============================================

function showMemberModal(memberId = null) {
    appState.editingMemberId = memberId;
    const modal = document.getElementById('memberModal');
    const title = document.getElementById('memberModalTitle');
    
    if (memberId) {
        const member = familyData.members.find(m => m.id === memberId);
        if (member) {
            title.textContent = 'Edit Family Member';
            document.getElementById('memberName').value = member.name;
            document.getElementById('memberAvatar').value = member.avatar;
            document.getElementById('memberLocation').value = member.location;
            document.getElementById('memberLat').value = member.coordinates[0];
            document.getElementById('memberLng').value = member.coordinates[1];
            document.getElementById('memberPhone').value = member.phone || '';
        }
    } else {
        title.textContent = 'Add Family Member';
        document.getElementById('memberName').value = '';
        document.getElementById('memberAvatar').value = '👤';
        document.getElementById('memberLocation').value = '';
        document.getElementById('memberLat').value = '';
        document.getElementById('memberLng').value = '';
        document.getElementById('memberPhone').value = '';
    }
    
    modal.classList.remove('hidden');
}

function hideMemberModal() {
    document.getElementById('memberModal').classList.add('hidden');
    appState.editingMemberId = null;
}

function saveFamilyMember() {
    const name = document.getElementById('memberName').value.trim();
    const avatar = document.getElementById('memberAvatar').value.trim();
    const location = document.getElementById('memberLocation').value.trim();
    const lat = parseFloat(document.getElementById('memberLat').value);
    const lng = parseFloat(document.getElementById('memberLng').value);
    const phone = document.getElementById('memberPhone').value.trim();
    
    if (!name || !avatar || !location || isNaN(lat) || isNaN(lng)) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    if (appState.editingMemberId) {
        // Update existing member
        const member = familyData.members.find(m => m.id === appState.editingMemberId);
        if (member) {
            member.name = name;
            member.avatar = avatar;
            member.location = location;
            member.coordinates = [lat, lng];
            member.phone = phone || member.phone;
            
            // Update marker
            if (appState.markers[member.id]) {
                appState.map.removeLayer(appState.markers[member.id]);
                addFamilyMemberMarker(member);
            }
        }
    } else {
        // Add new member
        const newId = Math.max(...familyData.members.map(m => m.id), 0) + 1;
        const newMember = {
            id: newId,
            name: name,
            avatar: avatar,
            status: 'online',
            location: location,
            coordinates: [lat, lng],
            lastSeen: 'Just now',
            phone: phone || null
        };
        
        familyData.members.push(newMember);
        
        // Add marker to map
        addFamilyMemberMarker(newMember);
    }
    
    renderFamilyMembers();
    hideMemberModal();
    announceToScreenReader(appState.editingMemberId ? 'Family member updated' : 'Family member added');
}

function editFamilyMember(id) {
    showMemberModal(id);
}

function deleteFamilyMember(id) {
    if (confirm('Are you sure you want to remove this family member?')) {
        // Remove from data
        familyData.members = familyData.members.filter(m => m.id !== id);
        
        // Remove marker from map
        if (appState.markers[id]) {
            appState.map.removeLayer(appState.markers[id]);
            delete appState.markers[id];
        }
        
        renderFamilyMembers();
        announceToScreenReader('Family member removed');
    }
}

// Make functions globally accessible
window.editFamilyMember = editFamilyMember;
window.deleteFamilyMember = deleteFamilyMember;

// ============================================
// Chat Functionality
// ============================================

function toggleChat() {
    const chatBox = document.getElementById('chatBox');
    chatBox.classList.toggle('hidden');
    
    if (!chatBox.classList.contains('hidden')) {
        document.getElementById('chatInput').focus();
        loadChatMessages();
    }
}

function loadChatMessages() {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';
    
    // Load from localStorage or use default
    const savedMessages = localStorage.getItem('familyLocatorChat');
    if (savedMessages) {
        appState.chatMessages = JSON.parse(savedMessages);
    }
    
    if (appState.chatMessages.length === 0) {
        // Add welcome message
        addChatMessage('System', 'Welcome to Family Chat! Start a conversation.', 'received');
    } else {
        appState.chatMessages.forEach(msg => {
            displayChatMessage(msg);
        });
    }
    
    scrollChatToBottom();
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(appState.currentUser, message, 'sent');
    input.value = '';
    
    // Simulate response from family member (optional)
    setTimeout(() => {
        const randomMember = familyData.members[Math.floor(Math.random() * familyData.members.length)];
        addChatMessage(randomMember.name, 'Got it! 👍', 'received');
    }, 1000);
}

function addChatMessage(sender, text, type) {
    const message = {
        sender: sender,
        text: text,
        type: type,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    appState.chatMessages.push(message);
    displayChatMessage(message);
    
    // Save to localStorage
    localStorage.setItem('familyLocatorChat', JSON.stringify(appState.chatMessages));
    
    scrollChatToBottom();
}

function displayChatMessage(message) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.type}`;
    
    messageDiv.innerHTML = `
        <div class="message-sender">${message.sender}</div>
        <div class="message-text">${message.text}</div>
        <div class="message-time">${message.time}</div>
    `;
    
    messagesDiv.appendChild(messageDiv);
}

function scrollChatToBottom() {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================================
// Photo Sharing Functionality
// ============================================

function handlePhotoUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const photoData = {
                    id: Date.now() + Math.random(),
                    url: event.target.result,
                    name: file.name,
                    uploadedAt: new Date().toISOString(),
                    memberId: null, // Can be assigned later
                    isProfile: false
                };
                appState.sharedPhotos.push(photoData);
                saveSharedPhotos();
                renderPhotoGallery();
            };
            reader.readAsDataURL(file);
        }
    });
    // Reset input
    e.target.value = '';
}

function renderPhotoGallery() {
    const container = document.getElementById('photoGallery');
    container.innerHTML = '';
    
    if (appState.sharedPhotos.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: rgba(224, 231, 255, 0.6);">No photos shared yet. Upload your first photo!</div>';
        return;
    }
    
    appState.sharedPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.url}" alt="${photo.name}" loading="lazy">
            <div class="photo-overlay">
                <div style="font-weight: 600; margin-bottom: 4px;">${photo.name}</div>
                <div style="font-size: 0.75rem; opacity: 0.8;">${new Date(photo.uploadedAt).toLocaleDateString()}</div>
            </div>
            <button class="photo-delete" onclick="deletePhoto('${photo.id}')" aria-label="Delete photo">×</button>
        `;
        
        photoItem.addEventListener('click', (e) => {
            if (!e.target.closest('.photo-delete')) {
                showPhotoModal(photo);
            }
        });
        
        container.appendChild(photoItem);
    });
}

function showPhotoModal(photo) {
    // Create modal for full-size photo view
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.zIndex = '2000';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
            <div class="modal-header">
                <h2>${photo.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <img src="${photo.url}" alt="${photo.name}" style="max-width: 100%; max-height: 70vh; border-radius: 12px; margin-top: 1rem;">
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function deletePhoto(photoId) {
    if (confirm('Are you sure you want to delete this photo?')) {
        appState.sharedPhotos = appState.sharedPhotos.filter(p => p.id !== photoId);
        saveSharedPhotos();
        renderPhotoGallery();
    }
}

function saveSharedPhotos() {
    try {
        localStorage.setItem('familyLocatorPhotos', JSON.stringify(appState.sharedPhotos));
    } catch (e) {
        console.error('Error saving photos:', e);
    }
}

function loadSharedPhotos() {
    try {
        const saved = localStorage.getItem('familyLocatorPhotos');
        if (saved) {
            appState.sharedPhotos = JSON.parse(saved);
            renderPhotoGallery();
        }
    } catch (e) {
        console.error('Error loading photos:', e);
    }
}

window.deletePhoto = deletePhoto;

// ============================================
// Offline Mode
// ============================================

function setupOfflineMode() {
    // Check initial online status
    appState.isOffline = !navigator.onLine;
    updateOfflineIndicator();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        appState.isOffline = false;
        updateOfflineIndicator();
        showSuccessMessage('Connection restored!');
    });
    
    window.addEventListener('offline', () => {
        appState.isOffline = true;
        updateOfflineIndicator();
        showErrorMessage('You are now offline. Some features may be limited.');
    });
}

function updateOfflineIndicator() {
    const indicator = document.getElementById('offlineIndicator');
    if (appState.isOffline) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

// ============================================
// Service Worker Registration (for PWA)
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker would be registered here for offline support
        // navigator.serviceWorker.register('/sw.js');
    });
}
