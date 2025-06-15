import ControlsManager from "./controlesJug.js";


export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });


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
        this.controlsManager = new ControlsManager();
        this.controlsManager.initializeControls(this);

        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        //Creamos unos arrays para meter las imagenes de las huellas y el humo
        this.huellas = [];
        this.humos = [];

        //Tiempo de carga y duracción de las habilidades
        this.cargaOlfato = 10000;
        this.cargaVista = 10000;
        this.durOlfato = 3000;
        this.durVista = 3000;

        //Estado de los poderes inicialmente
        this.vistaDisp = false;
        this.olfatoDisp = false;

        //Crear áreas y objetos
        const cripta = this.add.rectangle(0.085 * centerX, 0, centerX + 30, 0.95 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(cripta, true);//Le añadimos esto para que los personaje sno lo puedan atravesar

        const cementerio = this.add.rectangle(1.6 * centerX, 0, 0.4 * centerX, 1.4 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(cementerio, true);//Le añadimos esto para que los personaje sno lo puedan atravesar

        this.puerta = this.add.rectangle(0.5 * centerX, 0.55 * centerY, 0.2 * centerX, 0.45 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(this.puerta, true);//Le añadimos esto para que los personaje sno lo puedan atravesar
        this.puertaInteractuable = false; // Controla si el jugador puede interactuar con la puerta.

        //Fondo
        const escenario = this.add.image(centerX, centerY, "escenario");

        //Hacemos que la imagen ocupe toda la pantalla y le hacemos zoom para que se vea el escenario más grande
        const worldWidthT = escenario.displayWidth;
        const worldHeightT = escenario.displayHeight;
        this.cameras.main.setBounds(0, 0, worldWidthT, worldHeightT);
        this.cameras.main.setZoom(2);

        //Añadimos el agujero que no es visible desde el inicio
        this.agujero = this.physics.add.image(1.1 * centerX, 0.2 * centerY, 'agujero').setScale(1.7).setVisible(false);

        // Crear personajes
        this.sighttail = this.physics.add.sprite(1.56 * centerX, 0.2 * centerY, 'Sighttail')
            .setScale(2)
            .setSize(40, 30)
            .setOffset(12, 20);

        this.scentpaw = this.physics.add.sprite(1.42 * centerX, 0.2 * centerY, 'Scentpaw')
            .setScale(2)
            .setSize(40, 30)
            .setOffset(12, 20);

        //Colocamos a los personajes en el escenario
        this.centerjX = (this.sighttail.x + this.scentpaw.x) / 2;
        this.centerjY = (this.sighttail.y + this.scentpaw.y) / 2;
        this.cameras.main.centerOn(this.centerjX, this.centerjY);

        // Animaciones
        this.createAnimations('Sighttail');
        this.createAnimations('Scentpaw');

        // Colisiones
        this.physics.add.collider(this.sighttail, cripta);
        this.physics.add.collider(this.scentpaw, cripta);
        this.physics.add.collider(this.sighttail, cementerio);
        this.physics.add.collider(this.scentpaw, cementerio);

        //Si choca con la puerta se inicia el dialogo de esta
        this.physics.add.collider(this.sighttail, this.puerta, () => {
            this.launchDialogueScene(1);
        });

        this.physics.add.collider(this.scentpaw, this.puerta, () => {
            this.launchDialogueScene(1);
        });

        //Si el personaje de Sighttail se choca con el agujero usando su habilidad se inicia la conversación
        this.physics.add.overlap(this.sighttail, this.agujero, (player, agujero) => {
            if (this.agujero.visible) {
                this.checkAgujeroInteraction('Sighttail');
            }
        });

        //Lo mismo pero con el otro personaje
        this.physics.add.overlap(this.scentpaw, this.agujero, (player, agujero) => {
            if (this.agujero.visible) {
                this.checkAgujeroInteraction('Scentpaw');
            }
        });

        //Ponemos las huellas invisibles
        const oscuridad = this.add.rectangle(centerX, centerY, 2 * centerX, 2 * centerY, 0x000000, 0.5);

        const huella1 = this.add.image(0.3 * centerX, 1.2 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella2 = this.add.image(0.5 * centerX, 1.3 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella3 = this.add.image(0.7 * centerX, 1.1 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella4 = this.add.image(1.2 * centerX, 1.2 * centerY, 'huellaD').setScale(2).setVisible(false);
        const huella5 = this.add.image(1.5 * centerX, 0.9 * centerY, 'huellaA').setScale(2).setVisible(false);

        //Las añadimos al array
        this.huellas.push(huella1);
        this.huellas.push(huella2);
        this.huellas.push(huella3);
        this.huellas.push(huella4);
        this.huellas.push(huella5)

        //Ponemos los humos
        const humo1 = this.add.image(0.9 * centerX, 1.5 * centerY, 'humo').setScale(2).setVisible(false);
        const humo2 = this.add.image(0.6 * centerX, 1.7 * centerY, 'humo').setScale(2).setVisible(false);
        const humo3 = this.add.image(centerX, centerY, 'humo').setScale(2).setVisible(false);
        const humo4 = this.add.image(1.3 * centerX, 0.7 * centerY, 'humov').setScale(2).setVisible(false);
        const humo5 = this.add.image(1.2 * centerX, 0.4 * centerY, 'humov').setScale(2).setVisible(false);

        //Los añadimos al array
        this.humos.push(humo1);
        this.humos.push(humo2);
        this.humos.push(humo3);
        this.humos.push(humo4);
        this.humos.push(humo5);


        // Pausa
        const pausa = this.add.image(0.55 * centerX, 0.6 * centerY, 'pause').setScrollFactor(0).setScale(0.15)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.pause();
                this.scene.launch('PauseScene', { callingScene: this.scene.key });
            });

        //boton para abrir el chat
        const chatButton = this.add.image(1.43*centerX, 0.6*centerY, 'chat').setScrollFactor(0).setScale(0.15)
            .setInteractive()
            .on('pointerdown', () =>{
                $('#chat-container').toggle();
        });

        //icono de los poderes
        this.vision = this.add.image(0.56 * centerX, 1.4 * centerY, 'vision').setScrollFactor(0);
        this.olfato = this.add.image(0.56 * centerX, 1.25 * centerY, 'olfato').setScrollFactor(0);

        this.capaV = this.add.circle(0.56 * centerX, 1.4 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(true);
        this.capaO = this.add.circle(0.56 * centerX, 1.25 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(true);

        // Lanzar el primer diálogo
        this.launchDialogueScene(0);


    }

    //Confirma la interacción con el agujero
    checkAgujeroInteraction(playerKey) {
        this.input.keyboard.on('keydown-E', () => {
            if (playerKey === 'Sighttail' && this.agujero.visible) {
                this.launchDialogueScene(2);
                this.time.delayedCall(500, () => {
                    this.scene.stop('TutorialScene');
                    this.scene.start('GameScene');
                })

            }
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (playerKey === 'Scentpaw' && this.agujero.visible) {
                this.launchDialogueScene(2);
                this.time.delayedCall(500, () => {
                    this.scene.stop('TutorialScene');
                    this.scene.start('GameScene');
                })
            }
        });
    }

<<<<<<< Updated upstream
    //Gestión de dialogos
=======
    // Método llamado por WebSocketManager cuando el servidor indica que el juego ha comenzado
    startGame(gameId, myPlayerId, myPlayerKey) { 
        this.gameId = gameId;
        this.myPlayerId = myPlayerId;
        this.myPlayerKey = myPlayerKey;

        this.waitingText.setVisible(false); // Oculta el mensaje de espera

        // Configuración de la puerta
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
            this.myControls = this.controlsManager.controls2;
        }

        // Calcula las posiciones de inicio basadas en el centerX, centerY del cliente
        this.myPlayer.setPosition(1.56 * centerX, 0.2 * centerY);
        this.otherPlayer.setPosition(1.42 * centerX, 0.2 * centerY);


        // Hace visibles y activas las físicas para ambos jugadores
        this.myPlayer.setVisible(true).setImmovable(false);
        this.otherPlayer.setVisible(true).setImmovable(false);

        // Asegura que el otro jugador no tenga velocidad por defecto
        this.otherPlayer.body.setVelocity(0, 0);
        this.otherPlayer.body.setAllowGravity(false); // Si no usas gravedad

        console.log(`Partida ${this.gameId} iniciada. Eres ${this.myPlayerKey}`);

        // Lanza el primer diálogo
        this.launchDialogueScene(0);

        
        this.puerta = this.add.rectangle(0.5 * centerX, 0.55 * centerY, 0.2 * centerX, 0.45 * centerY, 0x000000, 0).setOrigin(0, 0);
        this.physics.add.existing(this.puerta, true);
        this.puertaInteractuable = false;

        // Collider para la puerta (solo el jugador local puede interactuar inicialmente)
        // **CORREGIDO: Un solo collider para myPlayer y la puerta.**
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
>>>>>>> Stashed changes
    launchDialogueScene(caseId) {
        let startIndex = 0;
        let endIndex = 0;


        switch (caseId) {
            case 0: // Caso inicial
                startIndex = 0;
                endIndex = 7;
                break;

            case 1: // puerta
                startIndex = 7;
                endIndex = 9;
                this.agujero.setVisible(true);
                this.capaO.setVisible(false);
                this.capaV.setVisible(false);
                this.vistaDisp = true;
                this.olfatoDisp = true;
                break;

            case 2: // dialogo de agujero
                startIndex = 9;
                endIndex = 12;
                break;

            default: // Caso por defecto
                console.error("Invalid caseId provided:", caseId);
                return;

        }

        //Pausamos la escena para mostar los diálogos
        this.scene.pause();
        this.scene.launch('DialogueScene', { startIndex, endIndex, callingScene: this.scene.key });
    }

    //Construye las animaciones de los personajes
    createAnimations(playerkey) {
        this.anims.create({
            key: `${playerkey}-idleUp`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 286, end: 287 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-idleLeft`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 299, end: 300 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-idleDown`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 312, end: 313 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-idleRight`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 325, end: 326 }),
            frameRate: 8,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-walk-up`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 104, end: 112 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-walk-down`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 130, end: 138 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-walk-left`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 117, end: 125 }),
            frameRate: 10,
            repeat: -1,
        });

        this.anims.create({
            key: `${playerkey}-walk-right`,
            frames: this.anims.generateFrameNumbers(playerkey, { start: 143, end: 151 }),
            frameRate: 10,
            repeat: -1,
        });
    }

    //Comprueba la dirección de los personajes y los estados de las huellas y humos
    update() {

        this.controlsManager.handlePlayerMovement(
            this.sighttail,
            this.controlsManager.controls1,
            'Sighttail'
        );
        
        this.controlsManager.handlePlayerMovement(
            this.scentpaw,
            this.controlsManager.controls2,
            'Scentpaw'
        );

        //Si la habilidad de la vista está activa se muestran las huellas
        if (this.vistaDisp && this.controlsManager.controls1.keys.power.isDown) {
            console.log("Jugador 1 usó poder");
            this.vistaDisp = false;
            this.huellas.forEach(huella => {
                huella.setVisible(true);
            });

            this.capaV.setVisible(true);

            //logica del timer 
            this.time.delayedCall(this.durVista, () => {
                this.huellas.forEach(huella => {
                    huella.setVisible(false);
                });

            });

            this.time.delayedCall(this.cargaVista, () => {
                this.vistaDisp = true;
                this.capaV.setVisible(false);
                console.log("vista disponible");
            });
        }
        //Si la habilidad de olfato está activa se muestran los humos
        if (this.olfatoDisp && this.controlsManager.controls2.keys.power.isDown) {
            console.log("Jugador 2 usó poder");
            this.olfatoDisp = false;
            this.humos.forEach(humo => {
                humo.setVisible(true);
            });

            this.capaO.setVisible(true);

            this.time.delayedCall(this.durOlfato, () => {
                this.humos.forEach(humo => {
                    humo.setVisible(false);
                });
            });

            this.time.delayedCall(this.cargaOlfato, () => {
                this.olfatoDisp = true;
                this.capaO.setVisible(false);
                console.log("olfato disponible");
            });
        }

        // Centrar cámara entre los dos jugadores
        this.centerjX = (this.sighttail.x + this.scentpaw.x) / 2;
        this.centerjY = (this.sighttail.y + this.scentpaw.y) / 2;
        this.cameras.main.centerOn(this.centerjX, this.centerjY);


    }

}
