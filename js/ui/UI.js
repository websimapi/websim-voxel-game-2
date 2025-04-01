export class UI {
    constructor(gameState) {
        this.gameState = gameState;
        this.debugInfo = document.getElementById('debug-info');
        this.blockSelector = document.getElementById('block-selector');
        
        this.setupBlockSelector();
    }
    
    setupBlockSelector() {
        // Create block options
        const blockTypes = [1, 2, 3, 4, 5, 6, 7]; // Block type IDs
        
        blockTypes.forEach(type => {
            const blockOption = document.createElement('div');
            blockOption.className = 'block-option';
            blockOption.dataset.type = type;
            
            // Set background color based on block type
            switch (type) {
                case 1: blockOption.style.backgroundColor = '#888888'; break; // Stone
                case 2: blockOption.style.backgroundColor = '#A07048'; break; // Dirt
                case 3: blockOption.style.backgroundColor = '#60A048'; break; // Grass
                case 4: blockOption.style.backgroundColor = '#A06030'; break; // Wood
                case 5: blockOption.style.backgroundColor = '#50A050'; break; // Leaves
                case 6: blockOption.style.backgroundColor = '#E0D0A0'; break; // Sand
                case 7: blockOption.style.backgroundColor = '#5050E0'; break; // Water
            }
            
            this.blockSelector.appendChild(blockOption);
        });
        
        // Set initial selection
        const firstBlock = this.blockSelector.querySelector('.block-option');
        if (firstBlock) firstBlock.classList.add('selected');
    }
    
    update() {
        // Update debug info
        if (this.debugInfo && this.gameState.playerPosition) {
            const pos = this.gameState.playerPosition;
            this.debugInfo.textContent = `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        }
    }
}

