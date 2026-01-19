import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'
import BasePlanet from '../entities/BasePlanet.js'
import Ship from '../entities/Ship.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    // First planet (blue) with HOME PLANET nameplate
    this.basePlanet = new BasePlanet(this, cx, cy, 0x2a4a6e, 0x66ccff, 'HOME PLANET')
    this.ship = new Ship(this, this.basePlanet, this.basePlanet.coreRadius)

    // Second planet (gray) with PLANET1 nameplate
    this.grayPlanet = new BasePlanet(this, cx + 250, cy - 100, 0x555555, 0x999999, 'PLANET1')
    
    // Set up planet click handler for travel
    this.grayPlanet.setOnClick((planet) => {
      // Send idle ship to this planet
      if (this.ship.state === 'IDLE') {
        this.ship.travelTo(planet)
      }
    })

    // Camera pan setup
    this.isPanning = false
    this.panStartX = 0
    this.panStartY = 0

    this.input.on('pointerdown', (pointer) => {
      this.isPanning = true
      this.panStartX = pointer.x + this.cameras.main.scrollX
      this.panStartY = pointer.y + this.cameras.main.scrollY
    })

    this.input.on('pointermove', (pointer) => {
      if (this.isPanning && !this.isPinching) {
        this.cameras.main.scrollX = this.panStartX - pointer.x
        this.cameras.main.scrollY = this.panStartY - pointer.y
      }
    })

    this.input.on('pointerup', () => {
      this.isPanning = false
    })

    // Mouse wheel zoom
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      const zoomAmount = deltaY > 0 ? -0.1 : 0.1
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomAmount, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })

    // Pinch zoom setup
    this.setupPinchZoom()

    // Create UI camera for fixed elements
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    this.uiCamera.setScroll(0, 0)
    
    // Make UI camera ignore game objects
    this.uiCamera.ignore([
      this.basePlanet.graphics, 
      this.basePlanet.hitZone,
      this.basePlanet.nameText,
      this.grayPlanet.graphics,
      this.grayPlanet.hitZone,
      this.grayPlanet.nameText,
      this.ship.graphics,
      this.ship.statusText
    ])
    
    // Mobile zoom buttons
    this.createZoomButtons()
  }

  setupPinchZoom() {
    this.isPinching = false
    this.pinchDistance = 0

    // Listen to native touch events for pinch detection
    this.game.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this.isPinching = true
        this.isPanning = false
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        this.pinchDistance = Math.sqrt(dx * dx + dy * dy)
      }
    })

    this.game.canvas.addEventListener('touchmove', (e) => {
      if (this.isPinching && e.touches.length === 2) {
        e.preventDefault()
        
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const newDistance = Math.sqrt(dx * dx + dy * dy)
        
        if (this.pinchDistance > 0) {
          const scale = newDistance / this.pinchDistance
          const currentZoom = this.cameras.main.zoom
          const newZoom = Phaser.Math.Clamp(currentZoom * scale, 0.5, 3)
          this.cameras.main.setZoom(newZoom)
        }
        
        this.pinchDistance = newDistance
      }
    }, { passive: false })

    this.game.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        this.isPinching = false
        this.pinchDistance = 0
      }
    })
  }

  createZoomButtons() {
    const buttonStyle = {
      fontSize: '32px',
      color: '#66ccff',
      backgroundColor: '#1a2a3a',
      padding: { x: 15, y: 10 },
      fixedWidth: 50,
      fixedHeight: 50,
      align: 'center'
    }

    this.zoomInBtn = this.add.text(this.scale.width - 70, 20, '+', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.zoomOutBtn = this.add.text(this.scale.width - 70, 85, '-', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    // Make buttons only visible to UI camera
    this.cameras.main.ignore([this.zoomInBtn, this.zoomOutBtn])

    this.zoomInBtn.on('pointerdown', () => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })

    this.zoomOutBtn.on('pointerdown', () => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })
  }

  update() {
    this.basePlanet.update()
    this.grayPlanet.update()
    this.ship.update()
  }
}