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

        if(!this.userId){
            this.connectUser();
        } else {
            this.startHeartbeat();
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
        if (!this.userName) {
            alert("No se encontró nombre de usuario. Inicia sesión primero.");
            return;
        }

        const message = this.chatInput.val().trim();
        if (!message) return;

        $.ajax({
            url: "/api/chat",
            type: "POST",
            data: {
                message: message,
                userName: this.userName
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
        if(!this.userId) return;

        $.get("/api/chat/activeClients", {userId: this.userId})
            .done((data) => {
                this.userCount.text(`Usuarios conectados: ${data}`);
            })
            .fail((error) => console.error('Error al obtener usuarios conectados:', error));
    }

    connectUser() {
        $.ajax({
            url: "/api/chat/connect",
            type: "POST",
            contentType: "application/json",
            success: (data) => {
                this.userId = data;
                localStorage.setItem('chatUserId', this.userId);
                console.log(`Conectado con ID: ${this.userId}`);
                this.startHeartbeat();
            },
            error: (error) => {
                console.error("Error de conexión:", error.responseJSON || error);
                alert("Error al conectar al chat. Recarga la página.");
            }
        });
    }

    disconnectUser() {
        if(this.userId){
            $.post("/api/chat/disconnect", {userId: this.userId})
                .done((updatedCount)=>{
                    this.userCount.text(`Usuarios conectados: ${updatedCount}`);
                })
                .fail((error)=> console.error('Error al desconectar el usuario: ', error));
        }
    }

    startHeartbeat(){
        setInterval(()=>{
            this.sendHeartbeat();
        }, 3000); // cada 3 segundos
    }

    sendHeartbeat(){
        if(this.userId){
            $.post("/api/chat/heartbeat", {userId: this.userId})
            .fail((error)=>console.error('Error en el heartbeat:', error));
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
    const chatManager = new ChatManager();

    $(window).on('beforeunload', ()=>{
        chatManager.disconnectUser();
    });
});

