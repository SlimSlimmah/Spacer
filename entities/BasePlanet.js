// src/entities/BasePlanet.js
export default class BasePlanet {
  constructor(scene, x, y) {
    this.scene = scene
    this.x = x
    this.y = y

    this.innerRadius = 70
    this.outerRadius = 90
    this.segments = 64

    this.waveStrength = 0
    this.waveDecay = 0.92
    this.wavePhase = 0

    this.graphics = scene.add.graphics()
    this.graphics.setDepth(1)
	
	this.noiseOffsets = []
	this.noiseFrequency = 6
	for (let i = 0; i < this.segments; i++) {
  this.noiseOffsets.push(Math.random() * Math.PI * 2)
}

    this.hitZone = scene.add.circle(x, y, this.outerRadius)
    this.hitZone.setInteractive({ useHandCursor: true })

    this.hitZone.on('pointerdown', () => {
      this.triggerWave()
    })

    this.draw()
  }

triggerWave() {
  this.waveStrength = 14
  this.wavePhase = 0
  this.noiseFrequency = Phaser.Math.Between(4, 9)

  for (let i = 0; i < this.noiseOffsets.length; i++) {
    this.noiseOffsets[i] = Math.random() * Math.PI * 2
  }
}


  update() {
    if (this.waveStrength > 0.1) {
      this.wavePhase += 0.25
      this.waveStrength *= this.waveDecay
      this.draw()
    }
  }

  draw() {
    const g = this.graphics
    g.clear()

    g.lineStyle(4, 0x66ccff, 1)
    g.beginPath()

    for (let i = 0; i <= this.segments; i++) {
      const t = i / this.segments
      const angle = t * Math.PI * 2

const noise =
  Math.sin(
    angle * this.noiseFrequency +
    this.wavePhase +
    this.noiseOffsets[i]
  ) * this.waveStrength


      const radius =
        (this.innerRadius + this.outerRadius) / 2 + noise

      const px = this.x + Math.cos(angle) * radius
      const py = this.y + Math.sin(angle) * radius

      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }

    g.closePath()
    g.strokePath()
  }
}
