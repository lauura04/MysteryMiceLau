import { MSG_TYPES } from './WebSocketMessages.js'; // Asegúrate de que esta ruta y el contenido de MSG_TYPES sean correctos

class ControlsManager {
    // Acepta la escena en el constructor para poder acceder al WebSocketManager
    constructor(scene) {
        this.scene = scene; // Guarda una referencia a la escena

        this.controls1 = {
            // Inicializados con strings, estos se reemplazarán por objetos Phaser Key en initializeControls
            keys: {
                up: 'W',
                down: 'S',
                left: 'A',
                right: 'D',
                power: 'E',
            },
            lastDirection: 'down', // Renombrado de lastDirection1 para consistencia
        };

        this.controls2 = {
            // Inicializados con strings, estos se reemplazarán por objetos Phaser Key en initializeControls
            keys: {
                up: 'UP',
                down: 'DOWN',
                left: 'LEFT',
                right: 'RIGHT',
                power: 'SPACE',
            },
            lastDirection: 'down', // Renombrado de lastDirection2 para consistencia
        };
    }

    initializeControls(scene) {
        // Asigna los objetos Phaser Key a las propiedades 'keys' de controls1 y controls2
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
        // Comprobación defensiva: asegúrate de que player y su body existan
        if (!player || !player.body) {
            return;
        }

        player.body.setVelocity(0); // Detener movimiento al principio del frame

        let isMoving = false;
        let currentAnim = '';
        let currentFlipX = player.flipX; // Mantiene el estado de flipX actual

        // Comprobaciones defensivas adicionales para controls.keys y sus propiedades
        if (!controls || !controls.keys) {
            console.warn("Controls o controls.keys no definidos en handlePlayerMovement.");
            return;
        }

        // Movimiento en Y
        if (controls.keys.down && controls.keys.down.isDown) { // Asegúrate de que controls.keys.down exista y sea un objeto válido
            player.setVelocityY(100);
            currentAnim = `${playerKey}-walk-down`;
            controls.lastDirection = 'down';
            isMoving = true;
        } else if (controls.keys.up && controls.keys.up.isDown) { // Asegúrate de que controls.keys.up exista y sea un objeto válido
            player.setVelocityY(-100);
            currentAnim = `${playerKey}-walk-up`;
            controls.lastDirection = 'up';
            isMoving = true;
        }
        // Movimiento en X
        else if (controls.keys.left && controls.keys.left.isDown) { // Asegúrate de que controls.keys.left exista y sea un objeto válido
            player.setVelocityX(-100);
            currentAnim = `${playerKey}-walk-left`;
            controls.lastDirection = 'left';
            isMoving = true;
            currentFlipX = false; // Asumiendo que la imagen original mira a la izquierda
        } else if (controls.keys.right && controls.keys.right.isDown) { // Asegúrate de que controls.keys.right exista y sea un objeto válido
            player.setVelocityX(100);
            currentAnim = `${playerKey}-walk-right`;
            controls.lastDirection = 'right';
            isMoving = true;
            currentFlipX = true; // Voltea la imagen si mira a la derecha
        }

        if (isMoving) {
            player.anims.play(currentAnim, true);
        } else {
            // Si no se mueve, pone la animación idle basada en la última dirección
            switch (controls.lastDirection) {
                case 'down':
                    currentAnim = `${playerKey}-idleDown`;
                    break;
                case 'up':
                    currentAnim = `${playerKey}-idleUp`;
                    break;
                case 'left':
                    currentAnim = `${playerKey}-idleLeft`;
                    break;
                case 'right':
                    currentAnim = `${playerKey}-idleRight`;
                    break;
                default:
                    currentAnim = `${playerKey}-idleDown`; // Por defecto
                    break;
            }
            player.anims.play(currentAnim, true);
        }

        player.setFlipX(currentFlipX); // Aplica el flipX

        // *** LÓGICA DE ENVÍO DE DATOS AL SERVIDOR ***
        // Asegúrate de que las propiedades lastX, lastY, etc. existan en el jugador
        if (player.lastX === undefined) player.lastX = player.x;
        if (player.lastY === undefined) player.lastY = player.y;
        if (player.lastAnim === undefined) player.lastAnim = player.anims.currentAnim.key;
        if (player.lastFlipX === undefined) player.lastFlipX = player.flipX;

        // Solo si es nuestro jugador (myPlayer), envía la actualización al servidor
        // y solo si la posición o animación han cambiado (para optimización)
        if (this.scene.myPlayer && player === this.scene.myPlayer) {
            if (player.x !== player.lastX || player.y !== player.lastY || player.anims.currentAnim.key !== player.lastAnim || player.flipX !== player.lastFlipX) {
                this.scene.WebsSocketManger.send({
                    type: MSG_TYPES.PLAYER_UPDATE, // Usamos PLAYER_UPDATE que suele ser 'u'
                    x: player.x,
                    y: player.y,
                    anim: player.anims.currentAnim.key,
                    flipX: player.flipX
                });
                // Guarda el estado actual para la próxima comparación
                player.lastX = player.x;
                player.lastY = player.y;
                player.lastAnim = player.anims.currentAnim.key;
                player.lastFlipX = player.flipX;
            }
        }
    }
}

export default ControlsManager;