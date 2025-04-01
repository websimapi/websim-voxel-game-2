import * as THREE from 'three';

export class Player {
    constructor(camera, controls, world) {
        this.camera = camera;
        this.controls = controls;
        this.world = world;
        
        // Player properties
        this.height = 1.8;
        this.eyeHeight = 1.6;
        this.width = 0.6;
        this.position = new THREE.Vector3(8, 30, 8); // Start above ground
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        
        // Physics constants
        this.gravity = 20;
        this.jumpForce = 8;
        this.speed = 5;
        this.sprint = 1.6;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jumping = false;
        this.sprinting = false;
        
        // Inventory
        this.inventory = {
            selectedBlock: 1,
            blocks: [1, 2, 3, 4, 5, 6, 7]
        };
        
        this.init();
    }
    
    init() {
        // Set initial camera position
        this.updateCamera();
        
        // Bind event listeners
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'Space': this.jumping = true; break;
            case 'ShiftLeft': this.sprinting = true; break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
            case 'Space': this.jumping = false; break;
            case 'ShiftLeft': this.sprinting = false; break;
        }
    }
    
    update(deltaTime) {
        this.applyPhysics(deltaTime);
        this.handleCollisions();
        this.updateCamera();
    }
    
    applyPhysics(deltaTime) {
        // Apply gravity
        this.velocity.y -= this.gravity * deltaTime;
        
        // Handle jumping
        if (this.jumping && this.onGround) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
        
        // Calculate movement direction
        const direction = new THREE.Vector3();
        
        // Get forward/right vectors from camera
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0; // Keep movement in XZ plane
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();
        
        // Add movement inputs
        if (this.moveForward) direction.add(forward);
        if (this.moveBackward) direction.sub(forward);
        if (this.moveRight) direction.add(right);
        if (this.moveLeft) direction.sub(right);
        
        // Normalize and apply speed
        if (direction.lengthSq() > 0) {
            direction.normalize();
            const speedMultiplier = this.sprinting ? this.speed * this.sprint : this.speed;
            direction.multiplyScalar(speedMultiplier * deltaTime);
            
            // Apply horizontal movement
            this.position.x += direction.x;
            this.position.z += direction.z;
        }
        
        // Apply vertical velocity
        this.position.y += this.velocity.y * deltaTime;
    }
    
    handleCollisions() {
        // Check for collisions with world
        this.onGround = false;
        
        // Collision box dimensions
        const halfWidth = this.width / 2;
        
        // Check feet position
        const feetY = Math.floor(this.position.y);
        if (this.checkCollision(this.position.x, feetY, this.position.z)) {
            // Move player up to the top of the block
            this.position.y = feetY + 1;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Check head position (prevent going through ceiling)
        const headY = Math.floor(this.position.y + this.height);
        if (this.checkCollision(this.position.x, headY, this.position.z)) {
            // Bump head on ceiling
            this.position.y = headY - this.height;
            this.velocity.y = 0;
        }
        
        // Check horizontal collisions (X axis)
        if (this.checkCollision(this.position.x + halfWidth, this.position.y + 0.5, this.position.z) ||
            this.checkCollision(this.position.x - halfWidth, this.position.y + 0.5, this.position.z)) {
            // Adjust X position to prevent collision
            const blockX = Math.floor(this.position.x);
            if (this.position.x > blockX + 0.5) {
                this.position.x = blockX + 1 + halfWidth;
            } else {
                this.position.x = blockX - halfWidth;
            }
        }
        
        // Check horizontal collisions (Z axis)
        if (this.checkCollision(this.position.x, this.position.y + 0.5, this.position.z + halfWidth) ||
            this.checkCollision(this.position.x, this.position.y + 0.5, this.position.z - halfWidth)) {
            // Adjust Z position to prevent collision
            const blockZ = Math.floor(this.position.z);
            if (this.position.z > blockZ + 0.5) {
                this.position.z = blockZ + 1 + halfWidth;
            } else {
                this.position.z = blockZ - halfWidth;
            }
        }
    }
    
    checkCollision(x, y, z) {
        // Get voxel at position
        const voxelX = Math.floor(x);
        const voxelY = Math.floor(y);
        const voxelZ = Math.floor(z);
        
        const voxel = this.world.getVoxel(voxelX, voxelY, voxelZ);
        return voxel !== 0 && this.world.voxelTypes.isSolid(voxel);
    }
    
    updateCamera() {
        // Position camera at eye level
        this.camera.position.x = this.position.x;
        this.camera.position.y = this.position.y + this.eyeHeight;
        this.camera.position.z = this.position.z;
        
        // Update game state with player position
        this.world.gameState.playerPosition = this.position.clone();
    }
    
    reset() {
        // Reset player to initial state
        this.position.set(8, 30, 8);
        this.velocity.set(0, 0, 0);
        this.updateCamera();
    }
    
    serialize() {
        return {
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            inventory: this.inventory
        };
    }
    
    deserialize(data) {
        this.position.set(data.position.x, data.position.y, data.position.z);
        this.inventory = data.inventory;
        this.updateCamera();
    }
}

