import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

export default class Ship {
  constructor(scene, planet, radius, status = 'IDLE') {
    this.scene = scene
    this.planet = planet
    this.orbitRadius = radius
    this.angle = 0
    this.rotationSpeed = 0.02
    this.status = status

    // Visual representation
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(2)
    
    // Status text
    this.statusText = scene.add.text(0, 0, this.status, {
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

  update() {
    this.angle += this.rotationSpeed
    this.updatePosition()
  }

  updatePosition() {
    this.x = this.planet.x + Math.cos(this.angle) * this.orbitRadius
    this.y = this.planet.y + Math.sin(this.angle) * this.orbitRadius
    
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