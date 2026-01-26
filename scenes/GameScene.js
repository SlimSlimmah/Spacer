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

    // Create popup container - FIXED TO SCREEN
    this.container = scene.add.container(0, 0)
    this.container.setDepth(200)
    this.container.setVisible(false)
    this.container.setScrollFactor(0) // Fixed to screen, not world

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

    // Click anywhere to close - use screen coordinates
    this.closeListener = this.scene.input.on('pointerup', (pointer) => {
      if (this.isVisible && !this.clickedInsidePopup && !this.justOpened) {
        // Use screen coordinates since popup has scrollFactor 0
        const screenX = pointer.x
        const screenY = pointer.y
        const popupX = this.container.x
        const popupY = this.container.y
        
        const bounds = new Phaser.Geom.Rectangle(
          popupX - 75,
          popupY - 60,
          150,
          120
        )
        
        if (!Phaser.Geom.Rectangle.Contains(bounds, screenX, screenY)) {
          this.hide()
        }
      }
    })
  }





show(planet, worldX, worldY) {
  this.planet = planet
  this.isVisible = true
  this.justOpened = true
  
  // Convert world coordinates to screen coordinates
  const cam = this.scene.cameras.main
  const screenX = (worldX - cam.scrollX) * cam.zoom
  const screenY = (worldY - cam.scrollY) * cam.zoom
  
  // Clamp to screen bounds to keep popup visible
  const popupHalfWidth = 75
  const popupHalfHeight = 60
  const resourceBarHeight = this.scene.resourceBar ? this.scene.resourceBar.getBarHeight() : 40
  
  const clampedX = Phaser.Math.Clamp(screenX, popupHalfWidth, this.scene.scale.width - popupHalfWidth)
  const clampedY = Phaser.Math.Clamp(screenY, popupHalfHeight + resourceBarHeight, this.scene.scale.height - popupHalfHeight)
  
  this.container.setPosition(clampedX, clampedY)
  this.container.setVisible(true)
  this.updateShipCount()

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

    const assignedShip = this.scene.ships.find(ship => 
      ship.assignedPlanet === this.planet
    )

    if (assignedShip) {
      assignedShip.recallToHome()
      this.scene.time.delayedCall(50, () => {
        this.updateShipCount()
      })
    }
  }

  onPlusClicked() {
    if (!this.planet) return

    const idleShip = this.scene.ships.find(ship => ship.state === 'IDLE')

    if (idleShip) {
      idleShip.travelTo(this.planet)
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
    this.justOpened = false

    // Create panel container
    this.container = scene.add.container(0, 0)
    this.container.setDepth(250)
    this.container.setVisible(false)
    this.container.setScrollFactor(0)

    const panelWidth = 400
    const panelHeight = 500

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
    this.closeBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.hide()
    })
    this.container.add(this.closeBtn)

    // Scrollable content container - start at top of content area
    this.contentStartY = -panelHeight/2 + 70
    this.scrollContainer = scene.add.container(0, this.contentStartY)
    this.container.add(this.scrollContainer)

    this.scrollY = 0
    this.maxScrollY = 0
    this.isDragging = false
    this.dragStartY = 0

    // Upgrade items
    this.upgradeItems = []
    this.createUpgradeItem('Planet Detection', 'Scans for Planets', 0, 'planetDetection')
    this.createUpgradeItem('Thrusters', 'Increases Ship Speed by 10%', 0, 'thrusters')
    this.createUpgradeItem('Fuel Refinement', 'Unlocks Refinery', 0, 'fuelRefinement')
    this.createUpgradeItem('Planet Database', 'Increases Planet Capacity by 5', 0, 'planetDatabase')
    this.createUpgradeItem('Ship Hangar', 'Increases Ship Capacity by 5', 0, 'shipHangar')

    this.repositionUpgrades()

    // Scrolling with mouse wheel
    scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
      if (this.isVisible) {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.3, 0, this.maxScrollY)
        this.updateScrollPosition()
      }
    })

    // Touch/drag scrolling
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight),
      Phaser.Geom.Rectangle.Contains
    )
    
    this.container.on('pointerdown', (pointer) => {
      if (this.isVisible) {
        this.isDragging = true
        this.dragStartY = pointer.y
        this.dragStartScrollY = this.scrollY
      }
    })

    scene.input.on('pointermove', (pointer) => {
      if (this.isDragging && this.isVisible) {
        const deltaY = this.dragStartY - pointer.y
        this.scrollY = Phaser.Math.Clamp(this.dragStartScrollY + deltaY, 0, this.maxScrollY)
        this.updateScrollPosition()
      }
    })

    scene.input.on('pointerup', () => {
      this.isDragging = false
    })

    // Click anywhere to close
    scene.input.on('pointerup', (pointer) => {
      if (this.isVisible && !this.justOpened && !this.isDragging) {
        const screenX = pointer.x
        const screenY = pointer.y
        
        const panelCenterX = this.scene.scale.width / 2
        const panelCenterY = this.scene.scale.height / 2
        const halfWidth = panelWidth / 2
        const halfHeight = panelHeight / 2
        
        const bounds = new Phaser.Geom.Rectangle(
          panelCenterX - halfWidth,
          panelCenterY - halfHeight,
          panelWidth,
          panelHeight
        )
        
        if (!Phaser.Geom.Rectangle.Contains(bounds, screenX, screenY)) {
          this.hide()
        }
      }
    })
  }

  createUpgradeItem(name, description, cost, id) {
    const item = {
      id: id,
      name: name,
      description: description,
      cost: cost,
      isPurchased: false,
      level: 0,
      elements: null
    }

    this.upgradeItems.push(item)
  }

  renderUpgradeItem(item, yOffset) {
    // Container for this upgrade
    const itemBg = this.scene.add.graphics()
    itemBg.fillStyle(0x1a2a3a, 0.8)
    itemBg.fillRoundedRect(-180, yOffset, 360, 70, 8)
    this.scrollContainer.add(itemBg)

    // Name
    const nameText = this.scene.add.text(-170, yOffset + 10, item.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.scrollContainer.add(nameText)

    // Description
    const descText = this.scene.add.text(-170, yOffset + 32, item.description, {
      fontSize: '14px',
      color: '#aaaaaa'
    })
    this.scrollContainer.add(descText)

    // Level indicator (for multi-purchase upgrades)
    const levelText = this.scene.add.text(-170, yOffset + 52, `Level: ${item.level}`, {
      fontSize: '12px',
      color: '#ffaa00'
    })
    this.scrollContainer.add(levelText)

    // Purchase button
    const isRepeatable = item.id === 'thrusters' || item.id === 'planetDatabase' || item.id === 'shipHangar'
    const btnText = item.isPurchased && !isRepeatable ? 'PURCHASED' : (item.cost === 0 ? 'FREE' : `${item.cost} Credits`)
    const purchaseBtn = this.scene.add.text(120, yOffset + 35, btnText, {
      fontSize: '16px',
      color: item.isPurchased && !isRepeatable ? '#666666' : '#00ff00',
      backgroundColor: item.isPurchased && !isRepeatable ? '#333333' : '#2a4a2a',
      padding: { x: 15, y: 8 }
    })
    purchaseBtn.setOrigin(0.5)
    
    if (!item.isPurchased || isRepeatable) {
      purchaseBtn.setInteractive({ useHandCursor: true })
      purchaseBtn.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation()
      })
      purchaseBtn.on('pointerup', (pointer) => {
        pointer.event.stopPropagation()
        this.purchaseUpgrade(item.id)
      })
    }
    
    this.scrollContainer.add(purchaseBtn)

    item.elements = {
      bg: itemBg,
      nameText: nameText,
      descText: descText,
      levelText: levelText,
      purchaseBtn: purchaseBtn
    }
  }

  repositionUpgrades() {
    // Clear existing rendered elements
    this.upgradeItems.forEach(item => {
      if (item.elements) {
        item.elements.bg.destroy()
        item.elements.nameText.destroy()
        item.elements.descText.destroy()
        item.elements.levelText.destroy()
        item.elements.purchaseBtn.destroy()
        item.elements = null
      }
    })

    // Sort: repeatable upgrades first, then unpurchased, then purchased
    const sortedItems = [...this.upgradeItems].sort((a, b) => {
      const aRepeatable = a.id === 'thrusters' || a.id === 'planetDatabase' || a.id === 'shipHangar'
      const bRepeatable = b.id === 'thrusters' || b.id === 'planetDatabase' || b.id === 'shipHangar'
      
      if (aRepeatable && !bRepeatable) return -1
      if (!aRepeatable && bRepeatable) return 1
      
      if (!a.isPurchased && b.isPurchased) return -1
      if (a.isPurchased && !b.isPurchased) return 1
      
      return 0
    })

    // Render all items
    let yOffset = 0
    sortedItems.forEach(item => {
      this.renderUpgradeItem(item, yOffset)
      yOffset += 90
    })

    // Calculate max scroll (visible area is ~400px)
    this.maxScrollY = Math.max(0, yOffset - 400)
    
    // Reset scroll to top
    this.scrollY = 0
    this.updateScrollPosition()
  }

  updateScrollPosition() {
    this.scrollContainer.setY(this.contentStartY - this.scrollY)
  }

  purchaseUpgrade(id) {
    const item = this.upgradeItems.find(i => i.id === id)
    if (!item) return

    if (id === 'planetDetection') {
      if (!this.scene.research.planetDetection) {
        this.scene.research.planetDetection = true
        this.scene.scanBtn.setVisible(true)
        item.isPurchased = true
        this.repositionUpgrades()
      }
    } else if (id === 'thrusters') {
      this.scene.research.thrustersLevel++
      item.level = this.scene.research.thrustersLevel
      
      const speedMultiplier = 1 + (item.level * 0.1)
      this.scene.ships.forEach(ship => {
        ship.applySpeedMultiplier(speedMultiplier)
      })
      
      this.repositionUpgrades()
    } else if (id === 'fuelRefinement') {
      if (!this.scene.research.fuelRefinement) {
        this.scene.research.fuelRefinement = true
        this.scene.refineryBtn.setVisible(true)
        item.isPurchased = true
        this.repositionUpgrades()
      }
    } else if (id === 'planetDatabase') {
      this.scene.research.planetDatabaseLevel = (this.scene.research.planetDatabaseLevel || 0) + 1
      item.level = this.scene.research.planetDatabaseLevel
      
      this.scene.maxPlanets += 5
      if (this.scene.resourceBar) {
        this.scene.resourceBar.updatePlanetCount(this.scene.planets.length, this.scene.maxPlanets)
      }
      
      this.repositionUpgrades()
    } else if (id === 'shipHangar') {
      this.scene.research.shipHangarLevel = (this.scene.research.shipHangarLevel || 0) + 1
      item.level = this.scene.research.shipHangarLevel
      
      this.scene.maxShips += 5
      if (this.scene.resourceBar) {
        this.scene.resourceBar.updateShipCount(this.scene.ships.length, this.scene.maxShips)
      }
      
      this.repositionUpgrades()
    }
  }

  show() {
    this.isVisible = true
    this.justOpened = true
    
    const centerX = this.scene.scale.width / 2
    const centerY = this.scene.scale.height / 2
    this.container.setPosition(centerX, centerY)
    this.container.setVisible(true)

    this.scene.time.delayedCall(200, () => {
      this.justOpened = false
    })
  }

  hide() {
    this.isVisible = false
    this.container.setVisible(false)
  }
}







