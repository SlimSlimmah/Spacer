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
    this.updatePosition()
  }

  travelTo(targetPlanet) {
    if (this.state !== 'IDLE') return

    this.state = 'TRAVELING_TO'
    this.statusText.setText('TRAVELING')
    this.targetPlanet = targetPlanet

    // Calculate travel path
    const startX = this.x
    const startY = this.y
    const endX = targetPlanet.x + Math.cos(this.angle) * targetPlanet.coreRadius
    const endY = targetPlanet.y + Math.sin(this.angle) * targetPlanet.coreRadius

    // Tween to target planet
    this.scene.tweens.add({
      targets: this,
      x: endX,
      y: endY,
      duration: 1500,
      ease: 'Power2',
      onUpdate: () => {
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Arrived at target planet
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

    // Calculate return path
    const endX = this.homePlanet.x + Math.cos(this.angle) * this.homePlanet.coreRadius
    const endY = this.homePlanet.y + Math.sin(this.angle) * this.homePlanet.coreRadius

    this.scene.tweens.add({
      targets: this,
      x: endX,
      y: endY,
      duration: 1500,
      ease: 'Power2',
      onUpdate: () => {
        this.statusText.setPosition(this.x, this.y - 15)
        this.draw()
      },
      onComplete: () => {
        // Back home
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