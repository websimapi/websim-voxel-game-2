export class GameState {
    constructor() {
        this.playerPosition = null;
        this.menuOpen = false;
        
        // Game statistics
        this.stats = {
            blocksPlaced: 0,
            blocksRemoved: 0,
            timePlayed: 0
        };
    }
    
    updateBlockStats(placed = false) {
        if (placed) {
            this.stats.blocksPlaced++;
        } else {
            this.stats.blocksRemoved++;
        }
    }
}