// DealershipPanel class
class DealershipPanel {
  constructor(scene) {
    this.scene = scene
    this.isVisible = false
    this.justOpened = false

    // Create panel container
    this.container = scene.add.container(0, 0)
    this.container.setDepth(250)
    this.container.setVisible(false)
    this.container.setScrollFactor(0)

    const panelWidth = 400
    const panelHeight = 250

    // Background
    this.bg = scene.add.graphics()
    this.bg.fillStyle(0x0a0f1a, 0.98)
    this.bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.bg.lineStyle(3, 0xffaa00, 1)
    this.bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.container.add(this.bg)

    // Title
    this.titleText = scene.add.text(0, -panelHeight/2 + 30, 'DEALERSHIP', {
      fontSize: '24px',
      color: '#ffaa00',
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

    // Ship purchase option
    this.createShipItem('Basic Ship', 'Standard mining vessel', 0, -20)

    // Click anywhere to close
    this.closeListener = this.scene.input.on('pointerup', (pointer) => {
      if (this.isVisible && !this.justOpened) {
        const screenX = pointer.x
        const screenY = pointer.y
        
        const panelCenterX = this.scene.scale.width / 2
        const panelCenterY = this.scene.scale.height / 2
        const halfWidth = panelWidth / 2
        const halfHeight = panelHeight / 2
        
        const bounds = new Phaser.Geom.Rectangle(
          panelCenterX - halfWidth,
          panelCenterY - halfHeight,
          panelWidth,
          panelHeight
        )
        
        if (!Phaser.Geom.Rectangle.Contains(bounds, screenX, screenY)) {
          this.hide()
        }
      }
    })
  }

  createShipItem(name, description, cost, yOffset) {
    // Container for this ship
    const itemBg = this.scene.add.graphics()
    itemBg.fillStyle(0x1a2a3a, 0.8)
    itemBg.fillRoundedRect(-180, yOffset, 360, 70, 8)
    this.container.add(itemBg)

    // Name
    const nameText = this.scene.add.text(-170, yOffset + 15, name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.container.add(nameText)

    // Description
    const descText = this.scene.add.text(-170, yOffset + 38, description, {
      fontSize: '14px',
      color: '#aaaaaa'
    })
    this.container.add(descText)

    // Purchase button
    const btnText = cost === 0 ? 'FREE' : `${cost} Credits`
    const purchaseBtn = this.scene.add.text(120, yOffset + 35, btnText, {
      fontSize: '16px',
      color: '#ffaa00',
      backgroundColor: '#3a2a1a',
      padding: { x: 15, y: 8 }
    })
    purchaseBtn.setOrigin(0.5)
    purchaseBtn.setInteractive({ useHandCursor: true })
    purchaseBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation()
    })
    purchaseBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.purchaseShip()
    })
    this.container.add(purchaseBtn)
  }

  purchaseShip() {
    // Add a new ship
    this.scene.addShip()
  }

  show() {
    this.isVisible = true
    this.justOpened = true
    
    const centerX = this.scene.scale.width / 2
    const centerY = this.scene.scale.height / 2
    this.container.setPosition(centerX, centerY)
    this.container.setVisible(true)

    this.scene.time.delayedCall(200, () => {
      this.justOpened = false
    })
  }

  hide() {
    this.isVisible = false
    this.container.setVisible(false)
  }
}


