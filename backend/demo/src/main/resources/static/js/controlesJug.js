class ControlsManager {
    constructor() {
        this.controls1 = {
            keys: {
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D',
                power: 'E',

            },
            lastDirection1: 'down',

        };

        this.controls2 = {
            keys: {
                up: 'UP',
                down: 'DOWN',
                left: 'LEFT',
                right: 'RIGHT',
                power: 'SPACE',

            },
            lastDirection2: 'down',

        };
    }

    initializeControls(scene) {
        this.controls1.keys = {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            power: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };
    
        this.controls2.keys = {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            power: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        };

    }

    handlePlayerMovement(player, controls, playerKey) {
        let isMoving = false;
    
        player.setVelocity(0); // Detener movimiento al principio del frame
    
        if (controls.keys.down.isDown) {
            player.setVelocityY(100);
            player.anims.play(`${playerKey}-walk-down`, true);
            controls.lastDirection = 'down';
            isMoving = true;
        } else if (controls.keys.up.isDown) {
            player.setVelocityY(-100);
            player.anims.play(`${playerKey}-walk-up`, true);
            controls.lastDirection = 'up';
            isMoving = true;
        } else if (controls.keys.left.isDown) {
            player.setVelocityX(-100);
            player.anims.play(`${playerKey}-walk-left`, true);
            controls.lastDirection = 'left';
            isMoving = true;
        } else if (controls.keys.right.isDown) {
            player.setVelocityX(100);
            player.anims.play(`${playerKey}-walk-right`, true);
            controls.lastDirection = 'right';
            isMoving = true;
        }
    
        // Si no se mueve, pone la animación idle
        if (!isMoving) {
            switch (controls.lastDirection) {
                case 'down':
                    player.anims.play(`${playerKey}-idleDown`, true);
                    break;
                case 'up':
                    player.anims.play(`${playerKey}-idleUp`, true);
                    break;
                case 'left':
                    player.anims.play(`${playerKey}-idleLeft`, true);
                    break;
                case 'right':
                    player.anims.play(`${playerKey}-idleRight`, true);
                    break;
            }
        }
    }

}

export default ControlsManager;