import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'
import BasePlanet from '../entities/BasePlanet.js'
import Ship from '../entities/Ship.js'

// PlanetPopup class inline
class PlanetPopup {
  constructor(scene) {
    this.scene = scene
    this.planet = null
    this.isVisible = false
    this.justOpened = false

    // Create popup container
    this.container = scene.add.container(0, 0)
    this.container.setDepth(200)
    this.container.setVisible(false)

    // Background
    this.bg = scene.add.graphics()
    this.bg.fillStyle(0x1a2a3a, 0.95)
    this.bg.fillRoundedRect(-75, -60, 150, 120, 8)
    this.bg.lineStyle(2, 0x66ccff, 1)
    this.bg.strokeRoundedRect(-75, -60, 150, 120, 8)
    this.container.add(this.bg)

    // Ship count text
    this.shipCountText = scene.add.text(0, -30, '0 Ships', {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center'
    })
    this.shipCountText.setOrigin(0.5)
    this.container.add(this.shipCountText)

    // Minus button
    this.minusBtn = scene.add.text(-40, 10, '−', {
      fontSize: '32px',
      color: '#ff6666',
      backgroundColor: '#333333',
      padding: { x: 15, y: 5 },
      fixedWidth: 50,
      fixedHeight: 50,
      align: 'center'
    })
    this.minusBtn.setOrigin(0.5)
    this.minusBtn.setInteractive({ useHandCursor: true })
    this.container.add(this.minusBtn)

    // Plus button
    this.plusBtn = scene.add.text(40, 10, '+', {
      fontSize: '32px',
      color: '#66ff66',
      backgroundColor: '#333333',
      padding: { x: 15, y: 5 },
      fixedWidth: 50,
      fixedHeight: 50,
      align: 'center'
    })
    this.plusBtn.setOrigin(0.5)
    this.plusBtn.setInteractive({ useHandCursor: true })
    this.container.add(this.plusBtn)

    // Track if we're clicking inside buttons
    this.clickedInsidePopup = false

    // Button handlers
    this.minusBtn.on('pointerdown', () => {
      this.clickedInsidePopup = true
    })

    this.minusBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.onMinusClicked()
      this.clickedInsidePopup = false
    })

    this.plusBtn.on('pointerdown', () => {
      this.clickedInsidePopup = true
    })

    this.plusBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.onPlusClicked()
      this.clickedInsidePopup = false
    })

    // Click anywhere to close (but not if clicking buttons or just opened)
    this.closeListener = this.scene.input.on('pointerup', (pointer) => {
      if (this.isVisible && !this.clickedInsidePopup && !this.justOpened) {
        // Check if click is outside popup
        const worldX = pointer.x + this.scene.cameras.main.scrollX
        const worldY = pointer.y + this.scene.cameras.main.scrollY
        const popupBounds = this.container.getBounds()
        
        if (!Phaser.Geom.Rectangle.Contains(popupBounds, worldX, worldY)) {
          this.hide()
        }
      }
      this.clickedInsidePopup = false
    })
  }

  show(planet, x, y) {
    this.planet = planet
    this.isVisible = true
    this.justOpened = true
    this.container.setPosition(x, y)
    this.container.setVisible(true)
    this.updateShipCount()

    // Allow closing after a short delay
    this.scene.time.delayedCall(100, () => {
      this.justOpened = false
    })
  }

  hide() {
    this.isVisible = false
    this.container.setVisible(false)
    this.planet = null
  }

  updateShipCount() {
    if (!this.planet) return

    const count = this.scene.ships.filter(ship => 
      ship.assignedPlanet === this.planet
    ).length

    this.shipCountText.setText(`${count} Ship${count !== 1 ? 's' : ''}`)
  }

  onMinusClicked() {
    if (!this.planet) return

    // Find one ship assigned to this planet and recall it
    const assignedShip = this.scene.ships.find(ship => 
      ship.assignedPlanet === this.planet
    )

    if (assignedShip) {
      assignedShip.recallToHome()
      // Update immediately
      this.scene.time.delayedCall(50, () => {
        this.updateShipCount()
      })
    }
  }

  onPlusClicked() {
    if (!this.planet) return

    // Find an idle ship
    const idleShip = this.scene.ships.find(ship => ship.state === 'IDLE')

    if (idleShip) {
      idleShip.travelTo(this.planet)
      // Update immediately
      this.scene.time.delayedCall(50, () => {
        this.updateShipCount()
      })
    }
  }
}

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

    // Planets array (excluding home planet)
    this.planets = []

    // Create UI camera BEFORE creating ships and popup
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
    this.uiCamera.setScroll(0, 0)

    // Ships array
    this.ships = []
    this.addShip()

    // Create planet popup AFTER UI camera exists
    this.planetPopup = new PlanetPopup(this)
    
    // CRITICAL: Make main camera ignore popup, only UI camera renders it
    this.cameras.main.ignore([this.planetPopup.container])

    // Second planet (gray) with PLANET1 nameplate
    this.addPlanet(cx + 250, cy - 100, 0x555555, 0x999999, 'PLANET1', 70)

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
    this.createScanButton()

    // Handle window resize
    this.scale.on('resize', this.handleResize, this)
  }

  addPlanet(x, y, coreColor, ringColor, name, coreRadius) {
    const planet = new BasePlanet(this, x, y, coreColor, ringColor, name, coreRadius)
    this.planets.push(planet)

    // Set up planet click handler for travel
    planet.setOnClick((clickedPlanet) => {
      // Send first idle ship to this planet
      const idleShip = this.ships.find(ship => ship.state === 'IDLE')
      if (idleShip) {
        idleShip.travelTo(clickedPlanet)
      }
    })

    // Set up planet hold handler to show popup
    planet.setOnHold((heldPlanet) => {
      this.planetPopup.show(heldPlanet, heldPlanet.x, heldPlanet.y)
    })

    this.updateUICameraIgnoreList()
  }

  scanForPlanet() {
    // Random position around home planet
    const angle = Math.random() * Math.PI * 2
    const distance = Phaser.Math.Between(200, 400)
    const x = this.basePlanet.x + Math.cos(angle) * distance
    const y = this.basePlanet.y + Math.sin(angle) * distance

    // Random colors
    const coreColor = Phaser.Display.Color.RandomRGB().color
    const ringColor = Phaser.Display.Color.RandomRGB().color

    // Random size
    const coreRadius = Phaser.Math.Between(50, 90)

    // Generate name
    const planetNumber = this.planets.length + 1
    const name = `PLANET${planetNumber}`

    this.addPlanet(x, y, coreColor, ringColor, name, coreRadius)
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
      this.basePlanet.nameText
    ]

    // Add all planets to ignore list
    this.planets.forEach(planet => {
      ignoreList.push(planet.graphics)
      ignoreList.push(planet.hitZone)
      ignoreList.push(planet.nameText)
    })

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
        this.addShipBtn.setPosition(gameSize.width / 2 - 70, 100)
      } else {
        this.addShipBtn.setPosition(gameSize.width - 70, 150)
      }
    }

    if (this.scanBtn) {
      if (this.isMobile) {
        this.scanBtn.setPosition(gameSize.width / 2 + 70, 100)
      } else {
        this.scanBtn.setPosition(gameSize.width - 70, 215)
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
    const fontSize = this.isMobile ? '18px' : '14px'

    const buttonStyle = {
      fontSize: fontSize,
      color: '#ffaa00',
      backgroundColor: '#1a2a3a',
      padding: { x: 8, y: 6 },
      align: 'center'
    }

    if (this.isMobile) {
      this.addShipBtn = this.add.text(this.scale.width / 2 - 70, 100, 'ADD SHIP', buttonStyle)
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

  createScanButton() {
    const fontSize = this.isMobile ? '18px' : '14px'

    const buttonStyle = {
      fontSize: fontSize,
      color: '#00ff00',
      backgroundColor: '#1a2a3a',
      padding: { x: 8, y: 6 },
      align: 'center'
    }

    if (this.isMobile) {
      this.scanBtn = this.add.text(this.scale.width / 2 + 70, 100, 'SCAN', buttonStyle)
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(100)
    } else {
      this.scanBtn = this.add.text(this.scale.width - 70, 215, 'SCAN', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(100)
    }

    this.cameras.main.ignore([this.scanBtn])

    this.scanBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.scanForPlanet()
    })
  }

  update() {
    this.basePlanet.update()
    this.planets.forEach(planet => planet.update())
    this.ships.forEach(ship => ship.update())
  }
}