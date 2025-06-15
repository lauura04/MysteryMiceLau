import ControlsManager from "./controlesJug.js";
import { MSG_TYPES } from './WebSocketMessages.js' // Asegúrate de que este archivo define tus tipos de mensaje
import WebsSocketManger from "./WebSocketManager.js"; // Asegúrate de que el nombre del archivo es exactamente este

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });

        this.webSocketManager = null;
        this.dialogueIntroLaunched = false;
        this.gameStarted = false;
        this.gameReadyPayload = null;

        this.gameId = null; // Asignar cuando el servidor lo envíe
        this.myPlayerKey = null;

        this.myPlayer = null; // El sprite del jugador que controlas localmente
        this.otherPlayer = null; // El sprite del otro jugador (controlado por el servidor)
        this.myControls = null; // Los controles específicos para tu jugador

        // Propiedades para los objetos interactuables del tutorial
        this.door = null;
        this.hole = null;

        // Objeto para almacenar el último estado enviado del jugador.
        // Esto se usa para evitar enviar mensajes de actualización si no hay cambios.
        this.lastSentPlayerPosition = { x: 0, y: 0 };
        this.lastUpdateTime = 0;
        this.POSITION_UPDATE_INTERVAL = 50;
        this.POSITION_THRESHOLD = 2;

        this.otherPlayerCurrentAnim = '';

        this.cursors = null; // Declararlo aquí lo hace accesible globalmente en la escena


        // Tiempo de carga y duracción de las habilidades
        this.cargaOlfato = 10000;
        this.cargaVista = 10000;
        this.durOlfato = 3000;
        this.durVista = 3000;

        // Estado de los poderes inicialmente
        this.vistaDisp = false;
        this.olfatoDisp = false;
    }

    preload() {
        //Cargamos todos los objetos que hay en la escena del tutorial
        this.load.image("escenario", 'assets/EntradaCripta.png');
        this.load.image("agujero", 'assets/Bujero.png');
        this.load.image("pause", 'assets/Boton_Pausa.png');
        this.load.image("vision", 'assets/Supervision.png');
        this.load.image("olfato", 'assets/Superolfato.png');
        this.load.image("huellaA", 'assets/Huellas1.png');
        this.load.image("huellaB", 'assets/Huellas1B.png');
        this.load.image("huellaD", 'assets/Huellas1D.png');
        this.load.image("huellaI", 'assets/Huellas1i.png');
        this.load.image("humo", 'assets/Rastro1.png')
        this.load.image("humov", 'assets/Rastro2.png');
        this.load.image("chat", 'assets/Boton_Chat.png');

        //Cargamos los spritesheets de los dos personajes
        this.load.spritesheet('Sighttail', 'assets/Sightail_spritesheet.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet('Scentpaw', 'assets/Scentpaw-spritesheet.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.abilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);


        this.controlsManager = new ControlsManager(this);

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Inicialización de WebSockets
        this.webSocketManager = new WebsSocketManger(this); // **CORREGIDO: Usamos el nombre 'webSocketManager' consistente**
        this.webSocketManager.connect();

        // Elementos de espera mientras se une el otro jugador
        this.waitingText = this.add.text(0.63 * centerX, 1.35 * centerY, 'Esperando a otro jugador', { // **CORREGIDO: Centrado el texto de espera**
            font: '30px mousy', // **Ajustado el tamaño de la fuente para que se vea mejor centrado**
            color: '#ffffff',
            align: 'center'
        }).setDepth(10);




        // Creamos unos arrays para meter las imagenes de las huellas y el humo
        this.huellas = [];
        this.humos = [];

        // Crear áreas y objetos (colisiones del mundo)
        const cripta = this.add.rectangle(0.085 * centerX, 0, centerX + 30, 0.95 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(cripta, true);

        const cementerio = this.add.rectangle(1.6 * centerX, 0, 0.4 * centerX, 1.4 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(cementerio, true);


        // Fondo del escenario
        const escenario = this.add.image(centerX, centerY, "escenario");

        // Crear personajes (inicialmente invisibles y sin física activa, inamovibles)
        this.sighttail = this.physics.add.sprite(1.56 * centerX, 0.2 * centerY, 'Sighttail')
            .setScale(2)
            .setSize(40, 30)
            .setOffset(12, 20)
            .setVisible(false)
            .setImmovable(true); // **Añadido: inamovible hasta que la partida comience**

        this.scentpaw = this.physics.add.sprite(1.42 * centerX, 0.2 * centerY, 'Scentpaw')
            .setScale(2)
            .setSize(40, 30)
            .setOffset(12, 20)
            .setVisible(false)
            .setImmovable(true); // **Añadido: inamovible hasta que la partida comience**


        const worldWidthT = escenario.displayWidth;
        const worldHeightT = escenario.displayHeight;
        this.cameras.main.setBounds(0, 0, worldWidthT, worldHeightT);
        this.cameras.main.setZoom(2);

        // Agujero (inicialmente invisible)
        this.agujero = this.physics.add.image(1.1 * centerX, 0.2 * centerY, 'agujero').setScale(1.7).setVisible(false);

        // **IMPORTANTE: Las colisiones con los límites del mapa ahora se configuran para ambos sprites.**
        // Cuando se asignen this.myPlayer y this.otherPlayer, sus cuerpos de física estarán activos y podrán colisionar.
        this.physics.add.collider(this.sighttail, cripta);
        this.physics.add.collider(this.scentpaw, cripta);
        this.physics.add.collider(this.sighttail, cementerio);
        this.physics.add.collider(this.scentpaw, cementerio);

        // **Eliminado: La capa de oscuridad fija. Si quieres que la vista cambie esto, debe ser manejado por la habilidad.**
        const oscuridad = this.add.rectangle(centerX, centerY, 2 * centerX, 2 * centerY, 0x000000, 0.5);

        // Inicialización de huellas (invisibles al inicio)
        const huella1 = this.add.image(0.3 * centerX, 1.2 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella2 = this.add.image(0.5 * centerX, 1.3 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella3 = this.add.image(0.7 * centerX, 1.1 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella4 = this.add.image(1.2 * centerX, 1.2 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella5 = this.add.image(1.5 * centerX, 0.9 * centerY, 'huellaA').setScale(2).setVisible(false);
        this.huellas.push(huella1, huella2, huella3, huella4, huella5);

        // Inicialización de humos (invisibles al inicio)
        const humo1 = this.add.image(0.9 * centerX, 1.5 * centerY, 'humo').setScale(2).setVisible(false);
        const humo2 = this.add.image(0.6 * centerX, 1.7 * centerY, 'humo').setScale(2).setVisible(false);
        const humo3 = this.add.image(centerX, centerY, 'humo').setScale(2).setVisible(false);
        const humo4 = this.add.image(1.3 * centerX, 0.7 * centerY, 'humov').setScale(2).setVisible(false);
        const humo5 = this.add.image(1.2 * centerX, 0.4 * centerY, 'humov').setScale(2).setVisible(false);
        this.humos.push(humo1, humo2, humo3, humo4, humo5);


        // Botones de UI (Pausa, Chat)
        const pausa = this.add.image(0.55 * centerX, 0.6 * centerY, 'pause').setScrollFactor(0).setScale(0.15)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.pause();
                this.scene.launch('PauseScene', { callingScene: this.scene.key });
            });

        const chatButton = this.add.image(1.43 * centerX, 0.6 * centerY, 'chat').setScrollFactor(0).setScale(0.15)
            .setInteractive()
            .on('pointerdown', () => {
                $('#chat-container').toggle();
            });

        // Iconos y capas de los poderes
        this.vision = this.add.image(0.56 * centerX, 1.4 * centerY, 'vision').setScrollFactor(0);
        this.olfato = this.add.image(0.56 * centerX, 1.25 * centerY, 'olfato').setScrollFactor(0);
        this.capaV = this.add.circle(0.56 * centerX, 1.4 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(true);
        this.capaO = this.add.circle(0.56 * centerX, 1.25 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(true);

        // **IMPORTANTE: Los listeners de teclado se añaden ONCE y se manejan solo para tu myPlayer.**
        // La lógica de interacción con agujero ya no se duplica en `checkAgujeroInteraction`.
        this.input.keyboard.on('keydown-E', () => {
            if (this.myPlayer && this.myPlayerKey === 'Sighttail' && this.agujero.visible && this.physics.overlap(this.myPlayer, this.agujero)) {
                this.webSocketManager.send(MSG_TYPES.AGUJERO_INTERACT, { playerKey: this.myPlayerKey });
            }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.myPlayer && this.myPlayerKey === 'Scentpaw' && this.agujero.visible && this.physics.overlap(this.myPlayer, this.agujero)) {
                this.webSocketManager.send(MSG_TYPES.AGUJERO_INTERACT, { playerKey: this.myPlayerKey });
            }
        });

        // **Crear animaciones para ambos personajes al inicio.**
        this.createAnimations('Sighttail');
        this.createAnimations('Scentpaw');


    }

    // Método llamado por WebSocketManager cuando el servidor indica que el juego ha comenzado
    startGame(gameId, myPlayerId, myPlayerKey) {
        console.log("startGame called!");

        this.gameId = gameId;
        this.myPlayerId = myPlayerId;
        this.myPlayerKey = myPlayerKey;

        this.waitingText.setVisible(false); // Oculta el mensaje de espera

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Asigna los sprites de los jugadores según la clave recibida del servidor
        if (this.myPlayerKey === 'Sighttail') {
            this.myPlayer = this.sighttail;
            this.otherPlayer = this.scentpaw;
            this.myControls = this.controlsManager.controls1;
        } else { // myPlayerKey === 'Scentpaw'
            this.myPlayer = this.scentpaw;
            this.otherPlayer = this.sighttail;
            this.myControls = this.controlsManager.controls2; // Scentpaw uses controls2
        }

        // Set initial idle animation for both players
        this.myPlayer.anims.play(`${this.myPlayerKey}-idleDown`, true);
        this.otherPlayer.anims.play(`${this.otherPlayer.texture.key}-idleDown`, true);

        this.lastSentPlayerState = {
            x: this.myPlayer.x,
            y: this.myPlayer.y,
            anim: `${this.myPlayerKey}-idleDown`
        };
        this.lastUpdateTime = Date.now();

        // Lanza el primer diálogo
        this.launchDialogueScene(0);

        console.log(`Partida ${this.gameId} iniciada. Eres ${this.myPlayerKey}`);
        // Hace visibles y activas las físicas para ambos jugadores
        this.myPlayer.setVisible(true).setImmovable(false);
        this.otherPlayer.setVisible(true).setImmovable(false);

        // Asegura que el otro jugador no tenga velocidad por defecto
        this.otherPlayer.body.setVelocity(0, 0);
        this.otherPlayer.body.setAllowGravity(false); // Si no usas gravedad


        // Configuración de la puerta
        this.puerta = this.add.rectangle(0.5 * centerX, 0.55 * centerY, 0.2 * centerX, 0.45 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(this.puerta, true);
        this.puertaInteractuable = false;

        this.physics.add.collider(this.myPlayer, this.puerta, () => this.handlePuertaCollision());
    }

    // Este método es llamado por el WebSocketManager cuando recibe un mensaje de actualización de otro jugador
    handlePlayerUpdate(data) {
        const { playerId, x, y, anim, flipX } = data;

        // Si el mensaje es de nuestro propio jugador, no hacemos nada porque ya lo manejamos localmente en update()
        if (playerId === this.myPlayerId) {
            return;
        }

        // Si es el otro jugador, actualiza su posición y animación
        if (this.otherPlayer && this.otherPlayer.body) {
            this.otherPlayer.body.setVelocity(0, 0); // Detén cualquier movimiento residual
            this.otherPlayer.setPosition(x, y); // Establece la posición directamente
            if (this.otherPlayer.anims && anim) {
                this.otherPlayer.anims.play(anim, true);
            }
            this.otherPlayer.setFlipX(flipX);
        } else {
            console.warn("No se pudo encontrar el sprite del otro jugador para actualizar.", data);
        }
    }

    // Método llamado cuando el jugador local colisiona con la puerta
    handlePuertaCollision() {
        if (this.puertaInteractuable === false) {
            // CORREGIDO: Usamos el tipo de mensaje definido en MSG_TYPES
            this.webSocketManager.send(MSG_TYPES.DOOR_INTERACT, { playerKey: this.myPlayerKey, playerId: this.myPlayerId });
        }
    }

    // Método llamado por WebSocketManager cuando el servidor confirma la interacción con la puerta
    handleDoorInteractionConfirmed() {
        if (this.puertaInteractuable === false) {
            this.puertaInteractuable = true;
            this.launchDialogueScene(1);
            console.log("Puerta interactuada, lanzando diálogo para ambos.");

            // Activar agujero, etc., aquí si corresponde después del diálogo de la puerta
            this.agujero.setVisible(true);
            this.capaO.setVisible(false); // Suponiendo que estas capas se desactivan
            this.capaV.setVisible(false);
            this.vistaDisp = true;
            this.olfatoDisp = true;
        }
    }

    // Método llamado por WebSocketManager cuando el servidor confirma la interacción con el agujero
    handleAgujeroInteractionConfirmed(data) {
        console.log("Servidor confirma interacción con el agujero.");
        this.launchDialogueScene(data.dialogueIndex || 2); // Lanza el diálogo 2 por defecto o el índice enviado por el servidor

        // Transición a GameScene después de un breve retraso
        this.time.delayedCall(500, () => {
            this.scene.stop('TutorialScene');
            this.scene.start('GameScene');
        });
    }

    // Gestión de diálogos
    launchDialogueScene(caseId) {
        let startIndex = 0;
        let endIndex = 0;

        switch (caseId) {
            case 0: // Caso inicial
                startIndex = 0;
                endIndex = 7;
                break;
            case 1: // Diálogo de la puerta
                startIndex = 7;
                endIndex = 9;
                break;
            case 2: // Diálogo del agujero
                startIndex = 9;
                endIndex = 12;
                break;
            default:
                console.error("Invalid caseId provided:", caseId);
                return;
        }

        this.scene.pause();
        this.scene.launch('DialogueScene', {
            startIndex, endIndex, callingScene: this.scene.key,
            onDialogueComplete: () => {
                if (caseId === 0) {
                    this.gameStarted = true;
                    console.log("Dialogo inicial completo. Movimiento habilitado");
                }
                
            }
        });
    }

    // Construye las animaciones de los personajes
    createAnimations(playerkey) {
        this.anims.create({ key: `${playerkey}-idleUp`, frames: this.anims.generateFrameNumbers(playerkey, { start: 286, end: 287 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${playerkey}-idleLeft`, frames: this.anims.generateFrameNumbers(playerkey, { start: 299, end: 300 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${playerkey}-idleDown`, frames: this.anims.generateFrameNumbers(playerkey, { start: 312, end: 313 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${playerkey}-idleRight`, frames: this.anims.generateFrameNumbers(playerkey, { start: 325, end: 326 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: `${playerkey}-walk-up`, frames: this.anims.generateFrameNumbers(playerkey, { start: 104, end: 112 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: `${playerkey}-walk-down`, frames: this.anims.generateFrameNumbers(playerkey, { start: 130, end: 138 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: `${playerkey}-walk-left`, frames: this.anims.generateFrameNumbers(playerkey, { start: 117, end: 125 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: `${playerkey}-walk-right`, frames: this.anims.generateFrameNumbers(playerkey, { start: 143, end: 151 }), frameRate: 10, repeat: -1 });
    }

    handlePowers() {
        if (!this.gameStarted || !this.myPlayer) return;

        if (this.abilityKey.isDown) {
            if (this.myPlayerKey === 'Sighttail' && this.vistaDisp) {
                console.log("Jugador Sighttail usó poder");
                this.vistaDisp = false;
                this.huellas.forEach(huella => { huella.setVisible(true); });
                this.capaV.setVisible(true);
                
                this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'vision' }); // Enviar al servidor

                this.time.delayedCall(this.durVista, () => {
                    this.huellas.forEach(huella => { huella.setVisible(false); });
                });

                this.time.delayedCall(this.cargaVista, () => {
                    this.vistaDisp = true;
                    this.capaV.setVisible(false);
                    console.log("Vista disponible");
                });
            }
            
            // Habilidad de Olfato (Scentpaw)
            if (this.myPlayerKey === 'Scentpaw' && this.olfatoDisp) {
                console.log("Jugador Scentpaw usó poder");
                this.olfatoDisp = false;
                this.humos.forEach(humo => { humo.setVisible(true); });
                this.capaO.setVisible(true);

                this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'olfato' }); // Enviar al servidor

                this.time.delayedCall(this.durOlfato, () => {
                    this.humos.forEach(humo => { humo.setVisible(false); });
                });

                this.time.delayedCall(this.cargaOlfato, () => {
                    this.olfatoDisp = true;
                    this.capaO.setVisible(false);
                    console.log("Olfato disponible");
                });
            }

        }
    }

    // Bucle principal de actualización del juego
    update(time, delta) {

        if (!this.gameStarted || !this.myPlayer) return;

        this.handlePlayerMovement();
        this.handlePositionUpdates();
        this.handlePowers();
        
        // Centrar cámara entre los dos jugadores
        // **Esto solo debe ocurrir si ambos jugadores (myPlayer y otherPlayer) han sido inicializados.**
        if (this.myPlayer && this.otherPlayer) {
            const centerjX = (this.myPlayer.x + this.otherPlayer.x) / 2;
            const centerjY = (this.myPlayer.y + this.otherPlayer.y) / 2;
            this.cameras.main.centerOn(centerjX, centerjY);
        } else {
            // Si los jugadores aún no están inicializados (al inicio), centra en un punto fijo o solo en myPlayer si existe.
            // Mantén la cámara centrada en el punto inicial del "esperando a otro jugador" o simplemente no muevas la cámara.
            // Para este caso, ya que tienes un texto fijo, puedes dejarla centrada en el punto inicial.
            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;
            this.cameras.main.centerOn(centerX, centerY);
        }
    }

    handlePlayerMovement() {
        const cursors = this.input.keyboard.createCursorsKeys();
        const speed = 100;

        this.myPlayer.body.setVelocity(0);

        if (cursors.left.isDown) {
            this.myPlayer.body.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            this.myPlayer.body.setVelocityX(speed);
        }

        if (cursors.up.isDown) {
            this.myPlayer.body.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            this.myPlayer.body.setVelocityY(speed);
        }
    }

    handlePositionUpdates() {
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime >= this.POSITION_UPDATE_INTERVAL) {
            const dx = Maths.abs(this.myPlayer.x - this.lastSentPlayerPosition.x);
            const dy = Maths.abs(this.myPlayer.y - this.lastSentPlayerPosition.y);

            if (dx > this.POSITION_THRESHOLD || dy > this.POSITION_THRESHOLD) {
                this.sendPosition();
                this.lastUpdateTime = currentTime;
                this.lastSentPlayerPosition = { x: this.myPlayer.x, y: this.myPlayer.y };
            }

        }
    }


    sendPlayerState(){
        this.webSocketManager.send(MSG_TYPES.PLAYER_UPDATE, {
            playerId: this.myPlayerId,
            x: Math.round(this.myPlayer.x),
            y: Math.round(this.myPlayer.y),
            anim: this.myPlayer.anims.currentAnim ? this.myPlayer.anims.currentAnim.key : `${this.myPlayerKey}-idleDown`,
            flipX: this.myPlayer.flipX
        });
    }
}