// MtaaLink API Service

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
        ...options.headers
    };
    
    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }
        
        return await response.json();
        
    } catch (error) {
        if (state.isOffline) {
            // Save for offline sync
            await saveOfflineRequest(endpoint, options);
        }
        throw error;
    }
}

// Offline request storage
async function saveOfflineRequest(endpoint, options) {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    await store.add({
        endpoint,
        options,
        timestamp: Date.now()
    });
    await tx.done;
}

async function getPendingChanges() {
    const db = await openDB();
    const tx = db.transaction('pending', 'readonly');
    const store = tx.objectStore('pending');
    return store.getAll();
}

async function clearSyncedChanges() {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    await store.clear();
    await tx.done;
}
