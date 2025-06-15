export default class WebsSocketManger {
    constructor(gameScene) {
        this.gameScene = gameScene; //referencia a escena del juego, ya sea tutorial, game etc
        this.ws = null; //conexión websocket
        this.playerId = null;
        this.playerKey = null; // 'Sighttail' o 'Scentpaw'
    }

    connect(gameId, playerId, playerKey) {
        this.socket = new WebSocket("ws:// " + location.host + "/ws");


        this.playerId = playerId,
            this.playerKey = playerKey;

        this.ws.onopen = () => {
            console.log('Conectado al servidor WebSocket para el juego');
            this.send({ type: 'player_join', gameId: gameId, playerId: this.playerId, playerKey: this.playerKey });
        };

        this.ws.onmessage = (event) => {
            const message = event.data;

            const messageType = message.charAt(0);
            const jsonData = message.substring(1);

            try {
                const data = JSON.parse(jsonData);

                switch (messageType) {
                    case 'u': //update
                        this.handlePlayerUpdate(data);
                        break;
                    case 's': //start
                        console.log("Mensaje de inicio de partida recibido. Ambos jugadores conectados");
                        break;
                    case 'e': //error
                        console.error('Error del servidor: ', data.message);
                        break;
                    case 'd': // 'd' de door_interact_confirm: el servidor confirma la interacción de la puerta
                        console.log("Servidor confirma interacción con la puerta.");
                        if (this.gameScene && this.gameScene.handleDoorInteractionConfirmed) {
                            this.gameScene.handleDoorInteractionConfirmed(); // Llama al método de la escena
                        }
                        break;
                }
            } catch (e) {
                console.error('Error al parsear el mensaje JSON:', e, 'Mensaje: ', jsonData);
            }
        };

        this.ws.onclose = () => {
            console.log('Desconectado del servidor WebSocket');
            //reconexión o volver al menú principal 
        }

        this.ws.onerror = (error) => {
            console.error('Error del WebSocket:', error);
        };
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const jsonMessage = JSON.stringify(message);
            this.ws.send(jsonMessage);
        } else {
            console.warn('WebSocket no conetado. No se pudo enviar el mensaje:', message);
        }
    }

    //manejar actualización de la posición de un jugador
    handlePlayerUpdate(data) {
        if (this.gameScene.scene.isActive()) {
            const { playerId, x, y, anim, flipX } = data;

            let targetPlayer = null;
            if (playerId === this.playerId) {
                return;
            } else {
                targetPlayer = (this.playerKey === 'Sighttail') ? this.gameScene.scentpaw : this.gameScene.sighttail;
            }

            if (targetPlayer) {
                targetPlayer.x = x;
                targetPlayer.y = y;
                targetPlayer.anims.play(anim, true);
                targetPlayer.setFlipX(flipX);
            }
        }

    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }


}