// ResourceBar class - update the constructor
// ResourceBar class
class ResourceBar {
  constructor(scene) {
    this.scene = scene
    this.resources = {}
    this.gasCount = 0
    this.fuelCount = 0
    
    // Safe area padding for mobile
    const topPadding = scene.isMobile ? 80 : 0
    
    // Create container fixed to screen
    this.container = scene.add.container(0, topPadding)
    this.container.setDepth(300)
    this.container.setScrollFactor(0)
    
    const barHeight = 40
    const barWidth = scene.scale.width
    
    // Background bar
    this.bg = scene.add.graphics()
    this.bg.fillStyle(0x0a0f1a, 0.95)
    this.bg.fillRect(0, 0, barWidth, barHeight)
    this.bg.lineStyle(2, 0x66ccff, 0.5)
    this.bg.lineBetween(0, barHeight, barWidth, barHeight)
    this.container.add(this.bg)
    
    // Container for resource items (will be updated dynamically)
    this.resourceItems = []
    
    // Planet count
    this.planetCountText = scene.add.text(barWidth - 20, barHeight / 2 - 10, 'PLANETS: 2/10', {
      fontSize: '14px',
      color: '#66ccff',
      fontStyle: 'bold'
    })
    this.planetCountText.setOrigin(1, 0.5)
    this.container.add(this.planetCountText)
    
    // Ship count (supply)
    this.shipCountText = scene.add.text(barWidth - 20, barHeight / 2 + 10, 'SHIPS: 1/10', {
      fontSize: '14px',
      color: '#ffaa00',
      fontStyle: 'bold'
    })
    this.shipCountText.setOrigin(1, 0.5)
    this.container.add(this.shipCountText)
    
    this.topPadding = topPadding
    this.update()
  }
  
