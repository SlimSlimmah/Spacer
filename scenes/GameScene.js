import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'
import BasePlanet from '../entities/BasePlanet.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    this.basePlanet = new BasePlanet(this, cx, cy)

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

    const zoomInBtn = this.add.text(this.scale.width - 70, 20, '+', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(100)

    const zoomOutBtn = this.add.text(this.scale.width - 70, 85, '-', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(100)

    zoomInBtn.on('pointerdown', () => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })

    zoomOutBtn.on('pointerdown', () => {
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })
  }

  update() {
    this.basePlanet.update()
  }
}