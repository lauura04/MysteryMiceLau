class EndScene extends Phaser.Scene{
    constructor(){
        super({key:'EndScene'});
    }

    preload(){

        //Cargamos el periódico como imagen de fondo
        this.load.image("periodicoF", 'assets/periodico.png');
    }

    create(){

        //variables para meter las imagenes a posteriori
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        //Colocamos la imagen
        this.periodicoF = this.add.image(centerX, centerY, 'periodicoF');

        //Añadimos el texto con el mensaje final
        this.textoF = this.add.text(0.75*centerX, centerY, 'Fin... ¿O no?', {
            font: '120px mousy',
            color: '#42240e',
            align: 'center'
        });
    }
}