  addGas(amount) {
    this.gasCount += amount
    this.update()
  }
  
  addFuel(amount) {
    this.fuelCount += amount
    this.update()
  }
  
  removeGas(amount) {
    if (this.gasCount >= amount) {
      this.gasCount -= amount
      this.update()
      return true
    }
    return false
  }
  
  addRevolution(rarity) {
    const rarityName = rarity.name
    
    if (!this.resources[rarityName]) {
      this.resources[rarityName] = {
        name: rarityName,
        color: rarity.ringBase,
        count: 0
      }
    }
    
    this.resources[rarityName].count++
    this.update()
  }
  
  updateShipCount(current, max) {
    this.shipCountText.setText(`SHIPS: ${current}/${max}`)
  }
  
  updatePlanetCount(current, max) {
    this.planetCountText.setText(`PLANETS: ${current}/${max}`)
  }
  
  update() {
    // Clear existing resource items
    this.resourceItems.forEach(item => item.destroy())
    this.resourceItems = []
    
    // Draw resource items
    let xOffset = 20
    const yCenter = 20
    
    const sortedResources = Object.entries(this.resources).sort((a, b) => b[1].count - a[1].count)
    
    for (const [rarityName, data] of sortedResources) {
      // Colored dot
      const dot = this.scene.add.graphics()
      dot.fillStyle(data.color, 1)
      dot.fillCircle(xOffset, yCenter, 6)
      this.container.add(dot)
      this.resourceItems.push(dot)
      
      // Count text
      const countText = this.scene.add.text(xOffset + 12, yCenter, data.count.toString(), {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      countText.setOrigin(0, 0.5)
      this.container.add(countText)
      this.resourceItems.push(countText)
      
      xOffset += 50 + (data.count.toString().length * 10)
    }
    
    // Add Gas (G) counter
    if (xOffset > 20) xOffset += 20 // Add spacing after minerals
    
    const gasLabel = this.scene.add.text(xOffset, yCenter, 'G', {
      fontSize: '16px',
      color: '#ffcc00',
      fontStyle: 'bold'
    })
    gasLabel.setOrigin(0, 0.5)
    this.container.add(gasLabel)
    this.resourceItems.push(gasLabel)
    
    const gasCount = this.scene.add.text(xOffset + 15, yCenter, this.gasCount.toString(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    gasCount.setOrigin(0, 0.5)
    this.container.add(gasCount)
    this.resourceItems.push(gasCount)
    
    xOffset += 35 + (this.gasCount.toString().length * 10)
    
    // Add Fuel (F) counter
    xOffset += 20 // Spacing
    
    const fuelLabel = this.scene.add.text(xOffset, yCenter, 'F', {
      fontSize: '16px',
      color: '#ff6600',
      fontStyle: 'bold'
    })
    fuelLabel.setOrigin(0, 0.5)
    this.container.add(fuelLabel)
    this.resourceItems.push(fuelLabel)
    
    const fuelCount = this.scene.add.text(xOffset + 15, yCenter, this.fuelCount.toString(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    fuelCount.setOrigin(0, 0.5)
    this.container.add(fuelCount)
    this.resourceItems.push(fuelCount)
  }
  
  resize(width) {
    // Redraw background with new width
    this.bg.clear()
    this.bg.fillStyle(0x0a0f1a, 0.95)
    this.bg.fillRect(0, 0, width, 40)
    this.bg.lineStyle(2, 0x66ccff, 0.5)
    this.bg.lineBetween(0, 40, width, 40)
    
    // Reposition counters
    this.planetCountText.setPosition(width - 20, 10)
    this.shipCountText.setPosition(width - 20, 30)
  }
  
  getBarHeight() {
    return 40 + this.topPadding
  }
}




// RefineryPanel class
class RefineryPanel {
  constructor(scene) {
    this.scene = scene
    this.isVisible = false
    this.justOpened = false
    this.isRefining = false
    this.refineProgress = 0

    // Create panel container
    this.container = scene.add.container(0, 0)
    this.container.setDepth(250)
    this.container.setVisible(false)
    this.container.setScrollFactor(0)

    const panelWidth = 400
    const panelHeight = 300

    // Background
    this.bg = scene.add.graphics()
    this.bg.fillStyle(0x0a0f1a, 0.98)
    this.bg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.bg.lineStyle(3, 0xff6600, 1)
    this.bg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 12)
    this.container.add(this.bg)

    // Title
    this.titleText = scene.add.text(0, -panelHeight/2 + 30, 'REFINERY', {
      fontSize: '24px',
      color: '#ff6600',
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

    // Info text
    this.infoText = scene.add.text(0, -40, 'Convert Gas into Fuel\n1 Gas → 1 Fuel (10 seconds)', {
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center'
    })
    this.infoText.setOrigin(0.5)
    this.container.add(this.infoText)

    // Resource display
    this.gasText = scene.add.text(0, 10, 'Gas: 0', {
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold'
    })
    this.gasText.setOrigin(0.5)
    this.container.add(this.gasText)

    this.fuelText = scene.add.text(0, 40, 'Fuel: 0', {
      fontSize: '18px',
      color: '#ff6600',
      fontStyle: 'bold'
    })
    this.fuelText.setOrigin(0.5)
    this.container.add(this.fuelText)

    // Progress bar (hidden initially)
    this.progressBg = scene.add.graphics()
    this.progressBg.setVisible(false)
    this.container.add(this.progressBg)

    this.progressFill = scene.add.graphics()
    this.progressFill.setVisible(false)
    this.container.add(this.progressFill)

    this.progressText = scene.add.text(0, 90, '', {
      fontSize: '14px',
      color: '#ffffff'
    })
    this.progressText.setOrigin(0.5)
    this.progressText.setVisible(false)
    this.container.add(this.progressText)

    // Refine button
    this.refineBtn = scene.add.text(0, 120, 'REFINE GAS', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#ff6600',
      padding: { x: 20, y: 10 }
    })
    this.refineBtn.setOrigin(0.5)
    this.refineBtn.setInteractive({ useHandCursor: true })
    this.refineBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation()
    })
    this.refineBtn.on('pointerup', (pointer) => {
      pointer.event.stopPropagation()
      this.startRefining()
    })
    this.container.add(this.refineBtn)

    // Click anywhere to close
    this.closeListener = this.scene.input.on('pointerup', (pointer) => {
      if (this.isVisible && !this.justOpened && !this.isRefining) {
        const screenX = pointer.x
        const screenY = pointer.y
        
        const panelCenterX = this.scene.scale.width / 2
        const panelCenterY = this.scene.scale.height / 2
        const halfWidth = panelWidth / 2
        const halfHeight = panelHeight / 2
        
        const bounds = new Phaser.Geom.Rectangle(
          panelCenterX - halfWidth,
          panelCenterY - halfHeight,
          panelWidth,
          panelHeight
        )
        
        if (!Phaser.Geom.Rectangle.Contains(bounds, screenX, screenY)) {
          this.hide()
        }
      }
    })
  }

  startRefining() {
    if (this.isRefining) return
    
    // Check if we have gas
    if (this.scene.resourceBar.gasCount < 1) {
      console.log("Not enough gas!")
      return
    }

    // Remove gas
    if (!this.scene.resourceBar.removeGas(1)) {
      return
    }

    this.isRefining = true
    this.refineProgress = 0
    this.refineBtn.setStyle({ backgroundColor: '#666666' })
    this.refineBtn.disableInteractive()
    
    this.progressBg.setVisible(true)
    this.progressFill.setVisible(true)
    this.progressText.setVisible(true)

    // 10 second refine
    this.scene.tweens.add({
      targets: this,
      refineProgress: 100,
      duration: 10000,
      ease: 'Linear',
      onUpdate: () => {
        this.updateProgressBar()
      },
      onComplete: () => {
        // Add fuel
        this.scene.resourceBar.addFuel(1)
        
        this.isRefining = false
        this.refineBtn.setStyle({ backgroundColor: '#ff6600' })
        this.refineBtn.setInteractive({ useHandCursor: true })
        
        this.progressBg.setVisible(false)
        this.progressFill.setVisible(false)
        this.progressText.setVisible(false)
        
        this.updateResourceDisplay()
      }
    })
  }

  updateProgressBar() {
    const barWidth = 300
    const barHeight = 20
    const barX = -barWidth / 2
    const barY = 70

    // Background
    this.progressBg.clear()
    this.progressBg.fillStyle(0x333333, 1)
    this.progressBg.fillRect(barX, barY, barWidth, barHeight)

    // Fill
    this.progressFill.clear()
    this.progressFill.fillStyle(0xff6600, 1)
    this.progressFill.fillRect(barX, barY, (barWidth * this.refineProgress) / 100, barHeight)

    this.progressText.setText(`Refining... ${Math.floor(this.refineProgress)}%`)
  }

  updateResourceDisplay() {
    this.gasText.setText(`Gas: ${this.scene.resourceBar.gasCount}`)
    this.fuelText.setText(`Fuel: ${this.scene.resourceBar.fuelCount}`)
  }

  show() {
    this.isVisible = true
    this.justOpened = true
    
    const centerX = this.scene.scale.width / 2
    const centerY = this.scene.scale.height / 2
    this.container.setPosition(centerX, centerY)
    this.container.setVisible(true)
    
    this.updateResourceDisplay()

    this.scene.time.delayedCall(200, () => {
      this.justOpened = false
    })
  }

  hide() {
    if (this.isRefining) return // Can't close while refining
    
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
  thrustersLevel: 0,
  fuelRefinement: false,
  planetDatabaseLevel: 0,
  shipHangarLevel: 0
}



  // Limits
  this.maxShips = 10
  this.maxPlanets = 10

  // First planet (blue) with HOME PLANET nameplate
  this.basePlanet = new BasePlanet(this, cx, cy, 0x2a4a6e, 0x66ccff, 'HOME PLANET')

  // Planets array (excluding home planet)
  this.planets = []

  // Create UI camera BEFORE creating ships and popup
  this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height)
  this.uiCamera.setScroll(0, 0)

  // Create resource bar FIRST
  this.resourceBar = new ResourceBar(this)
  this.cameras.main.ignore([this.resourceBar.container])

  // Ships array
  this.ships = []
  this.addShip()

  // Create planet popup AFTER UI camera exists
  this.planetPopup = new PlanetPopup(this)
  
  // CRITICAL: Make main camera ignore popup, only UI camera renders it
  this.cameras.main.ignore([this.planetPopup.container])

  // Create research panel
  this.researchPanel = new ResearchPanel(this)
  
  // Create dealership panel
  this.dealershipPanel = new DealershipPanel(this)
  
  // Create refinery panel
  this.refineryPanel = new RefineryPanel(this)

  // Second planet (gray COMMON level 1)
  const commonRarity = { 
    name: 'COMMON', 
    ringBase: 0x999999, 
    textColor: '#999999' 
  }
  this.addPlanet(cx + 250, cy - 100, 0x555555, 0x999999, 'COMMON LV1', 55, '#999999', commonRarity, 'mineral')

  // Gas planet (yellow/orange swirls)
  this.addPlanet(cx - 200, cy + 150, 0x8a6a2d, 0xddaa44, 'GAS PLANET', 80, '#ddaa44', null, 'gas')

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

  // Mouse wheel zoom - zoom range: 0.2 - 3
  this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
    const zoomAmount = deltaY > 0 ? -0.1 : 0.1
    const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + zoomAmount, 0.2, 3)
    this.cameras.main.setZoom(newZoom)
  })
  
