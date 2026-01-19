import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

class RingLayer {
  constructor(radius, segments) {
    this.radius = radius
    this.segments = segments
    this.waveStrength = 0
    this.wavePhase = 0
    this.waveDecay = Phaser.Math.FloatBetween(0.88, 0.94)
    this.frequency = Phaser.Math.Between(4, 9)
    this.noiseOffsets = Array.from(
      { length: segments },
      () => Math.random() * Math.PI * 2
    )
  }

  trigger() {
    this.waveStrength = Phaser.Math.Between(3, 6) // reduced for minimal distortion
    this.wavePhase = 0
    this.frequency = Phaser.Math.Between(4, 10)
    for (let i = 0; i < this.noiseOffsets.length; i++) {
      this.noiseOffsets[i] = Math.random() * Math.PI * 2
    }
  }

  update() {
    if (this.waveStrength > 0.1) {
      this.wavePhase += 0.25
      this.waveStrength *= this.waveDecay
    }
  }
}

export default class BasePlanet {
  constructor(scene, x, y) {
    this.scene = scene
    this.x = x
    this.y = y
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(1)
    this.segments = 72

    // Core (static)
    this.coreRadius = 70

    // Only 2 reactive rings, positioned at coreRadius
    this.rings = [
      new RingLayer(this.coreRadius, this.segments),
      new RingLayer(this.coreRadius, this.segments)
    ]

    this.hitZone = scene.add.circle(x, y, 120)
    this.hitZone.setInteractive({ useHandCursor: true })
    this.hitZone.on('pointerdown', () => this.triggerWave())

    this.draw()
  }

  triggerWave() {
    this.rings.forEach((ring, i) => {
      this.scene.time.delayedCall(i * 60, () => ring.trigger())
    })
  }

  update() {
    let needsRedraw = false
    this.rings.forEach(ring => {
      ring.update()
      if (ring.waveStrength > 0.1) needsRedraw = true
    })
    if (needsRedraw) this.draw()
  }

  draw() {
    const g = this.graphics
    g.clear()

    // ---- CORE RING (static) ----
    g.lineStyle(4, 0x2a4a6e, 1)
    g.strokeCircle(this.x, this.y, this.coreRadius)

    // ---- REACTIVE RINGS (only visible when active) ----
    g.lineStyle(3, 0x66ccff, 0.9)
    this.rings.forEach(ring => {
      if (ring.waveStrength < 0.1) return // invisible when not active

      g.beginPath()
      for (let i = 0; i <= ring.segments; i++) {
        const t = i / ring.segments
        const angle = t * Math.PI * 2
        const noise =
          Math.sin(
            angle * ring.frequency +
            ring.wavePhase +
            ring.noiseOffsets[i % ring.segments]
          ) * ring.waveStrength
        const radius = ring.radius + noise
        const px = this.x + Math.cos(angle) * radius
        const py = this.y + Math.sin(angle) * radius
        if (i === 0) g.moveTo(px, py)
        else g.lineTo(px, py)
      }
      g.closePath()
      g.strokePath()
    })
  }
}