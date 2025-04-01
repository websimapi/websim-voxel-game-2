import * as THREE from 'three';
import { GreedyMesher } from '../utils/GreedyMesher.js';

export class Chunk {
    constructor(x, y, z, world) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.world = world;
        this.size = world.chunkSize;
        
        // 3D array to store voxel data
        this.voxels = new Uint8Array(this.size * this.size * this.size);
        
        // For mesh generation
        this.mesher = new GreedyMesher(this);
        this.geometry = null;
        this.material = null;
        this.mesh = null;
    }
    
    getIndex(x, y, z) {
        return x + y * this.size + z * this.size * this.size;
    }
    
    getVoxel(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= this.size || y >= this.size || z >= this.size) {
            return 0; // Out of bounds
        }
        return this.voxels[this.getIndex(x, y, z)];
    }
    
    setVoxel(x, y, z, voxelType) {
        if (x < 0 || y < 0 || z < 0 || x >= this.size || y >= this.size || z >= this.size) {
            return; // Out of bounds
        }
        this.voxels[this.getIndex(x, y, z)] = voxelType;
    }
    
    generate(terrainGenerator) {
        // Generate terrain using the terrain generator
        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                // Calculate world coordinates
                const worldX = this.x * this.size + x;
                const worldZ = this.z * this.size + z;
                
                // Get terrain height at this position
                const height = terrainGenerator.getHeight(worldX, worldZ);
                
                // Fill column with appropriate blocks
                for (let y = 0; y < this.size; y++) {
                    const worldY = this.y * this.size + y;
                    
                    let voxelType = 0; // Air by default
                    
                    if (worldY < height - 4) {
                        voxelType = 1; // Stone
                    } else if (worldY < height) {
                        voxelType = 2; // Dirt
                    } else if (worldY === height) {
                        voxelType = 3; // Grass
                    }
                    
                    this.setVoxel(x, y, z, voxelType);
                }
            }
        }
    }
    
    createMesh() {
        // Don't create mesh for empty chunks
        if (this.isEmpty()) {
            return null;
        }
        
        // Generate optimized geometry using greedy meshing
        const meshData = this.mesher.createMesh();
        
        // Convert mesh data to Three.js geometry
        this.geometry = new THREE.BufferGeometry();
        
        // Set vertices
        this.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(meshData.positions), 3)
        );
        
        // Set normals
        this.geometry.setAttribute(
            'normal',
            new THREE.BufferAttribute(new Float32Array(meshData.normals), 3)
        );
        
        // Set UVs for texturing
        this.geometry.setAttribute(
            'uv',
            new THREE.BufferAttribute(new Float32Array(meshData.uvs), 2)
        );
        
        // Set face colors/types
        this.geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(new Float32Array(meshData.colors), 3)
        );
        
        // Create material
        this.material = new THREE.MeshLambertMaterial({
            vertexColors: true
        });
        
        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        // Position mesh correctly in world space
        this.mesh.position.set(
            this.x * this.size,
            this.y * this.size,
            this.z * this.size
        );
        
        return this.mesh;
    }
    
    isEmpty() {
        // Quick check if chunk contains any non-air blocks
        for (let i = 0; i < this.voxels.length; i++) {
            if (this.voxels[i] !== 0) {
                return false;
            }
        }
        return true;
    }
    
    serialize() {
        // For sparse chunks, we could use run-length encoding
        // For simplicity, we'll just return the full array for now
        return {
            voxels: Array.from(this.voxels)
        };
    }
    
    deserialize(data) {
        this.voxels = new Uint8Array(data.voxels);
    }
}

