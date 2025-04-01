import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world/World.js';
import { Player } from './entities/Player.js';
import { UI } from './ui/UI.js';
import { InputManager } from './controls/InputManager.js';
import { GameState } from './state/GameState.js';
import { StorageManager } from './state/StorageManager.js';

class Game {
    constructor() {
        this.setupThree();
        this.gameState = new GameState();
        this.storageManager = new StorageManager();
        this.world = new World(this.scene, this.gameState);
        this.player = new Player(this.camera, this.controls, this.world);
        this.ui = new UI(this.gameState);
        this.inputManager = new InputManager(this.player, this.world, this.controls, this.gameState);
        
        this.previousTime = 0;
        this.isRunning = false;
        
        this.checkMobile();
        this.bindEvents();
        this.init();
    }

    setupThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
        this.camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add ambient and directional light
        const ambientLight = new THREE.AmbientLight(0x6688cc, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 0.5).normalize();
        this.scene.add(directionalLight);
        
        // Setup controls
        this.controls = new PointerLockControls(this.camera, document.body);
    }
    
    checkMobile() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            document.getElementById('mobile-controls').classList.remove('hidden');
        }
    }
    
    bindEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Menu buttons
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('save-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('load-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('new-world-btn').addEventListener('click', () => this.newGame());
        
        // Game start on click
        document.addEventListener('click', () => {
            if (!this.isRunning && !this.gameState.menuOpen) {
                this.startGame();
            }
        });
        
        // Show menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleMenu();
            }
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    startGame() {
        this.controls.lock();
        this.isRunning = true;
        this.gameState.menuOpen = false;
        document.getElementById('menu').classList.add('hidden');
    }
    
    pauseGame() {
        this.controls.unlock();
        this.isRunning = false;
    }
    
    resumeGame() {
        this.startGame();
    }
    
    toggleMenu() {
        if (this.gameState.menuOpen) {
            document.getElementById('menu').classList.add('hidden');
            this.gameState.menuOpen = false;
            this.startGame();
        } else {
            this.pauseGame();
            document.getElementById('menu').classList.remove('hidden');
            this.gameState.menuOpen = true;
        }
    }
    
    async saveGame() {
        const worldData = this.world.serialize();
        const playerData = this.player.serialize();
        const saveData = {
            world: worldData,
            player: playerData,
            timestamp: Date.now()
        };
        
        await this.storageManager.saveWorld('default', saveData);
        console.log('Game saved');
    }
    
    async loadGame() {
        const saveData = await this.storageManager.loadWorld('default');
        if (saveData) {
            this.world.deserialize(saveData.world);
            this.player.deserialize(saveData.player);
            console.log('Game loaded');
            this.startGame();
        } else {
            console.log('No saved game found');
        }
    }
    
    newGame() {
        this.world.generate();
        this.player.reset();
        this.startGame();
    }
    
    init() {
        this.world.generate();
        this.animate();
        
        // Show initial menu
        this.pauseGame();
        document.getElementById('menu').classList.remove('hidden');
        this.gameState.menuOpen = true;
    }
    
    update(deltaTime) {
        if (!this.isRunning) return;
        
        this.world.update(deltaTime);
        this.player.update(deltaTime);
        this.ui.update();
    }
    
    animate(currentTime = 0) {
        requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.previousTime) / 1000;
        this.previousTime = currentTime;
        
        // Skip first frame delta (it's usually too large)
        if (deltaTime > 0 && deltaTime < 1) {
            this.update(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

