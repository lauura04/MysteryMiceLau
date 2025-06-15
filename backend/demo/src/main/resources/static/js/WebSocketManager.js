import { MSG_TYPES } from './WebSocketMessages.js'; // Asegúrate de que la ruta sea correcta y que MSG_TYPES esté bien definido

export default class WebsSocketManger {
    constructor(gameScene) {
        this.gameScene = gameScene; // referencia a escena del juego, ya sea tutorial, game etc
        this.ws = null; // conexión websocket
        this.playerId = null;
        this.playerKey = null; // 'Sighttail' o 'Scentpaw'
    }

    connect(gameId, playerId, playerKey) {
        this.ws = new WebSocket('ws://' + location.host + '/ws');

        // Asigna el playerId y playerKey locales inmediatamente
        this.playerId = playerId;
        this.playerKey = playerKey;

        this.ws.onopen = () => {
            console.log('Conectado al servidor WebSocket para el juego');
            // Al conectarse, envía el mensaje de unión con el gameId y los IDs del jugador
            // ¡IMPORTANTE! Ahora se pasa el tipo de mensaje como primer argumento y luego el objeto de datos
            this.send(MSG_TYPES.PLAYER_JOIN, { gameId: gameId, playerId: this.playerId, playerKey: this.playerKey });
        };

        this.ws.onmessage = (event) => {
            const message = event.data;

            // Asegúrate de que el mensaje tiene al menos un carácter para el tipo
            if (message.length < 1) {
                console.warn("Mensaje WebSocket vacío recibido.");
                return;
            }

            const messageType = message.charAt(0);
            const jsonData = message.substring(1);

            try {
                // Añade un log aquí para ver el JSON recibido en el cliente antes de parsearlo
                // console.log("CLIENTE: JSON Data recibido del servidor:", jsonData);
                const data = JSON.parse(jsonData);

                switch (messageType) {
                    case MSG_TYPES.PLAYER_UPDATE: // 'u' para actualizaciones de jugador (movimiento, etc.)
                        this.handlePlayerUpdate(data);
                        break;
                    case MSG_TYPES.GAME_START: // 's' para el inicio del juego
                        this.gameScene.startGame(
                            data.gameId,
                            data.playerId, // Esto es el ID de sesión del servidor
                            data.playerKey,
                        );
                        // Asegúrate de que el playerId y playerKey del manager ya están asignados al conectarse
                        // O actualízalos aquí si el servidor envía los "oficiales"
                        this.playerId = data.playerId; // Sobrescribe con el ID oficial del servidor si es necesario
                        this.playerKey = data.playerKey; // <-- **CORREGIDO**: Antes era this.play, ahora es this.playerKey
                        console.log("Mensaje de inicio de partida recibido. Ambos jugadores conectados");
                        break;
                    case MSG_TYPES.ERROR: // 'e' para errores del servidor
                        console.error('Error del servidor: ', data.message);
                        break;
                    case MSG_TYPES.DOOR_INTERACT_CONFIRM: // 'd' de door_interact_confirm: el servidor confirma la interacción de la puerta
                        console.log("Servidor confirma interacción con la puerta.");
                        if (this.gameScene && this.gameScene.handleDoorInteractionConfirmed) {
                            this.gameScene.handleDoorInteractionConfirmed(); // Llama al método de la escena
                        }
                        break;
                    case MSG_TYPES.AGUJERO_INTERACT_CONFIRM: // Añadir si el servidor confirma la interacción del agujero
                        console.log("Servidor confirma interacción con el agujero.");
                        if (this.gameScene && this.gameScene.launchDialogueScene) {
                            // Asumo que el servidor podría enviar qué diálogo lanzar, por ejemplo data.dialogueIndex
                            this.gameScene.launchDialogueScene(data.dialogueIndex || 2); // Ejemplo: lanza el diálogo 2 por defecto
                        }
                        break;
                    default:
                        console.warn(`Tipo de mensaje desconocido: ${messageType}`, data);
                        break;
                }
            } catch (e) {
                // Manejo de errores al parsear el JSON recibido del servidor
                console.error('CLIENTE ERROR: Error al parsear el mensaje JSON recibido del servidor:', e, 'Mensaje crudo: ', message);
            }
        };

        this.ws.onclose = () => {
            console.log('Desconectado del servidor WebSocket');
            // reconexión o volver al menú principal
        }

        this.ws.onerror = (error) => {
            console.error('Error del WebSocket:', error);
        };
    }

