class CreditScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CreditScene' });
    }

    preload() {
        //carga de audio
        this.load.audio("button", 'assets/Clickar_Boton.wav')

        // carga de imagenes
        this.load.image("fondoCr", 'assets/backgroundcontrol.png');
        this.load.image("volverCr", 'assets/backbutton.png');
        this.load.image("creditos", 'assets/créditos.png');
        this.load.image("hoja", 'assets/rat.png');

    }

    create() {
        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        //Fondo
        const fondoCr = this.add.image(centerX, centerY, "fondoCr");

        //Hojas
        const creditos = this.add.image(0.95 * centerX, 0.4 * centerY, "creditos");
        const hoja1 = this.add.image(0.35 * centerX, centerY, "hoja");
        const hoja2 = this.add.image(0.95 * centerX, 1.35 * centerY, "hoja");
        const hoja3 = this.add.image(1.55 * centerX, centerY, "hoja");

        //Textos de los créditos
        const dA = this.add.text(0.23 * centerX, 0.6 * centerY, 'Arte 2D', {
            font: '65px mousy',
            color: '#42240e',
            align: 'center'

        })
        const mari = this.add.text(0.15 * centerX, 0.85 * centerY, 'María de Andrés Jarandilla', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })

        const dav = this.add.text(0.15 * centerX, centerY, 'David del Castillo Enríquez', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'
        })

        const prog = this.add.text(1.37 * centerX, 0.6 * centerY, 'Programación', {
            font: '65px mousy',
            color: '#42240e',
            align: 'center'

        })

        const mari2 = this.add.text(1.35 * centerX, 0.85 * centerY, 'María de Andrés Jarandilla', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })

        const dav2 = this.add.text(1.36 * centerX, centerY, 'David del Castillo Enríquez', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'
        })

        const dan3 = this.add.text(1.38 * centerX, 1.15 * centerY, 'Daniel Duque Rodríguez', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })

        const lau = this.add.text(1.38 * centerX, 1.3 * centerY, 'Laura Facenda Estrella', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })

        const son= this.add.text(0.75*centerX,0.95*centerY, 'Sfx y guion', {
            font: '65px mousy',
            color: '#42240e',
            align: 'center'

        })

        const dan = this.add.text(0.77 * centerX, 1.15 * centerY, 'Daniel Duque Rodríguez', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })

        const gam= this.add.text(0.77*centerX,1.35*centerY, 'Game Design', {
            font: '65px mousy',
            color: '#42240e',
            align: 'center'

        })

        const dan2=this.add.text(0.77*centerX,1.55*centerY, 'Laura Facenda Estrella', {
            font: '35px mousy',
            color: '#42240e',
            align: 'center'

        })


        //Botón para volver a la escena anterior
        const volverCr = this.add.image(0.2 * centerX, 1.7 * centerY, "volverCr")
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.stop("CreditScene");//Detiene la escena
                this.returnToCallingScene();//Llama a un método para volver a la escena anterior
                this.sound.play("button");
            });

        volverCr.setScale(0.3);
        
        //Se guarda la escena que fué pausada para cambiar a esta interfaz
        this.callingScene = this.scene.settings.data?.callingScene || null;
    }

    //función para manejar la llamada entre distintas escenas
    returnToCallingScene() {
        if (this.callingScene) {
            this.scene.stop(); // Detén la escena de controles
            this.scene.resume(this.callingScene); // Reanuda la escena parada
        } else {
            console.error("No callingScene provided");
        }
    }
}