import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'
import BasePlanet from '../entities/BasePlanet.js'
import Ship from '../entities/Ship.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

create() {
  // Detect if mobile
  this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const cx = this.scale.width / 2
  const cy = this.scale.height / 2

  // First planet (blue) with HOME PLANET nameplate
  this.basePlanet = new BasePlanet(this, cx, cy, 0x2a4a6e, 0x66ccff, 'HOME PLANET')

  // Second planet (gray) with PLANET1 nameplate
  this.grayPlanet = new BasePlanet(this, cx + 250, cy - 100, 0x555555, 0x999999, 'PLANET1')

  // Create UI camera BEFORE creating ships
  this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
  this.uiCamera.setScroll(0, 0)

  // Ships array
  this.ships = []
  this.addShip()
  
  // Set up planet click handler for travel
  this.grayPlanet.setOnClick((planet) => {
    // Send first idle ship to this planet
    const idleShip = this.ships.find(ship => ship.state === 'IDLE')
    if (idleShip) {
      idleShip.travelTo(planet)
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
  
  // UI buttons
  this.createZoomButtons()
  this.createAddShipButton()

  // Handle window resize
  this.scale.on('resize', this.handleResize, this)
}

  addShip() {
    const newShip = new Ship(this, this.basePlanet, this.basePlanet.coreRadius)
    this.ships.push(newShip)
    this.updateUICameraIgnoreList()
  }

  updateUICameraIgnoreList() {
    const ignoreList = [
      this.basePlanet.graphics, 
      this.basePlanet.hitZone,
      this.basePlanet.nameText,
      this.grayPlanet.graphics,
      this.grayPlanet.hitZone,
      this.grayPlanet.nameText
    ]

    // Add all ship graphics to ignore list
    this.ships.forEach(ship => {
      ignoreList.push(ship.graphics)
      ignoreList.push(ship.statusText)
      ignoreList.push(ship.progressBarBg)
      ignoreList.push(ship.progressBarFill)
    })

    this.uiCamera.ignore(ignoreList)
  }

  handleResize(gameSize) {
    // Reposition UI elements on resize
    if (this.zoomInBtn && this.zoomOutBtn) {
      if (this.isMobile) {
        this.zoomOutBtn.setPosition(gameSize.width / 2 - 70, 30)
        this.zoomInBtn.setPosition(gameSize.width / 2 + 70, 30)
      } else {
        this.zoomInBtn.setPosition(gameSize.width - 70, 20)
        this.zoomOutBtn.setPosition(gameSize.width - 70, 85)
      }
    }

    if (this.addShipBtn) {
      if (this.isMobile) {
        this.addShipBtn.setPosition(gameSize.width / 2, 100)
      } else {
        this.addShipBtn.setPosition(gameSize.width - 70, 150)
      }
    }
  }

  createZoomButtons() {
    // Larger buttons for mobile
    const buttonSize = this.isMobile ? 60 : 50
    const fontSize = this.isMobile ? '40px' : '32px'

    const buttonStyle = {
      fontSize: fontSize,
      color: '#66ccff',
      backgroundColor: '#1a2a3a',
      padding: { x: 15, y: 10 },
      fixedWidth: buttonSize,
      fixedHeight: buttonSize,
      align: 'center'
    }

    // Position buttons differently for mobile vs desktop
    if (this.isMobile) {
      // Mobile: center top, side by side, slightly larger spacing
      this.zoomOutBtn = this.add.text(this.scale.width / 2 - 70, 30, '−', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(100)

      this.zoomInBtn = this.add.text(this.scale.width / 2 + 70, 30, '+', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(100)
    } else {
      // Desktop: top right, stacked vertically
      this.zoomInBtn = this.add.text(this.scale.width - 70, 20, '+', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)

      this.zoomOutBtn = this.add.text(this.scale.width - 70, 85, '−', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
    }

    // Make buttons only visible to UI camera
    this.cameras.main.ignore([this.zoomInBtn, this.zoomOutBtn])

    // Use pointerup instead of pointerdown for better mobile response
    this.zoomInBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })

    this.zoomOutBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - 0.2, 0.5, 3)
      this.cameras.main.setZoom(newZoom)
    })
  }

  createAddShipButton() {
    const buttonSize = this.isMobile ? 60 : 50
    const fontSize = this.isMobile ? '24px' : '18px'

    const buttonStyle = {
      fontSize: fontSize,
      color: '#ffaa00',
      backgroundColor: '#1a2a3a',
      padding: { x: 10, y: 8 },
      align: 'center'
    }

    if (this.isMobile) {
      this.addShipBtn = this.add.text(this.scale.width / 2, 100, 'ADD SHIP', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(100)
    } else {
      this.addShipBtn = this.add.text(this.scale.width - 70, 150, 'ADD SHIP', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
    }

    this.cameras.main.ignore([this.addShipBtn])

    this.addShipBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.addShip()
    })
  }

  update() {
    this.basePlanet.update()
    this.grayPlanet.update()
    this.ships.forEach(ship => ship.update())
  }
}