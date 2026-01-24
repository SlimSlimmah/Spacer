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
    this.waveStrength = Phaser.Math.Between(3, 6)
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
  constructor(scene, x, y, coreColor = 0x2a4a6e, ringColor = 0x66ccff, name = '', coreRadius = 70, textColor = '#ffffff') {
  this.scene = scene
  this.x = x
  this.y = y
  this.coreColor = coreColor
  this.ringColor = ringColor
  this.name = name
  this.textColor = textColor
  this.onClickCallback = null
  this.onHoldCallback = null
  
  this.graphics = scene.add.graphics()
  this.graphics.setDepth(1)
  this.segments = 72

  // Core (configurable size)
  this.coreRadius = coreRadius

  // Only 2 reactive rings, positioned at coreRadius
  this.rings = [
    new RingLayer(this.coreRadius, this.segments),
    new RingLayer(this.coreRadius, this.segments)
  ]

  this.hitZone = scene.add.circle(x, y, coreRadius + 50)
  this.hitZone.setInteractive({ useHandCursor: true })
  
  // Hold detection
  this.holdStartTime = 0
  this.isHolding = false
  this.holdPointerX = 0
  this.holdPointerY = 0

  this.hitZone.on('pointerdown', (pointer) => {
    this.holdStartTime = Date.now()
    this.isHolding = true
    
    // Store world coordinates of where user clicked
    this.holdPointerX = pointer.worldX
    this.holdPointerY = pointer.worldY
    
    this.triggerWave()
    
    // Check for hold every 100ms
    this.holdCheckInterval = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (this.isHolding) {
          const holdDuration = Date.now() - this.holdStartTime
          if (holdDuration >= 500 && this.onHoldCallback) {
            this.onHoldCallback(this, this.holdPointerX, this.holdPointerY)
            this.isHolding = false
            this.holdCheckInterval.remove()
          }
        }
      },
      loop: true
    })
  })

  this.hitZone.on('pointerup', () => {
    if (this.isHolding) {
      const holdDuration = Date.now() - this.holdStartTime
      if (holdDuration < 500 && this.onClickCallback) {
        this.onClickCallback(this)
      }
    }
    this.isHolding = false
    if (this.holdCheckInterval) {
      this.holdCheckInterval.remove()
    }
  })

  // Nameplate with colored text
  if (this.name) {
    this.nameText = scene.add.text(this.x, this.y - this.coreRadius - 20, this.name, {
      fontSize: '16px',
      color: this.textColor,
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    })
    this.nameText.setOrigin(0.5)
    this.nameText.setDepth(2)
  }

  this.draw()
}

  setOnClick(callback) {
    this.onClickCallback = callback
  }

  setOnHold(callback) {
    this.onHoldCallback = callback
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
    g.lineStyle(4, this.coreColor, 1)
    g.strokeCircle(this.x, this.y, this.coreRadius)

    // ---- REACTIVE RINGS (only visible when active) ----
    g.lineStyle(3, this.ringColor, 0.9)
    this.rings.forEach(ring => {
      if (ring.waveStrength < 0.1) return

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