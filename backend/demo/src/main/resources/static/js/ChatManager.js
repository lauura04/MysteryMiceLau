export default class ChatManager {
    constructor() {
        this.chatContainer = $('#chat-container');
        this.chatMessages = $('#chat-messages');
        this.chatInput = $('#chat-input');
        this.chatSend = $('#chat-send');
        this.userCount = $('#users-count');

        this.lastMessageId = 0;
        this.userId = localStorage.getItem('chatUserId');
        this.userName = localStorage.getItem('usuarioNombre');

        // Elementos del estado de conexión
        this.connectionStatus = $('#connection-status');
        this.isConnected = false;
        this.reconnectTimeout = null; // Para almacenar el timeout de los intentos de reconexión

        if (this.userName) {
            this.connectUser(); // Intentar conectar al usuario al iniciar
            this.startFetchingMessages();
            this.startFetchingUsers();
        } else {
            console.warn("Usuario no logueado. No se inicializa el chat");
            this.setConnectionMessage(false, "No has iniciado sesión. El chat no está disponible."); // Informar al usuario
            this.chatInput.prop('disabled', true); // Deshabilitar el input y el botón
            this.chatSend.prop('disabled', true);
        }

        // Listeners
        this.chatSend.on('click', () => this.sendMessage());
        this.chatInput.on('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    setConnectionMessage(isConnected, message = '') {
        this.isConnected = isConnected;
        if (isConnected) {
            this.connectionStatus.text('Conectado').css({
                'background-color': '#4CAF50',
                'color': 'white'
            });
            clearTimeout(this.reconnectTimeout); // Limpiar cualquier intento de reconexión pendiente
            this.reconnectTimeout = null; // Resetear la variable del timeout
        } else {
            this.connectionStatus.text(message || 'Conexión perdida. Intentando reconectar...').css({
                'background-color': '#f44336',
                'color': 'white'
            });
            // Iniciar intentos de reconexión si no se están realizando ya
            if (this.userName && !this.reconnectTimeout) {
                this.reconnectTimeout = setTimeout(() => this.tryReconnect(), 5000);
            }
        }
    }

    tryReconnect() {
        if (!this.isConnected && this.userName) {
            console.log("Intentando reconectar...");
            $.post(`/api/chat/connect?nombre=${encodeURIComponent(this.userName)}`)
                .done((data) => {
                    this.userId = data;
                    localStorage.setItem('chatUserId', this.userId); // Guardar el nuevo userId por si cambió
                    this.setConnectionMessage(true);
                    this.fetchMessages(); // Recuperar mensajes perdidos
                    this.fetchConnectedUsers(); // Actualizar el conteo de usuarios
                    this.startHeartbeat(); // Reiniciar el heartbeat
                    this.chatInput.prop('disabled', false); // Habilitar el input y el botón
                    this.chatSend.prop('disabled', false);
                })
                .fail(() => {
                    console.error("Fallo al reconectar. Reintentando en 5 segundos...");
                    this.reconnectTimeout = setTimeout(() => this.tryReconnect(), 5000);
                });
        } else if (!this.userName) {
            this.setConnectionMessage(false, "No has iniciado sesión. El chat no está disponible.");
        }
    }

    sendMessage() {
        if (!this.userId) {
            alert("No se encontró el ID del usuario. Inicia sesión primero.");
            return;
        }

        const message = this.chatInput.val().trim();
        if (!message) return;

        $.ajax({
            url: "/api/chat",
            type: "POST",
            data: {
                message: message,
                userId: this.userId
            },
            success: () => {
                this.chatInput.val('');
                this.fetchMessages();
                this.setConnectionMessage(true); // Confirmar que la conexión está activa después de enviar
            },
            error: (error) => {
                console.error("Error enviando mensaje:", error.responseJSON || error);
                alert("Error al enviar mensaje. Intenta nuevamente.");
                this.setConnectionMessage(false); // Indicar pérdida de conexión
            }
        });
    }

    fetchMessages() {
        if (!this.userId) return; // Evitar obtener mensajes si no está conectado

        $.get("/api/chat", { since: this.lastMessageId })
            .done((data) => {
                if (!this.isConnected) { // Si se ha reconectado, actualizar el estado
                    this.setConnectionMessage(true);
                }
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach((msg) => {
                        this.chatMessages.append(`<div><b>${msg.userName}</b>: ${msg.text}</div>`);
                    });
                    this.chatMessages.scrollTop(this.chatMessages.prop('scrollHeight'));
                    this.lastMessageId = data.timestamp;
                }
            })
            .fail((error) => {
                console.error('Error al obtener los mensajes:', error);
                this.setConnectionMessage(false); // Indicar pérdida de conexión
            });
    }

    fetchConnectedUsers() {
        if (!this.userId) return; // Evitar obtener usuarios si no está conectado

        $.get("/api/chat/activeClients", { userId: this.userId })
            .done((data) => {
                $('#users-count').text(`Usuarios conectados: ${data}`);
                if (!this.isConnected) { // Si se ha reconectado, actualizar el estado
                    this.setConnectionMessage(true);
                }
            })
            .fail((error) => {
                console.error('Error al obtener usuarios conectados:', error);
                this.setConnectionMessage(false); // Indicar pérdida de conexión
            });
    }

    connectUser() {
        $.post(`/api/chat/connect?nombre=${encodeURIComponent(this.userName)}`)
            .done((data) => {
                this.userId = data; // Guardar el userId asignado por el servidor
                localStorage.setItem('chatUserId', this.userId);
                this.setConnectionMessage(true);
                console.log(`Usuario conectado con nombre: ${this.userName} y ID: ${this.userId}`);

                this.fetchConnectedUsers(); // Actualizar el conteo de usuarios
                this.startHeartbeat(); // Iniciar heartbeat
                this.chatInput.prop('disabled', false); // Habilitar input y botón
                this.chatSend.prop('disabled', false);
            })
            .fail((error) => {
                console.error('Error al conectar usuario: ', error);
                this.setConnectionMessage(false, "No se pudo conectar al chat. Intentando reconectar...");
            });
    }

    disconnectUser() {
        if (this.userId) {
            $.post("/api/chat/disconnect", { userId: this.userId })
                .done((updatedCount) => {
                    this.userCount.text(`Usuarios conectados: ${updatedCount}`);
                    localStorage.removeItem('chatUserId'); // Limpiar el ID de usuario al desconectar
                    this.userId = null; // Limpiar userId en la instancia
                    this.setConnectionMessage(false, "Desconectado del chat.");
                })
                .fail((error) => console.error('Error al desconectar el usuario: ', error));
        }
    }

    startHeartbeat() {
        // Limpiar intervalo previo para evitar múltiples heartbeats
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 3000); // cada 3 segundos
    }

    sendHeartbeat() {
        if (this.userId) {
            $.post("/api/chat/heartbeat", { userId: this.userId })
                .done(() => {
                    if (!this.isConnected) { // Si se ha reconectado, actualizar el estado
                        this.setConnectionMessage(true);
                    }
                })
                .fail(() => this.setConnectionMessage(false)); // Indicar pérdida de conexión
        }
    }

    startFetchingMessages() {
        // Limpiar intervalo previo para evitar múltiples fetches
        if (this.messageFetchInterval) {
            clearInterval(this.messageFetchInterval);
        }
        this.messageFetchInterval = setInterval(() => this.fetchMessages(), 2000);
    }

    startFetchingUsers() {
        // Limpiar intervalo previo para evitar múltiples fetches
        if (this.userFetchInterval) {
            clearInterval(this.userFetchInterval);
        }
        this.userFetchInterval = setInterval(() => this.fetchConnectedUsers(), 2000);
    }
}