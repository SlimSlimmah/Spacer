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

    this.basePlanet = new BasePlanet(this, cx, cy)
    this.ship = new Ship(this, this.basePlanet, this.basePlanet.coreRadius)

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
      if (this.isPanning) {
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

    // Create UI camera for fixed elements
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    this.uiCamera.setScroll(0, 0)
    
    // Mobile zoom buttons
    this.createZoomButtons()
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
    this.ship.update()
  }
}