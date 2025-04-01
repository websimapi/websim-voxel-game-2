import * as THREE from 'three';

export class RayCaster {
    constructor(world) {
        this.world = world;
    }
    
    raycast(origin, direction, maxDistance = 10) {
        const step = 0.1; // Step size for ray marching
        const maxSteps = maxDistance / step;
        
        // Create ray from origin in direction
        const ray = new THREE.Ray(origin, direction);
        
        // Start position
        const pos = new THREE.Vector3();
        
        // Previous position (used for getting the face normal)
        const prevPos = new THREE.Vector3(origin.x, origin.y, origin.z);
        
        // March along ray
        for (let i = 0; i < maxSteps; i++) {
            // Get point along ray
            ray.at(i * step, pos);
            
            // Get voxel at this position
            const vx = Math.floor(pos.x);
            const vy = Math.floor(pos.y);
            const vz = Math.floor(pos.z);
            const voxel = this.world.getVoxel(vx, vy, vz);
            
            // If we hit a solid voxel
            if (voxel !== 0 && this.world.voxelTypes.isSolid(voxel)) {
                // Calculate hit normal (which face did we hit?)
                const normal = this.calculateNormal(pos, prevPos);
                
                return {
                    position: { x: pos.x, y: pos.y, z: pos.z },
                    normal: { x: normal.x, y: normal.y, z: normal.z },
                    voxelPosition: { x: vx, y: vy, z: vz },
                    voxelType: voxel,
                    distance: i * step
                };
            }
            
            // Store previous position
            prevPos.copy(pos);
        }
        
        // No hit
        return null;
    }
    
    calculateNormal(pos, prevPos) {
        // Determine which face we hit by comparing current and previous positions
        const dx = pos.x - prevPos.x;
        const dy = pos.y - prevPos.y;
        const dz = pos.z - prevPos.z;
        
        const normal = new THREE.Vector3(0, 0, 0);
        
        // Find the component with the largest change
        if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dz)) {
            normal.x = dx > 0 ? -1 : 1;
        } else if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) {
            normal.y = dy > 0 ? -1 : 1;
        } else {
            normal.z = dz > 0 ? -1 : 1;
        }
        
        return normal;
    }
}