  // UI buttons
  this.createZoomButtons()
  this.createScanButton()
  this.createResearchButton()
  this.createDealershipButton()
  this.createRefineryButton()

  // Hide scan button until Planet Detection is researched
  this.scanBtn.setVisible(false)
  
  // Hide refinery button until Fuel Refinement is researched
  this.refineryBtn.setVisible(false)

  // Handle window resize
  this.scale.on('resize', this.handleResize, this)
}







addPlanet(x, y, coreColor, ringColor, name, coreRadius, textColor = '#ffffff', rarity = null, type = 'mineral') {
  const planet = new BasePlanet(this, x, y, coreColor, ringColor, name, coreRadius, textColor, rarity, type)
  this.planets.push(planet)

  planet.setOnClick((clickedPlanet) => {
    const idleShip = this.ships.find(ship => ship.state === 'IDLE')
    if (idleShip) {
      idleShip.travelTo(clickedPlanet)
    }
  })

  planet.setOnHold((heldPlanet, pointerX, pointerY) => {
    this.planetPopup.show(heldPlanet, pointerX, pointerY)
  })

  this.updateUICameraIgnoreList()
  
  if (this.resourceBar) {
    this.resourceBar.updatePlanetCount(this.planets.length, this.maxPlanets)
  }
}





// Add this method to the GameScene class
getRarityColors() {
  const rarities = [
    { name: 'COMMON', weight: 50, ringBase: 0x999999, textColor: '#999999' },
    { name: 'UNCOMMON', weight: 30, ringBase: 0x4a9d4a, textColor: '#4a9d4a' },
    { name: 'RARE', weight: 12, ringBase: 0x4a7acc, textColor: '#4a7acc' },
    { name: 'EPIC', weight: 5, ringBase: 0xa84acc, textColor: '#a84acc' },
    { name: 'LEGENDARY', weight: 2, ringBase: 0xddc84a, textColor: '#ddc84a' },
    { name: 'MYTHIC', weight: 1, ringBase: 0xdd7a4a, textColor: '#dd7a4a' }
  ]
  
  const totalWeight = rarities.reduce((sum, r) => sum + r.weight, 0)
  
  let random = Math.random() * totalWeight
  for (const rarity of rarities) {
    random -= rarity.weight
    if (random <= 0) {
      return rarity
    }
  }
  
  return rarities[0]
}

