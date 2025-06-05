class DialogueScene extends Phaser.Scene {
        constructor() {
                super({ key: 'DialogueScene' });
        }

        //se va a ir llamando a las funciones de forma paralela -> sin fondo

        preload() {
                //Prepara las imagenes para los dialogos
                this.load.image("scentpaw", 'assets/ScentpawDialogue.png');
                this.load.image("sighttail", 'assets/SightailDialogue.png');
                this.load.image("cazador", 'assets/cazador.png');
                this.load.image("nameIm", 'assets/Dialogo_nombre.png');
                this.load.image("dialog", 'assets/Dialogo_dcha.png');

        }

        create() {
                //variables para meter las imagenes a posteriori
                this.centerX = this.scale.width / 2;
                this.centerY = this.scale.height / 2;

                //variables de las imagenes
                this.scentpaw = this.add.image(1.45 * this.centerX, 1.2 * this.centerY, "scentpaw").setScale(0.8);
                this.sighttail = this.add.image(0.5 * this.centerX, 1.2 * this.centerY, "sighttail").setScale(0.8);
                this.cazador = this.add.image(1.45 * this.centerX, 1.2 * this.centerY, "cazador").setVisible(false).setScale(0.8);
                this.rectDialogue = this.add.image(this.centerX, 1.2 * this.centerY, "dialog").setScale(-0.8, 0.8);
                this.rectName = this.add.image(this.centerX, 1.1 * this.centerY, "nameIm");

                //variables de texto
                this.nameText = this.add.text(0.289 * this.centerX, 1.457 * this.centerY, "Sighttail", {
                        font: '50px mousy',
                        color: '#FFFFFF',
                        align: 'center'
                }).setOrigin(0, 0);

                this.dialogueText = this.add.text(0.4 * this.centerX, 1.605 * this.centerY, "", {
                        font: '45px mousy',
                        color: '#FFFFFF',
                        wordWrap: { width: this.centerX + 150 },

                }).setOrigin(0, 0);

                //contenido de los dialogos
                this.dialogueData = [
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿Sabes, Scentpaw? No puedo dejar de pensar en por qué este lugar en concreto es tan importante para nuestra investigación.",
                                side: "left",

                        },
                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "A esta cripta se la relaciona con los primeros asentamientos de VillaCheddar.",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Es el epicentro de las energías que he estado rastreando desde hace semanas. Todas las señales apuntan a este lugar.",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Tiene lógica, pero... hay algo que me da mala espina. Jamás he oído a nadie en VillaCheddar hablar de ella.",
                                side: "left",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Apenas queda rastro de su existencia en los mapas del pueblo. ¿Por qué alguien querría mantener este lugar en secreto?",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Quizá porque aquí ocurrió algo que nadie quiere recordar.",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Entonces más nos vale estar preparados. Algo me dice que aquí hay algo más que simples piedras y huesos.",
                                side: "left",
                        },

                        // dialogo de la puerta
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Está cerrada... parece que alguien no quiere visitas.",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Perfecto, cuanto más raro, más cerca estamos de descubrir la verdad.",
                                side: "rigth",
                        },

                        //dialogo de agujero
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¡Aquí hay algo! Parece un hueco lo suficientemente grande para que pasemos.",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Bien visto. Aunque… esto me huele aún peor de lo que esperaba. Prepárate, seguro que no será un camino de rosas.",
                                side: "rigth",
                        },
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: " ¿Y cuándo lo es? Vamos, Scentpaw.",
                                side: "left",
                        },

                        //dialogo sobre trampas
                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Cuidado, Sighttail, no podemos bajar la guardia. Este lugar huele a maldad… algo no está bien aquí, puede que haya trampas.",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Lo sé. No me gusta esto. Noto algo en el aire… y las paredes… parece que nos están observando. Mantente alerta.",
                                side: "left",
                        },

                        // dialogo sobre flechas
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¡Espera! Veo algo… hay un brillo en las paredes.",
                                side: "left",
                        },
                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Sí, lo huelo también. Es como si estas flechas estuvieran hechas de puro odio. Tenemos que movernos rápido, pero con cuidado.",
                                side: "rigth",
                        },

                        //dialogo sobre neblina
                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "¡Para! Hay algo en el aire… es esa maldita niebla. Está por todas partes.",
                                side: "rigth",
                        },
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Ya lo veo. Vamos, buscaré un camino alternativo. No podemos quedarnos aquí por mucho tiempo.",
                                side: "left",
                        },

                        // dialogo con cazador
                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "¿Quién osa perturbar mi descanso eterno? ¿Sois enviados de ese maldito traidor?",
                                side: "right",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿Quién... quién eres tú? ¿Eres el espíritu que habita esta cripta?",
                                side: "left",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Soy más que un simple espíritu, pequeñajo. Fui un cazador, y de los buenos, uno de los mejores de VillaCheddar.",
                                side: "right",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Tu energía es fuerte, más que la de otros fantasmas que hemos encontrado. ¿Por qué sigues aquí, atrapado?",
                                side: "rigth",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Porque fui traicionado. Mi muerte no fue un simple accidente, sino un acto deliberado de un cobarde que me temía.",
                                side: "right",
                        },
                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Yo protegía este pueblo de fantasmas bajo las ordenes de nuestra alcaldesa, pero mi lealtad fue pagada con una daga en la espalda.",
                                side: "right",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿Traicionado? ¿Quién te hizo esto?",
                                side: "left",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Alguien con un ansia de poder inimaginable... Recuerdo vagamente una figura... ",
                                side: "right",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Quizá era alguien que temía lo que sabía… o lo que podía descubrir.",
                                side: "right",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Entonces, si fue una conspiración, tal vez tenga que ver con los fantasmas que están causando el caos en el pueblo.",
                                side: "rigth",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Es posible. Algo oscuro ha caído sobre VillaCheddar. Las energías que percibo no son normales...",
                                side: "right",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: " Alguien o algo está usando el dolor y la ira de las almas para un propósito mayor.",
                                side: "right",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Nuestros padres también investigaban algo relacionado con las viejas tradiciones y los fantasmas antes de morir.",
                                side: "left",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Los secretos que guarda esta cripta podrían aclarar muchas cosas. Quizá aquí encontréis las respuestas.",
                                side: "right",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Gracias por tu ayuda. Prometemos averiguar que está pasando y hacer justicia por lo que te hicieron.",
                                side: "left",
                        },

                        {
                                character: "cazador",
                                name: "Cazador",
                                text: "Os deseo suerte, jóvenes. Quizás vuestra valentía sea lo que finalmente traiga la paz que este lugar ha perdido.",
                                side: "right",
                        },

                        // dialogo de la carta
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Scentpaw, aquí... Parece una carta vieja.",
                                side: "left",
                        },
                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Déjame ver... La tinta está descolorida, pero todavía es legible. Esta letra… ¡Es de papá!",
                                side: "rigth",
                        },
                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿De papá? No puede ser... Entonces, estuvieron aquí antes que nosotros. ¿Qué dice?",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Queridos Sighttail y Scentpaw, si estáis leyendo esto, significa que nuestra investigación nos ha llevado demasiado lejos",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: " y no hemos tenido más opción que dejar esta advertencia para vosotros. Los fantasmas que atormentan el pueblo no son simples almas perdidas.",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: " Son víctimas de un antiguo ritual. Una figura en las sombras controla a estos seres cuando llega la medianoche y hasta que sale el sol,",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: " canalizando el dolor y la ira, y extrayendo su energía para alimentar su conexión con el plano espiritual.",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿Una figura en las sombras? ¿Se refiere a la misma persona que mencionó el cazador? Todo empieza a encajar.",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "‘Tras mucho tiempo de investigación, hemos descubierto que quién está detrás de todo esto es… la propia alcaldesa de VillaCheddar.’",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "¿Qué? ¿La alcaldesa? ¡No puede ser! Dijo que necesitaba nuestra ayuda.",
                                side: "left",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "Pero... ¿por qué alguien atormentaría a su propio pueblo?",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "‘Según hemos logrado descubrir, la alcadesa es descendiente de una familia de antiguos ocultistas.",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Es una persona corrompida por su ambición, y gracias al control de los fantasmas elimina a cualquiera que amenace su puesto de poder.",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Si no podemos detener lo que se avecina, al menos esperamos que vosotros podáis hacerlo. Os queremos...’",
                                side: "rigth",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: "No quiero creerlo, pero todo encaja. Nos mandó investigar para que no sopechasemos de ella, al igual que al cazador.",
                                side: "left",
                        },

                        {
                                character: "sighttail",
                                name: "Sighttail",
                                text: " Entonces papá y mamá descubrieron la verdad y... fueron asesinados por los fantasmas de la alcaldesa.",
                                side: "left",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Hay que detenerla antes que acabemos como ellos. Por mamá y papá. Y por VillaCheddar.",
                                side: "rigth",
                        },

                        {
                                character: "scentpaw",
                                name: "Scentpaw",
                                text: "Aún no es medianoche, vamos a por ella antes de que se entere de que la hemos decubierto. Papá, mamá, lo conseguimos...",
                                side: "rigth",
                        },

                ];

                // variables para gestionar el comienzo y fin de cada uno de los dialogoso
                const startIndex = this.scene.settings.data?.startIndex || 0; //Dialogo inicial
                const endIndex = this.scene.settings.data?.endIndex || 0; //Dialogo final
                this.currentDialogueIndex = startIndex; //Se actualiza el dialogo que se muestra
                this.endIndex = endIndex;//Se actualiza el dialogo final
                this.callingScene = this.scene.settings.data?.callingScene || null;//Se guarda la escena pausada
                this.updateDialogue();//Llama a la función para actualizar el dialogo
                this.primerDialCaz = true;

                //Si se hace click se salta al siguiente dialogo
                this.input.on('pointerdown', () => {
                        this.nextDialogue();
                });

                // letras que skipean dialogo -> de cada raton
                this.input.keyboard.on('keydown-SPACE', () => {
                        this.nextDialogue();
                });
                this.input.keyboard.on('keydown-E', () => {
                        this.nextDialogue();
                });


        }

        updateDialogue() {

                //maneja la posicion de cada elemento y la actualizacion de los mismos en funcion de en que dialogo se encuentre
                const dialogue = this.dialogueData[this.currentDialogueIndex];
                if (this.currentDialogueIndex < 18 || this.currentDialogueIndex>=34) {
                        if (dialogue.side === 'left') {
                                this.rectDialogue.setScale(-0.8, 0.8);
                                this.rectName.setPosition(this.centerX, 1.1 * this.centerY, "nameIm");
                                this.nameText.setPosition(0.289 * this.centerX, 1.457 * this.centerY).setText("Sighttail");
                        }
                        else {
                                this.scentpaw.setPosition(1.45 * this.centerX, 1.2 * this.centerY).setScale(0.8);
                                this.rectDialogue.setScale(0.8);
                                this.rectName.setPosition(2.25 * this.centerX, 1.1 * this.centerY, "nameIm");
                                this.nameText.setPosition(1.52 * this.centerX, 1.457 * this.centerY).setText("Scentpaw");
                        }
                }

                else if(this.currentDialogueIndex<34){
                        
                        if (dialogue.character === 'sighttail') {
                                this.scentpaw.setVisible(false);
                                this.sighttail.setVisible(true);
                                this.rectDialogue.setScale(-0.8, 0.8);
                                this.rectName.setPosition(this.centerX, 1.1 * this.centerY, "nameIm");
                                this.nameText.setPosition(0.289 * this.centerX, 1.457 * this.centerY).setText("Sighttail");
                        }
                        else if(dialogue.character === 'scentpaw') {
                                this.sighttail.setVisible(false);
                                this.scentpaw.setVisible(true).setScale(-1,1);
                                this.scentpaw.setPosition(0.7* this.centerX, 1.2 * this.centerY);
                                this.rectDialogue.setScale(-0.8, 0.8);
                                this.rectName.setPosition(this.centerX, 1.1 * this.centerY, "nameIm");
                                this.nameText.setPosition(0.289 * this.centerX, 1.457 * this.centerY).setText("Scentpaw");
                        }

                        else if(dialogue.character === 'cazador') {
                                if(this.primerDialCaz){
                                        this.scentpaw.setVisible(false);
                                        this.primerDialCaz = false;
                                }
                                this.cazador.setVisible(true);
                                this.rectDialogue.setScale(0.8);
                                this.rectName.setPosition(2.25 * this.centerX, 1.1 * this.centerY, "nameIm");
                                this.nameText.setPosition(1.52 * this.centerX, 1.457 * this.centerY).setText("Cazador");
                        }
                }
                this.dialogueText.setText(dialogue.text);
                console.log(this.currentDialogueIndex);
                console.log(this.endIndex);
        }

        //Pasa a la siguiente posición de dialogo
        nextDialogue() {
                this.currentDialogueIndex++;

                //Si es mayor o igual que la final se acaba
                if (this.currentDialogueIndex >= this.endIndex) {
                        this.endDialogue();
                        return;
                }
                //Si no se pasa al siguiente
                if (this.currentDialogueIndex < this.dialogueData.length) {
                        this.updateDialogue();
                }
        }
        // para volver a activar la escena en la que se encontraba al acabar el dialogo
        endDialogue() {
                if (this.callingScene) {
                        this.scene.stop();
                        this.scene.resume(this.callingScene);
                } else {
                        console.error("No callingScene provided");
                }
        }
}



