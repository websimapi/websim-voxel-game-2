import { SimplexNoise } from 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.js';

export class TerrainGenerator {
    constructor(world) {
        this.world = world;
        this.seed = Math.random() * 10000;
        this.noise = new SimplexNoise(this.seed.toString());
        
        // Terrain generation parameters
        this.baseHeight = 20;
        this.heightAmplitude = 20;
        this.scale1 = 0.01; // Large scale features
        this.scale2 = 0.05; // Medium scale features
        this.scale3 = 0.2;  // Small scale features
    }
    
    setSeed(seed) {
        this.seed = seed;
        this.noise = new SimplexNoise(seed.toString());
    }
    
    getHeight(x, z) {
        // Combine multiple noise frequencies for more natural terrain
        const noise1 = this.noise.noise2D(x * this.scale1, z * this.scale1);
        const noise2 = this.noise.noise2D(x * this.scale2, z * this.scale2) * 0.5;
        const noise3 = this.noise.noise2D(x * this.scale3, z * this.scale3) * 0.25;
        
        const combined = (noise1 + noise2 + noise3) / 1.75;
        
        // Convert to terrain height
        return Math.floor(this.baseHeight + combined * this.heightAmplitude);
    }
    
    getBiome(x, z) {
        // Simple biome determination based on a different noise function
        const biomeNoise = this.noise.noise2D(x * 0.005, z * 0.005);
        
        if (biomeNoise < -0.3) return 'desert';
        if (biomeNoise > 0.3) return 'mountains';
        return 'plains';
    }
    
    // Additional methods for cave generation, structures, etc. can be added here
    generateCaves(x, y, z) {
        const caveNoise = this.noise.noise3D(x * 0.05, y * 0.05, z * 0.05);
        return caveNoise > 0.7; // Returns true if there should be a cave at this position
    }
}