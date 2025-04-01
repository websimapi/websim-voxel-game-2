export class GreedyMesher {
    constructor(chunk) {
        this.chunk = chunk;
        this.world = chunk.world;
    }
    
    createMesh() {
        const { size } = this.chunk;
        
        // Arrays to hold mesh data
        const positions = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        
        // Direction vectors for the six faces
        const faces = [
            { dir: [0, 0, 1], normal: [0, 0, 1] },  // Front
            { dir: [0, 0, -1], normal: [0, 0, -1] }, // Back
            { dir: [0, 1, 0], normal: [0, 1, 0] },  // Top
            { dir: [0, -1, 0], normal: [0, -1, 0] }, // Bottom
            { dir: [1, 0, 0], normal: [1, 0, 0] },  // Right
            { dir: [-1, 0, 0], normal: [-1, 0, 0] }  // Left
        ];
        
        // Process each face direction
        for (const face of faces) {
            const [nx, ny, nz] = face.normal;
            
            // Mask for this direction
            const mask = new Uint8Array(size * size);
            
            // For each slice in this direction
            for (let d = 0; d < size; d++) {
                // Compute mask
                for (let h = 0; h < size; h++) {
                    for (let w = 0; w < size; w++) {
                        // Map these coordinates to actual voxel positions
                        let x, y, z;
                        if (nx === 1) { x = d; y = h; z = w; }
                        else if (nx === -1) { x = size - 1 - d; y = h; z = w; }
                        else if (ny === 1) { x = w; y = d; z = h; }
                        else if (ny === -1) { x = w; y = size - 1 - d; z = h; }
                        else if (nz === 1) { x = w; y = h; z = d; }
                        else if (nz === -1) { x = w; y = h; z = size - 1 - d; }
                        
                        // Current voxel
                        const voxel = this.chunk.getVoxel(x, y, z);
                        
                        // Position of adjacent voxel
                        const ax = x + nx;
                        const ay = y + ny;
                        const az = z + nz;
                        
                        // Check adjacent voxel (either in this chunk or neighbor)
                        let adjacent = 0;
                        if (ax >= 0 && ax < size && ay >= 0 && ay < size && az >= 0 && az < size) {
                            adjacent = this.chunk.getVoxel(ax, ay, az);
                        } else {
                            // Get voxel from world
                            const wx = this.chunk.x * size + ax;
                            const wy = this.chunk.y * size + ay;
                            const wz = this.chunk.z * size + az;
                            adjacent = this.world.getVoxel(wx, wy, wz);
                        }
                        
                        // If current is solid and adjacent is not, we need a face
                        const i = h * size + w;
                        if (voxel !== 0 && (adjacent === 0 || !this.world.voxelTypes.isSolid(adjacent))) {
                            mask[i] = voxel;
                        } else {
                            mask[i] = 0;
                        }
                    }
                }
                
                // Now use mask to generate greedy mesh
                let w = 0;
                while (w < size) {
                    let h = 0;
                    while (h < size) {
                        const i = h * size + w;
                        if (mask[i] !== 0) {
                            // Find width of this quad
                            const voxelType = mask[i];
                            let width = 1;
                            while (w + width < size && mask[h * size + (w + width)] === voxelType) {
                                width++;
                            }
                            
                            // Find height of this quad
                            let height = 1;
                            let done = false;
                            while (h + height < size && !done) {
                                for (let k = 0; k < width; k++) {
                                    if (mask[(h + height) * size + (w + k)] !== voxelType) {
                                        done = true;
                                        break;
                                    }
                                }
                                if (!done) height++;
                            }
                            
                            // Add quad
                            this.addQuad(
                                positions, normals, uvs, colors,
                                w, h, d, width, height, nx, ny, nz, voxelType
                            );
                            
                            // Clear mask
                            for (let j = 0; j < height; j++) {
                                for (let k = 0; k < width; k++) {
                                    mask[(h + j) * size + (w + k)] = 0;
                                }
                            }
                            
                            // Increment to skip the quad we just created
                            h += height;
                        } else {
                            // Increment to next position
                            h++;
                        }
                    }
                    w++;
                }
            }
        }
        
        return { positions, normals, uvs, colors };
    }
    
    addQuad(positions, normals, uvs, colors, x, y, d, width, height, nx, ny, nz, voxelType) {
        // Transform coordinates based on normal
        let x1, y1, z1, x2, y2, z2;
        
        if (nx === 1) {
            x1 = x2 = d + 1;
            y1 = y; y2 = y + height;
            z1 = x; z2 = x + width;
        } else if (nx === -1) {
            x1 = x2 = d;
            y1 = y; y2 = y + height;
            z1 = x + width; z2 = x;
        } else if (ny === 1) {
            x1 = x; x2 = x + width;
            y1 = y2 = d + 1;
            z1 = y; z2 = y + height;
        } else if (ny === -1) {
            x1 = x; x2 = x + width;
            y1 = y2 = d;
            z1 = y + height; z2 = y;
        } else if (nz === 1) {
            x1 = x; x2 = x + width;
            y1 = y; y2 = y + height;
            z1 = z2 = d + 1;
        } else if (nz === -1) {
            x1 = x + width; x2 = x;
            y1 = y; y2 = y + height;
            z1 = z2 = d;
        }
        
        // Get voxel type color
        const color = this.world.voxelTypes.getColor(voxelType);
        
        // Add vertices for triangles (two triangles per quad)
        // Triangle 1
        positions.push(x1, y1, z1);
        positions.push(x2, y1, z2);
        positions.push(x2, y2, z2);
        
        // Triangle 2
        positions.push(x1, y1, z1);
        positions.push(x2, y2, z2);
        positions.push(x1, y2, z1);
        
        // Add normals
        for (let i = 0; i < 6; i++) {
            normals.push(nx, ny, nz);
        }
        
        // Add colors
        for (let i = 0; i < 6; i++) {
            colors.push(color.r, color.g, color.b);
        }
        
        // Add UVs (simple UVs for now)
        uvs.push(0, 0);
        uvs.push(width, 0);
        uvs.push(width, height);
        
        uvs.push(0, 0);
        uvs.push(width, height);
        uvs.push(0, height);
    }
}

