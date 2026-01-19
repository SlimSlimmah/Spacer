// src/main.js
import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'

import GameScene from './scenes/GameScene.js'

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#0b1020',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [GameScene]
}

new Phaser.Game(config)
