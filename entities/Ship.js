import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

export default class Ship {
  constructor(scene, planet, radius) {
    this.scene = scene
    this.homePlanet = planet
    this.currentPlanet = planet
    this.orbitRadius = radius
    this.angle = 0
    this.rotationSpeed = 0.02
    this.state = 'IDLE' // IDLE, SPIRALING, ORBITING

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
    
    this.shipRadius = 5
    
    // Spiral animation properties
    this.spiralCenter = { x: 0, y: 0 }
    this.spiralRadius = 0
    this.spiralAngle = 0
    
    this.updatePosition()
  }

  travelTo(targetPlanet) {
    if (this.state !== 'IDLE') return

    this.state = 'SPIRALING'
    this.statusText.setText('TRAVELING')
    this.targetPlanet = targetPlanet

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
      duration: 1500,
      ease: 'Power2',
      onUpdate: () => {
        // Rotate while spiraling in
        this.spiralAngle += 0.05
        
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
        this.state = 'ORBITING'
        this.statusText.setText('ORBITING')

        // Orbit for 3 seconds then return
        this.scene.time.delayedCall(3000, () => {
          this.returnHome()
        })
      }
    })
  }

  returnHome() {
    this.state = 'SPIRALING'
    this.statusText.setText('RETURNING')

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
      duration: 1500,
      ease: 'Power2',
      onUpdate: () => {
        // Rotate while spiraling in
        this.spiralAngle += 0.05
        
        // Calculate position on spiral
        this.x = this.spiralCenter.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = this.spiralCenter.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Back home
        this.angle = this.spiralAngle
        this.currentPlanet = this.homePlanet
        this.state = 'IDLE'
        this.statusText.setText('IDLE')
      }
    })
  }

  update() {
    if (this.state === 'IDLE' || this.state === 'ORBITING') {
      // Only rotate when idle or orbiting
      this.angle += this.rotationSpeed
      this.updatePosition()
    }
    // During SPIRALING state, position is updated by tween
  }

  updatePosition() {
    this.x = this.currentPlanet.x + Math.cos(this.angle) * this.currentPlanet.coreRadius
    this.y = this.currentPlanet.y + Math.sin(this.angle) * this.currentPlanet.coreRadius
    
    // Position text above the ship
    this.statusText.setPosition(this.x, this.y - 15)
    
    this.draw()
  }

  draw() {
    this.graphics.clear()
    this.graphics.fillStyle(0xffaa00, 1)
    this.graphics.fillCircle(this.x, this.y, this.shipRadius)
  }
}