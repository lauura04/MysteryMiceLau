class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
    }

    preload() {
        // carga de audios
        this.load.audio("boton", 'assets/Clickar_Boton.wav');
        this.load.audio("musicaFondo", 'assets/musicMenu.mp3');
        

        //carga de imágenes
        this.load.image("fondo", 'assets/menu.png');
        this.load.image("libro", 'assets/Libro.png');
        this.load.image("sombraLibro", 'assets/SombraLibro.png');
        this.load.image("periodicoM", 'assets/Menu_inicialPeri.png');
        
    }

    create() {
        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // activacion de sonidos
        if (!this.sound.get('musicaFondo')) {
            this.music = this.sound.add("musicaFondo", { loop: true, volume: 0.5 });
            this.music.play();
            this.registry.set("musicaFondo", this.music);
        } else {//Si estamos en otra escena y volvemos no se vuelve a poner la música que ya estaba, se deja como está
            this.music = this.sound.get('musicaFondo');
        }

        // montaje de la escena
        const background_menu = this.add.image(centerX, centerY, "fondo");
        // interfaz del libro
        const sombraLibro = this.add.image(0.618 * centerX, 1.2 * centerY, "sombraLibro");
        const libro = this.add.image(0.65 * centerX, 1.2 * centerY, "libro");


        //Recuadro usuario
        const containerNombre = document.getElementById('game-canvas');
        this.nombre = document.createElement('input');
        this.nombre.type= 'text';
        this.nombre.placeholder = 'Usuario';
        this.nombre.style.position= 'absolute';
        this.nombre.style.left=`${0.6*centerX}px`;
        this.nombre.style.top=`${0.45*centerY}px`;
        this.nombre.style.width= '200px';
        this.nombre.style.font= '40px mousy';
        this.nombre.style.backgroundColor = 'rgba(162, 208, 158, 0.39)';
        this.nombre.style.color='#42240e';
        containerNombre.appendChild(this.nombre);

        //Recuadro contraseña
        const containerContra = document.getElementById('game-canvas');
        this.contra = document.createElement('input');
        this.contra.type= 'password';
        this.contra.placeholder = 'Contraseña';
        this.contra.style.position= 'absolute';
        this.contra.style.left=`${0.6*centerX}px`;
        this.contra.style.top=`${0.6*centerY}px`;
        this.contra.style.width= '200px';
        this.contra.style.font= '40px mousy';
        this.contra.style.backgroundColor = 'rgba(162, 208, 158, 0.39)';
        this.contra.style.color='#42240e';
        this.contra.style.font= '40px mousy';
        containerContra.appendChild(this.contra);



        //Botón para ir al inicio
        const logText = this.add.text(0.7 * centerX, 1.15 * centerY, 'Iniciar sesion', {
            font: '70px mousy',
            color: '#42240e',
            align: 'center'
        }).setInteractive()
            .on('pointerdown', () => {
                this.login(this.nombre.value, this.contra.value);
            });

        //Botón para ir al registrarse
        const regText = this.add.text(0.7 * centerX, 1.4 * centerY, 'Registrarse', {
            font: '70px mousy',
            color: '#42240e',
            align: 'center'
        }).setInteractive()
            .on('pointerdown', () => {
                this.registrar(this.nombre.value, this.contra.value);
            });

    }

    // Función para iniciar sesión
    login(nombre, password) {
        fetch('/usuario/login', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: nombre, 
                password: password 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Inicio de sesión exitoso");

                localStorage.setItem('usuarioNombre', nombre); // Guardar nombre de usuario

                if (this.nombre) this.nombre.remove();
                if (this.contra) this.contra.remove();

                // Inicializar ChatManager aquí después de un login exitoso
                // Importante: asegúrate de que ChatManager.js esté cargado como type="module"
                if (!window.chatManagerInstance) {
                    import('./ChatManager.js').then(({ default: ChatManager }) => {
                        window.chatManagerInstance = new ChatManager();
                        // Adjuntar el listener beforeunload si no se ha hecho ya
                        $(window).on('beforeunload', () => {
                            if (window.chatManagerInstance) {
                                window.chatManagerInstance.disconnectUser();
                            }
                        });
                    });
                } else {
                    // Si ya estaba instanciado pero sin usuario (ej. en una nueva pestaña)
                    // necesitamos decirle que un usuario ha iniciado sesión.
                    window.chatManagerInstance.userName = nombre;
                    window.chatManagerInstance.connectUser(); // Forzar la reconexión con el nuevo usuario
                    window.chatManagerInstance.startFetchingMessages();
                    window.chatManagerInstance.startFetchingUsers();
                    $('#chat-input').prop('disabled', false); // Habilitar chat input
                    $('#chat-send').prop('disabled', false); // Habilitar botón de enviar chat
                }

                this.scene.stop("LoginScene");
                this.scene.start("IntroScene"); // Ir a la escena de introducción del juego
                this.sound.play("boton");
                
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(error => console.error("Error en el login:", error));
    }


    // Función para registrar usuario
    registrar(nombre, contra) {
        if (!nombre || !contra) {
            alert("Por favor completa todos los campos.");
            return;
        }
        fetch('/usuario/registro', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: nombre, password: contra })
        })
        .then(async response => {
        const data = await response.json().catch(() => ({})); 
        if (response.ok && data.success) {
            localStorage.setItem('usuarioNombre', nombre);
            alert(data.message || "Usuario registrado correctamente");
            
            if (this.nombre) this.nombre.remove();
            if (this.contra) this.contra.remove();

            // Inicializar ChatManager aquí después de un registro exitoso
            // Importante: asegúrate de que ChatManager.js esté cargado como type="module"
            if (!window.chatManagerInstance) {
                import('./ChatManager.js').then(({ default: ChatManager }) => {
                    window.chatManagerInstance = new ChatManager();
                    $(window).on('beforeunload', () => {
                        if (window.chatManagerInstance) {
                            window.chatManagerInstance.disconnectUser();
                        }
                    });
                });
            } else {
                 window.chatManagerInstance.userName = nombre;
                window.chatManagerInstance.connectUser();
                window.chatManagerInstance.startFetchingMessages();
                window.chatManagerInstance.startFetchingUsers();
                 $('#chat-input').prop('disabled', false); // Habilitar chat input
                $('#chat-send').prop('disabled', false); // Habilitar botón de enviar chat
            }

            this.scene.stop("LoginScene");
            this.scene.start("IntroScene");
            this.sound.play("boton");
        } else {
            alert("Error: " + (data.message || "No se pudo registrar"));
        }
    })
    .catch(error => {
        console.error("Error en el registro:", error);
        alert("Error al conectar con el servidor");
    });
    }
}