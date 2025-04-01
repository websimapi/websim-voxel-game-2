import * as THREE from 'three';

export class VoxelTypes {
    constructor() {
        this.types = [
            { 
                name: 'air', 
                solid: false, 
                color: new THREE.Color(0, 0, 0),
                textureOffset: { x: 0, y: 0 }
            },
            { 
                name: 'stone', 
                solid: true, 
                color: new THREE.Color(0.5, 0.5, 0.5),
                textureOffset: { x: 0, y: 0 }
            },
            { 
                name: 'dirt', 
                solid: true, 
                color: new THREE.Color(0.6, 0.4, 0.2),
                textureOffset: { x: 1, y: 0 }
            },
            { 
                name: 'grass', 
                solid: true, 
                color: new THREE.Color(0.4, 0.8, 0.4),
                textureOffset: { x: 2, y: 0 }
            },
            { 
                name: 'wood', 
                solid: true, 
                color: new THREE.Color(0.6, 0.3, 0.0),
                textureOffset: { x: 3, y: 0 }
            },
            { 
                name: 'leaves', 
                solid: true, 
                color: new THREE.Color(0.2, 0.6, 0.2),
                textureOffset: { x: 4, y: 0 }
            },
            { 
                name: 'sand', 
                solid: true, 
                color: new THREE.Color(0.9, 0.8, 0.6),
                textureOffset: { x: 0, y: 1 }
            },
            { 
                name: 'water', 
                solid: false, 
                color: new THREE.Color(0.0, 0.0, 0.8),
                textureOffset: { x: 1, y: 1 }
            }
        ];
    }
    
    getType(id) {
        return this.types[id] || this.types[0]; // Default to air
    }
    
    getColor(id) {
        return this.getType(id).color;
    }
    
    isSolid(id) {
        return this.getType(id).solid;
    }
}

