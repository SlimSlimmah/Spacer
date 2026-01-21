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

    // Button handlers - stop propagation on both down and up
    this.minusBtn.on('pointerdown', (pointer) => {
      this.clickedInsidePopup = true
      pointer.event.stopPropagation()
    })

    this.minusBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.onMinusClicked()
      // Keep popup open
      this.scene.time.delayedCall(10, () => {
        this.clickedInsidePopup = false
      })
    })

    this.plusBtn.on('pointerdown', (pointer) => {
      this.clickedInsidePopup = true
      pointer.event.stopPropagation()
    })

    this.plusBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.onPlusClicked()
      // Keep popup open
      this.scene.time.delayedCall(10, () => {
        this.clickedInsidePopup = false
      })
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
    })
  }

  show(planet, x, y) {
    this.planet = planet
    this.isVisible = true
    this.justOpened = true
    this.container.setPosition(x, y)
    this.container.setVisible(true)
    this.updateShipCount()

    // Allow closing after 200ms
    this.scene.time.delayedCall(200, () => {
      this.justOpened = false
    })
  }

  hide() {
    this.isVisible = false
    this.container.setVisible(false)
    this.planet = null
    this.clickedInsidePopup = false
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

// ResearchPanel class
class ResearchPanel {
  constructor(scene) {
    this.scene = scene
    this.isVisible = false

    // Create panel container
    this.container = scene.add.container(0, 0)
    this.container.setDepth(250)
    this.container.setVisible(false)

    const panelWidth = 400
    const panelHeight = 300

    // Background
    this.bg = scene.add.graphics()
    this.bg.fillStyle(0x0a0f1a, 0.98)
    this.bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.bg.lineStyle(3, 0x66ccff, 1)
    this.bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.container.add(this.bg)

    // Title
    this.titleText = scene.add.text(0, -panelHeight/2 + 30, 'RESEARCH', {
      fontSize: '24px',
      color: '#66ccff',
      fontStyle: 'bold',
      align: 'center'
    })
    this.titleText.setOrigin(0.5)
    this.container.add(this.titleText)

    // Close button (X)
    this.closeBtn = scene.add.text(panelWidth/2 - 30, -panelHeight/2 + 30, '×', {
      fontSize: '32px',
      color: '#ff6666',
      fontStyle: 'bold'
    })
    this.closeBtn.setOrigin(0.5)
    this.closeBtn.setInteractive({ useHandCursor: true })
    this.closeBtn.on('pointerup', () => this.hide())
    this.container.add(this.closeBtn)

    // Upgrade items
    this.upgradeItems = []
    this.createUpgradeItem('Planet Detection', 'Scans for Planets', 0, 'planetDetection', -70)
    this.createUpgradeItem('Thrusters', 'Increases Ship Speed by 10%', 0, 'thrusters', 20)
  }

  createUpgradeItem(name, description, cost, id, yOffset) {
    const item = {}
    
    // Container for this upgrade
    const itemBg = this.scene.add.graphics()
    itemBg.fillStyle(0x1a2a3a, 0.8)
    itemBg.fillRoundedRect(-180, yOffset, 360, 70, 8)
    this.container.add(itemBg)

    // Name
    const nameText = this.scene.add.text(-170, yOffset + 10, name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.container.add(nameText)

    // Description
    const descText = this.scene.add.text(-170, yOffset + 32, description, {
      fontSize: '14px',
      color: '#aaaaaa'
    })
    this.container.add(descText)

    // Level indicator (for multi-purchase upgrades)
    const levelText = this.scene.add.text(-170, yOffset + 52, 'Level: 0', {
      fontSize: '12px',
      color: '#ffaa00'
    })
    this.container.add(levelText)

    // Purchase button
    const btnText = cost === 0 ? 'FREE' : `${cost} Credits`
    const purchaseBtn = this.scene.add.text(120, yOffset + 35, btnText, {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#2a4a2a',
      padding: { x: 15, y: 8 }
    })
    purchaseBtn.setOrigin(0.5)
    purchaseBtn.setInteractive({ useHandCursor: true })
    purchaseBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.purchaseUpgrade(id)
    })
    this.container.add(purchaseBtn)

    item.id = id
    item.bg = itemBg
    item.nameText = nameText
    item.descText = descText
    item.levelText = levelText
    item.purchaseBtn = purchaseBtn
    item.cost = cost

    this.upgradeItems.push(item)
  }

  purchaseUpgrade(id) {
    if (id === 'planetDetection') {
      if (!this.scene.research.planetDetection) {
        this.scene.research.planetDetection = true
        this.scene.scanBtn.setVisible(true)
        
        // Update UI to show purchased
        const item = this.upgradeItems.find(i => i.id === 'planetDetection')
        item.purchaseBtn.setText('PURCHASED')
        item.purchaseBtn.setStyle({ color: '#666666', backgroundColor: '#333333' })
        item.purchaseBtn.disableInteractive()
      }
    } else if (id === 'thrusters') {
      this.scene.research.thrustersLevel++
      const level = this.scene.research.thrustersLevel
      
      // Apply speed boost to all ships
      const speedMultiplier = 1 + (level * 0.1)
      this.scene.ships.forEach(ship => {
        ship.applySpeedMultiplier(speedMultiplier)
      })
      
      // Update UI
      const item = this.upgradeItems.find(i => i.id === 'thrusters')
      item.levelText.setText(`Level: ${level}`)
    }
  }

  show() {
    this.isVisible = true
    const cx = this.scene.cameras.main.scrollX + this.scene.scale.width / 2
    const cy = this.scene.cameras.main.scrollY + this.scene.scale.height / 2
    this.container.setPosition(cx, cy)
    this.container.setVisible(true)
  }

  hide() {
    this.isVisible = false
    this.container.setVisible(false)
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

  // Research state
  this.research = {
    planetDetection: false,
    thrustersLevel: 0
  }

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

  // Create research panel
  this.researchPanel = new ResearchPanel(this)
  this.cameras.main.ignore([this.researchPanel.container])

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

// Mouse wheel zoom - update the range to 0.2 - 3
this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
  const zoomAmount = deltaY > 0 ? -0.1 : 0.1
  const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomAmount, 0.2, 3)
  this.cameras.main.setZoom(newZoom)
})
    
    // UI buttons
  this.createZoomButtons()
  this.createAddShipButton()
  this.createScanButton() // Will be hidden by default
  this.createResearchButton()

  // Hide scan button until Planet Detection is researched
  this.scanBtn.setVisible(false)

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
    let x, y, coreRadius
    let validPosition = false
    let attempts = 0
    const maxAttempts = 50

    // Keep trying to find a non-overlapping position
    while (!validPosition && attempts < maxAttempts) {
      // Random position around home planet
      const angle = Math.random() * Math.PI * 2
      const distance = Phaser.Math.Between(200, 400)
      x = this.basePlanet.x + Math.cos(angle) * distance
      y = this.basePlanet.y + Math.sin(angle) * distance

      // Random size
      coreRadius = Phaser.Math.Between(50, 90)

      // Check if this position overlaps with any existing planet
      validPosition = true
      const minDistance = coreRadius + 100 // Buffer space

      // Check against home planet
      const distToHome = Math.sqrt(
        Math.pow(x - this.basePlanet.x, 2) + 
        Math.pow(y - this.basePlanet.y, 2)
      )
      if (distToHome < this.basePlanet.coreRadius + minDistance) {
        validPosition = false
      }

      // Check against all other planets
      for (const planet of this.planets) {
        const dist = Math.sqrt(
          Math.pow(x - planet.x, 2) + 
          Math.pow(y - planet.y, 2)
        )
        if (dist < planet.coreRadius + minDistance) {
          validPosition = false
          break
        }
      }

      attempts++
    }

    if (!validPosition) {
      console.log("Could not find valid position for new planet after", maxAttempts, "attempts")
      return
    }

    // Random colors
    const coreColor = Phaser.Display.Color.RandomRGB().color
    const ringColor = Phaser.Display.Color.RandomRGB().color

    // Generate name
    const planetNumber = this.planets.length + 1
    const name = `PLANET${planetNumber}`

    this.addPlanet(x, y, coreColor, ringColor, name, coreRadius)
  }

