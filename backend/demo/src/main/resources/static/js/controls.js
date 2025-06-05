class ControlScene extends Phaser.Scene{
    constructor(){
        super({key: 'ControlScene'});
    }

    preload() {
        //carga de audios
        this.load.audio("button", 'assets/Clickar_Boton.wav');
        


        // carga de imagenes
        this.load.image("fondoC", 'assets/backgroundcontrol.png');
        this.load.image("volverB", 'assets/backbutton.png');
        this.load.image("sighttailE", 'assets/SightailDialogue.png');
        this.load.image("scentpawE", 'assets/ScentpawDialogue.png');
        this.load.image("control1", 'assets/Controles_awse.png');
        this.load.image("control2", 'assets/Controles_flechas.png');
        this.load.image("vision", 'assets/Supervision.png');
        this.load.image("olfato", 'assets/Superolfato.png');
        
        

    }

    create(){
        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width/2;
        const centerY = this.scale.height/2;
       
        //Ponemos el fondo
        const fonfoC = this.add.image(centerX, centerY, "fondoC");


        //Botón para volver al menú de pausa
        const volverB = this.add.image(0.2*centerX, 1.7*centerY, "volverB")
        .setInteractive()
        .on('pointerdown', ()=>{
            this.scene.stop("ControlScene");
            if (this.callingScene) {
                this.scene.stop();//Detiene la escena
                this.returnToCallingScene();//Llama a un método para volver a la escena anterior
        }
            this.sound.play("button");
        } );
        
        //Escalamos el botón
        volverB.setScale(0.3);

        // imagenes de los ratones con sus respectivos controles de teclado
        const sighttailAsset = this.add.image(0.5*centerX,0.6*centerY, "sighttailE");
        sighttailAsset.setScale(0.4);
        const control1 = this.add.image(0.7*centerX, 0.8*centerY, "control1");
        control1.setScale(1.2);    
        const scentpawAsset = this.add.image(1.4*centerX, 0.6*centerY,"scentpawE" );
        scentpawAsset.setScale(-0.45, 0.45);
        const control2 = this.add.image(1.5*centerX, 0.9*centerY, "control2");
        control2.setScale(1.2);       
        const vision = this.add.image(0.7*centerX, 1.2*centerY, "vision").setScale(3);
        const olfato = this.add.image(1.5*centerX, 1.2*centerY, "olfato").setScale(3);

        //Se guarda la escena que fué pausada para cambiar a esta interfaz
        this.callingScene = this.scene.settings.data?.callingScene || null;
    }

    //funcion para manejar la llamada entre distintas escenas
    returnToCallingScene() {
        if (this.callingScene) {
            this.scene.stop(); 
            this.scene.resume(this.callingScene); 
        } else {
            console.error("No callingScene provided");
        }
    }
    
}