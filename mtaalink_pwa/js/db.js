// MtaaLink IndexedDB Service for Offline Storage

const DB_NAME = 'MtaaLinkDB';
const DB_VERSION = 1;

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Store for pending requests
            if (!db.objectStoreNames.contains('pending')) {
                db.createObjectStore('pending', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
            }
            
            // Store for cached data
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { 
                    keyPath: 'key' 
                });
            }
        };
    });
}

async function cacheData(key, data) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.put({ key, data, timestamp: Date.now() });
    await tx.done;
}

async function getCachedData(key) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const result = await store.get(key);
    await tx.done;
    return result?.data;
}

async function clearCache() {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.clear();
    await tx.done;
}

// Export for use
window.MtaaLinkDB = {
    openDB,
    cacheData,
    getCachedData,
    clearCache,
    getPendingChanges,
    clearSyncedChanges
};
