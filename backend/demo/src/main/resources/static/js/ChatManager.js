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

        // Solo intentar conectar si hay un nombre de usuario válido en localStorage al cargar la página
        if (this.userName && this.userName !== "Anónimo") {
            this.connectUser(); 
            this.startFetchingMessages();
            this.startFetchingUsers();
            this.chatInput.prop('disabled', false); // Habilitar el input y el botón
            this.chatSend.prop('disabled', false);
        } else {
            console.warn("Usuario no logueado o anónimo. Chat inactivo.");
            // Al cargar sin loguearse, solo muestra el estado en el div, no alerta.
            this.setConnectionMessage(false, "No has iniciado sesión. El chat no está disponible."); 
            this.chatInput.prop('disabled', true); // Deshabilitar el input y el botón
            this.chatSend.prop('disabled', true);
        }

        // Listeners
        this.chatSend.on('click', () => this.sendMessage());
        this.chatInput.on('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    /**
     * Establece el mensaje y el estado visual de la conexión.
     * Muestra un alert solo si el estado cambia a desconectado.
     * @param {boolean} isConnected - True si está conectado, false si no.
     * @param {string} [message=''] - Mensaje opcional para el estado de conexión.
     */
    setConnectionMessage(isConnected, message = '') {
        const wasConnected = this.isConnected; 
        this.isConnected = isConnected;

        if (isConnected) {
            this.connectionStatus.text('Conectado').css({
                'background-color': '#4CAF50',
                'color': 'white'
            });
            clearTimeout(this.reconnectTimeout); // Limpiar cualquier intento de reconexión pendiente
            this.reconnectTimeout = null; // Resetear la variable del timeout
            // No alert aquí al conectar
        } else {
            // El mensaje de la barra siempre es "Conexión perdida. Reintentando..."
            this.connectionStatus.text('Conexión perdida. Reintentando...').css({
                'background-color': '#f44336',
                'color': 'white'
            });
            // ALERTA solo si el estado cambió de conectado a desconectado
            // o si es un mensaje de "conexión perdida" inicial al no estar logueado
            if (wasConnected || (message && (message.includes("Conexión perdida") || message.includes("No se pudo conectar"))) ) { 
                 alert(message || 'Conexión perdida. Reintentando...'); 
            }
            // Iniciar intentos de reconexión si no se están realizando ya y hay un nombre de usuario real
            if (this.userName && this.userName !== "Anónimo" && !this.reconnectTimeout) {
                this.reconnectTimeout = setTimeout(() => this.tryReconnect(), 5000);
            }
        }
    }

    /**
     * Intenta reconectar el usuario al chat.
     */
    tryReconnect() {
        // Solo intentar reconectar si el chat no está conectado y hay un nombre de usuario válido
        if (!this.isConnected && this.userName && this.userName !== "Anónimo") { 
            console.log("Intentando reconectar...");
            $.post(`/api/chat/connect?nombre=${encodeURIComponent(this.userName)}`)
                .done((data) => {
                    this.userId = data;
                    localStorage.setItem('chatUserId', this.userId); // Guardar el nuevo userId por si cambió
                    this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
                    this.fetchMessages(); // Recuperar mensajes perdidos
                    this.fetchConnectedUsers(); // Actualizar el conteo de usuarios
                    this.startHeartbeat(); // Reiniciar el heartbeat
                    this.chatInput.prop('disabled', false); // Habilitar el input y el botón
                    this.chatSend.prop('disabled', false);
                })
                .fail((jqXHR) => { // jqXHR contiene el error y el status
                    console.error("Fallo al reconectar:", jqXHR.statusText, jqXHR.status);
                    // setConnectionMessage ya maneja la alerta y el mensaje del div
                    this.setConnectionMessage(false, "Conexión perdida. Reintentando..."); 
                    this.reconnectTimeout = setTimeout(() => this.tryReconnect(), 5000);
                });
        } else if (!this.userName || this.userName === "Anónimo") {
            this.setConnectionMessage(false, "No has iniciado sesión. El chat no está disponible.");
        }
    }

    /**
     * Envía un mensaje al chat.
     */
    sendMessage() {
        // Solo enviar mensaje si el usuario y la conexión son válidos
        if (this.userId === null || this.userId === undefined||!this.isConnected) { 
            alert("No se encontró el ID del usuario o el chat no está conectado.");
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
                this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
            },
            error: (jqXHR) => {
                console.error("Error enviando mensaje:", jqXHR.responseJSON || jqXHR.statusText || jqXHR);
                alert("Error al enviar mensaje. Conexión perdida."); // ALERTA: Error al enviar y conexión perdida
                this.setConnectionMessage(false, "Error al enviar mensaje. Conexión perdida."); // Actualiza el div
            }
        });
    }

   
    fetchMessages() {
       if (!this.userId || !this.isConnected) return; 

        $.get("/api/chat", { since: this.lastMessageId })
            .done((data) => {
                if (!this.isConnected) {
                    this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
                }
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach((msg) => {
                        this.chatMessages.append(`<div><b>${msg.userName}</b>: ${msg.text}</div>`);
                    });
                    this.chatMessages.scrollTop(this.chatMessages.prop('scrollHeight'));
                    this.lastMessageId = data.timestamp;
                }
            })
            .fail((jqXHR) => {
                console.error('Error al obtener los mensajes:', jqXHR.statusText, jqXHR.status);
                this.setConnectionMessage(false, "Conexión perdida mientras se obtenían mensajes."); // ALERTA: Conexión perdida
            });
    }

    
    fetchConnectedUsers() {
         if (!this.userId || !this.isConnected) return; 

        $.get("/api/chat/activeClients", { userId: this.userId })
            .done((data) => {
               this.userCount.text(`Usuarios conectados: ${data}`);
                if (!this.isConnected) {
                    this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
                }
            })
            .fail((jqXHR) => {
                console.error('Error al obtener usuarios conectados:', jqXHR.statusText, jqXHR.status);
                this.setConnectionMessage(false, "Conexión perdida mientras se obtenían usuarios."); // ALERTA: Conexión perdida
            });
    }

    
    connectUser() {
        if (this.userName && this.userName !== "Anónimo") { 
            $.post(`/api/chat/connect?nombre=${encodeURIComponent(this.userName)}`)
                .done((data) => {
                    this.userId = data; // Guardar el userId asignado por el servidor
                    localStorage.setItem('chatUserId', this.userId);
                    this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
                    console.log(`Usuario conectado con nombre: ${this.userName} y ID: ${this.userId}`);

                    //this.fetchConnectedUsers(); // Actualizar el conteo de usuarios
                    this.startHeartbeat(); // Iniciar heartbeat
                    this.chatInput.prop('disabled', false); // Habilitar input y botón
                    this.chatSend.prop('disabled', false);
                })
                .fail((jqXHR) => {
                    console.error('Error al conectar usuario: ', jqXHR.statusText, jqXHR.status);
                    this.setConnectionMessage(false, "No se pudo conectar al chat. Reintentando..."); // ALERTA: No se pudo conectar
                });
        } else {
            this.setConnectionMessage(false, "No has iniciado sesión. El chat no está disponible.");
        }
    }

    
    disconnectUser() {
        if (this.userId) {
            // Detener heartbeats y fetches inmediatamente al desconectar
            clearInterval(this.heartbeatInterval);
            clearInterval(this.messageFetchInterval);
            clearInterval(this.userFetchInterval);

            $.post("/api/chat/disconnect", { userId: this.userId })
                .done((updatedCount) => {
                    this.userCount.text(`Usuarios conectados: ${updatedCount}`);
                    localStorage.removeItem('chatUserId'); // Limpiar el ID de usuario al desconectar
                    this.userId = null; // Limpiar userId en la instancia
                    this.setConnectionMessage(false, "Te has desconectado del chat."); // Esto generará la alerta
                })
                .fail((jqXHR) => {
                    console.error('Error al desconectar el usuario: ', jqXHR.statusText, jqXHR.status);
                    alert("Error al intentar desconectarse del chat."); // ALERTA: Error al desconectar
                    // Si falla la desconexión, mantenemos el estado como perdido y se intentará reconectar.
                    this.setConnectionMessage(false, "Error al intentar desconectarse. Conexión perdida.");
                });
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
        if (this.userId && this.isConnected) { 
            $.post("/api/chat/heartbeat", { userId: this.userId })
                .done(() => {
                    // Si de alguna forma se marcó como desconectado y el heartbeat funciona, actualiza a conectado
                    if (!this.isConnected) {
                        this.setConnectionMessage(true); // Solo actualiza el div, no hay alerta
                    }
                })
                .fail((jqXHR) => {
                    console.error("Heartbeat fallido:", jqXHR.statusText, jqXHR.status);
                    // Si el servidor responde con 404 (NOT_FOUND), significa que el userId ya no es válido en el servidor.
                    if (jqXHR.status === 404) {
                        console.log("Heartbeat 404: El usuario no es válido en el servidor. Forzando reconexión.");
                        // Establecer isConnected a false y llamar a tryReconnect para obtener un nuevo userId
                        this.setConnectionMessage(false, "Tu sesión de chat ha expirado. Reconectando...");
                        // tryReconnect ya se llamará si isConnected es false y userName es válido
                    } else {
                        this.setConnectionMessage(false, "Conexión perdida (heartbeat fallido). Reintentando..."); // ALERTA: Heartbeat fallido
                    }
                });
        }
    }

    
    startFetchingMessages() {
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