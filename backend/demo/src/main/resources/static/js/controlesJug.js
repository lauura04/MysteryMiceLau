class ControlsManager {
    
    // Acepta la escena en el constructor para poder acceder al WebSocketManager
    constructor(scene, WebsSocketManager) {
        this.scene = scene; // Guarda una referencia a la escena
        this.WebsSocketManager = WebsSocketManager;

        this.controls1 = {
            // Inicializados con strings, estos se reemplazarán por objetos Phaser Key en initializeControls
            keys: {},
            lastDirection: 'down', // Renombrado de lastDirection1 para consistencia
        };

        this.controls2 = {
            // Inicializados con strings, estos se reemplazarán por objetos Phaser Key en initializeControls
            keys: {},
            lastDirection: 'down', // Renombrado de lastDirection2 para consistencia
        };

        this.lastSentPosition = { x: 0, y: 0 };
        this.lastSentAnim = '';
        this.lastSentFlipX = false;
        this.lastUpdateTime = 0;
        this.POSITION_UPDATE_INTERVAL = 50; // milliseconds
        this.POSITION_THRESHOLD = 2; // pixels
    }

    initializeControls() {
        // Asigna los objetos Phaser Key a las propiedades 'keys' de controls1 y controls2
        
        this.keys = {
            up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            power: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };

        /*this.controls2.keys = {
            up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            power: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        };*/
    }

    handlePlayerMovement(player, controls, playerKey, isMyPlayer) {
        
        if (!player || !player.body|| !controls || !controls.keys) {
            return;
        }

        player.body.setVelocity(0); // Detener movimiento al principio del frame

        let isMoving = false;
        let currentAnim = '';
        let currentFlipX = player.flipX; // Mantiene el estado de flipX actual

       
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

       if (isMyPlayer) {
            const currentTime = Date.now();
            const dx = Math.abs(player.x - this.lastSentPosition.x);
            const dy = Math.abs(player.y - this.lastSentPosition.y);
            const animChanged = player.anims.currentAnim.key !== this.lastSentAnim;
            const flipXChanged = player.flipX !== this.lastSentFlipX;

            // Send update if position changed significantly, or if animation/flipX changed
            if (currentTime - this.lastUpdateTime >= this.POSITION_UPDATE_INTERVAL &&
                (dx > this.POSITION_THRESHOLD || dy > this.POSITION_THRESHOLD || animChanged || flipXChanged)) {

                this.websocketManager.sendMessage(MSG_TYPES.PLAYER_UPDATE, {
                    x: Math.round(player.x),
                    y: Math.round(player.y),
                    anim: player.anims.currentAnim.key,
                    flipX: player.flipX
                });

                this.lastSentPosition = { x: player.x, y: player.y };
                this.lastSentAnim = player.anims.currentAnim.key;
                this.lastSentFlipX = player.flipX;
                this.lastUpdateTime = currentTime;
            }
        }
    }
}

export default ControlsManager;