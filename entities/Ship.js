import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

export default class Ship {
  constructor(scene, planet, radius) {
    this.scene = scene
    this.planet = planet
    this.orbitRadius = radius
    this.angle = 0 // starting angle in radians
    this.rotationSpeed = 0.02 // radians per frame

    // Visual representation
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(2)
    
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
    this.draw()
  }

  draw() {
    this.graphics.clear()
    this.graphics.fillStyle(0xffaa00, 1)
    this.graphics.fillCircle(this.x, this.y, this.shipRadius)
  }
}