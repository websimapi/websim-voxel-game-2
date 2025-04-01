export class InputManager {
    constructor(player, world, controls, gameState) {
        this.player = player;
        this.world = world;
        this.controls = controls;
        this.gameState = gameState;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Touch controls state
        this.touchStartPosition = null;
        this.touchCurrentPosition = null;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Mouse events
        document.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('contextmenu', this.onRightClick.bind(this));
        document.addEventListener('wheel', this.onMouseWheel.bind(this));
        
        // Mobile touch events
        const mobilePad = document.getElementById('movement-pad');
        if (mobilePad) {
            mobilePad.addEventListener('touchstart', this.onTouchStart.bind(this));
            mobilePad.addEventListener('touchmove', this.onTouchMove.bind(this));
            mobilePad.addEventListener('touchend', this.onTouchEnd.bind(this));
        }
        
        // Mobile buttons
        document.getElementById('jump-btn')?.addEventListener('touchstart', () => {
            this.player.jumping = true;
        });
        document.getElementById('jump-btn')?.addEventListener('touchend', () => {
            this.player.jumping = false;
        });
        
        document.getElementById('place-btn')?.addEventListener('touchstart', () => {
            this.placeBlock();
        });
        
        document.getElementById('break-btn')?.addEventListener('touchstart', () => {
            this.breakBlock();
        });
        
        // Block selection
        document.querySelectorAll('.block-option').forEach(block => {
            block.addEventListener('click', (e) => {
                this.player.inventory.selectedBlock = parseInt(e.target.dataset.type);
                this.updateBlockSelector();
            });
        });
    }
    
    onClick(event) {
        if (!this.controls.isLocked || this.gameState.menuOpen) return;
        
        // Left click to break block
        this.breakBlock();
    }
    
    onRightClick(event) {
        event.preventDefault();
        if (!this.controls.isLocked || this.gameState.menuOpen) return;
        
        // Right click to place block
        this.placeBlock();
    }
    
    onMouseWheel(event) {
        if (!this.controls.isLocked || this.gameState.menuOpen) return;
        
        // Scroll to change selected block
        const delta = Math.sign(event.deltaY);
        const inventory = this.player.inventory;
        const blockCount = inventory.blocks.length;
        
        let newIndex = inventory.blocks.indexOf(inventory.selectedBlock) + delta;
        if (newIndex < 0) newIndex = blockCount - 1;
        if (newIndex >= blockCount) newIndex = 0;
        
        inventory.selectedBlock = inventory.blocks[newIndex];
        this.updateBlockSelector();
    }
    
    onTouchStart(event) {
        if (this.gameState.menuOpen) return;
        
        const touch = event.touches[0];
        this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
        this.touchCurrentPosition = { x: touch.clientX, y: touch.clientY };
    }
    
    onTouchMove(event) {
        if (!this.touchStartPosition) return;
        
        const touch = event.touches[0];
        this.touchCurrentPosition = { x: touch.clientX, y: touch.clientY };
        
        // Calculate direction vector
        const dx = this.touchCurrentPosition.x - this.touchStartPosition.x;
        const dy = this.touchCurrentPosition.y - this.touchStartPosition.y;
        
        // Normalize and map to controls
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 10) {
            // Forward/backward
            if (dy < -20) this.player.moveForward = true;
            else if (dy > 20) this.player.moveBackward = true;
            else {
                this.player.moveForward = false;
                this.player.moveBackward = false;
            }
            
            // Left/right
            if (dx < -20) this.player.moveLeft = true;
            else if (dx > 20) this.player.moveRight = true;
            else {
                this.player.moveLeft = false;
                this.player.moveRight = false;
            }
        }
    }
    
    onTouchEnd(event) {
        this.touchStartPosition = null;
        this.touchCurrentPosition = null;
        
        // Reset movement
        this.player.moveForward = false;
        this.player.moveBackward = false;
        this.player.moveLeft = false;
        this.player.moveRight = false;
    }
    
    breakBlock() {
        const hit = this.raycastFromCamera();
        if (hit) {
            // Remove the block
            this.world.setVoxel(
                hit.voxelPosition.x, 
                hit.voxelPosition.y, 
                hit.voxelPosition.z, 
                0
            );
        }
    }
    
    placeBlock() {
        const hit = this.raycastFromCamera();
        if (hit) {
            // Place new block adjacent to the hit face
            const pos = {
                x: hit.voxelPosition.x + hit.normal.x,
                y: hit.voxelPosition.y + hit.normal.y,
                z: hit.voxelPosition.z + hit.normal.z
            };
            
            // Check if position would intersect with player
            if (!this.wouldIntersectPlayer(pos)) {
                this.world.setVoxel(
                    pos.x, pos.y, pos.z, 
                    this.player.inventory.selectedBlock
                );
            }
        }
    }
    
    wouldIntersectPlayer(pos) {
        // Check if new block would intersect with player
        const playerMin = {
            x: this.player.position.x - this.player.width / 2,
            y: this.player.position.y,
            z: this.player.position.z - this.player.width / 2
        };
        
        const playerMax = {
            x: this.player.position.x + this.player.width / 2,
            y: this.player.position.y + this.player.height,
            z: this.player.position.z + this.player.width / 2
        };
        
        return (
            pos.x >= playerMin.x && pos.x <= playerMax.x &&
            pos.y >= playerMin.y && pos.y <= playerMax.y &&
            pos.z >= playerMin.z && pos.z <= playerMax.z
        );
    }
    
    raycastFromCamera() {
        // Raycast from player's perspective
        const direction = new THREE.Vector3();
        this.player.camera.getWorldDirection(direction);
        
        return this.world.raycast(
            this.player.camera.position,
            direction,
            5 // Maximum distance
        );
    }
    
    updateBlockSelector() {
        // Update UI to show selected block
        document.querySelectorAll('.block-option').forEach(block => {
            const type = parseInt(block.dataset.type);
            if (type === this.player.inventory.selectedBlock) {
                block.classList.add('selected');
            } else {
                block.classList.remove('selected');
            }
        });
    }
}

