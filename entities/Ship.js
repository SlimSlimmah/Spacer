import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

export default class Ship {
  constructor(scene, planet, radius) {
    this.scene = scene
    this.homePlanet = planet
    this.currentPlanet = planet
    this.orbitRadius = radius
    this.angle = 0
    this.rotationSpeed = 0.02
    this.state = 'IDLE' // IDLE, TRAVELING_TO, ORBITING, TRAVELING_FROM

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
    this.spiralRadius = 0
    this.spiralAngle = 0
    
    this.updatePosition()
  }

  travelTo(targetPlanet) {
    if (this.state !== 'IDLE') return

    this.state = 'TRAVELING_TO'
    this.statusText.setText('TRAVELING')
    this.targetPlanet = targetPlanet

    // Calculate initial distance and angle to target planet
    const dx = targetPlanet.x - this.x
    const dy = targetPlanet.y - this.y
    const startDistance = Math.sqrt(dx * dx + dy * dy)
    const startAngle = Math.atan2(dy, dx)

    // Set up spiral properties
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
        this.x = targetPlanet.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = targetPlanet.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Arrived at target planet - set angle for seamless orbit continuation
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
    this.state = 'TRAVELING_FROM'
    this.statusText.setText('RETURNING')

    // Calculate distance to home
    const dx = this.homePlanet.x - this.x
    const dy = this.homePlanet.y - this.y
    const startDistance = Math.sqrt(dx * dx + dy * dy)
    const startAngle = Math.atan2(dy, dx)

    // Set up spiral properties for return
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
        this.x = this.homePlanet.x + Math.cos(this.spiralAngle) * this.spiralRadius
        this.y = this.homePlanet.y + Math.sin(this.spiralAngle) * this.spiralRadius
        
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Back home - set angle for seamless orbit continuation
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