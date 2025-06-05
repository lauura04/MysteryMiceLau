class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    preload() {
        //Cargamos las imagenes
        this.load.image("backgroundP", 'assets/backgroundcontrol.png');
        this.load.image("reanudar", 'assets/Reanudar.png');
        this.load.image("rat1", 'assets/Rat.png');
        this.load.image("rat2", 'assets/Rat2.png');


        this.load.image("credits", 'assets/Créditos.png');

        this.load.image("salir", 'assets/VolverMenu.png');
        this.load.image("hilos", 'assets/Hilos.png');
        this.load.image("sighttailP", 'assets/SightailDialogue.png');
        this.load.image("scentpawP", 'assets/ScentpawDialogue.png');
    }

    create() {
        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        //Imagen de fondo
        const backgroundPause = this.add.image(centerX, centerY, "backgroundP");

        //Botón que te devuelve a la escena anterior 
        const reanudar = this.add.image(0.28 * centerX, 0.4 * centerY, "reanudar").setInteractive()
            .on('pointerdown', () => {
                this.scene.stop("PauseScene");//Detiene la escena
                this.returnToCallingScene();//Llama a un método para volver a la escena anterior
            });
        
        //Botón para volver al menú inicial
        const salir = this.add.image(0.4 * centerX, 0.9 * centerY, "salir").setInteractive()
            .on('pointerdown', () => {
                this.scene.stop("PauseScene");
                this.stopCallingScene();//Detiene la escena anterior
                this.scene.start("IntroScene");
            });

        //Botón que te envía a la escena de créditos
        const credits = this.add.image(0.6 * centerX, 1.5 * centerY, "credits").setInteractive()
            .on('pointerdown', () => {
                this.scene.pause("PauseScene");
                this.scene.launch('CreditScene', { callingScene: this.scene.key });
            });

        //Cargamos las imagenes de decoración
        const sighttailImg = this.add.image(1.1 * centerX, 0.9 * centerY, "rat1");
        const sighttailAs = this.add.image(1.23*centerX, 0.85*centerY, "sighttailP").setScale(0.4);

        const scentpawImg = this.add.image(1.7*centerX, centerY, "rat2");
        const scentpawAs = this.add.image(1.5*centerX, 0.95*centerY, "scentpawP").setScale(0.4);

        const hilos = this.add.image(centerX, centerY, "hilos");

        //Se guarda la escena que fué pausada para cambiar a esta interfaz
        this.callingScene = this.scene.settings.data?.callingScene || null;
    }

    //función para manejar la llamada entre distintas escenas
    returnToCallingScene() {
        if (this.callingScene) {
            this.scene.stop(); // Detén la escena de pausa
            this.scene.resume(this.callingScene); // Reanuda la escena llamante
        } else {
            console.error("No callingScene provided");
        }
    }

    //Función para detener la escena inicial que fué pausada
    stopCallingScene(){
        if(this.callingScene){
            this.scene.stop(this.callingScene);
        }
    }
}