scanForPlanet() {
  if (this.planets.length >= this.maxPlanets) {
    console.log("Planet limit reached!")
    return
  }

  let x, y, coreRadius
  let validPosition = false
  let attempts = 0
  const maxAttempts = 50

  const baseMinDistance = 200
  const baseMaxDistance = 400
  const distanceIncrease = this.planets.length * 50
  const minDistance = baseMinDistance + distanceIncrease
  const maxDistance = baseMaxDistance + distanceIncrease

  while (!validPosition && attempts < maxAttempts) {
    const angle = Math.random() * Math.PI * 2
    const distance = Phaser.Math.Between(minDistance, maxDistance)
    x = this.basePlanet.x + Math.cos(angle) * distance
    y = this.basePlanet.y + Math.sin(angle) * distance

    const level = Phaser.Math.Between(1, 10)
    coreRadius = 50 + (level * 5)

    validPosition = true
    const bufferSpace = coreRadius + 100

    const distToHome = Math.sqrt(
      Math.pow(x - this.basePlanet.x, 2) + 
      Math.pow(y - this.basePlanet.y, 2)
    )
    if (distToHome < this.basePlanet.coreRadius + bufferSpace) {
      validPosition = false
    }

    for (const planet of this.planets) {
      const dist = Math.sqrt(
        Math.pow(x - planet.x, 2) + 
        Math.pow(y - planet.y, 2)
      )
      if (dist < planet.coreRadius + bufferSpace) {
        validPosition = false
        break
      }
    }

    attempts++
    
    if (validPosition) {
      // 10% chance for gas planet
      const isGasPlanet = Math.random() < 0.1
      
      if (isGasPlanet) {
        // Gas planet - yellow/orange theme
        const colorVariation = () => Phaser.Math.Between(-20, 20)
        const coreColor = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(138 + colorVariation(), 100, 180),
          Phaser.Math.Clamp(106 + colorVariation(), 80, 140),
          Phaser.Math.Clamp(45 + colorVariation(), 30, 80)
        )
        const ringColor = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(221 + colorVariation(), 200, 255),
          Phaser.Math.Clamp(170 + colorVariation(), 150, 200),
          Phaser.Math.Clamp(68 + colorVariation(), 50, 100)
        )
        
        const name = `GAS LV${level}`
        this.addPlanet(x, y, coreColor, ringColor, name, coreRadius, '#ddaa44', null, 'gas')
      } else {
        // Regular mineral planet with rarity
        const rarity = this.getRarityColors()
        
        const colorVariation = () => Phaser.Math.Between(-30, 30)
        
        const coreColor = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(((rarity.ringBase >> 16) & 0xFF) + colorVariation() - 40, 0, 255),
          Phaser.Math.Clamp(((rarity.ringBase >> 8) & 0xFF) + colorVariation() - 40, 0, 255),
          Phaser.Math.Clamp((rarity.ringBase & 0xFF) + colorVariation() - 40, 0, 255)
        )
        
        const ringColor = Phaser.Display.Color.GetColor(
          Phaser.Math.Clamp(((rarity.ringBase >> 16) & 0xFF) + colorVariation(), 0, 255),
          Phaser.Math.Clamp(((rarity.ringBase >> 8) & 0xFF) + colorVariation(), 0, 255),
          Phaser.Math.Clamp((rarity.ringBase & 0xFF) + colorVariation(), 0, 255)
        )

        const name = `${rarity.name} LV${level}`
        this.addPlanet(x, y, coreColor, ringColor, name, coreRadius, rarity.textColor, rarity, 'mineral')
      }
    }
  }

  if (!validPosition) {
    console.log("Could not find valid position for new planet after", maxAttempts, "attempts")
  }
}

  addShip() {
  // Check if at ship limit
  if (this.ships.length >= this.maxShips) {
    console.log("Ship limit reached!")
    return
  }

  const newShip = new Ship(this, this.basePlanet, this.basePlanet.coreRadius)
  
  if (this.research.thrustersLevel > 0) {
    const speedMultiplier = 1 + (this.research.thrustersLevel * 0.1)
    newShip.applySpeedMultiplier(speedMultiplier)
  }
  
  this.ships.push(newShip)
  this.updateUICameraIgnoreList()
  
  if (this.resourceBar) {
    this.resourceBar.updateShipCount(this.ships.length, this.maxShips)
  }
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
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileTopPadding = this.isMobile ? resourceBarHeight + 10 : 50
  const mobileButtonRow2 = this.isMobile ? resourceBarHeight + 80 : 110
  const mobileButtonRow3 = this.isMobile ? resourceBarHeight + 150 : 180
  const mobileButtonRow4 = this.isMobile ? resourceBarHeight + 220 : 250

  // Resize resource bar
  if (this.resourceBar) {
    this.resourceBar.resize(gameSize.width)
  }

  // Reposition UI elements on resize
  if (this.zoomInBtn && this.zoomOutBtn) {
    if (this.isMobile) {
      this.zoomOutBtn.setPosition(gameSize.width / 2 - 70, mobileTopPadding)
      this.zoomInBtn.setPosition(gameSize.width / 2 + 70, mobileTopPadding)
    } else {
      this.zoomInBtn.setPosition(gameSize.width - 70, 50)
      this.zoomOutBtn.setPosition(gameSize.width - 70, 115)
    }
  }

  if (this.dealershipBtn) {
    if (this.isMobile) {
      this.dealershipBtn.setPosition(gameSize.width / 2 - 70, mobileButtonRow2)
    } else {
      this.dealershipBtn.setPosition(gameSize.width - 70, 180)
    }
  }

  if (this.scanBtn) {
    if (this.isMobile) {
      this.scanBtn.setPosition(gameSize.width / 2 + 70, mobileButtonRow2)
    } else {
      this.scanBtn.setPosition(gameSize.width - 70, 245)
    }
  }

  if (this.researchBtn) {
    if (this.isMobile) {
      this.researchBtn.setPosition(gameSize.width / 2, mobileButtonRow3)
    } else {
      this.researchBtn.setPosition(gameSize.width - 70, 310)
    }
  }

  if (this.refineryBtn) {
    if (this.isMobile) {
      this.refineryBtn.setPosition(gameSize.width / 2, mobileButtonRow4)
    } else {
      this.refineryBtn.setPosition(gameSize.width - 70, 375)
    }
  }
}





