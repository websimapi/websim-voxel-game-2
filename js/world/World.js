import * as THREE from 'three';
import { ChunkManager } from './ChunkManager.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { VoxelTypes } from './VoxelTypes.js';
import { RayCaster } from '../utils/RayCaster.js';

export class World {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        
        this.chunkSize = 16;
        this.renderDistance = 4; // Number of chunks in each direction
        
        this.chunkManager = new ChunkManager(this, scene);
        this.terrainGenerator = new TerrainGenerator(this);
        this.rayCaster = new RayCaster(this);
        
        // Register voxel types
        this.voxelTypes = new VoxelTypes();
    }
    
    generate() {
        // Clear existing world
        this.chunkManager.clear();
        
        // Generate new world with seed
        const seed = Math.floor(Math.random() * 10000);
        this.terrainGenerator.setSeed(seed);
        
        // Generate chunks around origin
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.chunkManager.generateChunk(x, 0, z);
            }
        }
    }
    
    update(deltaTime) {
        // Update chunks based on player position
        const playerPosition = this.gameState.playerPosition;
        if (playerPosition) {
            const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
            const playerChunkZ = Math.floor(playerPosition.z / this.chunkSize);
            
            this.chunkManager.updateChunksAroundPlayer(playerChunkX, playerChunkZ, this.renderDistance);
        }
    }
    
    getVoxel(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        
        const chunk = this.chunkManager.getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) return 0;
        
        const localX = x - chunkX * this.chunkSize;
        const localY = y - chunkY * this.chunkSize;
        const localZ = z - chunkZ * this.chunkSize;
        
        return chunk.getVoxel(localX, localY, localZ);
    }
    
    setVoxel(x, y, z, voxelType) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        
        let chunk = this.chunkManager.getChunk(chunkX, chunkY, chunkZ);
        if (!chunk) {
            chunk = this.chunkManager.generateChunk(chunkX, chunkY, chunkZ);
        }
        
        const localX = x - chunkX * this.chunkSize;
        const localY = y - chunkY * this.chunkSize;
        const localZ = z - chunkZ * this.chunkSize;
        
        chunk.setVoxel(localX, localY, localZ, voxelType);
        
        // Update neighboring chunks if needed
        if (localX === 0) this.chunkManager.updateChunkMesh(chunkX - 1, chunkY, chunkZ);
        if (localY === 0) this.chunkManager.updateChunkMesh(chunkX, chunkY - 1, chunkZ);
        if (localZ === 0) this.chunkManager.updateChunkMesh(chunkX, chunkY, chunkZ - 1);
        if (localX === this.chunkSize - 1) this.chunkManager.updateChunkMesh(chunkX + 1, chunkY, chunkZ);
        if (localY === this.chunkSize - 1) this.chunkManager.updateChunkMesh(chunkX, chunkY + 1, chunkZ);
        if (localZ === this.chunkSize - 1) this.chunkManager.updateChunkMesh(chunkX, chunkY, chunkZ + 1);
    }
    
    raycast(origin, direction, maxDistance = 10) {
        return this.rayCaster.raycast(origin, direction, maxDistance);
    }
    
    serialize() {
        return {
            seed: this.terrainGenerator.seed,
            chunks: this.chunkManager.serialize()
        };
    }
    
    deserialize(data) {
        this.chunkManager.clear();
        this.terrainGenerator.setSeed(data.seed);
        this.chunkManager.deserialize(data.chunks);
    }
}

