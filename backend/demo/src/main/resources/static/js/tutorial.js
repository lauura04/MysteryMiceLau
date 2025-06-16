import ControlsManager from "./controlesJug.js";
import { MSG_TYPES } from './WebSocketMessages.js' // Asegúrate de que este archivo define tus tipos de mensaje
import WebsSocketManger from "./WebSocketManager.js"; // Asegúrate de que el nombre del archivo es exactamente este

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
        this.webSocketManager = null;
        this.gameStarted = false;
        this.gameReadyPayload = null;

        this.gameId = null; // Asignar cuando el servidor lo envíe
        this.myPlayerId = null;
        this.myPlayerKey = null;

        this.myPlayer = null; // El sprite del jugador que controlas localmente
        this.otherPlayer = null; // El sprite del otro jugador (controlado por el servidor)

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

        // Banderas para controlar si el efecto visual de un poder está activo
        // Esto ayuda a evitar múltiples activaciones visuales y sincronización
        this.isSighttailVisualEffectActive = false;
        this.isScentpawVisualEffectActive = false;
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


        this.controlsManager = new ControlsManager(this); //lo mismo se quita

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


        // Creamos unos arrays para meter las imagenes de las huellas y el humo
        this.huellas = [];
        this.humos = [];



        const worldWidthT = escenario.displayWidth;
        const worldHeightT = escenario.displayHeight;
        this.cameras.main.setBounds(0, 0, worldWidthT, worldHeightT);
        this.cameras.main.setZoom(2);



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

        } else { // myPlayerKey === 'Scentpaw'
            this.myPlayer = this.scentpaw;
            this.otherPlayer = this.sighttail;

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
        this.myPlayer.setVisible(true).setImmovable(false).setDepth(1);
        this.otherPlayer.setVisible(true).setImmovable(false).setDepth(1);

        // Asegura que el otro jugador no tenga velocidad por defecto
        this.otherPlayer.body.setVelocity(0, 0);
        this.otherPlayer.body.setAllowGravity(false); // Si no usas gravedad


        // Configuración de la puerta

        this.puerta = this.add.rectangle(0.5 * centerX, 0.55 * centerY, 0.2 * centerX, 0.45 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(this.puerta, true);
        this.puertaInteractuable = false;


        this.physics.add.collider(this.myPlayer, this.puerta, () => this.handlePuertaCollision());

        // Agujero (inicialmente invisible)
        this.agujero = this.add.image(1.1 * centerX, 0.2 * centerY, 'agujero').setScale(2).setVisible(false);
        this.physics.add.existing(this.agujero, true);
        this.agujeroInteractuable = false;

        this.physics.add.collider(this.myPlayer, this.agujero, () => this.handleAgujeroCollision());


        this.cameras.main.startFollow(this.myPlayer);
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

    handleAgujeroCollision() {
        if (this.agujeroInteractuable === false) {
            this.webSocketManager.send(MSG_TYPES.HOLE_INTERACT, { playerKey: this.myPlayerKey, playerId: this.myPlayerId });
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
    handleAgujeroInteractionConfirmed() {
        if (this.agujeroInteractuable === false) {
            this.agujeroInteractuable = true;
            this.launchDialogueScene(2);
            console.log("Agujero interactuado, lanzado diálogo para ambos");

            // Transición a GameScene después de un breve retraso
            this.time.delayedCall(500, () => {
                this.scene.stop('TutorialScene');
                this.scene.start('GameScene');
            });
        }
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
        this.scene.launch('DialogueScene', { startIndex, endIndex, callingScene: this.scene.key });
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
        if (!this.myPlayer) {
            return;
        }

        // Lógica para Sighttail (Visión)
        // Usamos JustDown para activar solo una vez por pulsación
        if (this.myPlayerKey === 'Sighttail' && this.vistaDisp && this.abilityKey.isDown) {
            console.log("Jugador Sighttail usó poder: ACTIVAR");
            this.vistaDisp = false; // El poder entra en cooldown (no disponible para re-uso)
            this.huellas.forEach(huella => { huella.setVisible(true); });

            // La capa V se vuelve visible por la DURACIÓN del poder (indica efecto activo)
            this.capaV.setVisible(true);

            // Notificar al servidor que Sighttail ACTIVÓ su poder
            this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'vision', action: 'activate' });

            // Timer para DESACTIVAR el efecto visual del poder y ocultar capaV
            this.time.delayedCall(this.durVista, () => {
                this.huellas.forEach(huella => { huella.setVisible(false); });

                // Notificar al servidor que Sighttail DESACTIVÓ su poder
                this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'vision', action: 'deactivate' });
                console.log("Jugador Sighttail: Efecto de visión finalizado.");
            });

            // Timer para que el poder esté disponible de nuevo (Cooldown)
            this.time.delayedCall(this.cargaVista, () => {
                this.capaV.setVisible(false); // La capa V se oculta al finalizar la duración del efecto
                this.vistaDisp = true; // El poder vuelve a estar disponible para uso
                console.log("Vista disponible de nuevo.");
            });
        }

        // Habilidad de Olfato (Scentpaw)
        if (this.myPlayerKey === 'Scentpaw' && this.olfatoDisp && this.abilityKey.isDown) {
            console.log("Jugador Scentpaw usó poder: ACTIVAR");
            this.olfatoDisp = false; // El poder entra en cooldown
            this.humos.forEach(humo => { humo.setVisible(true); });

            // La capa O se vuelve visible por la DURACIÓN del poder
            this.capaO.setVisible(true);

            // Notificar al servidor que Scentpaw ACTIVÓ su poder
            this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'olfato', action: 'activate' });

            // Timer para DESACTIVAR el efecto visual del poder y ocultar capaO
            this.time.delayedCall(this.durOlfato, () => {
                this.humos.forEach(humo => { humo.setVisible(false); });

                // Notificar al servidor que Scentpaw DESACTIVÓ su poder
                this.webSocketManager.send(MSG_TYPES.ABILITY_USE, { playerKey: this.myPlayerKey, ability: 'olfato', action: 'deactivate' });
                console.log("Jugador Scentpaw: Efecto de olfato finalizado.");
            });

            // Timer para que el poder esté disponible de nuevo (Cooldown)
            this.time.delayedCall(this.cargaOlfato, () => {
                this.capaO.setVisible(false); // La capa O se oculta al finalizar la duración del efecto
                this.olfatoDisp = true; // El poder vuelve a estar disponible para uso
                console.log("Olfato disponible de nuevo.");
            });
        }
    }


    // Bucle principal de actualización del juego
    update(time, delta) {
        // Only handle player movement and updates if myPlayer is initialized
        if (this.myPlayer) {
            this.handlePlayerMovement(); // Handles local player movement and animation
            this.handlePositionUpdates(); // Handles sending position updates to the server
            this.handlePowers(); // Handles player abilities


        } else {
            // 
            const centerX = this.scale.width / 2;
            const centerY = this.scale.height / 2;
            this.cameras.main.centerOn(centerX, centerY);
        }
    }

    handlePlayerMovement() {
        if (!this.myPlayer || !this.myPlayer.body) {
            return; // Exit the function if myPlayer or its body is not yet defined
        }
        const cursors = this.cursors;
        const speed = 100;

        let moving = false;
        let currentAnimKey = this.myPlayer.anims.currentAnim ? this.myPlayer.anims.currentAnim.key : `${this.myPlayerKey}-idleDown`;

        this.myPlayer.body.setVelocity(0); // Reset velocity each frame

        if (cursors.left.isDown) {
            this.myPlayer.body.setVelocityX(-speed);

            if (currentAnimKey !== `${this.myPlayerKey}-walk-left`) {
                this.myPlayer.anims.play(`${this.myPlayerKey}-walk-left`, true);
            }
            moving = true;
        } else if (cursors.right.isDown) {
            this.myPlayer.body.setVelocityX(speed);
            this.myPlayer.setFlipX(false); // No flip for right movement
            if (currentAnimKey !== `${this.myPlayerKey}-walk-right`) {
                this.myPlayer.anims.play(`${this.myPlayerKey}-walk-right`, true);
            }
            moving = true;
        }

        if (cursors.up.isDown) {
            this.myPlayer.body.setVelocityY(-speed);
            // Don't change flipX for up/down movement, let horizontal movement dictate it
            if (currentAnimKey !== `${this.myPlayerKey}-walk-up`) {
                this.myPlayer.anims.play(`${this.myPlayerKey}-walk-up`, true);
            }
            moving = true;
        } else if (cursors.down.isDown) {
            this.myPlayer.body.setVelocityY(speed);
            // Don't change flipX for up/down movement
            if (currentAnimKey !== `${this.myPlayerKey}-walk-down`) {
                this.myPlayer.anims.play(`${this.myPlayerKey}-walk-down`, true);
            }
            moving = true;
        }

        // If not moving, play idle animation based on last direction or default
        if (!moving) {
            // Ensure we only change to idle if a movement animation was playing
            if (currentAnimKey.includes('walk')) {
                let idleAnim = `${this.myPlayerKey}-idleDown`; // Default idle
                if (currentAnimKey.includes('up')) idleAnim = `${this.myPlayerKey}-idleUp`;
                else if (currentAnimKey.includes('down')) idleAnim = `${this.myPlayerKey}-idleDown`;
                else if (currentAnimKey.includes('left')) idleAnim = `${this.myPlayerKey}-idleLeft`;
                else if (currentAnimKey.includes('right')) idleAnim = `${this.myPlayerKey}-idleRight`;

                if (currentAnimKey !== idleAnim) { // Only change if actually different
                    this.myPlayer.anims.play(idleAnim, true);
                }
            } else if (!currentAnimKey) { // If no animation was set yet (e.g., very first frame)
                this.myPlayer.anims.play(`${this.myPlayerKey}-idleDown`, true);
            }
        }
    }

    handlePositionUpdates() {
        if (!this.myPlayer) {
            return; // Exit the function if myPlayer is not yet defined
        }
        const currentTime = Date.now();
        if (currentTime - this.lastUpdateTime >= this.POSITION_UPDATE_INTERVAL) {
            const dx = Math.abs(this.myPlayer.x - this.lastSentPlayerPosition.x);
            const dy = Math.abs(this.myPlayer.y - this.lastSentPlayerPosition.y);

            if (dx > this.POSITION_THRESHOLD || dy > this.POSITION_THRESHOLD) {
                this.sendPlayerState();
                this.lastUpdateTime = currentTime;
                this.lastSentPlayerPosition = { x: this.myPlayer.x, y: this.myPlayer.y };
            }

        }
    }


    sendPlayerState() {
        this.webSocketManager.send(MSG_TYPES.PLAYER_UPDATE, {
            playerId: this.myPlayerId,
            x: Math.round(this.myPlayer.x),
            y: Math.round(this.myPlayer.y),
            anim: this.myPlayer.anims.currentAnim ? this.myPlayer.anims.currentAnim.key : `${this.myPlayerKey}-idleDown`,
            flipX: this.myPlayer.flipX
        });
    }

    applyPowerEffect(actingPlayerKey, abilityName, action) {
        let targetOverlay = null;
        let cooldownDuration = 0;

        if (abilityName === 'vista') {
            targetOverlay = this.capaV;
            cooldownDuration = this.cargaVista;
        } else if (abilityName === 'olfato') {
            targetOverlay = this.capaO;
            cooldownDuration = this.cargaOlfato;
        }

        if (action === 'activate') {
            if (targetOverlay.visible) {
                return;
            }

            targetOverlay.setVisible(true);
            if (actingPlayerKey === this.myPlayer.playerKey) {
                this.webSocketManager.send(MSG_TYPES.ABILITY_USE, {
                    playerKey: actingPlayerKey,
                    ability: abilityName,
                    action: 'activate'
                });
            }

            this.time.delayedCall(cooldownDuration, () => {
                targetOverlay.setVisible(false);
            }, [], this);
        }
    }
}