import ControlsManager from "./controlesJug.js";
import ChatManager from './ChatManager.js';
import { MSG_TYPES } from './WebSocketMessages.js'

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene', physics: { default: 'arcade' } });
    }

    init(data) {
        // Almacenar los datos pasados para usarlos en create()
        this.gameId = data.gameId;
        this.myPlayerId = data.playerId;
        this.myPlayerKey = data.playerKey; // 'Sighttail' o 'Scentpaw'
        this.webSocketManager = data.webSocketManager; // Esto es crucial para mantener la conexión
        this.otherPlayerId = data.otherPlayerId; // Si necesitas saber el ID del otro jugador
        this.otherPlayerKey = data.otherPlayerKey; // Si necesitas saber el rol del otro jugador


        this.myPlayer = data.myPlayer;
        this.otherPlayer = data.otherPlayer;
        console.log("GameScene initialized with data:", data);

        //esto es igual
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

        this.cursors = null;

        
    }

    preload() {
        //Cargamos los spritesheet de los personajes
        this.load.spritesheet('Sighttail', 'assets/Sightail_spritesheet.png', {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet('Scentpaw', 'assets/Scentpaw-spritesheet.png', {
            frameWidth: 64,
            frameHeight: 64,
        });

        //Cargamos el tilemap
        this.load.image('tiles', 'assets/Tilemap.png');

        //Cargamos el spritesheet del cazador
        this.load.spritesheet('Cazador', 'assets/cazador_spritesheet.png', {
            frameWidth: 64,
            frameHeight: 64,

        });

        //Cargamos los audios
        this.load.audio("Derrota", 'assets/Derrota.mp3');
        this.load.audio("Daño", 'assets/minecraft_hit.mp3');
        this.load.audio("chillaud", 'assets/chill-guy.mp3');

        //Cargamos las imagenes de los distintos elementos
        this.load.image('pause', 'assets/Boton_Pausa.png');
        this.load.image('gas', 'assets/Gas.png');
        this.load.image("vision", 'assets/Supervision.png');
        this.load.image("olfato", 'assets/Superolfato.png');
        this.load.image("frame1", 'assets/Flechas_F1.png');
        this.load.image("frame2", 'assets/Flechas_F2.png');
        this.load.image("frame3", 'assets/Flechas_F3.png');
        this.load.image("frame4", 'assets/Flechas_F4.png');
        this.load.image("frame5", 'assets/Flechas_F5.png');
        this.load.image("carta", 'assets/carta.png');
        this.load.image("vidaSc", 'assets/ScentpawVida.png');
        this.load.image("vidaSi", 'assets/SightailVida.png');
        this.load.image("muerteSc", 'assets/ScentpawMuerte.png');
        this.load.image("muerteSi", 'assets/SightailMuerte.png');
        this.load.image("chillpic", 'assets/chill_sprite.png');
        this.load.image("chat", 'assets/Boton_Chat.png');
        this.load.audio("laberinto", 'assets/MusicaLaberinto.mp3');
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        this.abilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        

        //Detiene la música de la pantalla anterior
        const backgroundMusic1 = this.registry.get("musicaFondo");
        if (backgroundMusic1) {
            backgroundMusic1.stop();
        }

        //Instaura la música de este nivel
        if (!this.sound.get('laberinto')) {
            this.music = this.sound.add("laberinto", { loop: true, volume: 0.5 });
            this.music.play();
        } else {
            this.music = this.sound.get('laberinto');
        }
        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;


        //servidor
        this.sighttailGas = 0;
        this.scentpawGas = 0;



        //Daño máximo que pueden recibir servidor
        this.vidasP1 = 2; //Vida de Sightail
        this.vidasP2 = 2;//Vida de Scentpaw

        //servidor
        this.gasPriVez = true;
        this.flechasPriVez = true;
        this.hablarCazador = true;

        //Tamaño de los tiles
        const tileSize = 64;

        //Arrays para guardar los gases y las flechas
        this.gas = [];
        this.flechas = [];

        //servidor
        //Arrays para guardar las vidas y muertes de los personajes
        this.vidasSc = [];
        this.vidasSi = [];
        this.muertesSc = [];
        this.muertesSi = [];

        const mapData = [
            // Aquí va  matriz mapData
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 0, 1, 1, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 1, 1, 1, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 0, 1, 1, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 5, 7, 7, 7, 7, 3, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 4, 4, 4, 4, 8, 1, 1, 1, 1, 6, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 0, 1, 1, 1, 1, 1, 1, 1, 6, 4, 4, 4, 8, 1, 1, 1, 1, 1, 1, 1, 2],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 6, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 7, 7, 7, 7, 7, 7],
            [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7],

        ];

        //Creamos un tilemap
        const map = this.make.tilemap({
            data: mapData,
            tileWidth: tileSize,
            tileHeight: tileSize,
        });

        //Le añadimos la imagen correspondiente
        const tileset = map.addTilesetImage('tiles');
        const layer = map.createLayer(0, tileset, 0, 0);

        // Configurar límites de la cámara al tamaño del mapa
        const worldWidth = map.widthInPixels;
        const worldHeight = map.heightInPixels;
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setZoom(2);

        // Configurar colisiones en el mapa
        layer.setCollision([1, 7]);

        //donde vergas iria
        // Crear los sprites de los jugadores con físicas
        this.sighttail = this.physics.add.sprite(3.5 * centerX, 8 * centerY, 'Sighttail')
            .setScale(2)
            .setSize(40, 35)
            .setOffset(12, 25);

        this.scentpaw = this.physics.add.sprite(3.3 * centerX, 8 * centerY, 'Scentpaw')
            .setScale(2)
            .setSize(40, 35)
            .setOffset(12, 25);

        this.cazador = this.physics.add.sprite(3.2 * centerX, 4.5 * centerY, 'Cazador')
            .setScale(2)
            .setSize(40, 40)
            .setOffset(12, 20)
            .setImmovable(true);

        this.carta = this.physics.add.image(3.5 * centerX, 4.6 * centerY, 'carta').setVisible(false).setImmovable(true);

        console.log("myPlayerKey before assignment:", this.myPlayerKey); // Check this!
        if (this.myPlayerKey === 'Sighttail') {
            this.myPlayer = this.sighttail;
            this.otherPlayer = this.scentpaw;
            console.log("Assigned Sighttail as myPlayer.");
        } else if (this.myPlayerKey === 'Scentpaw') {
            this.myPlayer = this.scentpaw;
            this.otherPlayer = this.sighttail;
            console.log("Assigned Scentpaw as myPlayer.");
        } else {
            console.error("myPlayerKey is undefined or invalid. Defaulting to Sighttail for camera follow.");
            this.myPlayer = this.sighttail; // Default to Sighttail to prevent crashes
            this.otherPlayer = this.scentpaw;

            //servidor?
            //Animación de las flechas
            this.anims.create({
                key: 'flechas',
                frames: [
                    { key: 'frame1' },
                    { key: 'frame2' },
                    { key: 'frame5' },
                ],
                frameRate: 10,
                repeat: -1,
            });

            //Llamamos a la función constructor de las flechas que hay por el mapa
            this.createFlecha(1.9 * centerX, 6.3 * centerY, 2000, { minX: 1.9 * centerX, maxX: 2.7 * centerX });
            this.createFlecha(3.2 * centerX, 3 * centerY, 3000, { minX: 3.2 * centerX, maxX: 3.45 * centerX });
            this.createFlecha(3.2 * centerX, 2.5 * centerY, 2500, { minX: 3.2 * centerX, maxX: 3.45 * centerX });
            this.createFlecha(3.2 * centerX, 2 * centerY, 4000, { minX: 3.2 * centerX, maxX: 3.45 * centerX });

            //Comprobamos el teimpo que están los persoanjes dentro del gas
            this.time.addEvent({
                delay: 100,
                callback: () => {
                    this.checkGasCollision(this.sighttail, 'Sighttail');
                    this.checkGasCollision(this.scentpaw, 'Scentpaw');
                },
                loop: true
            });

            //Creamos los gases
            this.gas1 = this.physics.add.image(2.5 * centerX, 8 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas2 = this.physics.add.image(2 * centerX, 8 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas3 = this.physics.add.image(1.5 * centerX, 8 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas4 = this.physics.add.image(centerX, 8 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas5 = this.physics.add.image(1.85 * centerX, 2.0 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas6 = this.physics.add.image(1.85 * centerX, 1.2 * centerY, 'gas').setScale(5).setVisible(false);

            this.gas7 = this.physics.add.image(2.5 * centerX, 0.38 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas8 = this.physics.add.image(3 * centerX, 0.38 * centerY, 'gas').setScale(5).setVisible(false);
            this.gas9 = this.physics.add.image(2 * centerX, 0.38 * centerY, 'gas').setScale(5).setVisible(false);

            //Añadimos los gases al array
            this.gas.push(this.gas1, this.gas2, this.gas3, this.gas4, this.gas5, this.gas6, this.gas7, this.gas8, this.gas9);

            this.gas.forEach((gasCloud) => {
                this.physics.add.overlap(this.sighttail, gasCloud, () => {
                    this.sighttailInGas = true;
                });
                this.physics.add.overlap(this.scentpaw, gasCloud, () => {
                    this.scentpawInGas = true;
                });
            });

            //Boleanos para indicar si los personajes están dentro del gas inicializandolo en falso
            this.sighttailInGas = false;
            this.scentpawInGas = false;



            //Añadimos los iconos de las muertes de Scentpaw
            this.muerteSc1 = this.add.image(1.35 * centerX, 0.56 * centerY, 'muerteSc').setScrollFactor(0).setScale(0.11).setVisible(false);
            this.muerteSc2 = this.add.image(1.4 * centerX, 0.56 * centerY, 'muerteSc').setScrollFactor(0).setScale(0.11).setVisible(false);
            this.muerteSc3 = this.add.image(1.45 * centerX, 0.56 * centerY, 'muerteSc').setScrollFactor(0).setScale(0.11).setVisible(false);
            //Las metemos en el array de muertes de Scentpaw
            this.muertesSc.push(this.muerteSc1, this.muerteSc2, this.muerteSc3);
            //Añadimos los iconos de las muertes de Signtail
            this.muerteSi1 = this.add.image(1.35 * centerX, 0.66 * centerY, 'muerteSi').setScrollFactor(0).setScale(0.11).setVisible(false);
            this.muerteSi2 = this.add.image(1.4 * centerX, 0.66 * centerY, 'muerteSi').setScrollFactor(0).setScale(0.11).setVisible(false);
            this.muerteSi3 = this.add.image(1.45 * centerX, 0.66 * centerY, 'muerteSi').setScrollFactor(0).setScale(0.11).setVisible(false);
            //Las metemos en el array de muertes de Signtail
            this.muertesSi.push(this.muerteSi1, this.muerteSi2, this.muerteSi3);

            //Añadimos los iconos de las vidas de Scentpaw
            this.vidaSc1 = this.add.image(1.35 * centerX, 0.56 * centerY, 'vidaSc').setScrollFactor(0).setScale(0.11);
            this.vidaSc2 = this.add.image(1.4 * centerX, 0.56 * centerY, 'vidaSc').setScrollFactor(0).setScale(0.11);
            this.vidaSc3 = this.add.image(1.45 * centerX, 0.56 * centerY, 'vidaSc').setScrollFactor(0).setScale(0.11);
            //Las metemos en el array de vidas de Scentpaw
            this.vidasSc.push(this.vidaSc1, this.vidaSc2, this.vidaSc3);
            //Añadimos los iconos de las vidas de Signtail
            this.vidaSi1 = this.add.image(1.35 * centerX, 0.66 * centerY, 'vidaSi').setScrollFactor(0).setScale(0.11);
            this.vidaSi2 = this.add.image(1.4 * centerX, 0.66 * centerY, 'vidaSi').setScrollFactor(0).setScale(0.11);
            this.vidaSi3 = this.add.image(1.45 * centerX, 0.66 * centerY, 'vidaSi').setScrollFactor(0).setScale(0.11);
            //Las metemos en el array de vidas de Signtail
            this.vidasSi.push(this.vidaSi1, this.vidaSi2, this.vidaSi3);

            // Crear el texto del temporizador ¿SERVIDOR?
            this.timerText = this.add.text(0.96 * centerX, 0.52 * centerY, '00:00', {
                font: '35px mousy',
                color: '#FFFFFF',
            }).setScrollFactor(0);

            // Inicializa el tiempo que transcurre
            this.elapsedTime = 0;

            // Configura un evento que actualiza el cronómetro cada segundo
            this.time.addEvent({
                delay: 1000, //
                callback: this.updateTimer,
                callbackScope: this,
                loop: true, //
            });

            //Añadimos el botón de pausa
            const pausa = this.add.image(0.54 * centerX, 0.55 * centerY, 'pause').setScrollFactor(0).setScale(0.09)
                .setInteractive()
                .on('pointerdown', () => {
                    this.scene.pause(); // Pausa la escena actual
                    this.scene.launch('PauseScene', { callingScene: this.scene.key }); //Nos movemos a la escena de pausa
                });

            //boton para abrir el chat
            const chatButton = this.add.image(1.43 * centerX, 0.6 * centerY, 'chat').setScrollFactor(0).setScale(0.15)
                .setInteractive()
                .on('pointerdown', () => {
                    $('#chat-container').toggle();
                });
            // Crear las animaciones para los jugadores
            this.createAnimations('Sighttail');
            this.createAnimations('Scentpaw');
            this.createAnimations('Cazador');


            //Implementacion de la insignia "chill guy"
            //añadimos cómo se va a ver la imagen en pantalla
            this.cuadropixel = this.physics.add.image(1.1 * centerX, 0.2 * centerY, 'chillpic').setScale(1.7).setVisible(true);


            //hacer movidas con el servidor
            //Si el personaje de Sighttail se choca con el cuadro se muestra este
            this.physics.add.overlap(this.sighttail, this.cuadropixel, (player, cuadropixel) => {
                if (this.cuadropixel.visible) {
                    this.checkCuadroInteraction('Sighttail');
                }
            });

            //Lo mismo pero con el otro personaje
            this.physics.add.overlap(this.scentpaw, this.cuadropixel, (player, cuadropixel) => {
                if (this.cuadropixel.visible) {
                    this.checkCuadroInteraction('Scentpaw');
                }
            });



            // Habilitar colisiones entre los jugadores y los tiles del mapa
            this.physics.add.collider(this.sighttail, layer);
            this.physics.add.collider(this.scentpaw, layer);

            //colisiones entre jugadores y cazador
            this.physics.add.collider(this.sighttail, this.cazador, () => {
                console.log('colision con cazador: sighttail');
                this.checkCazadorCollision('Sighttail');

            });
            this.physics.add.collider(this.scentpaw, this.cazador, () => {
                console.log('colision con cazador: scentpaw');
                this.checkCazadorCollision('Scentpaw');
            });

            //Colisiones entre jugadores y la carta
            this.physics.add.collider(this.sighttail, this.carta, () => {
                this.launchDialogueScene(5);
                this.time.delayedCall(500, () => {
                    this.scene.stop("GameScene");
                    this.scene.start("EndScene");
                });
            })
            this.physics.add.collider(this.scentpaw, this.carta, () => {
                this.launchDialogueScene(5);
                this.time.delayedCall(500, () => {
                    this.scene.stop("GameScene");
                    this.scene.start("EndScene");
                });
            })

            //icono de los poderes
            this.vision = this.add.image(0.56 * centerX, 1.4 * centerY, 'vision').setScrollFactor(0);
            this.olfato = this.add.image(0.56 * centerX, 1.25 * centerY, 'olfato').setScrollFactor(0);

            this.capaV = this.add.circle(0.56 * centerX, 1.4 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(false);
            this.capaO = this.add.circle(0.56 * centerX, 1.25 * centerY, 32, 0x000000, 0.5).setScrollFactor(0).setVisible(false);

            //Posición de los personajes en la cámara --> se va
            const centerjX = (this.sighttail.x + this.scentpaw.x) / 2;
            const centerjY = (this.sighttail.y + this.scentpaw.y) / 2;
            this.cameras.main.startFollow(this.myPlayer);

            this.launchDialogueScene(0);
        }
    }



        checkCuadroInteraction(playerKey) {
            this.input.keyboard.on('keydown-E', () => {
                if (playerKey === 'Sighttail') {
                    //Instaura la música de este nivel
                    this.music = this.sound.add("chillaud", { loop: true, volume: 0.5 });
                    this.music.play();
                    this.time.delayedCall(5000, () => {
                        this.music = this.sound.add("laberinto", { loop: true, volume: 0.5 });
                        this.music.play();
                    })
                }
            });

            this.input.keyboard.on('keydown-E', () => {
                if (playerKey === 'Scentpaw') {
                    //Instaura la música de este nivel
                    this.music = this.sound.add("chillaud", { loop: true, volume: 0.5 });
                    this.music.play();
                    this.time.delayedCall(5000, () => {
                        this.music = this.sound.add("laberinto", { loop: true, volume: 0.5 });
                        this.music.play();
                    })
                }
            });
        }

        updateTimer() {
            // Incrementa el tiempo transcurrido
            this.elapsedTime++;

            // Convierte segundos a minutos y segundos
            const minutes = Math.floor(this.elapsedTime / 60);
            const seconds = this.elapsedTime % 60;

            // Actualiza el texto del temporizador
            this.timerText.setText(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }

        //Comprueba si alguno de los jugadores ha chocado co él para iniciar su dialogo
        checkCazadorCollision(playerKey) {

            if (playerKey === 'Sighttail') {
                if (this.hablarCazador) {
                    this.launchDialogueScene(3);//Dialogo cazador
                    this.hablarCazador = false; // Desactiva para no repetir el diálogo
                    this.carta.setVisible(true);
                }
            } else if (playerKey === 'Scentpaw') {
                if (this.hablarCazador) {
                    this.launchDialogueScene(3);//Dialogo cazador
                    this.hablarCazador = false;
                    this.carta.setVisible(true);
                }
            }
        }

        //Función que comprueba la colisión de este con el gas
        checkGasCollision(player, playerKey) {

            if (playerKey === 'Sighttail') {
                if (this.sighttailInGas) {
                    this.sighttailGas += 100;
                    if (this.gasPriVez) {//Si es la primera vez que lo toca salta dialogo
                        this.launchDialogueScene(2);
                        this.gasPriVez = !this.gasPriVez;
                    }
                    if (this.sighttailGas >= 7000) {//Si esta más tiempo del que debe se le quita una vida
                        //Eliminamos un simbolo de vida
                        this.vidasSi[this.vidasP1].setVisible(false);
                        //Mostramos ek simbolo de muerte
                        this.muertesSi[this.vidasP1].setVisible(true);
                        //Le quitamos una vida
                        this.vidasP1 -= 1;
                        this.sighttailGas = 0;
                        console.log("Una vida menos");
                        console.log(this.sighttailGas);
                        console.log(this.sighttailInGas);

                        this.sound.play("Daño");
                    }
                }
                else { //Si se va del gas reinicia el contador
                    this.sighttailGas = 0;
                }
                this.sighttailInGas = false;
            }
            if (playerKey === 'Scentpaw') {
                if (this.scentpawInGas) {
                    this.scentpawGas += 100;
                    if (this.gasPriVez) {
                        this.launchDialogueScene(2);//Si es la primera vez que lo toca salta dialogo
                        this.gasPriVez = !this.gasPriVez;
                    }
                    if (this.scentpawGas >= 7000) {//Si esta más tiempo del que debe se le quita una vida
                        //Eliminamos un simbolo de vida
                        this.vidasSc[this.vidasP2].setVisible(false);
                        //Mostramos un simbolo de muerte
                        this.muertesSc[this.vidasP2].setVisible(true);
                        //Le quitamos una vida
                        this.vidasP2 -= 1;
                        this.scentpawGas = 0;

                        this.sound.play("Daño");
                    }
                }
                else {//Si se va del gas reinicia el contador
                    this.scentpawGas = 0;
                }
                this.scentpawInGas = false;
            }

            //Si se quedan sin vidas se reinicia la escena
            if (this.vidasP1 < 0 || this.vidasP2 < 0) {

                this.sound.play("Derrota");

                //Cambiamos de escena
                this.scene.stop('GameScene');
                this.scene.start('LoseScene');
            }


        }

        //Función que maneja la colisión de los persoanjes con las flechas
        handleFlechaCollision(playerkey, flecha) {
            if (flecha.yaColisiono) {//Si choca sale de la función
                return;
            }
            flecha.yaColisiono = true; //Al chocar le quita una vida
            console.log(`${playerkey} ha sido alcanzado por una flecha`);
            //Eliminamos un simbolo de vida de los personajes
            if (playerkey == 'Sighttail') {
                //Eliminamos un simbolo de vida
                this.vidasSi[this.vidasP1].setVisible(false);
                //Mostramos un simbolo de muerte
                this.muertesSi[this.vidasP1].setVisible(true);
                //Le quitamos una vida
                this.vidasP1 -= 1;

                this.sound.play("Daño");
            }
            if (playerkey == 'Scentpaw') {
                //Eliminamos un simbolo de vida
                this.vidasSc[this.vidasP2].setVisible(false);
                //Mostramos un simbolo de muerte
                this.muertesSc[this.vidasP2].setVisible(true);
                //Le quitamos una vida
                this.vidasP2 -= 1;

                this.sound.play("Daño");
            }
            if (this.flechasPriVez) {//Si es la primera vez que choca salta el dialogo
                this.launchDialogueScene(1);
                this.flechasPriVez = !this.flechasPriVez;
            }
            flecha.setVelocity(0);
            flecha.setVisible(false);
            this.time.delayedCall(flecha.delay, () => {
                flecha.setPosition(flecha.posicionInicial.x, flecha.posicionInicial.y);
                flecha.play('flechas');
                flecha.setVelocityX(200);
                flecha.setVelocityY(0);
                flecha.yaColisiono = false;
            });


            //Si se quedan sin vidas se reinicia la escena
            if (this.vidasP1 < 0 || this.vidasP2 < 0) {

                this.sound.play("Derrota");

                //Cambiamos de escena
                this.scene.stop('GameScene');
                this.scene.start('LoseScene');
            }
        }

        //Función para crear las flechas y añadirles los colliders para detectar a los personajes
        createFlecha(startX, startY, delay, rangoX) {
            const flecha = this.physics.add.sprite(startX, startY, 'frame1').setScale(2).setVisible(false);
            flecha.play('flechas');
            flecha.setVelocityX(200);
            flecha.rangoX = rangoX;
            flecha.posicionInicial = { x: startX, y: startY };
            flecha.delay = delay;
            flecha.yaColisiono = false;
            this.flechas.push(flecha); //Añadimos la flecha al array

            this.physics.add.collider(flecha, this.sighttail, () => {
                this.handleFlechaCollision('Sighttail', flecha);
            });

            this.physics.add.collider(flecha, this.scentpaw, () => {
                this.handleFlechaCollision('Scentpaw', flecha);
            });

        }

        //Gestión de dialogos
        launchDialogueScene(caseId) {
            let startIndex = 0;
            let endIndex = 0;


            switch (caseId) {
                // game
                case 0: // dialogo sobre trampas
                    startIndex = 12;
                    endIndex = 14;
                    break;

                case 1: // dialogo sobre flechas
                    startIndex = 14;
                    endIndex = 16;
                    break;

                case 2: // dialogo sobre neblina
                    startIndex = 16;
                    endIndex = 18;
                    break;

                case 3: // dialogo cazador
                    startIndex = 18;
                    endIndex = 34;
                    break;

                case 5: // dialogo de la carta
                    startIndex = 34;
                    endIndex = 52;
                    break;

                default: // Caso por defecto
                    console.error("Invalid caseId provided:", caseId);
                    return;

            }

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

        update(time, delta) {
            // Only handle player movement and updates if myPlayer is initialized
            if (this.myPlayer) {
                this.handlePlayerMovement(); // Handles local player movement and animation
                this.handlePositionUpdates(); // Handles sending position updates to the server
                //this.handlePowers(); // Handles player abilities
                this.cameras.main.startFollow(this.myPlayer);

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
        }/*
//Comprueba la dirección de los personajes y los estados de los gases y las flechas
update() {

    this.controlsManager.handlePlayerMovement(
        this.sighttail,
        this.controlsManager.controls1,
        'Sighttail',
    );

    this.controlsManager.handlePlayerMovement(
        this.scentpaw,
        this.controlsManager.controls2,
        'Scentpaw',
    );

    //Movimiento de las flechas
    this.flechas.forEach((flecha) => {
        if (flecha.x >= flecha.rangoX.maxX) {
            flecha.setVelocityX(0);
            flecha.stop('flechas');

            // Retrasar el reinicio usando el delay almacenado
            this.time.delayedCall(flecha.delay, () => {
                flecha.setPosition(flecha.posicionInicial.x, flecha.posicionInicial.y);

                flecha.play('flechas');
                flecha.setVelocityX(200); // Reinicia el movimiento
            });
        }
    });

    //Si la habilidad de la vista está activa se muestran las flechas
    if (this.vistaDisp && this.controlsManager.controls1.keys.power.isDown) {
        console.log("Jugador 1 usó poder");
        this.vistaDisp = false;
        this.flechas.forEach(flecha => {
            flecha.setVisible(true);
        });

        this.capaV.setVisible(true);

        //logica del timer 
        this.time.delayedCall(this.durVista, () => {
            this.flechas.forEach(flecha => {
                flecha.setVisible(false);
            });

        });

        this.time.delayedCall(this.cargaVista, () => {
            this.vistaDisp = true;
            this.capaV.setVisible(false);
            console.log("vista disponible");
        });
    }

    //Si la habilidad de olfato está activa se muestran los gases
    if (this.olfatoDisp && this.controlsManager.controls2.keys.power.isDown) {
        console.log("Jugador 2 usó poder");
        this.olfatoDisp = false;
        this.gas.forEach(gas => {
            gas.setVisible(true);
        });

        this.capaO.setVisible(true);

        this.time.delayedCall(this.durOlfato, () => {
            this.gas.forEach(gas => {
                gas.setVisible(false);
            });
        });

        this.time.delayedCall(this.cargaOlfato, () => {
            this.olfatoDisp = true;
            this.capaO.setVisible(false);
            console.log("olfato disponible");
        });

    }

    this.checkCazadorCollision(this.sighttail, 'Sighttail');
    this.checkCazadorCollision(this.scentpaw, 'Scentpaw');
    // Centrar cámara entre los dos jugadores
    const centerjX = (this.sighttail.x + this.scentpaw.x) / 2;
    const centerjY = (this.sighttail.y + this.scentpaw.y) / 2;
    this.cameras.main.centerOn(centerjX, centerjY);
}*/



    }

window.GameScene = GameScene;