    // *** CAMBIO CRÍTICO AQUÍ: EL MÉTODO 'send' AHORA TOMA EL TIPO Y LOS DATOS POR SEPARADO ***
    send(typeChar, dataObject = {}) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // 1. Validar que el tipo sea un solo carácter
            if (typeof typeChar !== 'string' || typeChar.length !== 1) {
                console.error("Error: 'typeChar' debe ser un string de un solo carácter. Recibido:", typeChar);
                return;
            }

            // 2. Asegurarse de que el objeto de datos incluye el playerId
            //    Lo clonamos para no modificar el objeto original que nos pasaron
            const finalDataObject = { ...dataObject };
            if (this.playerId && finalDataObject.playerId === undefined) {
                finalDataObject.playerId = this.playerId;
            }
            // NOTA: Si el playerId ya se está pasando en dataObject (como en PLAYER_JOIN),
            // esta línea lo mantendrá. Si no está, lo añadirá. Esto es robusto.

            // 3. Convertir el objeto de datos a una cadena JSON
            const jsonString = JSON.stringify(finalDataObject);

            // 4. Concatenar el carácter de tipo al principio de la cadena JSON
            const messageToSend = typeChar + jsonString;

            console.log("CLIENTE: Enviando mensaje: ", messageToSend); // Para depurar lo que se envía
            this.ws.send(messageToSend);
        } else {
            console.warn('WebSocket no conectado. No se pudo enviar el mensaje con tipo:', typeChar, 'y datos:', dataObject);
        }
    }

    // Otros métodos auxiliares para enviar mensajes específicos (opcional, pero buena práctica)
    sendPlayerUpdate(x, y, anim, flipX) {
        this.send(MSG_TYPES.PLAYER_UPDATE, { x, y, anim, flipX });
    }

    sendDoorInteractionRequest(playerKey) {
        this.send(MSG_TYPES.DOOR_INTERACT, { playerKey }); // Asumiendo que MSG_TYPES.DOOR_INTERACT es el tipo 'd'
    }

    sendAgujeroInteractionRequest(playerKey) {
        this.send(MSG_TYPES.AGUJERO_INTERACT, { playerKey }); // Asumiendo que MSG_TYPES.AGUJERO_INTERACT es el tipo 'g'
    }

    // ... cualquier otro método de envío

    // manejar actualización de la posición de un jugador
    handlePlayerUpdate(data) {
        const { playerId, x, y, anim, flipX } = data;

        // Si el mensaje es de nuestro propio jugador, no hacemos nada porque ya lo manejamos localmente
        if (playerId === this.playerId) {
            return;
        }

        // Determina cuál es el otro jugador basado en el playerKey del jugador local
        let targetPlayer = null;
        if (this.gameScene.myPlayerKey === 'Sighttail') { // Si yo soy Sighttail, el otro es Scentpaw
            targetPlayer = this.gameScene.scentpaw;
        } else { // Si yo soy Scentpaw, el otro es Sighttail
            targetPlayer = this.gameScene.sighttail;
        }

        if (targetPlayer) {
            targetPlayer.x = x;
            targetPlayer.y = y;
            targetPlayer.anims.play(anim, true);
            targetPlayer.setFlipX(flipX);
        } else {
            console.warn("No se pudo encontrar el sprite del otro jugador para actualizar.", data);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}