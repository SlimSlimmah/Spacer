import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.esm.js'
import GameScene from './scenes/GameScene.js'

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'body',
    width: window.innerWidth,
    height: window.innerHeight
  },
  backgroundColor: '#000000',
  scene: [GameScene]
}

const game = new Phaser.Game(config)