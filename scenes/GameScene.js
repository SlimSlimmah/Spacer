// src/scenes/GameScene.js
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

import BasePlanet from '../entities/BasePlanet.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
  }

  create() {
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2

    this.basePlanet = new BasePlanet(this, cx, cy)
  }

  update() {
    this.basePlanet.update()
  }
}
