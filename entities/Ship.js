import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

export default class Ship {
  constructor(scene, planet, radius) {
    this.scene = scene
    this.homePlanet = planet
    this.currentPlanet = planet
    this.orbitRadius = radius
    this.angle = Math.random() * Math.PI * 2
    this.baseRotationSpeed = 0.02
    this.rotationSpeed = 0.02
    this.baseTravelDuration = 1500
    this.travelDuration = 1500
    this.state = 'IDLE'
    this.assignedPlanet = null
    this.miningProgress = 0
    this.shipColor = 0xffaa00

    // Visual representation
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(2)
    
    // Status text
    this.statusText = scene.add.text(0, 0, 'IDLE', {
      fontSize: '12px',
      color: '#ffaa00',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    })
    this.statusText.setOrigin(0.5)
    this.statusText.setDepth(3)

    // Progress bar (hidden initially)
    this.progressBarBg = scene.add.graphics()
    this.progressBarBg.setDepth(3)
    this.progressBarFill = scene.add.graphics()
    this.progressBarFill.setDepth(3)
    this.progressBarVisible = false
    
    this.shipRadius = 5
    
    // Spiral animation properties
    this.spiralCenter = { x: 0, y: 0 }
    this.spiralRadius = 0
    this.spiralAngle = 0
    
    this.updatePosition()
  }

  applySpeedMultiplier(multiplier) {
    this.rotationSpeed = this.baseRotationSpeed * multiplier
    this.travelDuration = this.baseTravelDuration / multiplier
  }

