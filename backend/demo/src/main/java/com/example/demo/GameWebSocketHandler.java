package com.example.demo;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {
    // Thread-safe collections for managing game state
    private final Map<String, Player> players = new ConcurrentHashMap<>();
    private final Map<String, Game> games = new ConcurrentHashMap<>(); // Mapa: sessionId del jugador -> Objeto Game
    private final Queue<WebSocketSession> waitingPlayers = new ConcurrentLinkedQueue<>();
    private final ObjectMapper mapper = new ObjectMapper(); // ObjectMapper para JSON

    /**
     * Represents a player in the game with their position, score, and WebSocket
     * session.
     */
    private static class Player {
        WebSocketSession session;
        double x;
        double y;
        int playerId;

        // Este campo no es necesario si usas session.getId() como ID
        // único
        // String playerKey; // Podrías almacenar el rol ('Sighttail', 'Scentpaw') aquí
        // también,
        // pero lo gestionamos en el cliente y en el server por game.player1/player2
        Player(WebSocketSession session) {
            this.session = session;
            this.x = 0; // Posición inicial por defecto
            this.y = 0; // Posición inicial por defecto

        }
    }

    /**
     * Represents a game session with two players and game state.
     */
    private static class Game {

        Player player1; // Sighttail
        Player player2; // Scentpaw

        // Posiciones iniciales para los jugadores en esta partida (pueden ser
        // dinámicas)
        double player1StartX = 1.56 * 400; // Ejemplo de valores calculados (basado en centro X, Y)
        double player1StartY = 0.2 * 300;
        double player2StartX = 1.42 * 400;
        double player2StartY = 0.2 * 300;

        // Banderas para el estado del tutorial (¡Nuevos campos!)
        boolean sighttailInteractedWithAgujero = false;
        boolean scentpawInteractedWithAgujero = false;
        boolean doorOpened = false;
        boolean tutorialAbilitiesActivated = false;
        boolean agujeroVisible = false;

        ScheduledFuture<?> timerTask;

        // ¡Constructor para la clase Game!
        Game(Player p1, Player p2) {
            this.player1 = p1;
            this.player2 = p2;
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        waitingPlayers.add(session);
        System.out.println("Nueva conexión WebSocket establecida: " + session.getId());
        players.put(session.getId(), new Player(session));

        synchronized (this) {
            checkAndCreateGame();
        }
    }

    private synchronized void checkAndCreateGame() {
        if (waitingPlayers.size() >= 2) {
            WebSocketSession session1 = waitingPlayers.poll();
            WebSocketSession session2 = waitingPlayers.poll();

            if (session1 != null && session2 != null) {
                Player player1 = players.get(session1.getId());
                Player player2 = players.get(session2.getId());

                player1.playerId = 1;
                player2.playerId = 2;
                player1.x = 100; // realmente da igual porque luego las actualiza
                player1.y = 300;
                player2.x = 700;
                player2.y = 300;

                Game game = new Game(player1, player2);
                games.put(session1.getId(), game);
                games.put(session2.getId(), game);
                startGame(game);
            }

        }
    }

    private void startGame(Game game) {
        List<List<Object>> playersData = Arrays.asList(
                Arrays.asList(game.player1.x, game.player1.y, 1),
                Arrays.asList(game.player2.x, game.player2.y, 2));

        sendToPlayer(game.player1, "i", Map.of("id", 1, "p", playersData));
        sendToPlayer(game.player2, "i", Map.of("id", 2, "p", playersData));
    }


    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Game game = games.get(session.getId());

            if (game == null)
                return;

            Player currentPlayer = players.get(session.getId());
            Player otherPlayer = game.player1 == currentPlayer ? game.player2 : game.player1;
            String payload = message.getPayload();
            System.out.println("Payload recibido: " + payload); // <--- AÑADE ESTA LÍNEA
            char type = payload.charAt(0);
            String data = payload.length() > 1 ? payload.substring(1) : "";

            switch (type) {
                case 'p': // position update
                    List<Integer> pos = mapper.readValue(data, List.class);

                    currentPlayer.x = pos.get(0);
                    currentPlayer.y = pos.get(1);

                    sendToPlayer(otherPlayer, "p",
                            Arrays.asList(currentPlayer.playerId, currentPlayer.x, currentPlayer.y));
                    break;

            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        /*
         * 
         * switch (type) {
         * case "j": // player_join message, client might send "j{}" or
         * "j{\"gameId\":null,...}"
         * System.out.println("Solicitud de 'j' (player_join) de: " + session.getId());
         * if (!waitingPlayers.isEmpty()) {
         * WebSocketSession opponentSession = waitingPlayers.poll();
         * Player opponentPlayer = players.get(opponentSession.getId());
         * 
         * if (opponentPlayer != null) {
         * String gameId = UUID.randomUUID().toString(); // ¡Genera un ID único para la
         * partida!
         * Game newGame = new Game(currentPlayer, opponentPlayer); // currentPlayer será
         * player1
         * // (Sighttail)
         * // opponentPlayer será player2
         * // (Scentpaw)
         * 
         * // Asignar los roles y ID de la partida a los jugadores
         * // Guardar la partida en el mapa 'games' usando el sessionId de ambos
         * jugadores
         * // como clave
         * games.put(currentPlayer.session.getId(), newGame);
         * games.put(opponentPlayer.session.getId(), newGame);
         * 
         * // Notificar a ambos jugadores que la partida ha comenzado y sus roles/gameId
         * sendToPlayer(currentPlayer, "s", Map.of(
         * "gameId", gameId,
         * "playerKey", "Sighttail",
         * "playerId", currentPlayer.session.getId(),
         * "startX", newGame.player1StartX, // Opcional: enviar posiciones iniciales
         * "startY", newGame.player1StartY));
         * sendToPlayer(opponentPlayer, "s", Map.of(
         * "gameId", gameId,
         * "playerKey", "Scentpaw",
         * "playerId", opponentPlayer.session.getId(),
         * "startX", newGame.player2StartX, // Opcional: enviar posiciones iniciales
         * "startY", newGame.player2StartY));
         * 
         * System.out.println("Partida creada: " + gameId + " entre " +
         * currentPlayer.session.getId()
         * + " (Sighttail) y " + opponentPlayer.session.getId() + " (Scentpaw)");
         * 
         * // Aquí podrías iniciar el timer de la partida real, si no es solo un
         * tutorial
         * // scheduleGameEnd(newGame);
         * 
         * } else {
         * // El oponente estaba en la cola pero su sesión ya no es válida
         * System.out.println("Oponente en cola no válido, re-encolando a: " +
         * session.getId());
         * waitingPlayers.offer(session); // Vuelve a poner al jugador actual en la cola
         * sendToPlayer(currentPlayer, "m", Map.of("message",
         * "Esperando a otro jugador..."));
         * }
         * } else {
         * waitingPlayers.offer(session);
         * System.out.println("Jugador " + session.getId() + " en cola de espera.");
         * sendToPlayer(currentPlayer, "m", Map.of("message",
         * "Esperando a otro jugador..."));
         * }
         * break;
         * 
         * case "u": // player_move message (anteriormente "player_move")
         * Game gameMove = games.get(session.getId());
         * if (gameMove != null) {
         * // Usar .path().asDouble(defaultValue) y .path().asText(defaultValue)
         * // para manejar de forma segura las claves faltantes o valores nulos.
         * double x = jsonNode.path("x").asDouble(currentPlayer.x); // Usa la posición
         * actual como defecto
         * double y = jsonNode.path("y").asDouble(currentPlayer.y); // Usa la posición
         * actual como defecto
         * String anim = jsonNode.path("anim").asText("idle"); // Valor por defecto
         * "idle"
         * boolean flipX = jsonNode.path("flipX").asBoolean(false); // Valor por defecto
         * false
         * 
         * // Actualizar la posición del jugador en el servidor
         * currentPlayer.x = x;
         * currentPlayer.y = y;
         * 
         * // Determinar cuál es el otro jugador en la partida
         * Player otherPlayer = (currentPlayer == gameMove.player1) ? gameMove.player2 :
         * gameMove.player1;
         * 
         * // Retransmitir la actualización al otro jugador
         * sendToPlayer(otherPlayer, "u", Map.of(
         * "playerId", currentPlayer.session.getId(), // ID del jugador que se movió
         * "x", x,
         * "y", y,
         * "anim", anim,
         * "flipX", flipX // Asegúrate de enviar flipX también
         * ));
         * } else {
         * System.out.println("SERVER: Game not found for move message from session: " +
         * session.getId());
         * }
         * break;
         * 
         * case "a": // ability_use message (anteriormente "ability_use")
         * Game gameAbility = games.get(session.getId());
         * if (gameAbility != null) {
         * String ability = jsonNode.path("ability").asText("unknown_ability"); // Valor
         * por defecto
         * Player otherPlayer = (currentPlayer == gameAbility.player1) ?
         * gameAbility.player2
         * : gameAbility.player1;
         * sendToPlayer(otherPlayer, "a",
         * Map.of("playerId", currentPlayer.session.getId(), "ability", ability)); //
         * 'a' de ability
         * }
         * break;
         * 
         * case "d": // door_interact message (anteriormente "door_interact")
         * Game gameDoor = games.get(session.getId());
         * if (gameDoor != null && !gameDoor.doorOpened) { // Solo si la puerta no ha
         * sido interactuada ya
         * String playerKey = jsonNode.path("playerKey").asText("unknown_player"); //
         * Valor por defecto
         * System.out.println(playerKey + " ha interactuado con la puerta en partida " +
         * gameDoor);
         * 
         * gameDoor.doorOpened = true; // Marca en el servidor que la puerta ha sido
         * interactuada
         * 
         * // NOTIFICAR A AMBOS JUGADORES que la puerta ha sido interactuada (type 'd')
         * sendToPlayer(gameDoor.player1, "d", Map.of("message",
         * "La puerta ha sido interactuada."));
         * sendToPlayer(gameDoor.player2, "d", Map.of("message",
         * "La puerta ha sido interactuada."));
         * 
         * // ¡Aquí el servidor decide cuándo activar el agujero y las habilidades del
         * // tutorial!
         * if (!gameDoor.agujeroVisible) {
         * gameDoor.agujeroVisible = true;
         * // Enviar un mensaje específico para que ambos clientes hagan visible el
         * agujero
         * // (type 'g', progressType)
         * sendToPlayer(gameDoor.player1, "g",
         * Map.of("progressType", "agujero_visible", "message",
         * "El agujero ha aparecido."));
         * sendToPlayer(gameDoor.player2, "g",
         * Map.of("progressType", "agujero_visible", "message",
         * "El agujero ha aparecido."));
         * }
         * if (!gameDoor.tutorialAbilitiesActivated) {
         * gameDoor.tutorialAbilitiesActivated = true;
         * // Enviar un mensaje específico para que ambos clientes activen las
         * habilidades
         * // (type 'g', progressType)
         * sendToPlayer(gameDoor.player1, "g", Map.of("progressType",
         * "abilities_activated", "message",
         * "Tus habilidades están activadas."));
         * sendToPlayer(gameDoor.player2, "g", Map.of("progressType",
         * "abilities_activated", "message",
         * "Tus habilidades están activadas."));
         * }
         * }
         * break;
         * 
         * case "g": // agujero_interact message (anteriormente "agujero_interact")
         * Game gameAgujero = games.get(session.getId());
         * if (gameAgujero != null) {
         * String playerKey = jsonNode.path("playerKey").asText("unknown_player"); //
         * Valor por defecto
         * if ("Sighttail".equals(playerKey)) {
         * gameAgujero.sighttailInteractedWithAgujero = true;
         * } else if ("Scentpaw".equals(playerKey)) {
         * gameAgujero.scentpawInteractedWithAgujero = true;
         * }
         * System.out.println(playerKey + " interacted with agujero. State: Sighttail="
         * + gameAgujero.sighttailInteractedWithAgujero + ", Scentpaw="
         * + gameAgujero.scentpawInteractedWithAgujero + " en partida " + gameAgujero);
         * 
         * // Si ambos han interactuado, envía una señal para que AMBOS avancen de
         * escena
         * if (gameAgujero.sighttailInteractedWithAgujero &&
         * gameAgujero.scentpawInteractedWithAgujero) {
         * System.out.println("Ambos jugadores interactuaron con el agujero en partida "
         * + gameAgujero + ". Notificando a clientes para avanzar.");
         * // Enviar un mensaje para CAMBIAR DE ESCENA (type 'g', progressType)
         * sendToPlayer(gameAgujero.player1, "g", Map.of("progressType",
         * "agujero_ambos_interactuaron",
         * "message", "Ambos interactuaron con el agujero. Avanzando a GameScene."));
         * sendToPlayer(gameAgujero.player2, "g", Map.of("progressType",
         * "agujero_ambos_interactuaron",
         * "message", "Ambos interactuaron con el agujero. Avanzando a GameScene."));
         * 
         * // Resetear el estado de interacción (opcional, si el agujero es de un solo
         * uso
         * // por partida)
         * gameAgujero.sighttailInteractedWithAgujero = false;
         * gameAgujero.scentpawInteractedWithAgujero = false;
         * }
         * }
         * break;
         * 
         * // ...otros casos para recoger items, daño, etc.
         * default:
         * System.out.println(
         * "SERVER: Received unknown message type: " + type + " from session: " +
         * session.getId());
         * break;
         * }
         */
    }

    /**
     * Ends a game session and cleans up resources.
     */
    public void endGame(Game game) {
        if (game == null)
            return; // Add null check for robustness

        // Notify players that the game has ended
        Map<String, String> finalScores = Map.of("message", "Game Ended!"); // You can add scores here if your game has
                                                                            // them

        // Check if sessions are still open before sending messages
        if (game.player1 != null && game.player1.session.isOpen()) {
            sendToPlayer(game.player1, "o", finalScores); // 'o' for game_over
        }
        // Solo envía al segundo jugador si es diferente al primero y su sesión está
        // abierta
        if (game.player2 != null && game.player2.session.isOpen()
                && !game.player1.session.getId().equals(game.player2.session.getId())) {
            sendToPlayer(game.player2, "o", finalScores);
        }

        // Cancel timer and cleanup game resources
        if (game.timerTask != null) {
            game.timerTask.cancel(false);
        }

        // Remove games using player session IDs to avoid
        // ConcurrentModificationException if iterating
        // Use a temp set to avoid issues if player1 and player2 IDs are the same (e.g.
        // self-connection error)
        Set<String> sessionIdsToRemove = new HashSet<>();
        if (game.player1 != null)
            sessionIdsToRemove.add(game.player1.session.getId());
        if (game.player2 != null)
            sessionIdsToRemove.add(game.player2.session.getId());

        for (String sessionId : sessionIdsToRemove) {
            games.remove(sessionId);
        }
    }

    /**
     * Handles WebSocket connection closures by cleaning up player and game
     * resources.
     */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("Conexión WebSocket cerrada: " + session.getId() + " con estado " + status.getCode());
        players.remove(session.getId());
        waitingPlayers.remove(session);

        Game game = games.get(session.getId());
        if (game != null) {
            endGame(game);
        }
    }

    /**
     * Sends a message to a specific player with the given type and data.
     * Messages are formatted as: type + JSON data
     * * @param player The target player
     * 
     * @param type Single character message type
     * @param data Data to be JSON serialized (can be null)
     */
    private void sendToPlayer(Player player, String type, Object data) {
        try {
            String message = type;
            if(data!=null){
                message+=mapper.writeValueAsString(data);
            }
            synchronized (player.session) {                
                    player.session.sendMessage(new TextMessage(message));                
            }

        } catch (IOException e) {
            System.err.println("Error al enviar mensaje a " + player.session.getId() + ": " + e.getMessage());
            e.printStackTrace(); // Descomentar para depuración completa
        }
    }
}