createResearchButton() {
  const fontSize = this.isMobile ? '16px' : '14px'
  const mobileButtonRow3 = this.isMobile ? 200 : 170

  const buttonStyle = {
    fontSize: fontSize,
    color: '#66ccff',
    backgroundColor: '#1a2a3a',
    padding: { x: 8, y: 6 },
    align: 'center'
  }

  if (this.isMobile) {
    this.researchBtn = this.add.text(this.scale.width / 2, mobileButtonRow3, 'RESEARCH', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
  } else {
    this.researchBtn = this.add.text(this.scale.width - 70, 280, 'RESEARCH', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)
  }

  this.cameras.main.ignore([this.researchBtn])

  this.researchBtn.on('pointerup', (pointer) => {
    pointer.event.stopPropagation()
    this.researchPanel.show()
  })
}

addShip() {
  const newShip = new Ship(this, this.basePlanet, this.basePlanet.coreRadius)
  
  // Apply current thruster upgrades to new ship
  if (this.research.thrustersLevel > 0) {
    const speedMultiplier = 1 + (this.research.thrustersLevel * 0.1)
    newShip.applySpeedMultiplier(speedMultiplier)
  }
  
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
    ignoreList.push(ship.trailGraphics)
    ignoreList.push(ship.statusText)
    ignoreList.push(ship.progressBarBg)
    ignoreList.push(ship.progressBarFill)
  })

  this.uiCamera.ignore(ignoreList)
}