  travelTo(targetPlanet) {
    if (this.state !== 'IDLE' && this.state !== 'ORBITING') return

    this.state = 'SPIRALING'
    this.statusText.setText('TRAVELING')
    this.assignedPlanet = targetPlanet
    this.hideProgressBar()

    // Change ship color to match planet
    this.shipColor = targetPlanet.ringColor

    // Calculate current distance and angle relative to target planet
    const dx = this.x - targetPlanet.x
    const dy = this.y - targetPlanet.y
    const startDistance = Math.sqrt(dx * dx + dy * dy)
    const startAngle = Math.atan2(dy, dx)

    // Set up spiral - start from current position relative to target
    this.spiralCenter = { x: targetPlanet.x, y: targetPlanet.y }
    this.spiralRadius = startDistance
    this.spiralAngle = startAngle
    
    // Tween the spiral radius down to the orbit radius
    this.scene.tweens.add({
      targets: this,
      spiralRadius: targetPlanet.coreRadius,
      duration: this.travelDuration,
      ease: 'Power2',
      onUpdate: () => {
        // Rotate while spiraling in
        this.spiralAngle += 0.05 * (this.rotationSpeed / this.baseRotationSpeed)
        
        // Calculate position on spiral
        this.x = this.spiralCenter.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = this.spiralCenter.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Arrived at target planet
        this.angle = this.spiralAngle
        this.currentPlanet = targetPlanet
        
        // Check if this is the home planet or mining planet
        if (targetPlanet === this.homePlanet) {
          // Orbit once at home, then return to mining (no label)
          this.state = 'ORBITING'
          this.statusText.setVisible(false)
          const startAngle = this.angle
          
          // Wait for one full orbit
          this.orbitCheckInterval = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
              const angleDiff = Math.abs(this.angle - startAngle)
              // Check if completed roughly one orbit (2*PI radians)
              if (angleDiff > Math.PI * 2 - 0.2) {
                this.orbitCheckInterval.remove()
                // Return to mining planet
                if (this.assignedPlanet) {
                  this.travelTo(this.assignedPlanet)
                }
              }
            },
            loop: true
          })
        } else {
          // Start mining
          this.startMining()
        }
      }
    })
  }

  startMining() {
    this.state = 'MINING'
    this.statusText.setText('MINING')
    this.statusText.setVisible(true)
    this.miningProgress = 0
    this.showProgressBar()

    // Mine for 3 seconds
    this.scene.tweens.add({
      targets: this,
      miningProgress: 100,
      duration: 3000,
      ease: 'Linear',
      onUpdate: () => {
        this.updateProgressBar()
      },
      onComplete: () => {
        this.hideProgressBar()
        this.returnHome()
      }
    })
  }

  returnHome() {
    this.state = 'SPIRALING'
    this.statusText.setVisible(false) // Hide RETURNING label

    // Calculate current distance and angle relative to home planet
    const dx = this.x - this.homePlanet.x
    const dy = this.y - this.homePlanet.y
    const startDistance = Math.sqrt(dx * dx + dy * dy)
    const startAngle = Math.atan2(dy, dx)

    // Set up spiral - start from current position relative to home
    this.spiralCenter = { x: this.homePlanet.x, y: this.homePlanet.y }
    this.spiralRadius = startDistance
    this.spiralAngle = startAngle

    this.scene.tweens.add({
      targets: this,
      spiralRadius: this.homePlanet.coreRadius,
      duration: this.travelDuration,
      ease: 'Power2',
      onUpdate: () => {
        // Rotate while spiraling in
        this.spiralAngle += 0.05 * (this.rotationSpeed / this.baseRotationSpeed)
        
        // Calculate position on spiral
        this.x = this.spiralCenter.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = this.spiralCenter.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Back home - set up orbit once then return to mining
        this.angle = this.spiralAngle
        this.currentPlanet = this.homePlanet
        this.state = 'ORBITING'
        this.statusText.setVisible(false) // Hide ORBITING label
        
        const startAngle = this.angle
        
        // Wait for one full orbit
        this.orbitCheckInterval = this.scene.time.addEvent({
          delay: 100,
          callback: () => {
            const angleDiff = Math.abs(this.angle - startAngle)
            // Check if completed roughly one orbit (2*PI radians)
            if (angleDiff > Math.PI * 2 - 0.2) {
              this.orbitCheckInterval.remove()
              // Return to mining planet
              if (this.assignedPlanet) {
                this.travelTo(this.assignedPlanet)
              }
            }
          },
          loop: true
        })
      }
    })
  }

  recallToHome() {
    // Stop ALL ongoing tweens for this ship
    this.scene.tweens.killTweensOf(this)
    
    // Stop any orbit checking intervals
    if (this.orbitCheckInterval) {
      this.orbitCheckInterval.remove()
      this.orbitCheckInterval = null
    }

    this.state = 'SPIRALING'
    this.statusText.setVisible(false) // Hide RECALLED label
    this.assignedPlanet = null
    this.hideProgressBar()

    // Change back to idle color (orange)
    this.shipColor = 0xffaa00

    // Calculate current distance and angle relative to home planet
    const dx = this.x - this.homePlanet.x
    const dy = this.y - this.homePlanet.y
    const startDistance = Math.sqrt(dx * dx + dy * dy)
    const startAngle = Math.atan2(dy, dx)

    // Set up spiral - start from current position relative to home
    this.spiralCenter = { x: this.homePlanet.x, y: this.homePlanet.y }
    this.spiralRadius = startDistance
    this.spiralAngle = startAngle

    this.scene.tweens.add({
      targets: this,
      spiralRadius: this.homePlanet.coreRadius,
      duration: this.travelDuration,
      ease: 'Power2',
      onUpdate: () => {
        // Rotate while spiraling in
        this.spiralAngle += 0.05 * (this.rotationSpeed / this.baseRotationSpeed)
        
        // Calculate position on spiral
        this.x = this.spiralCenter.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = this.spiralCenter.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Back home and IDLE
        this.angle = this.spiralAngle
        this.currentPlanet = this.homePlanet
        this.state = 'IDLE'
        this.statusText.setText('IDLE')
        this.statusText.setVisible(true)
      }
    })
  }

  showProgressBar() {
    this.progressBarVisible = true
    this.updateProgressBar()
  }

  hideProgressBar() {
    this.progressBarVisible = false
    this.progressBarBg.clear()
    this.progressBarFill.clear()
  }

  updateProgressBar() {
    if (!this.progressBarVisible) return

    const barWidth = 40
    const barHeight = 4
    const barX = this.x - barWidth / 2
    const barY = this.y - 25

    // Background
    this.progressBarBg.clear()
    this.progressBarBg.fillStyle(0x333333, 1)
    this.progressBarBg.fillRect(barX, barY, barWidth, barHeight)

    // Fill
    this.progressBarFill.clear()
    this.progressBarFill.fillStyle(0x00ff00, 1)
    this.progressBarFill.fillRect(barX, barY, (barWidth * this.miningProgress) / 100, barHeight)
  }

  update() {
    if (this.state === 'IDLE' || this.state === 'ORBITING') {
      // Only rotate when idle or orbiting
      this.angle += this.rotationSpeed
      this.updatePosition()
    } else if (this.state === 'MINING') {
      // Continue orbiting while mining
      this.angle += this.rotationSpeed
      this.updatePosition()
      this.updateProgressBar()
    }
  }

  updatePosition() {
    this.x = this.currentPlanet.x + Math.cos(this.angle) * this.currentPlanet.coreRadius
    this.y = this.currentPlanet.y + Math.sin(this.angle) * this.currentPlanet.coreRadius
    
    // Position text above the ship
    this.statusText.setPosition(this.x, this.y - 15)
    
    if (this.progressBarVisible) {
      this.updateProgressBar()
    }
    
    this.draw()
  }

  draw() {
    this.graphics.clear()
    this.graphics.fillStyle(this.shipColor, 1)
    this.graphics.fillCircle(this.x, this.y, this.shipRadius)
  }

  destroy() {
    this.graphics.destroy()
    this.statusText.destroy()
    this.progressBarBg.destroy()
    this.progressBarFill.destroy()
    if (this.orbitCheckInterval) {
      this.orbitCheckInterval.remove()
    }
  }
}