export default class ChatManager {
    constructor() {
        this.chatContainer = $('#chat-container');
        this.chatMessages = $('#chat-messages');
        this.chatInput = $('#chat-input');
        this.chatSend = $('#chat-send');
        this.userCount = $('#users-count');

        this.lastMessageId = 0;
        this.userId = localStorage.getItem('chatUserId');
        this.userName = localStorage.getItem('userName');

        if (this.userName) {
            this.connectUser();
        } else {
            console.warn("Usuario no logueado. No se inicializa el chat");
        }

        // Listeners
        this.chatSend.on('click', () => this.sendMessage());
        this.chatInput.on('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });


        this.startFetchingMessages();
        this.startFetchingUsers();
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
            },
            error: (error) => {
                console.error("Error enviando mensaje:", error.responseJSON || error);
                alert("Error al enviar mensaje. Intenta nuevamente.");
            }
        });
    }



    fetchMessages() {
        $.get("/api/chat", { since: this.lastMessageId })
            .done((data) => {
                if (data.messages && data.messages.length > 0) {
                    data.messages.forEach((msg) => {
                        this.chatMessages.append(`<div>${msg.userName}:${msg.text}</div>`);
                    });
                    this.chatMessages.scrollTop(this.chatMessages.prop('scrollHeight'));
                    this.lastMessageId = data.timestamp;
                }
            })
            .fail((error) => console.error('Error al obtener los mensajes:', error));
    }

    fetchConnectedUsers() {
        if (!this.userId) return;

        $.get("/api/chat/activeClients", { userId: this.userId })
            .done((data) => {
                $('#users-count').text(`Usuarios conectados: ${data}`);
            })
            .fail((error) => console.error('Error al obtener usuarios conectados:', error));
    }

    connectUser() {
        $.post(`/api/chat/connect?nombre=${encodeURIComponent(this.userName)}`)
            .done((data) => {
                this.userId = data; // guardar userId asignado por servidor
                localStorage.setItem('chatUserId', this.userId);
                console.log(`Usuario conectado con nombre: ${this.userName} y ID: ${this.userId}`);

                this.fetchConnectedUsers();  // <-- Actualizamos el contador de usuarios
                this.startHeartbeat();       // iniciar heartbeat
            })

            .fail((error) => {
                console.error('Error al conectar usuario: ', error);
            });
    }

    disconnectUser() {
        if (this.userId) {
            $.post("/api/chat/disconnect", { userId: this.userId })
                .done((updatedCount) => {
                    this.userCount.text(`Usuarios conectados: ${updatedCount}`);
                })
                .fail((error) => console.error('Error al desconectar el usuario: ', error));
        }
    }

    startHeartbeat() {
        setInterval(() => {
            this.sendHeartbeat();
        }, 3000); // cada 3 segundos
    }

    sendHeartbeat() {
        if (this.userId) {
            $.post("/api/chat/heartbeat", { userId: this.userId })
                .fail((error) => console.error('Error en el heartbeat:', error));
        }
    }

    startFetchingMessages() {
        setInterval(() => this.fetchMessages(), 2000);
    }

    startFetchingUsers() {
        setInterval(() => this.fetchConnectedUsers(), 2000);
    }
}

$(document).ready(() => {
    const nombre = localStorage.getItem("usuarioNombre");

    if (nombre && nombre !== "Anónimo") {
        const chatManager = new ChatManager();
        $(window).on('beforeunload', () => {
            chatManager.disconnectUser();
        });
    } else {
        console.warn("Usuario no logueado. No se inicializa el chat.");
    }
});
