import * as THREE from 'three';
import { Chunk } from './Chunk.js';

export class ChunkManager {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.chunks = new Map(); // Map for fast chunk lookup
        this.chunkMeshes = new Map(); // Store references to chunk meshes
        this.chunksToUpdate = new Set(); // Chunks that need mesh updates
        
        // Worker for background chunk generation
        this.setupWorker();
    }
    
    setupWorker() {
        // In a real implementation, we would use a Web Worker here
        // For simplicity, we'll simulate async behavior with setTimeout
        this.generateChunkAsync = (chunkX, chunkY, chunkZ) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const chunk = new Chunk(chunkX, chunkY, chunkZ, this.world);
                    chunk.generate(this.world.terrainGenerator);
                    resolve(chunk);
                }, 0);
            });
        };
    }
    
    getChunkKey(x, y, z) {
        return `${x},${y},${z}`;
    }
    
    getChunk(x, y, z) {
        return this.chunks.get(this.getChunkKey(x, y, z));
    }
    
    async generateChunk(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        
        // Check if chunk already exists
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }
        
        // Generate new chunk (async)
        const chunk = await this.generateChunkAsync(x, y, z);
        this.chunks.set(key, chunk);
        
        // Queue for mesh update
        this.chunksToUpdate.add(key);
        this.processChunkUpdates();
        
        return chunk;
    }
    
    updateChunkMesh(x, y, z) {
        const key = this.getChunkKey(x, y, z);
        if (this.chunks.has(key)) {
            this.chunksToUpdate.add(key);
            this.processChunkUpdates();
        }
    }
    
    processChunkUpdates() {
        if (this.isProcessingUpdates) return;
        this.isProcessingUpdates = true;
        
        // Process updates in batches to prevent frame drops
        const processNextBatch = () => {
            const batch = Array.from(this.chunksToUpdate).slice(0, 5);
            if (batch.length === 0) {
                this.isProcessingUpdates = false;
                return;
            }
            
            batch.forEach(key => {
                this.chunksToUpdate.delete(key);
                const chunk = this.chunks.get(key);
                if (chunk) {
                    this.updateSingleChunkMesh(chunk);
                }
            });
            
            // Schedule next batch
            setTimeout(processNextBatch, 0);
        };
        
        processNextBatch();
    }
    
    updateSingleChunkMesh(chunk) {
        const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);
        
        // Remove old mesh if it exists
        if (this.chunkMeshes.has(key)) {
            this.scene.remove(this.chunkMeshes.get(key));
        }
        
        // Generate new mesh
        const mesh = chunk.createMesh();
        if (mesh) {
            this.scene.add(mesh);
            this.chunkMeshes.set(key, mesh);
        }
    }
    
    updateChunksAroundPlayer(playerChunkX, playerChunkY, playerChunkZ, renderDistance) {
        const chunksToKeep = new Set();
        
        // Determine which chunks should be loaded/kept
        for (let x = playerChunkX - renderDistance; x <= playerChunkX + renderDistance; x++) {
            for (let y = 0; y <= 2; y++) { // Only load a few chunks vertically
                for (let z = playerChunkZ - renderDistance; z <= playerChunkZ + renderDistance; z++) {
                    const key = this.getChunkKey(x, y, z);
                    chunksToKeep.add(key);
                    
                    // Generate chunk if it doesn't exist
                    if (!this.chunks.has(key)) {
                        this.generateChunk(x, y, z);
                    }
                }
            }
        }
        
        // Unload chunks that are too far away
        for (const key of this.chunks.keys()) {
            if (!chunksToKeep.has(key)) {
                if (this.chunkMeshes.has(key)) {
                    this.scene.remove(this.chunkMeshes.get(key));
                    this.chunkMeshes.delete(key);
                }
                this.chunks.delete(key);
            }
        }
    }
    
    clear() {
        // Remove all chunk meshes from scene
        for (const mesh of this.chunkMeshes.values()) {
            this.scene.remove(mesh);
        }
        
        this.chunks.clear();
        this.chunkMeshes.clear();
        this.chunksToUpdate.clear();
    }
    
    serialize() {
        const chunksData = [];
        for (const [key, chunk] of this.chunks.entries()) {
            chunksData.push({
                key,
                data: chunk.serialize()
            });
        }
        return chunksData;
    }
    
    deserialize(chunksData) {
        this.clear();
        
        for (const chunkData of chunksData) {
            const [x, y, z] = chunkData.key.split(',').map(Number);
            const chunk = new Chunk(x, y, z, this.world);
            chunk.deserialize(chunkData.data);
            
            const key = this.getChunkKey(x, y, z);
            this.chunks.set(key, chunk);
            this.chunksToUpdate.add(key);
        }
        
        this.processChunkUpdates();
    }
}

