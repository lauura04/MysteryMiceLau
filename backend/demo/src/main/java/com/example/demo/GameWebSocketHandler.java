package com.example.demo;

import org.springframework.boot.autoconfigure.couchbase.CouchbaseProperties.Io;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    // asociar ID de sesión con Player
    private final Map<String, Player> players = new ConcurrentHashMap<>();

    // múltiples instancias de Game (creo que no)
    private final Map<String, GameInstance> gameInstances = new ConcurrentHashMap<>();
    // cola de jugadores esperando a emparejarse o unirse
    private final Queue<WebSocketSession> waitingPLayers = new ConcurrentLinkedQueue<>();
    private final ObjectMapper mapper = new ObjectMapper();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1); // temporizadores de juego

    private final AtomicInteger gameIdCounter = new AtomicInteger(0); // generador de IDs para puzles/partidas si son
                                                                      // dinámicos (creo que no)

    /*
     * Representación de un jugador en el juego con su posición, identificador único
     * y sesión WebSocket
     */
    private static class Player {
        WebSocketSession session;
        String userId;
        String username;
        double x; // posicion en x
        double y; // posicion en y
        long startTime;
        int score; // creo que no seria necesario

        Player(WebSocketSession session, String userId, String username) {
            this.session = session;
            this.userId = userId;
            this.username = username;
            this.score = 0;
            this.startTime = System.currentTimeMillis();
            //las posiciones iniciales deberia pasarselas el cliente???
        }

        /*
         * Instancia de juego activa, puzle o nivel (lo mismo si es necesario para el
         * cambio entre tuto y nivel)
         */

    }

    private static class GameInstance {
        String gameId; // tengo que ver cuál sería
        List<Player> playersInGame;
        ScheduledFuture<?> gameTimerTask; // ver que cojones es
        long gameStartTime; // ????

        GameInstance(String gameId) {
            this.gameId = gameId;
            this.playersInGame = new CopyOnWriteArrayList<>();
        }

        public void addPlayer(Player player) {
            playersInGame.add(player);
        }

        public void removePlayer(Player player) {
            playersInGame.remove(player);
        }
    }

    /*
     * Manejo nuevas conexiones websocket, crear jugador y añadir a la cola
     * Obtener username y userId de atributos de la sesion que el cliente pasa
     */

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Conexión establecida: " + session.getId());

        //intentar obtener nombre de usuario de atributos de sesión --> ver cómo vergas lo modifico
        String username = (String) session.getAttributes().get("username");
        if(username==null || username.isEmpty()){
            //si no está en los atributos intenta obtenerlo del id de la sesión --> lo mismo funciona mejor?
            username = "guest-" + session.getId().substring(0,5);
            System.out.println("No se encontró el nombre de usuario");
        }

        //userId podría ser el mismo que sessionId TENGO QUE MIRARLO!!!!
        String userId = session.getId();

        Player newPlayer = new Player(session, userId, username);
        players.put(session.getId(), newPlayer);
        waitingPLayers.add(session);

        synchronized(this){
            checkAndAssignToGame(newPlayer);
        }
    }
    /*
     * verifica si hay suficientes jugadores esperando para emparejar (2 jugadores)
     */
    private synchronized void checkAndAssignToGame(Player newPlayer){
        if(waitingPLayers.size()>=2){
            WebSocketSession session1 = waitingPLayers.poll();
            WebSocketSession session2 = waitingPLayers.poll();

            if(session1 !=null && session2 != null){
                Player player1 = players.get(session1.getId());
                Player player2 = players.get(session2.getId());

                if(player1==null || player2==null){
                    System.err.println("Error: Jugador nulo al emparejar");
                    if(session1!=null) waitingPLayers.add(session1);
                    if(session2!=null) waitingPLayers.add(session2);
                    return;
                }

                String newGameId = "game- " + gameIdCounter.incrementAndGet();
                GameInstance game = new GameInstance(newGameId);
                game.addPlayer(player1);
                game.addPlayer(player2);

                gameInstances.put(session1.getId(), game);
                gameInstances.put(session2.getId(), game);

                //establecer coordenadas especificas de los jugadores
                //player1.x = 1.56*centerX;
                //player1.y = 0.2*centerY;
                //player2.x = 1.42*centerX;
                //player2.y = 0.2*centerY;
                
                startGameInstance(game);
                System.out.println("Partida " + game.gameId + " creada con " + player1.username + " y " + player2.username);
            }
        } else{
            System.out.println(newPlayer.username + " está esperando a otro jugador");
            sendToPlayer(newPlayer, "w", "Esperando a otro jugador"); //'w' para "waiting"
        }
    }

    /*
     * Inicializacion de nueva instancia dee juego
     * Envía estado inicial a todos los jugadores en esa instancia
     * Message format 'i': estado inicial del juego con posiciones de jugadores
     */

     private void startGameInstance(GameInstance game){
        game.gameStartTime = System.currentTimeMillis(); //iniciar contador

        List<Map<String, Object>> playersData = new ArrayList<>();
        for(Player p: game.playersInGame){
            playersData.add(Map.of(
                "userId", p.userId,
                "username", p.username,
                "x",p.x,
                "y", p.y,
                "score", p.score //modificar xq más que score tendría que ser el tiempo
            ));
        }
        for(Player p: game.playersInGame){
            sendToPlayer(p, "i", Map.of(
                "gameId", game.gameId,
                "players", playersData,
                "startTime", game.gameStartTime
            ));
        }

        game.gameTimerTask = scheduler.scheduleAtFixedRate(() ->{
            gameLoop(game);
        }, 0, 1, TimeUnit.SECONDS);
     }

     /*
      * Bucle principal de la instancia del juego
      Actualiza el tiempo y podría disparar eventos de puzle
      */

      private void gameLoop(GameInstance game){
        long elapsedTime = (System.currentTimeMillis() - game.gameStartTime) / 1000; //tiempo en segundos

        //enviar tiempo transcurrido
        for(Player p: game.playersInGame){
            sendToPlayer(p, "t", elapsedTime);
        }

        //logica de los puzzles --> llegar al final del juego
      }

      /*
       * Maneja mensajes entrantes de clientes
       * 'm' movimiento del jugador
       * 'a': acción del jugador --> poderes
       * 'c': mensaje de chat
       */

       @Override
       protected void handleTextMessage(WebSocketSession session, TextMessage message){
            try{
                Player currentPlayer = players.get(session.getId());
                if(currentPlayer == null){
                    System.err.println("Mensaje recibido de sesión no registrada " + session.getId());
                    return;
                }

                GameInstance game = gameInstances.get(session.getId());
                if(game==null){
                    System.err.println("Mensaje recibido de jugador sin instancia de juego");
                    //posibilidad de enviar mensaje a cliente
                    return;
                }

                String payload = message.getPayload();
                char type = payload.charAt(0);
                String data = payload.length()>1 ? payload.substring(1) : "";

                switch (type) {
                    case 'm': //movimientos del jugador
                        List<Double> pos = mapper.readValue(data, List.class);
                        currentPlayer.x = pos.get(0);
                        currentPlayer.y = pos.get(1);


                        //reenviar la posición actualizada de todos los jugadores
                        for(Player p: game.playersInGame){
                            sendToPlayer(p, "m", Arrays.asList(currentPlayer.userId, currentPlayer.username, currentPlayer.x, currentPlayer.y));
                        }

                        break;
                    
                    case 'a': //acción del jugador o poderes o interactuar
                        Map<String, Object> actionData = mapper.readValue(data, Map.class);
                        String actionType = (String) actionData.get("actionType");
                        /*
                         * ver el tema de las acciones, poderes etc 
                         */
                       
                        switch (actionType) {
                             case "interactObject":
                                String objectId = (String) actionData.get("objectId");
                                /*
                                 * lógica para interactuar con objetos
                                 */

                                 break;
                            // caso de los poderes
                        }
                        break;

                    case 'c':
                        String chatMessage = currentPlayer.username + ": " +data;
                        for(Player p: game.playersInGame){
                            sendToPlayer(p,"c", chatMessage);
                        }
                        break;
                    
                }
            } catch (IOException e){
                System.err.println("Error procesando mensaje Websocket: " + e.getMessage());
                e.printStackTrace();
            }
       }
       
       /*
        * Lógica para tema "puzzles" --> solo ver el poder en la pantalla correspondiente
        */

        private void endGame(GameInstance game){
            Map<String, Object> finalResults = new HashMap<>();
            finalResults.put("gameId", game.gameId);
            finalResults.put("finalTime", (System.currentTimeMillis()-game.gameStartTime));

            List<Map<String,Object>> playerScores = new ArrayList<>(); //solo seria una porque el tiempo es compartido
            for(Player p: game.playersInGame){
                playerScores.add(Map.of(
                    "userId", p.userId,
                    "username", p.username,
                    "score", p.score
                ));
            }
            finalResults.put("playerScores", playerScores);
            for(Player p:game.playersInGame){
                sendToPlayer(p, "o", finalResults);
            }

            //cancelar temporizador de juego
            if(game.gameTimerTask!=null){
                game.gameTimerTask.cancel(false);
            }

            //limpiar recursos de instancia de juego
            for(Player p: game.playersInGame){
                gameInstances.remove(p.session.getId()); //remover referencia 
            }
            System.out.println("Instancia de juego " + game.gameId + " terminada");

        }

        /*
         * Cierre de conexiones WebSockets
         */

         @Override
         public void afterConnectionClosed(WebSocketSession session, CloseStatus status){
            Player player = players.remove(session.getId());
            if(player==null){
                System.out.println("Sesión no encontrada al cerrar: " + session.getId());
                return;
            }

            System.out.println("Conexión cerrada para " + player.username + " (" + player.userId + "): " + status);
            waitingPLayers.remove(session);

            //si el jugador estaba en juego --> gestionar
            GameInstance game = gameInstances.get(session.getId());
            if(game != null){
                game.removePlayer(player); //eliminar al jugador de la lista

                //Si la partida es de 2 jugadores y uno se desconecta la partida debería terminara para el otro
                if(game.playersInGame.isEmpty()){
                    System.out.println("Ambos jugadores se desconectaon o el último se fue");
                    endGame(game);
                } else if(game.playersInGame.size() == 1){
                    Player remainingPlayer = game.playersInGame.get(0);
                    System.out.println("Jugador " + player.username + " se desconectó de la partida");
                    sendToPlayer(remainingPlayer, "e", "Tu compañero se ha desconectado");
                    endGame(game);
                }
            }
         }

         /*
          * Envia mensaje a jugador especifico don tipo y datos
          */
          private void sendToPlayer(Player player, String type, Object data){
            try{
                String message = type;
                if(data!=null){
                    message += mapper.writeValueAsString(data);
                }

                synchronized(player.session){
                    if(player.session.isOpen()){
                        player.session.sendMessage(new TextMessage(message));
                    }
                }
            } catch(IOException e){
                System.err.println("Error enviando mensaje a " + player.username + e.getMessage());
                e.printStackTrace();
                //desconectar a jugador si el envio falla repetidamente
                try{
                    player.session.close();
                } catch(IOException closeEx){
                    System.err.println("Error al intentar cerrar sesión fallida " + closeEx.getMessage());
                }
            }
          }

}