handleResize(gameSize) {
  const mobileTopPadding = this.isMobile ? 60 : 20
  const mobileButtonRow2 = this.isMobile ? 130 : 100
  const mobileButtonRow3 = this.isMobile ? 200 : 170

  // Reposition UI elements on resize
  if (this.zoomInBtn && this.zoomOutBtn) {
    if (this.isMobile) {
      this.zoomOutBtn.setPosition(gameSize.width / 2 - 70, mobileTopPadding)
      this.zoomInBtn.setPosition(gameSize.width / 2 + 70, mobileTopPadding)
    } else {
      this.zoomInBtn.setPosition(gameSize.width - 70, 20)
      this.zoomOutBtn.setPosition(gameSize.width - 70, 85)
    }
  }

  if (this.addShipBtn) {
    if (this.isMobile) {
      this.addShipBtn.setPosition(gameSize.width / 2 - 70, mobileButtonRow2)
    } else {
      this.addShipBtn.setPosition(gameSize.width - 70, 150)
    }
  }

  if (this.scanBtn) {
    if (this.isMobile) {
      this.scanBtn.setPosition(gameSize.width / 2 + 70, mobileButtonRow2)
    } else {
      this.scanBtn.setPosition(gameSize.width - 70, 215)
    }
  }
  
    if (this.researchBtn) {
    if (this.isMobile) {
      this.researchBtn.setPosition(gameSize.width / 2, mobileButtonRow3)
    } else {
      this.researchBtn.setPosition(gameSize.width - 70, 280)
    }
  }
}
  


  createZoomButtons() {
  // Larger buttons for mobile
  const buttonSize = this.isMobile ? 60 : 50
  const fontSize = this.isMobile ? '40px' : '32px'
  
  // Safe area padding for mobile (notches, status bars, etc.)
  const mobileTopPadding = this.isMobile ? 60 : 20

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
    // Mobile: center top with safe padding, side by side
    this.zoomOutBtn = this.add.text(this.scale.width / 2 - 70, mobileTopPadding, '−', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0) // Extra insurance to keep it fixed

    this.zoomInBtn = this.add.text(this.scale.width / 2 + 70, mobileTopPadding, '+', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0) // Extra insurance to keep it fixed
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
  // Zoom range: 0.2 to 3 (was 0.5 to 3)
  this.zoomInBtn.on('pointerup', (pointer) => {
    pointer.event.stopPropagation()
    const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + 0.2, 0.2, 3)
    this.cameras.main.setZoom(newZoom)
  })

  this.zoomOutBtn.on('pointerup', (pointer) => {
    pointer.event.stopPropagation()
    const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom - 0.2, 0.2, 3)
    this.cameras.main.setZoom(newZoom)
  })
}

  createAddShipButton() {
  const buttonSize = this.isMobile ? 60 : 50
  const fontSize = this.isMobile ? '18px' : '14px'
  const mobileButtonRow2 = this.isMobile ? 130 : 100

  const buttonStyle = {
    fontSize: fontSize,
    color: '#ffaa00',
    backgroundColor: '#1a2a3a',
    padding: { x: 8, y: 6 },
    align: 'center'
  }

  if (this.isMobile) {
    this.addShipBtn = this.add.text(this.scale.width / 2 - 70, mobileButtonRow2, 'ADD SHIP', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
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
  const mobileButtonRow2 = this.isMobile ? 130 : 100

  const buttonStyle = {
    fontSize: fontSize,
    color: '#00ff00',
    backgroundColor: '#1a2a3a',
    padding: { x: 8, y: 6 },
    align: 'center'
  }

  if (this.isMobile) {
    this.scanBtn = this.add.text(this.scale.width / 2 + 70, mobileButtonRow2, 'SCAN', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
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