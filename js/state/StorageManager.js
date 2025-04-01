export class StorageManager {
    constructor() {
        this.dbName = 'voxel-game-db';
        this.dbVersion = 1;
        this.storeName = 'worlds';
        
        this.initDatabase();
    }
    
    async initDatabase() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object store for world data
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'id' });
                    }
                };
            });
        } catch (error) {
            console.error('Failed to initialize database:', error);
        }
    }
    
    async saveWorld(worldId, data) {
        try {
            await this.ensureDbReady();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const record = {
                    id: worldId,
                    data: data
                };
                
                const request = store.put(record);
                
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error saving world:', error);
            return null;
        }
    }
    
    async loadWorld(worldId) {
        try {
            await this.ensureDbReady();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                
                const request = store.get(worldId);
                
                request.onsuccess = (event) => {
                    if (request.result) {
                        resolve(request.result.data);
                    } else {
                        resolve(null); // World not found
                    }
                };
                
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error loading world:', error);
            return null;
        }
    }
    
    async listWorlds() {
        try {
            await this.ensureDbReady();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result.map(item => ({
                        id: item.id,
                        timestamp: item.data.timestamp
                    })));
                };
                
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error listing worlds:', error);
            return [];
        }
    }
    
    async deleteWorld(worldId) {
        try {
            await this.ensureDbReady();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                
                const request = store.delete(worldId);
                
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error('Error deleting world:', error);
        }
    }
    
    async ensureDbReady() {
        if (!this.db) {
            await this.initDatabase();
        }
    }
}