createZoomButtons() {
  const buttonSize = this.isMobile ? 60 : 50
  const fontSize = this.isMobile ? '40px' : '32px'
  
  // Position below the resource bar - account for safe area padding
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileTopPadding = this.isMobile ? resourceBarHeight + 10 : 50

  const buttonStyle = {
    fontSize: fontSize,
    color: '#66ccff',
    backgroundColor: '#1a2a3a',
    padding: { x: 15, y: 10 },
    fixedWidth: buttonSize,
    fixedHeight: buttonSize,
    align: 'center'
  }

  if (this.isMobile) {
    this.zoomOutBtn = this.add.text(this.scale.width / 2 - 70, mobileTopPadding, '−', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)

    this.zoomInBtn = this.add.text(this.scale.width / 2 + 70, mobileTopPadding, '+', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
  } else {
    this.zoomInBtn = this.add.text(this.scale.width - 70, 50, '+', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)

    this.zoomOutBtn = this.add.text(this.scale.width - 70, 115, '−', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)
  }

  this.cameras.main.ignore([this.zoomInBtn, this.zoomOutBtn])

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



createRefineryButton() {
  const fontSize = this.isMobile ? '16px' : '14px'
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileButtonRow4 = this.isMobile ? resourceBarHeight + 220 : 250

  const buttonStyle = {
    fontSize: fontSize,
    color: '#ff6600',
    backgroundColor: '#1a2a3a',
    padding: { x: 8, y: 6 },
    align: 'center'
  }

  if (this.isMobile) {
    this.refineryBtn = this.add.text(this.scale.width / 2, mobileButtonRow4, 'REFINERY', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
  } else {
    this.refineryBtn = this.add.text(this.scale.width - 70, 375, 'REFINERY', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)
  }

  this.cameras.main.ignore([this.refineryBtn])

  this.refineryBtn.on('pointerup', (pointer) => {
    pointer.event.stopPropagation()
    this.refineryPanel.show()
  })
}





createDealershipButton() {
  const fontSize = this.isMobile ? '14px' : '14px'
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileButtonRow2 = this.isMobile ? resourceBarHeight + 80 : 110

  const buttonStyle = {
    fontSize: fontSize,
    color: '#ffaa00',
    backgroundColor: '#1a2a3a',
    padding: { x: 8, y: 6 },
    align: 'center'
  }

  if (this.isMobile) {
    this.dealershipBtn = this.add.text(this.scale.width / 2 - 70, mobileButtonRow2, 'DEALERSHIP', buttonStyle)
      .setOrigin(0.5)
      .setInteractive()
      .setDepth(100)
      .setScrollFactor(0)
  } else {
    this.dealershipBtn = this.add.text(this.scale.width - 70, 180, 'DEALERSHIP', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(100)
  }

  this.cameras.main.ignore([this.dealershipBtn])

  this.dealershipBtn.on('pointerup', (pointer) => {
    pointer.event.stopPropagation()
    this.dealershipPanel.show()
  })
}

createScanButton() {
  const fontSize = this.isMobile ? '18px' : '14px'
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileButtonRow2 = this.isMobile ? resourceBarHeight + 80 : 110

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
    this.scanBtn = this.add.text(this.scale.width - 70, 245, 'SCAN', buttonStyle)
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

createResearchButton() {
  const fontSize = this.isMobile ? '16px' : '14px'
  const resourceBarHeight = this.resourceBar ? this.resourceBar.getBarHeight() : 40
  const mobileButtonRow3 = this.isMobile ? resourceBarHeight + 150 : 180

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
    this.researchBtn = this.add.text(this.scale.width - 70, 310, 'RESEARCH', buttonStyle)
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






createScanButton() {
  const fontSize = this.isMobile ? '18px' : '14px'
  const mobileButtonRow2 = this.isMobile ? 140 : 110

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
    this.scanBtn = this.add.text(this.scale.width - 70, 245, 'SCAN', buttonStyle)
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

createResearchButton() {
  const fontSize = this.isMobile ? '16px' : '14px'
  const mobileButtonRow3 = this.isMobile ? 210 : 180

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
    this.researchBtn = this.add.text(this.scale.width - 70, 310, 'RESEARCH', buttonStyle)
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





  update() {
    this.basePlanet.update()
    this.planets.forEach(planet => planet.update())
    this.ships.forEach(ship => ship.update())
  }
}