import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

class RingLayer {
  constructor(radius, segments) {
    this.radius = radius
    this.segments = segments
    this.points = []
    this.isActive = false
    this.activatedTime = 0
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      this.points.push({
        angle: angle,
        baseRadius: radius,
        currentRadius: radius,
        distortion: 0,
        activated: false
      })
    }
  }
  
  activate(delay) {
    this.isActive = true
    this.activatedTime = Date.now() + delay
    this.points.forEach(point => {
      point.activated = false
    })
  }
  
  update() {
    if (!this.isActive) return
    
    const now = Date.now()
    if (now < this.activatedTime) return
    
    const elapsed = (now - this.activatedTime) / 1000
    
    this.points.forEach((point, index) => {
      if (!point.activated && elapsed > index * 0.002) {
        point.activated = true
      }
      
      if (point.activated) {
        const wave = Math.sin(elapsed * 8 - index * 0.1) * 15
        const decay = Math.max(0, 1 - elapsed * 0.8)
        point.distortion = wave * decay
        point.currentRadius = point.baseRadius + point.distortion
      }
    })
    
    if (elapsed > 2) {
      this.isActive = false
      this.points.forEach(point => {
        point.distortion = 0
        point.currentRadius = point.baseRadius
      })
    }
  }
}

export default class BasePlanet {
  constructor(scene, x, y, coreColor = 0x2a4a6e, ringColor = 0x66ccff, name = '', coreRadius = 70, textColor = '#ffffff', rarity = null, type = 'mineral') {
  this.scene = scene
  this.x = x
  this.y = y
  this.coreColor = coreColor
  this.ringColor = ringColor
  this.name = name
  this.textColor = textColor
  this.rarity = rarity
  this.type = type // 'mineral' or 'gas'
  this.onClickCallback = null
  this.onHoldCallback = null
    
    this.graphics = scene.add.graphics()
    this.graphics.setDepth(1)
    this.segments = 72

    this.coreRadius = coreRadius

    this.rings = [
      new RingLayer(this.coreRadius, this.segments),
      new RingLayer(this.coreRadius, this.segments)
    ]

    this.hitZone = scene.add.circle(x, y, coreRadius + 50)
    this.hitZone.setInteractive({ useHandCursor: true })
    
    this.holdStartTime = 0
    this.isHolding = false
    this.holdPointerX = 0
    this.holdPointerY = 0

    this.hitZone.on('pointerdown', (pointer) => {
      this.holdStartTime = Date.now()
      this.isHolding = true
      
      this.holdPointerX = pointer.worldX
      this.holdPointerY = pointer.worldY
      
      this.triggerWave()
      
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
    this.rings[0].activate(0)
    this.rings[1].activate(100)
  }

  update() {
    this.rings.forEach(ring => ring.update())
    this.draw()
  }

  draw() {
    this.graphics.clear()
    
    this.graphics.fillStyle(this.coreColor, 1)
    this.graphics.fillCircle(this.x, this.y, this.coreRadius)
    
    this.graphics.lineStyle(2, this.ringColor, 1)
    this.graphics.strokeCircle(this.x, this.y, this.coreRadius)
    
    this.rings.forEach(ring => {
      if (!ring.isActive) return
      
      this.graphics.lineStyle(2, this.ringColor, 0.6)
      this.graphics.beginPath()
      
      ring.points.forEach((point, index) => {
        const x = this.x + Math.cos(point.angle) * point.currentRadius
        const y = this.y + Math.sin(point.angle) * point.currentRadius
        
        if (index === 0) {
          this.graphics.moveTo(x, y)
        } else {
          this.graphics.lineTo(x, y)
        }
      })
      
      this.graphics.closePath()
      this.graphics.strokePath()
    })
  }

  destroy() {
    this.graphics.destroy()
    this.hitZone.destroy()
    if (this.nameText) {
      this.nameText.destroy()
    }
    if (this.holdCheckInterval) {
      this.holdCheckInterval.remove()
    }
  }
}